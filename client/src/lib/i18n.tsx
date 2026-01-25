import { createContext, useContext, useState, useEffect } from "react";

// Translations
export type Language = "de" | "en";

export const ALLERGENS = {
  A: { code: "A", de: "Glutenhaltiges Getreide", en: "Gluten" },
  B: { code: "B", de: "Krebstiere", en: "Crustaceans" },
  C: { code: "C", de: "Eier", en: "Eggs" },
  D: { code: "D", de: "Fisch", en: "Fish" },
  E: { code: "E", de: "Erdnüsse", en: "Peanuts" },
  F: { code: "F", de: "Soja", en: "Soy" },
  G: { code: "G", de: "Milch", en: "Milk" },
  H: { code: "H", de: "Schalenfrüchte", en: "Nuts" },
  L: { code: "L", de: "Sellerie", en: "Celery" },
  M: { code: "M", de: "Senf", en: "Mustard" },
  N: { code: "N", de: "Sesam", en: "Sesame" },
  O: { code: "O", de: "Sulfite", en: "Sulphites" },
  P: { code: "P", de: "Lupinen", en: "Lupin" },
  R: { code: "R", de: "Weichtiere", en: "Molluscs" },
} as const;

export type AllergenCode = keyof typeof ALLERGENS;

const TRANSLATIONS = {
  de: {
    dashboard: "Übersicht",
    recipes: "Rezepte",
    haccp: "HACCP",
    reports: "Berichte",
    settings: "Einstellungen",
    home: "Startseite",
    kitchenOverview: "Küchen-Übersicht",
    activeRecipes: "Aktive Rezepte",
    pendingChecks: "Ausstehende Checks",
    logTemperature: "Temperatur erfassen",
    morningCheck: "Morgen-Runde",
    quickActions: "Schnellaktionen",
    recentActivity: "Letzte Aktivitäten",
    searchRecipes: "Rezepte suchen...",
    portions: "Portionen",
    prepTime: "Zubereitung",
    ingredients: "Zutaten",
    preparation: "Zubereitungsschritte",
    allergens: "Allergene",
    all: "Alle",
    save: "Speichern",
    cancel: "Abbrechen",
    language: "Sprache",
    exportPDF: "PDF Exportieren",
    comingSoon: "Demnächst verfügbar",
    fridge: "Kühlgerät",
    temperature: "Temperatur",
    status: "Status",
    user: "Benutzer",
    history: "Verlauf",
    noData: "Keine Daten",
    logCheck: "Messung erfassen",
    saveRecord: "Eintrag speichern",
    clear: "Löschen",
    range: "Bereich",
    lastCheck: "Letzte Prüfung",
    by: "Von",
    exportComplete: "Export abgeschlossen",
    warningRecorded: "Warnung erfasst",
    temperatureRecorded: "Temperatur erfasst",
    selectLanguage: "Sprache wählen",
    filterByAllergen: "Nach Allergen filtern",
    noAllergens: "Keine Allergene",
    addRecipe: "Rezept hinzufügen",
    recipeName: "Rezeptname",
    category: "Kategorie",
    image: "Bild",
    sourceUrl: "Website-Link (optional)",
    addIngredient: "Zutat hinzufügen",
    addStep: "Schritt hinzufügen",
    visitWebsite: "Website besuchen",
    categories: {
      Starters: "Vorspeisen",
      Mains: "Hauptspeisen",
      Desserts: "Desserts",
      Sides: "Beilagen"
    }
  },
  en: {
    dashboard: "Dashboard",
    recipes: "Recipes",
    haccp: "HACCP",
    reports: "Reports",
    settings: "Settings",
    home: "Home",
    kitchenOverview: "Kitchen Overview",
    activeRecipes: "Active Recipes",
    pendingChecks: "Pending Checks",
    logTemperature: "Log Temperature",
    morningCheck: "Morning Check",
    quickActions: "Quick Actions",
    recentActivity: "Recent Activity",
    searchRecipes: "Search recipes...",
    portions: "Portions",
    prepTime: "Prep Time",
    ingredients: "Ingredients",
    preparation: "Preparation",
    allergens: "Allergens",
    all: "All",
    save: "Save",
    cancel: "Cancel",
    language: "Language",
    exportPDF: "Export PDF",
    comingSoon: "Coming Soon",
    fridge: "Fridge",
    temperature: "Temperature",
    status: "Status",
    user: "User",
    history: "History",
    noData: "No Data",
    logCheck: "Log Check",
    saveRecord: "Save Record",
    clear: "Clear",
    range: "Range",
    lastCheck: "Last check",
    by: "By",
    exportComplete: "Export Complete",
    warningRecorded: "Warning Recorded",
    temperatureRecorded: "Temperature Recorded",
    selectLanguage: "Select Language",
    filterByAllergen: "Filter by Allergen",
    noAllergens: "No Allergens",
    addRecipe: "Add Recipe",
    recipeName: "Recipe Name",
    category: "Category",
    image: "Image",
    sourceUrl: "Website Link (optional)",
    addIngredient: "Add Ingredient",
    addStep: "Add Step",
    visitWebsite: "Visit Website",
    categories: {
      Starters: "Starters",
      Mains: "Mains",
      Desserts: "Desserts",
      Sides: "Sides"
    }
  }
};

type TranslationSchema = typeof TRANSLATIONS.en;
// Exclude nested objects to ensure t() always returns a string
type StringKeys = { [K in keyof TranslationSchema]: TranslationSchema[K] extends string ? K : never }[keyof TranslationSchema];

export const useTranslation = () => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("chefmate-lang");
    return (saved as Language) || "de";
  });

  useEffect(() => {
    localStorage.setItem("chefmate-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: StringKeys | string): string => {
    const val = TRANSLATIONS[lang][key as keyof TranslationSchema];
    if (typeof val === 'string') {
      return val;
    }
    // Fallback for missing keys or if a key points to an object unexpectedly
    return key;
  };

  const tCat = (cat: string) => {
    const catMap = TRANSLATIONS[lang].categories as Record<string, string>;
    return catMap[cat] || cat;
  };

  return { lang, setLang, t, tCat };
};
