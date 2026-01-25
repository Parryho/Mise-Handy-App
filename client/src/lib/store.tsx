import { createContext, useContext, useState } from "react";
import { AllergenCode } from "./i18n";

// Types
export type Category = "Starters" | "Mains" | "Desserts" | "Sides";

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  allergens?: AllergenCode[];
}

export interface Recipe {
  id: string;
  name: string;
  category: Category;
  portions: number;
  prepTime: number; // minutes
  ingredients: Ingredient[];
  steps: string[];
  allergens: AllergenCode[]; // Aggregated automatically, can be overridden
  image: string;
}

export interface Fridge {
  id: string;
  name: string;
  tempMin: number;
  tempMax: number;
}

export interface HACCPLog {
  id: string;
  fridgeId: string;
  temperature: number;
  timestamp: string;
  user: string;
  status: "OK" | "WARNING" | "CRITICAL";
  notes?: string;
}

// Mock Data
const MOCK_RECIPES: Recipe[] = [
  {
    id: "1",
    name: "Pan-Seared Scallops",
    category: "Starters",
    portions: 4,
    prepTime: 25,
    ingredients: [
      { name: "Sea Scallops", amount: 12, unit: "pcs", allergens: ["R"] },
      { name: "Butter", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Garlic", amount: 2, unit: "cloves" },
      { name: "Lemon", amount: 1, unit: "pc" }
    ],
    steps: [
      "Pat scallops dry with paper towels.",
      "Season generously with salt and pepper.",
      "Heat butter in a large skillet over medium-high heat.",
      "Sear scallops for 2-3 minutes per side until golden brown."
    ],
    allergens: ["R", "G"],
    image: "/src/assets/images/food-1_1.jpg"
  },
  {
    id: "2",
    name: "Herb Crusted Rack of Lamb",
    category: "Mains",
    portions: 2,
    prepTime: 45,
    ingredients: [
      { name: "Rack of Lamb", amount: 1, unit: "kg" },
      { name: "Breadcrumbs", amount: 100, unit: "g", allergens: ["A"] },
      { name: "Dijon Mustard", amount: 2, unit: "tbsp", allergens: ["M"] },
      { name: "Rosemary", amount: 2, unit: "sprigs" }
    ],
    steps: [
      "Preheat oven to 200°C.",
      "Season lamb with salt and pepper.",
      "Sear lamb in a hot pan.",
      "Brush with mustard and coat with breadcrumbs/herbs.",
      "Roast for 20-25 minutes."
    ],
    allergens: ["A", "M"],
    image: "/src/assets/images/food-1_2.jpg"
  },
  {
    id: "3",
    name: "Truffle Risotto",
    category: "Mains",
    portions: 4,
    prepTime: 40,
    ingredients: [
      { name: "Arborio Rice", amount: 300, unit: "g" },
      { name: "Vegetable Stock", amount: 1, unit: "L", allergens: ["L"] },
      { name: "Parmesan", amount: 50, unit: "g", allergens: ["G"] },
      { name: "Truffle Oil", amount: 10, unit: "ml" }
    ],
    steps: [
      "Sauté onions in butter.",
      "Add rice and toast for 2 minutes.",
      "Gradually add warm stock, stirring constantly.",
      "Finish with parmesan and truffle oil."
    ],
    allergens: ["G", "L"],
    image: "/src/assets/images/food-1_3.jpg"
  }
];

const MOCK_FRIDGES: Fridge[] = [
  { id: "f1", name: "Walk-in Cooler", tempMin: 0, tempMax: 4 },
  { id: "f2", name: "Freezer Unit A", tempMin: -22, tempMax: -18 },
  { id: "f3", name: "Prep Station Fridge", tempMin: 0, tempMax: 5 }
];

const MOCK_LOGS: HACCPLog[] = [
  { id: "l1", fridgeId: "f1", temperature: 2.5, timestamp: new Date(Date.now() - 86400000).toISOString(), user: "Chef Mike", status: "OK" },
  { id: "l2", fridgeId: "f2", temperature: -19, timestamp: new Date(Date.now() - 86400000).toISOString(), user: "Chef Mike", status: "OK" },
  { id: "l3", fridgeId: "f3", temperature: 6.5, timestamp: new Date(Date.now() - 86400000).toISOString(), user: "Sous Sarah", status: "WARNING", notes: "Door was left open" }
];

interface AppState {
  recipes: Recipe[];
  fridges: Fridge[];
  logs: HACCPLog[];
  addRecipe: (recipe: Recipe) => void;
  addLog: (log: HACCPLog) => void;
  getFridgeName: (id: string) => string;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [fridges] = useState<Fridge[]>(MOCK_FRIDGES);
  const [logs, setLogs] = useState<HACCPLog[]>(MOCK_LOGS);

  const addRecipe = (recipe: Recipe) => {
    setRecipes([...recipes, recipe]);
  };

  const addLog = (log: HACCPLog) => {
    setLogs([log, ...logs]);
  };

  const getFridgeName = (id: string) => fridges.find(f => f.id === id)?.name || "Unknown";

  return (
    <AppContext.Provider value={{ recipes, fridges, logs, addRecipe, addLog, getFridgeName }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
