import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeRecipe } from "./scraper";
import { insertRecipeSchema, insertIngredientSchema, insertFridgeSchema, insertHaccpLogSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // === RECIPES ===
  app.get("/api/recipes", async (req, res) => {
    const recipes = await storage.getRecipes();
    res.json(recipes);
  });

  app.get("/api/recipes/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const recipe = await storage.getRecipe(id);
    if (!recipe) {
      return res.status(404).json({ error: "Recipe not found" });
    }
    const ingredients = await storage.getIngredients(id);
    res.json({ ...recipe, ingredientsList: ingredients });
  });

  app.post("/api/recipes", async (req, res) => {
    try {
      const parsed = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(parsed);
      
      // Create ingredients if provided
      if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
        for (const ing of req.body.ingredientsList) {
          await storage.createIngredient({
            recipeId: recipe.id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || []
          });
        }
      }
      
      res.status(201).json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const recipe = await storage.updateRecipe(id, req.body);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Update ingredients if provided
      if (req.body.ingredientsList && Array.isArray(req.body.ingredientsList)) {
        await storage.deleteIngredientsByRecipe(id);
        for (const ing of req.body.ingredientsList) {
          await storage.createIngredient({
            recipeId: id,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            allergens: ing.allergens || []
          });
        }
      }

      res.json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/recipes/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteRecipe(id);
    res.status(204).send();
  });

  // === RECIPE IMPORT FROM URL ===
  app.post("/api/recipes/import", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const scraped = await scrapeRecipe(url);
      if (!scraped) {
        return res.status(400).json({ error: "Could not parse recipe from URL" });
      }

      // Create the recipe
      const recipe = await storage.createRecipe({
        name: scraped.name,
        category: "Mains",
        portions: scraped.portions,
        prepTime: scraped.prepTime,
        image: scraped.image,
        sourceUrl: url,
        steps: scraped.steps,
        allergens: []
      });

      // Create ingredients
      for (const ing of scraped.ingredients) {
        await storage.createIngredient({
          recipeId: recipe.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          allergens: []
        });
      }

      const ingredients = await storage.getIngredients(recipe.id);
      res.status(201).json({ ...recipe, ingredientsList: ingredients });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // === INGREDIENTS ===
  app.get("/api/recipes/:id/ingredients", async (req, res) => {
    const recipeId = parseInt(req.params.id, 10);
    const ingredients = await storage.getIngredients(recipeId);
    res.json(ingredients);
  });

  // === FRIDGES ===
  app.get("/api/fridges", async (req, res) => {
    const fridges = await storage.getFridges();
    res.json(fridges);
  });

  app.post("/api/fridges", async (req, res) => {
    try {
      const parsed = insertFridgeSchema.parse(req.body);
      const fridge = await storage.createFridge(parsed);
      res.status(201).json(fridge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/fridges/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteFridge(id);
    res.status(204).send();
  });

  // === HACCP LOGS ===
  app.get("/api/haccp-logs", async (req, res) => {
    const logs = await storage.getHaccpLogs();
    res.json(logs);
  });

  app.get("/api/fridges/:id/logs", async (req, res) => {
    const fridgeId = parseInt(req.params.id, 10);
    const logs = await storage.getHaccpLogsByFridge(fridgeId);
    res.json(logs);
  });

  app.post("/api/haccp-logs", async (req, res) => {
    try {
      const parsed = insertHaccpLogSchema.parse(req.body);
      const log = await storage.createHaccpLog(parsed);
      res.status(201).json(log);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // === SEED DATA (for initial setup) ===
  app.post("/api/seed", async (req, res) => {
    try {
      // Check if data already exists
      const existingFridges = await storage.getFridges();
      if (existingFridges.length > 0) {
        return res.json({ message: "Data already seeded" });
      }

      // Seed fridges
      await storage.createFridge({ name: "Walk-in Cooler", tempMin: 0, tempMax: 4 });
      await storage.createFridge({ name: "Freezer Unit A", tempMin: -22, tempMax: -18 });
      await storage.createFridge({ name: "Prep Station Fridge", tempMin: 0, tempMax: 5 });

      // Seed a sample recipe
      const recipe = await storage.createRecipe({
        name: "Truffle Risotto",
        category: "Mains",
        portions: 4,
        prepTime: 40,
        image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=800",
        sourceUrl: null,
        steps: [
          "Sauté onions in butter.",
          "Add rice and toast for 2 minutes.",
          "Gradually add warm stock, stirring constantly.",
          "Finish with parmesan and truffle oil."
        ],
        allergens: ["G", "I"]
      });

      await storage.createIngredient({ recipeId: recipe.id, name: "Arborio Rice", amount: 300, unit: "g", allergens: [] });
      await storage.createIngredient({ recipeId: recipe.id, name: "Vegetable Stock", amount: 1, unit: "L", allergens: ["I"] });
      await storage.createIngredient({ recipeId: recipe.id, name: "Parmesan", amount: 50, unit: "g", allergens: ["G"] });
      await storage.createIngredient({ recipeId: recipe.id, name: "Truffle Oil", amount: 10, unit: "ml", allergens: [] });

      res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
