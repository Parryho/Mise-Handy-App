// Auto-categorization based on keyword scoring
// Used by both server (URL import) and client (OCR flow)

type CategoryId = "ClearSoups" | "CreamSoups" | "MainMeat" | "MainVegan" | "Sides" | "ColdSauces" | "HotSauces" | "Salads" | "HotDesserts" | "ColdDesserts";

interface CategoryKeywords {
  name: string[];      // weight 3
  ingredients: string[]; // weight 1
  steps: string[];     // weight 1
}

const CATEGORY_KEYWORDS: Record<CategoryId, CategoryKeywords> = {
  ClearSoups: {
    name: ["klare suppe", "rindssuppe", "rindsuppe", "bouillon", "brühe", "consommé", "nudelsuppe", "frittatensuppe", "leberknödelsuppe", "grießnockerlsuppe", "kaspressknödel", "einmachsuppe", "linsensuppe", "bohnensuppe", "erbsensuppe", "zwiebelsuppe"],
    ingredients: ["suppengrün", "brühe", "bouillon", "rindfleisch"],
    steps: ["abseihen", "klären", "brühe"],
  },
  CreamSoups: {
    name: ["cremesuppe", "creme suppe", "rahm suppe", "rahmsuppe", "samtsuppe", "velouté", "schaumsuppe", "suppe"],
    ingredients: ["sahne", "obers", "rahm", "schlagobers", "creme"],
    steps: ["pürieren", "mixen", "passieren", "obers", "sahne"],
  },
  MainMeat: {
    name: ["schnitzel", "braten", "gulasch", "fleisch", "steak", "rind", "schwein", "lamm", "huhn", "hendl", "pute", "ente", "gans", "cordon", "leberkäse", "stelze", "beuschel", "leber", "lasagne"],
    ingredients: ["rindfleisch", "schweinefleisch", "hühnerfleisch", "lammfleisch", "speck", "schinken", "wurst", "faschiertes", "hackfleisch"],
    steps: ["anbraten", "braten", "schmoren", "grillen", "ausbacken"],
  },
  MainVegan: {
    name: ["vegan", "vegetarisch", "gemüse", "käsespätzle", "spinatknödel", "kasnocken", "eiernockerl", "topfenknödel", "strudel", "knödel", "nockerl", "laibchen", "risotto", "quiche", "flammkuchen"],
    ingredients: ["tofu", "gemüse", "käse", "topfen", "quark", "linsen", "bohnen", "kichererbsen"],
    steps: ["dünsten", "überbacken"],
  },
  Sides: {
    name: ["beilage", "kartoffel", "erdäpfel", "reis", "nudel", "spätzle", "knödel", "pommes", "kroketten", "püree", "kraut", "gemüse", "kohlsprossen", "rotkraut", "sauerkraut"],
    ingredients: ["kartoffel", "reis", "nudeln", "semmel"],
    steps: [],
  },
  ColdSauces: {
    name: ["kalte sauce", "dip", "marinade", "vinaigrette", "mayonnaise", "mayo", "pesto", "ketchup", "cocktailsauce", "kräuterbutter", "tsatziki", "aioli"],
    ingredients: ["essig", "öl", "senf", "mayonnaise", "joghurt"],
    steps: ["kalt", "verrühren", "marinieren"],
  },
  HotSauces: {
    name: ["warme sauce", "bratensauce", "rahmsauce", "bechamel", "hollandaise", "bernaise", "jus", "fond", "gravy", "sauce"],
    ingredients: ["butter", "mehl", "fond", "bratensaft"],
    steps: ["einkochen", "reduzieren", "aufgießen", "binden", "eindicken"],
  },
  Salads: {
    name: ["salat", "coleslaw", "taboulé", "bowl"],
    ingredients: ["salat", "dressing", "essig", "öl", "blattsalat"],
    steps: ["anrichten", "marinieren", "mischen"],
  },
  HotDesserts: {
    name: ["kaiserschmarrn", "strudel", "palatschinken", "germknödel", "buchteln", "schmarrn", "auflauf", "soufflé", "warmes dessert", "obstknödel", "powidltascherl"],
    ingredients: ["germteig", "strudelteig", "marmelade", "powidl"],
    steps: ["backen", "dämpfen", "in pfanne", "ausbacken"],
  },
  ColdDesserts: {
    name: ["torte", "kuchen", "mousse", "eis", "panna cotta", "tiramisu", "creme", "schnitte", "krapferl", "kipferl", "gugelhupf", "kaltes dessert"],
    ingredients: ["gelatine", "schlagobers", "schlag", "schokolade", "kakao"],
    steps: ["kalt stellen", "kühlen", "glasieren", "einfrieren"],
  },
};

export function autoCategorize(name: string, ingredients: string[] = [], steps: string[] = []): CategoryId {
  const nameLower = name.toLowerCase();
  const ingredientsLower = ingredients.map(i => i.toLowerCase()).join(" ");
  const stepsLower = steps.map(s => s.toLowerCase()).join(" ");

  const scores: Record<string, number> = {};

  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;

    // Name keywords (weight 3)
    for (const kw of keywords.name) {
      if (nameLower.includes(kw)) {
        score += 3;
      }
    }

    // Ingredient keywords (weight 1)
    for (const kw of keywords.ingredients) {
      if (ingredientsLower.includes(kw)) {
        score += 1;
      }
    }

    // Step keywords (weight 1)
    for (const kw of keywords.steps) {
      if (stepsLower.includes(kw)) {
        score += 1;
      }
    }

    scores[catId] = score;
  }

  // Find highest score
  let bestCategory: CategoryId = "MainMeat";
  let bestScore = 0;

  for (const [catId, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = catId as CategoryId;
    }
  }

  return bestCategory;
}
