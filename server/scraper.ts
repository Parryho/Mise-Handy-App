import * as cheerio from 'cheerio';

interface ScrapedRecipe {
  name: string;
  portions: number;
  prepTime: number;
  image: string | null;
  steps: string[];
  ingredients: { name: string; amount: number; unit: string }[];
}

// Supported platforms
const SUPPORTED_PLATFORMS = [
  'chefkoch.de',
  'gutekueche.at',
  'ichkoche.at',
  'kochrezepte.at',
  'essen-und-trinken.de',
  'lecker.de',
  'kitchen-stories.com',
  'marions-kochbuch.de'
];

export function getSupportedPlatforms(): string[] {
  return SUPPORTED_PLATFORMS;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try JSON-LD first (most reliable - works for most modern recipe sites)
    const jsonLd = $('script[type="application/ld+json"]').toArray();
    for (const script of jsonLd) {
      try {
        const data = JSON.parse($(script).html() || '');
        const recipe = findRecipeInJsonLd(data);
        if (recipe) {
          return recipe;
        }
      } catch (e) {
        continue;
      }
    }

    // Fallback: try site-specific selectors
    return scrapeWithSelectors($, url);
  } catch (error) {
    console.error('Scraping error:', error);
    return null;
  }
}

function findRecipeInJsonLd(data: any): ScrapedRecipe | null {
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = findRecipeInJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  if (data && (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe')))) {
    return parseJsonLdRecipe(data);
  }

  if (data && data['@graph']) {
    return findRecipeInJsonLd(data['@graph']);
  }

  return null;
}

function parseJsonLdRecipe(data: any): ScrapedRecipe {
  const name = data.name || 'Importiertes Rezept';
  
  // Parse portions/yield
  let portions = 4;
  if (data.recipeYield) {
    const yieldStr = Array.isArray(data.recipeYield) ? data.recipeYield[0] : data.recipeYield;
    const match = String(yieldStr).match(/(\d+)/);
    if (match) portions = parseInt(match[1], 10);
  }

  // Parse prep time (ISO 8601 duration)
  let prepTime = 0;
  const totalTime = data.totalTime || data.prepTime || data.cookTime;
  if (totalTime) {
    const hourMatch = String(totalTime).match(/(\d+)H/i);
    const minMatch = String(totalTime).match(/(\d+)M/i);
    if (hourMatch) prepTime += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) prepTime += parseInt(minMatch[1], 10);
    if (!hourMatch && !minMatch) {
      const simpleMatch = String(totalTime).match(/(\d+)/);
      if (simpleMatch) prepTime = parseInt(simpleMatch[1], 10);
    }
  }

  // Parse image
  let image: string | null = null;
  if (data.image) {
    if (typeof data.image === 'string') {
      image = data.image;
    } else if (Array.isArray(data.image)) {
      image = typeof data.image[0] === 'string' ? data.image[0] : data.image[0]?.url;
    } else if (data.image.url) {
      image = data.image.url;
    }
  }

  // Parse steps
  let steps: string[] = [];
  if (data.recipeInstructions) {
    if (typeof data.recipeInstructions === 'string') {
      steps = data.recipeInstructions.split(/\n+/).filter((s: string) => s.trim());
    } else if (Array.isArray(data.recipeInstructions)) {
      steps = data.recipeInstructions.map((inst: any) => {
        if (typeof inst === 'string') return inst;
        if (inst.text) return inst.text;
        if (inst.itemListElement) {
          return inst.itemListElement.map((i: any) => i.text || i).join(' ');
        }
        return '';
      }).filter((s: string) => s.trim());
    }
  }

  // Parse ingredients
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  if (data.recipeIngredient && Array.isArray(data.recipeIngredient)) {
    for (const ing of data.recipeIngredient) {
      const parsed = parseIngredientString(String(ing));
      ingredients.push(parsed);
    }
  }

  return { name, portions, prepTime, image, steps, ingredients };
}

function parseIngredientString(str: string): { name: string; amount: number; unit: string } {
  str = str.trim();
  
  // Common patterns: "100 g Mehl", "2 EL Zucker", "1/2 Tasse Milch", "½ kg Kartoffeln"
  // Handle unicode fractions
  str = str.replace(/½/g, '0.5').replace(/¼/g, '0.25').replace(/¾/g, '0.75').replace(/⅓/g, '0.33').replace(/⅔/g, '0.67');
  
  const match = str.match(/^([\d.,/\s]+)?\s*([a-zA-ZäöüÄÖÜß]+\.?)?\s*(.+)$/);
  
  if (match) {
    let amount = 1;
    if (match[1]) {
      const amountStr = match[1].trim();
      // Handle fractions like 1/2
      if (amountStr.includes('/')) {
        const parts = amountStr.split('/').map(n => parseFloat(n.replace(',', '.')));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] !== 0) {
          amount = parts[0] / parts[1];
        }
      } else {
        amount = parseFloat(amountStr.replace(',', '.')) || 1;
      }
    }
    
    const unit = match[2] || 'Stück';
    const name = match[3]?.trim() || str;
    
    return { name, amount, unit };
  }

  return { name: str, amount: 1, unit: 'Stück' };
}

function scrapeWithSelectors($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  const urlLower = url.toLowerCase();
  
  // GuteKueche.at specific
  if (urlLower.includes('gutekueche.at')) {
    const name = $('h1.recipe-title, h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.recipe-ingredients li, .ingredients-list li').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.recipe-preparation p, .preparation-steps li').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('img.recipe-image, .recipe-main-image img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Ichkoche.at specific
  if (urlLower.includes('ichkoche.at')) {
    const name = $('h1.recipe-title, h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.ingredient-item, .ingredients li').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.preparation-step, .instructions p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('.recipe-image img, .main-image img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Kochrezepte.at specific  
  if (urlLower.includes('kochrezepte.at')) {
    const name = $('h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('.zutat, .ingredient').each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(parseIngredientString(text));
    });

    const steps: string[] = [];
    $('.zubereitung p, .preparation p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10) steps.push(text);
    });

    const image = $('img.rezept-bild, .recipe-image').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Chefkoch.de specific
  if (urlLower.includes('chefkoch.de')) {
    const name = $('h1').first().text().trim() || 'Importiertes Rezept';
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    
    $('table.ingredients td, .ingredients-table td').each((_, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes(':')) {
        ingredients.push(parseIngredientString(text));
      }
    });

    const steps: string[] = [];
    $('.ds-box p, .preparation-text, article.ds-box').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) steps.push(text);
    });

    const image = $('img.ds-image, .recipe-image img, amp-img').first().attr('src') || null;

    return { name, portions: 4, prepTime: 30, image, steps, ingredients };
  }

  // Generic fallback - try common selectors
  const name = $('h1').first().text().trim() || 'Importiertes Rezept';
  const ingredients: { name: string; amount: number; unit: string }[] = [];
  
  $('[class*="ingredient"] li, [class*="zutat"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) ingredients.push(parseIngredientString(text));
  });

  const steps: string[] = [];
  $('[class*="instruction"] p, [class*="preparation"] p, [class*="zubereitung"] p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) steps.push(text);
  });

  const image = $('img[class*="recipe"], img[class*="rezept"]').first().attr('src') || null;

  return { name, portions: 4, prepTime: 30, image, steps, ingredients };
}
