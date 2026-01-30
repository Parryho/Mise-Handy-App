// Parse OCR text into structured recipe data

export interface ParsedRecipe {
  name: string;
  ingredients: { name: string; amount: number; unit: string }[];
  steps: string[];
  portions: number;
  prepTime: number;
}

const UNITS = [
  "g", "kg", "ml", "l", "cl", "dl",
  "EL", "TL", "Stk", "Stück", "Prise", "Priese",
  "Bund", "Becher", "Pkg", "Packung", "Dose",
  "Tasse", "Scheibe", "Scheiben", "Blatt", "Blätter",
  "Zehe", "Zehen",
];

const UNIT_PATTERN = UNITS.join("|");

// Match lines like: "200 g Mehl", "2 EL Öl", "1/2 TL Salz", "3 Eier"
const INGREDIENT_REGEX = new RegExp(
  `^\\s*(\\d+[.,/]?\\d*)\\s*(${UNIT_PATTERN})?\\s+(.+)$`,
  "i"
);

const STEP_HEADERS = [
  "zubereitung", "anleitung", "so geht's", "schritte",
  "preparation", "instructions", "directions", "method",
];

const PORTION_REGEX = /(\d+)\s*(portion|person|serving|portionen|personen)/i;
const TIME_REGEX = /(\d+)\s*(min|minuten|minutes|stunde|stunden|hour|hours|h)/i;

function parseAmount(raw: string): number {
  if (raw.includes("/")) {
    const [num, den] = raw.split("/");
    return parseFloat(num) / parseFloat(den);
  }
  return parseFloat(raw.replace(",", ".")) || 1;
}

export function parseRecipeText(text: string): ParsedRecipe {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { name: "", ingredients: [], steps: [], portions: 4, prepTime: 0 };
  }

  // First non-empty line = recipe name
  const name = lines[0];

  // Detect portions and prep time anywhere in text
  let portions = 4;
  let prepTime = 0;
  const fullText = text.toLowerCase();

  const portionMatch = fullText.match(PORTION_REGEX);
  if (portionMatch) {
    portions = parseInt(portionMatch[1]) || 4;
  }

  const timeMatch = fullText.match(TIME_REGEX);
  if (timeMatch) {
    const val = parseInt(timeMatch[1]);
    const unit = timeMatch[2].toLowerCase();
    if (unit.startsWith("h") || unit.startsWith("stunde")) {
      prepTime = val * 60;
    } else {
      prepTime = val;
    }
  }

  // Find where steps section begins
  let stepsStartIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    const lower = lines[i].toLowerCase().replace(/[:\-]/g, "").trim();
    if (STEP_HEADERS.some((h) => lower.startsWith(h))) {
      stepsStartIdx = i;
      break;
    }
  }

  // Parse ingredients (between name and steps header, or lines matching pattern)
  const ingredients: ParsedRecipe["ingredients"] = [];
  const steps: string[] = [];

  const ingredientEndIdx = stepsStartIdx > 0 ? stepsStartIdx : lines.length;

  for (let i = 1; i < ingredientEndIdx; i++) {
    const line = lines[i];

    // Skip section headers like "Zutaten:"
    if (/^(zutaten|ingredients)[:\s]*$/i.test(line)) continue;

    const match = line.match(INGREDIENT_REGEX);
    if (match) {
      ingredients.push({
        amount: parseAmount(match[1]),
        unit: match[2] || "Stk",
        name: match[3].trim(),
      });
    }
  }

  // Parse steps
  if (stepsStartIdx > 0) {
    for (let i = stepsStartIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      // Skip empty or very short lines
      if (line.length < 3) continue;
      // Remove leading step numbers like "1." or "1)"
      const cleaned = line.replace(/^\d+[.)]\s*/, "").trim();
      if (cleaned.length > 0) {
        steps.push(cleaned);
      }
    }
  }

  return { name, ingredients, steps, portions, prepTime };
}
