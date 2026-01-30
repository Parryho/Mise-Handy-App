import { createContext, useContext, useState, useEffect } from "react";
import { AllergenCode } from "./i18n";

// Types matching the backend
export type Category = "ClearSoups" | "CreamSoups" | "MainMeat" | "MainVegan" | "Sides" | "ColdSauces" | "HotSauces" | "Salads" | "HotDesserts" | "ColdDesserts";

export interface Ingredient {
  id?: number;
  recipeId?: number;
  name: string;
  amount: number;
  unit: string;
  allergens: AllergenCode[];
}

export interface Recipe {
  id: number;
  name: string;
  category: string;
  portions: number;
  prepTime: number;
  image: string | null;
  sourceUrl: string | null;
  steps: string[];
  allergens: AllergenCode[];
  ingredientsList?: Ingredient[];
  // R2-T3: Tags for filtering
  tags?: string[];
  // R2-T4: Last modification timestamp
  updatedAt?: string;
}

export interface Fridge {
  id: number;
  name: string;
  tempMin: number;
  tempMax: number;
}

export interface HaccpLog {
  id: number;
  fridgeId: number;
  temperature: number;
  timestamp: string;
  user: string;
  status: string;
  notes: string | null;
}

interface AppState {
  recipes: Recipe[];
  fridges: Fridge[];
  logs: HaccpLog[];
  loading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id'> & { ingredientsList?: Ingredient[] }) => Promise<Recipe>;
  updateRecipe: (id: number, recipe: Partial<Recipe> & { ingredientsList?: Ingredient[] }) => Promise<Recipe>;
  importRecipe: (url: string) => Promise<Recipe>;
  deleteRecipe: (id: number) => Promise<void>;
  addFridge: (fridge: Omit<Fridge, 'id'>) => Promise<Fridge>;
  updateFridge: (id: number, fridge: Partial<Fridge>) => Promise<Fridge>;
  deleteFridge: (id: number) => Promise<void>;
  addLog: (log: Omit<HaccpLog, 'id'>) => Promise<HaccpLog>;
  getFridgeName: (id: number) => string;
  refetch: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [fridges, setFridges] = useState<Fridge[]>([]);
  const [logs, setLogs] = useState<HaccpLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [recipesRes, fridgesRes, logsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/fridges'),
        fetch('/api/haccp-logs')
      ]);
      
      const [recipesData, fridgesData, logsData] = await Promise.all([
        recipesRes.json(),
        fridgesRes.json(),
        logsRes.json()
      ]);

      setRecipes(recipesData);
      setFridges(fridgesData);
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Seed data on first load
    fetch('/api/seed', { method: 'POST' }).then(() => fetchAll());
  }, []);

  const addRecipe = async (recipe: Omit<Recipe, 'id'> & { ingredientsList?: Ingredient[] }): Promise<Recipe> => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    });
    const created = await res.json();
    await fetchAll();
    return created;
  };

  const updateRecipe = async (id: number, recipe: Partial<Recipe> & { ingredientsList?: Ingredient[] }): Promise<Recipe> => {
    const res = await fetch(`/api/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recipe)
    });
    const updated = await res.json();
    await fetchAll();
    return updated;
  };

  const importRecipe = async (url: string): Promise<Recipe> => {
    const res = await fetch('/api/recipes/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Import failed');
    }
    const created = await res.json();
    await fetchAll();
    return created;
  };

  const deleteRecipe = async (id: number): Promise<void> => {
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    await fetchAll();
  };

  const addFridge = async (fridge: Omit<Fridge, 'id'>): Promise<Fridge> => {
    const res = await fetch('/api/fridges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fridge)
    });
    const created = await res.json();
    await fetchAll();
    return created;
  };

  const updateFridge = async (id: number, fridge: Partial<Fridge>): Promise<Fridge> => {
    const res = await fetch(`/api/fridges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fridge)
    });
    const updated = await res.json();
    await fetchAll();
    return updated;
  };

  const deleteFridge = async (id: number): Promise<void> => {
    await fetch(`/api/fridges/${id}`, { method: 'DELETE' });
    await fetchAll();
  };

  const addLog = async (log: Omit<HaccpLog, 'id'>): Promise<HaccpLog> => {
    const res = await fetch('/api/haccp-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log)
    });
    const created = await res.json();
    await fetchAll();
    return created;
  };

  const getFridgeName = (id: number) => fridges.find(f => f.id === id)?.name || "Unknown";

  return (
    <AppContext.Provider value={{ 
      recipes, 
      fridges, 
      logs, 
      loading,
      addRecipe,
      updateRecipe,
      importRecipe,
      deleteRecipe,
      addFridge,
      updateFridge,
      deleteFridge,
      addLog, 
      getFridgeName,
      refetch: fetchAll
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
