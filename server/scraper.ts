import * as cheerio from 'cheerio';

interface ScrapedRecipe {
  name: string;
  portions: number;
  prepTime: number;
  image: string | null;
  steps: string[];
  ingredients: { name: string; amount: number; unit: string }[];
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try JSON-LD first (most reliable)
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

    // Fallback: try common selectors for Chefkoch and similar sites
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
  const name = data.name || 'Imported Recipe';
  
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
    const match = String(totalTime).match(/PT(\d+)H?(\d*)M?/i);
    if (match) {
      prepTime = (parseInt(match[1] || '0', 10) * 60) + parseInt(match[2] || '0', 10);
    } else {
      const minMatch = String(totalTime).match(/(\d+)/);
      if (minMatch) prepTime = parseInt(minMatch[1], 10);
    }
  }

  // Parse image
  let image: string | null = null;
  if (data.image) {
    if (typeof data.image === 'string') {
      image = data.image;
    } else if (Array.isArray(data.image)) {
      image = data.image[0];
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
  
  // Common patterns: "100 g Mehl", "2 EL Zucker", "1/2 Tasse Milch"
  const match = str.match(/^([\d.,/]+)?\s*([a-zA-ZäöüÄÖÜß]+\.?)?\s*(.+)$/);
  
  if (match) {
    let amount = 1;
    if (match[1]) {
      // Handle fractions like 1/2
      if (match[1].includes('/')) {
        const [num, denom] = match[1].split('/').map(n => parseFloat(n.replace(',', '.')));
        amount = num / denom;
      } else {
        amount = parseFloat(match[1].replace(',', '.')) || 1;
      }
    }
    
    const unit = match[2] || 'Stück';
    const name = match[3]?.trim() || str;
    
    return { name, amount, unit };
  }

  return { name: str, amount: 1, unit: 'Stück' };
}

function scrapeWithSelectors($: cheerio.CheerioAPI, url: string): ScrapedRecipe | null {
  // Chefkoch specific selectors
  if (url.includes('chefkoch.de')) {
    const name = $('h1').first().text().trim() || 'Imported Recipe';
    
    // Get ingredients
    const ingredients: { name: string; amount: number; unit: string }[] = [];
    $('table.ingredients td').each((i, el) => {
      const text = $(el).text().trim();
      if (text && !text.includes(':')) {
        const parsed = parseIngredientString(text);
        ingredients.push(parsed);
      }
    });

    // Get steps
    const steps: string[] = [];
    $('.ds-box p, .preparation-text').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length > 20) {
        steps.push(text);
      }
    });

    const image = $('img.ds-image, .recipe-image img').first().attr('src') || null;

    return {
      name,
      portions: 4,
      prepTime: 30,
      image,
      steps,
      ingredients
    };
  }

  // Generic fallback
  const name = $('h1').first().text().trim() || 'Imported Recipe';
  return {
    name,
    portions: 4,
    prepTime: 30,
    image: null,
    steps: [],
    ingredients: []
  };
}
