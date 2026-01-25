import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeRecipe } from "./scraper";
import { 
  insertRecipeSchema, insertIngredientSchema, insertFridgeSchema, insertHaccpLogSchema,
  insertGuestCountSchema, insertCateringEventSchema, insertStaffSchema, insertScheduleEntrySchema, insertMenuPlanSchema
} from "@shared/schema";

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

  app.put("/api/fridges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const fridge = await storage.updateFridge(id, req.body);
      if (!fridge) {
        return res.status(404).json({ error: "Fridge not found" });
      }
      res.json(fridge);
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
      await storage.createFridge({ name: "Kühlraum", tempMin: 0, tempMax: 4 });
      await storage.createFridge({ name: "Tiefkühler", tempMin: -22, tempMax: -18 });
      await storage.createFridge({ name: "Vorbereitungskühlschrank", tempMin: 0, tempMax: 5 });

      res.json({ message: "Seed data created successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Seed Austrian/Styrian recipes
  app.post("/api/seed-recipes", async (req, res) => {
    try {
      const existingRecipes = await storage.getRecipes();
      if (existingRecipes.length >= 20) {
        return res.json({ message: "Recipes already seeded", count: existingRecipes.length });
      }

      const austrianRecipes = [
        // SOUPS (20+)
        { name: "Frittatensuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Palatschinken backen", "In Streifen schneiden", "Mit heißer Rindssuppe servieren"] },
        { name: "Leberknödelsuppe", category: "Soups", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Leber faschieren", "Mit Semmelbröseln und Ei vermengen", "Knödel formen", "In Suppe kochen"] },
        { name: "Grießnockerlsuppe", category: "Soups", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Butter schaumig rühren", "Grieß und Ei untermengen", "Nockerl formen", "In Suppe kochen"] },
        { name: "Knoblauchcremesuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Knoblauch anrösten", "Mit Suppe aufgießen", "Obers hinzufügen", "Pürieren"] },
        { name: "Kürbiscremesuppe", category: "Soups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Kürbis würfeln", "Mit Zwiebeln anbraten", "Aufgießen und pürieren", "Mit Kernöl verfeinern"] },
        { name: "Selleriecremesuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["G", "I"], steps: ["Sellerie kochen", "Pürieren", "Mit Obers verfeinern"] },
        { name: "Schwammerlsuppe", category: "Soups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Pilze putzen", "Anbraten", "Mit Suppe aufgießen", "Mit Sauerrahm verfeinern"] },
        { name: "Erdäpfelsuppe", category: "Soups", portions: 4, prepTime: 40, allergens: ["G", "I"], steps: ["Kartoffeln würfeln", "Mit Lauch anbraten", "Kochen und pürieren"] },
        { name: "Klare Rindsuppe", category: "Soups", portions: 6, prepTime: 180, allergens: ["I"], steps: ["Rindfleisch und Knochen kochen", "Wurzelgemüse hinzufügen", "Abseihen", "Würzen"] },
        { name: "Karfiolcremesuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Karfiol kochen", "Pürieren", "Mit Obers verfeinern", "Mit Muskat würzen"] },
        { name: "Spargelcremesuppe", category: "Soups", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Spargel kochen", "Schalen für Fond", "Pürieren", "Mit Obers vollenden"] },
        { name: "Bärlauchcremesuppe", category: "Soups", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Zwiebeln anbraten", "Bärlauch hinzufügen", "Pürieren", "Mit Sauerrahm servieren"] },
        { name: "Tomatencremesuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["G"], steps: ["Tomaten rösten", "Mit Basilikum pürieren", "Obers einrühren"] },
        { name: "Linsensuppe", category: "Soups", portions: 4, prepTime: 45, allergens: [], steps: ["Linsen mit Gemüse kochen", "Mit Essig abschmecken"] },
        { name: "Erbsensuppe", category: "Soups", portions: 4, prepTime: 60, allergens: ["I"], steps: ["Erbsen einweichen", "Mit Suppengrün kochen", "Pürieren"] },
        { name: "Bohnensuppe", category: "Soups", portions: 4, prepTime: 50, allergens: [], steps: ["Weiße Bohnen kochen", "Mit Speck verfeinern"] },
        { name: "Zwiebelsuppe", category: "Soups", portions: 4, prepTime: 40, allergens: ["A", "G"], steps: ["Zwiebeln karamellisieren", "Mit Suppe aufgießen", "Mit Käsetoast servieren"] },
        { name: "Nudelsuppe", category: "Soups", portions: 4, prepTime: 20, allergens: ["A", "C"], steps: ["Rindssuppe aufkochen", "Nudeln einlegen", "Schnittlauch darüber"] },
        { name: "Einmachsuppe", category: "Soups", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Einmach aus Butter und Mehl", "Mit Suppe aufgießen", "Mit Sauerrahm vollenden"] },
        { name: "Kaspressknödelsuppe", category: "Soups", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Knödel aus Altbrot und Käse formen", "Braten", "In Suppe servieren"] },

        // MAINS - Meat (25+)
        { name: "Wiener Schnitzel", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Fleisch klopfen", "Panieren", "In Butterschmalz ausbacken", "Mit Zitrone servieren"] },
        { name: "Schweinsbraten", category: "Mains", portions: 6, prepTime: 120, allergens: [], steps: ["Schwarte einschneiden", "Würzen", "Im Rohr braten", "Mit Bratensaft servieren"] },
        { name: "Tafelspitz", category: "Mains", portions: 6, prepTime: 180, allergens: ["L"], steps: ["Rindfleisch mit Suppengemüse kochen", "Mit Schnittlauchsauce servieren", "Apfelkren dazu reichen"] },
        { name: "Backhendl", category: "Mains", portions: 4, prepTime: 45, allergens: ["A", "C"], steps: ["Hendl zerteilen", "Panieren", "In Fett ausbacken"] },
        { name: "Rindsgulasch", category: "Mains", portions: 6, prepTime: 120, allergens: [], steps: ["Zwiebeln rösten", "Fleisch anbraten", "Mit Paprika würzen", "Langsam schmoren"] },
        { name: "Zwiebelrostbraten", category: "Mains", portions: 4, prepTime: 40, allergens: [], steps: ["Rostbraten braten", "Röstzwiebeln zubereiten", "Mit Bratensaft servieren"] },
        { name: "Stelze", category: "Mains", portions: 4, prepTime: 150, allergens: [], steps: ["Stelze würzen", "Im Rohr knusprig braten", "Mit Kraut servieren"] },
        { name: "Cordon Bleu", category: "Mains", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schnitzel füllen", "Mit Schinken und Käse", "Panieren", "Ausbacken"] },
        { name: "Leberkäse", category: "Mains", portions: 8, prepTime: 90, allergens: [], steps: ["Leberkäse backen", "In Scheiben schneiden", "Mit Senf und Semmel servieren"] },
        { name: "Beuschel", category: "Mains", portions: 4, prepTime: 90, allergens: ["A"], steps: ["Innereien kochen", "Sauce zubereiten", "Mit Semmelknödel servieren"] },
        { name: "Blunzengröstl", category: "Mains", portions: 4, prepTime: 30, allergens: ["C"], steps: ["Blutwurst würfeln", "Mit Erdäpfeln braten", "Mit Spiegelei servieren"] },
        { name: "Kalbsrahmgeschnetzeltes", category: "Mains", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Kalbfleisch schnetzeln", "Anbraten", "Mit Rahmsauce servieren"] },
        { name: "Altwiener Suppentopf", category: "Mains", portions: 6, prepTime: 120, allergens: ["I"], steps: ["Rindfleisch mit Gemüse kochen", "Als Eintopf servieren"] },
        { name: "Faschierter Braten", category: "Mains", portions: 6, prepTime: 70, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Formen", "Im Rohr braten"] },
        { name: "Krautfleckerl mit Speck", category: "Mains", portions: 4, prepTime: 40, allergens: ["A", "C"], steps: ["Kraut dünsten", "Fleckerl kochen", "Mit Speck mischen"] },
        { name: "Gebackene Leber", category: "Mains", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Leber schneiden", "Panieren", "Ausbacken", "Mit Erdäpfelpüree servieren"] },
        { name: "Steirisches Wurzelfleisch", category: "Mains", portions: 6, prepTime: 90, allergens: ["L"], steps: ["Schweinfleisch kochen", "Mit Kren servieren", "Wurzelgemüse dazu"] },
        { name: "Grammelknödel", category: "Mains", portions: 4, prepTime: 50, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Grammeln füllen", "Kochen"] },
        { name: "Fleischlaberl", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Faschiertes würzen", "Laibchen formen", "Braten"] },
        { name: "Geselchtes mit Sauerkraut", category: "Mains", portions: 4, prepTime: 60, allergens: [], steps: ["Geselchtes kochen", "Sauerkraut dünsten", "Zusammen servieren"] },
        { name: "Kümmelbraten", category: "Mains", portions: 6, prepTime: 100, allergens: [], steps: ["Schweinefleisch mit Kümmel würzen", "Langsam braten"] },
        { name: "Lammstelze", category: "Mains", portions: 4, prepTime: 120, allergens: [], steps: ["Lamm marinieren", "Im Rohr schmoren"] },
        { name: "Hühnerkeule überbacken", category: "Mains", portions: 4, prepTime: 50, allergens: ["G"], steps: ["Hühnerkeulen braten", "Mit Käse überbacken"] },
        { name: "Putenschnitzel", category: "Mains", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Pute klopfen", "Panieren", "Braten"] },
        { name: "Lasagne", category: "Mains", portions: 6, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Bolognese zubereiten", "Schichten", "Überbacken"] },

        // MAINS - Vegetarian (20+)
        { name: "Käsespätzle", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Spätzle kochen", "Schichten mit Käse", "Mit Röstzwiebeln servieren"] },
        { name: "Spinatknödel", category: "Mains", portions: 4, prepTime: 40, allergens: ["A", "C", "G"], steps: ["Spinat hacken", "Mit Knödelteig mischen", "Kochen", "Mit brauner Butter servieren"] },
        { name: "Gemüsestrudel", category: "Mains", portions: 6, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Gemüse dünsten", "In Strudelteig wickeln", "Backen"] },
        { name: "Eierschwammerl mit Knödel", category: "Mains", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Schwammerl putzen", "In Rahm schwenken", "Mit Semmelknödel servieren"] },
        { name: "Kasnocken", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "Mit Käse schichten", "Im Rohr überbacken"] },
        { name: "Erdäpfelgulasch", category: "Mains", portions: 4, prepTime: 40, allergens: [], steps: ["Kartoffeln und Würstel würfeln", "Mit Paprika kochen"] },
        { name: "Eiernockerl", category: "Mains", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Nockerl braten", "Mit Ei stocken lassen", "Mit grünem Salat servieren"] },
        { name: "Topfenknödel", category: "Mains", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Topfenteig zubereiten", "Knödel formen", "Kochen", "In Butterbröseln wälzen"] },
        { name: "Marillenknödel", category: "Mains", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Marillen einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Zwetschgenknödel", category: "Mains", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Zwetschgen einwickeln", "Kochen", "Mit Zimt-Zucker servieren"] },
        { name: "Mohnnudeln", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelteig zu Nudeln formen", "Kochen", "In Mohn und Butter wälzen"] },
        { name: "Krautstrudel", category: "Mains", portions: 6, prepTime: 60, allergens: ["A", "C"], steps: ["Kraut dünsten", "Mit Kümmel würzen", "In Strudelteig wickeln", "Backen"] },
        { name: "Gemüselaibchen", category: "Mains", portions: 4, prepTime: 35, allergens: ["A", "C"], steps: ["Gemüse raspeln", "Mit Ei und Mehl binden", "Braten"] },
        { name: "Käsesuppe", category: "Mains", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Zwiebeln anbraten", "Mit Suppe aufgießen", "Käse einschmelzen"] },
        { name: "Reiberdatschi", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffeln reiben", "Würzen", "Als Laibchen braten"] },
        { name: "Polenta mit Schwammerl", category: "Mains", portions: 4, prepTime: 35, allergens: ["G"], steps: ["Polenta kochen", "Pilze braten", "Mit Parmesan servieren"] },
        { name: "Risotto mit Spargel", category: "Mains", portions: 4, prepTime: 40, allergens: ["G"], steps: ["Spargel kochen", "Risotto zubereiten", "Zusammen servieren"] },
        { name: "Quiche Lorraine", category: "Mains", portions: 6, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Mürbteig backen", "Mit Eiermasse füllen", "Backen"] },
        { name: "Flammkuchen", category: "Mains", portions: 4, prepTime: 30, allergens: ["A", "G"], steps: ["Teig dünn ausrollen", "Mit Sauerrahm bestreichen", "Belegen", "Backen"] },
        { name: "Schinkenfleckerl", category: "Mains", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Fleckerl kochen", "Mit Schinken und Sauerrahm überbacken"] },

        // SIDES (25+)
        { name: "Pommes Frites", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln schneiden", "Frittieren", "Salzen"] },
        { name: "Erdäpfelpüree", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kartoffeln kochen", "Stampfen", "Mit Butter und Milch verfeinern"] },
        { name: "Semmelknödel", category: "Sides", portions: 4, prepTime: 35, allergens: ["A", "C", "G"], steps: ["Semmeln einweichen", "Mit Ei binden", "Knödel formen", "Kochen"] },
        { name: "Petersilkartoffeln", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Kartoffeln kochen", "In Butter schwenken", "Mit Petersilie bestreuen"] },
        { name: "Reis", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Reis waschen", "Kochen", "Mit Butter verfeinern"] },
        { name: "Butternockerl", category: "Sides", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Nockenteig zubereiten", "In Wasser kochen", "Mit Butter servieren"] },
        { name: "Kroketten", category: "Sides", portions: 4, prepTime: 30, allergens: ["A", "C"], steps: ["Kartoffelmasse zubereiten", "Formen", "Panieren", "Frittieren"] },
        { name: "Spätzle", category: "Sides", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Teig zubereiten", "Durch Spätzlepresse drücken", "In Butter schwenken"] },
        { name: "Serviettenknödel", category: "Sides", portions: 6, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Knödelmasse in Serviette wickeln", "Kochen", "In Scheiben schneiden"] },
        { name: "Bratkartoffeln", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "In Scheiben schneiden", "Knusprig braten"] },
        { name: "Sauerkraut", category: "Sides", portions: 4, prepTime: 40, allergens: [], steps: ["Kraut mit Kümmel dünsten", "Mit Schmalz verfeinern"] },
        { name: "Rotkraut", category: "Sides", portions: 4, prepTime: 50, allergens: [], steps: ["Rotkraut hobeln", "Mit Apfel und Essig schmoren"] },
        { name: "Speckkraut", category: "Sides", portions: 4, prepTime: 35, allergens: [], steps: ["Weißkraut mit Speck dünsten", "Mit Kümmel würzen"] },
        { name: "Bohnensalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Bohnen kochen", "Mit Essig-Öl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Gurkensalat", category: "Sides", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken hobeln", "Mit Sauerrahm-Dressing anmachen"] },
        { name: "Erdäpfelsalat", category: "Sides", portions: 4, prepTime: 30, allergens: [], steps: ["Kartoffeln kochen", "Warm marinieren", "Mit Essig und Öl anmachen"] },
        { name: "Krautsalat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Kraut hobeln", "Mit heißem Essig-Öl marinieren"] },
        { name: "Karottensalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Karotten raspeln", "Mit Zitrone und Öl anmachen"] },
        { name: "Rote Rüben Salat", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Rote Rüben kochen", "Schneiden", "Mit Kren marinieren"] },
        { name: "Vogerlsalat", category: "Sides", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Kernöl-Dressing anrichten"] },
        { name: "Gemischter Salat", category: "Sides", portions: 4, prepTime: 15, allergens: [], steps: ["Verschiedene Salate waschen", "Mit Dressing anrichten"] },
        { name: "Bratgemüse", category: "Sides", portions: 4, prepTime: 25, allergens: [], steps: ["Gemüse würfeln", "Im Ofen rösten"] },
        { name: "Karottengemüse", category: "Sides", portions: 4, prepTime: 20, allergens: ["G"], steps: ["Karotten kochen", "In Butter schwenken"] },
        { name: "Kohlsprossen", category: "Sides", portions: 4, prepTime: 20, allergens: [], steps: ["Kohlsprossen putzen", "Kochen", "In Butter schwenken"] },
        { name: "Rahmkohlrabi", category: "Sides", portions: 4, prepTime: 25, allergens: ["G"], steps: ["Kohlrabi kochen", "In Rahmsauce schwenken"] },

        // DESSERTS (25+)
        { name: "Kaiserschmarrn", category: "Desserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "In Pfanne backen", "Zerreißen", "Mit Puderzucker bestreuen"] },
        { name: "Apfelstrudel", category: "Desserts", portions: 8, prepTime: 60, allergens: ["A"], steps: ["Strudelteig ziehen", "Äpfel einwickeln", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Sachertorte", category: "Desserts", portions: 12, prepTime: 90, allergens: ["A", "C", "G"], steps: ["Schokobiskuit backen", "Mit Marmelade füllen", "Glasieren"] },
        { name: "Palatschinken", category: "Desserts", portions: 4, prepTime: 20, allergens: ["A", "C", "G"], steps: ["Teig zubereiten", "Dünne Pfannkuchen backen", "Mit Marmelade füllen"] },
        { name: "Topfenstrudel", category: "Desserts", portions: 8, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Topfenfülle zubereiten", "Einwickeln", "Backen"] },
        { name: "Germknödel", category: "Desserts", portions: 4, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Powidl füllen", "Dämpfen", "Mit Mohn bestreuen"] },
        { name: "Buchteln", category: "Desserts", portions: 12, prepTime: 75, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Marmelade füllen", "Backen", "Mit Vanillesauce servieren"] },
        { name: "Linzer Torte", category: "Desserts", portions: 12, prepTime: 60, allergens: ["A", "C", "H"], steps: ["Mürbteig mit Nüssen", "Mit Ribiselmarmelade füllen", "Gitter auflegen", "Backen"] },
        { name: "Esterházy Torte", category: "Desserts", portions: 12, prepTime: 90, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Buttercreme füllen", "Marmorglasur"] },
        { name: "Punschkrapferl", category: "Desserts", portions: 16, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuitreste mit Punsch vermengen", "Formen", "Rosa glasieren"] },
        { name: "Powidltascherl", category: "Desserts", portions: 4, prepTime: 45, allergens: ["A", "C"], steps: ["Kartoffelteig zubereiten", "Mit Powidl füllen", "Kochen", "In Bröseln wälzen"] },
        { name: "Grießschmarrn", category: "Desserts", portions: 4, prepTime: 25, allergens: ["A", "C", "G"], steps: ["Grießbrei kochen", "In Pfanne anbraten", "Zerreißen"] },
        { name: "Scheiterhaufen", category: "Desserts", portions: 6, prepTime: 65, allergens: ["A", "C", "G"], steps: ["Semmeln und Äpfel schichten", "Mit Eiermilch übergießen", "Backen"] },
        { name: "Milchrahmstrudel", category: "Desserts", portions: 8, prepTime: 55, allergens: ["A", "C", "G"], steps: ["Milchrahmfülle zubereiten", "In Strudelteig wickeln", "Backen"] },
        { name: "Nussschnitte", category: "Desserts", portions: 16, prepTime: 50, allergens: ["A", "C", "H"], steps: ["Biskuit backen", "Mit Nusscreme füllen", "Schneiden"] },
        { name: "Kardinalschnitte", category: "Desserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Biskuit und Baiser backen", "Schichten", "Schneiden"] },
        { name: "Vanillekipferl", category: "Desserts", portions: 40, prepTime: 45, allergens: ["A", "H"], steps: ["Mürbteig mit Nüssen", "Kipferl formen", "Backen", "In Vanillezucker wälzen"] },
        { name: "Marmorkuchen", category: "Desserts", portions: 12, prepTime: 60, allergens: ["A", "C", "G"], steps: ["Rührteig zubereiten", "Teil mit Kakao färben", "Marmorieren", "Backen"] },
        { name: "Gugelhupf", category: "Desserts", portions: 12, prepTime: 70, allergens: ["A", "C", "G"], steps: ["Germteig zubereiten", "Mit Rosinen", "In Form backen"] },
        { name: "Mohntorte", category: "Desserts", portions: 12, prepTime: 60, allergens: ["A", "C"], steps: ["Mohnmasse zubereiten", "Torte backen", "Mit Schlag servieren"] },
        { name: "Nusstorte", category: "Desserts", portions: 12, prepTime: 70, allergens: ["A", "C", "H"], steps: ["Nussböden backen", "Mit Creme füllen"] },
        { name: "Indianer", category: "Desserts", portions: 8, prepTime: 40, allergens: ["A", "C"], steps: ["Bisquit backen", "Aushöhlen", "Mit Schlag füllen", "Glasieren"] },
        { name: "Cremeschnitte", category: "Desserts", portions: 12, prepTime: 50, allergens: ["A", "C", "G"], steps: ["Blätterteig backen", "Vanillecreme zubereiten", "Schichten"] },
        { name: "Obstknödel", category: "Desserts", portions: 4, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Kartoffelteig zubereiten", "Obst einwickeln", "Kochen", "In Bröseln wälzen"] },
        { name: "Wiener Melange Mousse", category: "Desserts", portions: 4, prepTime: 30, allergens: ["C", "G"], steps: ["Kaffee-Mousse zubereiten", "Kalt stellen", "Mit Schlag servieren"] },

        // SALADS (10+)
        { name: "Steirischer Käferbohnensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Käferbohnen kochen", "Mit Kernöl marinieren", "Mit Zwiebeln servieren"] },
        { name: "Nüsslisalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Feldsalat waschen", "Mit Essig-Öl anmachen"] },
        { name: "Endiviensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Endivie waschen", "Mit Speckdressing anrichten"] },
        { name: "Radicchio Salat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Radicchio waschen", "Mit Balsamico anrichten"] },
        { name: "Tomatensalat", category: "Salads", portions: 4, prepTime: 10, allergens: [], steps: ["Tomaten schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Wurstsalat", category: "Salads", portions: 4, prepTime: 15, allergens: [], steps: ["Wurst in Streifen schneiden", "Mit Zwiebeln und Essig-Öl anmachen"] },
        { name: "Hirtensalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Gurken, Tomaten, Paprika schneiden", "Mit Schafskäse servieren"] },
        { name: "Caesar Salad", category: "Salads", portions: 4, prepTime: 20, allergens: ["A", "C", "D", "G"], steps: ["Romanasalat waschen", "Mit Caesar-Dressing anrichten", "Croûtons und Parmesan dazu"] },
        { name: "Fisolensalat", category: "Salads", portions: 4, prepTime: 20, allergens: [], steps: ["Fisolen kochen", "Mit Essig-Öl marinieren"] },
        { name: "Selleriesalat", category: "Salads", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Sellerie raspeln", "Mit Mayonnaise anmachen"] },

        // BREAKFAST (10+)
        { name: "Bauernfrühstück", category: "Breakfast", portions: 2, prepTime: 20, allergens: ["C"], steps: ["Kartoffeln braten", "Eier und Speck dazugeben", "Stocken lassen"] },
        { name: "Strammer Max", category: "Breakfast", portions: 2, prepTime: 15, allergens: ["A", "C"], steps: ["Brot mit Schinken belegen", "Spiegelei darauf geben"] },
        { name: "Eierspeis", category: "Breakfast", portions: 2, prepTime: 10, allergens: ["C"], steps: ["Eier verquirlen", "In Butter stocken lassen"] },
        { name: "Speckbrot", category: "Breakfast", portions: 2, prepTime: 10, allergens: ["A"], steps: ["Speck anbraten", "Auf Brot servieren"] },
        { name: "Verhackerts", category: "Breakfast", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Grammel faschieren", "Würzen", "Auf Brot streichen"] },
        { name: "Kipferl mit Butter", category: "Breakfast", portions: 4, prepTime: 5, allergens: ["A", "G"], steps: ["Kipferl aufschneiden", "Mit Butter bestreichen"] },
        { name: "Birchermüsli", category: "Breakfast", portions: 4, prepTime: 15, allergens: ["A", "G", "H"], steps: ["Haferflocken einweichen", "Mit Joghurt und Obst mischen"] },
        { name: "Käseaufstrich", category: "Breakfast", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Käse mischen", "Würzen", "Auf Brot streichen"] },
        { name: "Liptauer", category: "Breakfast", portions: 4, prepTime: 10, allergens: ["G"], steps: ["Topfen mit Paprika und Gewürzen mischen", "Kalt stellen"] },
        { name: "Wiener Frühstück", category: "Breakfast", portions: 2, prepTime: 15, allergens: ["A", "C", "G"], steps: ["Semmel mit Butter", "Weiches Ei", "Kaffee dazu"] },

        // SNACKS (10+)
        { name: "Bosna", category: "Snacks", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Bratwürste grillen", "In Semmel mit Zwiebeln und Senf servieren"] },
        { name: "Käsekrainer", category: "Snacks", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Krainer grillen", "Mit Senf und Kren servieren"] },
        { name: "Frankfurter", category: "Snacks", portions: 4, prepTime: 10, allergens: [], steps: ["Würstel erhitzen", "Mit Senf servieren"] },
        { name: "Leberkässemmel", category: "Snacks", portions: 4, prepTime: 10, allergens: ["A"], steps: ["Leberkäse anbraten", "In Semmel mit Senf servieren"] },
        { name: "Brezel", category: "Snacks", portions: 6, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Backen", "Mit Butter servieren"] },
        { name: "Langosch", category: "Snacks", portions: 4, prepTime: 25, allergens: ["A", "G"], steps: ["Teig ausbacken", "Mit Knoblauch und Käse belegen"] },
        { name: "Topfengolatsche", category: "Snacks", portions: 8, prepTime: 45, allergens: ["A", "C", "G"], steps: ["Blätterteig mit Topfen füllen", "Backen"] },
        { name: "Apfeltaschen", category: "Snacks", portions: 8, prepTime: 40, allergens: ["A"], steps: ["Blätterteig mit Apfel füllen", "Backen"] },
        { name: "Mohnflesserl", category: "Snacks", portions: 6, prepTime: 35, allergens: ["A"], steps: ["Germteig flechten", "Mit Mohn bestreuen", "Backen"] },
        { name: "Salzstangerl", category: "Snacks", portions: 8, prepTime: 30, allergens: ["A"], steps: ["Laugengebäck formen", "Mit Salz bestreuen", "Backen"] },

        // DRINKS (10+)
        { name: "Wiener Melange", category: "Drinks", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Espresso zubereiten", "Mit aufgeschäumter Milch servieren"] },
        { name: "Einspänner", category: "Drinks", portions: 1, prepTime: 5, allergens: ["G"], steps: ["Mokka in Glas", "Mit Schlagobers bedecken"] },
        { name: "Almudler Spritzer", category: "Drinks", portions: 1, prepTime: 2, allergens: [], steps: ["Almdudler mit Soda mischen"] },
        { name: "Hollunder Spritzer", category: "Drinks", portions: 1, prepTime: 2, allergens: [], steps: ["Holundersirup mit Soda aufgießen"] },
        { name: "Zitronen Eistee", category: "Drinks", portions: 4, prepTime: 15, allergens: [], steps: ["Tee kochen", "Mit Zitrone kalt stellen"] },
        { name: "Apfelsaft gespritzt", category: "Drinks", portions: 1, prepTime: 2, allergens: [], steps: ["Apfelsaft mit Mineralwasser mischen"] },
        { name: "Heiße Schokolade", category: "Drinks", portions: 1, prepTime: 10, allergens: ["G"], steps: ["Milch erhitzen", "Schokolade einrühren", "Mit Schlag servieren"] },
        { name: "Punsch", category: "Drinks", portions: 4, prepTime: 15, allergens: [], steps: ["Tee mit Gewürzen kochen", "Fruchtsaft hinzufügen"] },
        { name: "Glühwein", category: "Drinks", portions: 4, prepTime: 15, allergens: [], steps: ["Rotwein mit Gewürzen erhitzen", "Nicht kochen"] },
        { name: "Frischer Orangensaft", category: "Drinks", portions: 2, prepTime: 5, allergens: [], steps: ["Orangen auspressen", "Kalt servieren"] },

        // STARTERS (10+)
        { name: "Gebackene Champignons", category: "Starters", portions: 4, prepTime: 25, allergens: ["A", "C"], steps: ["Champignons panieren", "Ausbacken", "Mit Sauce Tartare servieren"] },
        { name: "Schinkenröllchen", category: "Starters", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Schinken mit Kren-Frischkäse füllen", "Aufrollen"] },
        { name: "Geräucherte Forelle", category: "Starters", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Forelle filetieren", "Mit Kren-Rahm servieren"] },
        { name: "Vitello Tonnato", category: "Starters", portions: 6, prepTime: 30, allergens: ["C", "D"], steps: ["Kalbfleisch kochen", "Mit Thunfischsauce servieren"] },
        { name: "Beef Tatar", category: "Starters", portions: 4, prepTime: 20, allergens: ["C"], steps: ["Rindfleisch fein hacken", "Würzen", "Mit Toast servieren"] },
        { name: "Carpaccio", category: "Starters", portions: 4, prepTime: 15, allergens: ["G"], steps: ["Rindfleisch dünn aufschneiden", "Mit Parmesan und Rucola servieren"] },
        { name: "Bruschetta", category: "Starters", portions: 4, prepTime: 15, allergens: ["A"], steps: ["Brot rösten", "Mit Tomaten-Basilikum belegen"] },
        { name: "Antipasti Teller", category: "Starters", portions: 4, prepTime: 20, allergens: [], steps: ["Mariniertes Gemüse anrichten", "Mit Oliven servieren"] },
        { name: "Bündnerfleisch", category: "Starters", portions: 4, prepTime: 10, allergens: [], steps: ["Bündnerfleisch dünn aufschneiden", "Mit Brot servieren"] },
        { name: "Räucherlachs", category: "Starters", portions: 4, prepTime: 10, allergens: ["D"], steps: ["Lachs auslegen", "Mit Dill und Zitrone servieren"] }
      ];

      let created = 0;
      for (const recipe of austrianRecipes) {
        await storage.createRecipe({
          name: recipe.name,
          category: recipe.category,
          portions: recipe.portions,
          prepTime: recipe.prepTime,
          image: null,
          sourceUrl: null,
          steps: recipe.steps,
          allergens: recipe.allergens
        });
        created++;
      }

      res.json({ message: `${created} Austrian recipes created successfully`, count: created });
    } catch (error: any) {
      console.error('Seed recipes error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === RECIPE EXPORT ===
  app.get("/api/recipes/:id/export/:format", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const format = req.params.format;
      const recipe = await storage.getRecipe(id);
      
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }
      
      const ingredients = await storage.getIngredients(id);
      
      if (format === 'pdf') {
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50 });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf"`);
        
        doc.pipe(res);
        
        doc.fontSize(24).font('Helvetica-Bold').text(recipe.name, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica').text(`Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zubereitungszeit: ${recipe.prepTime} Min.`);
        doc.moveDown();
        
        if (recipe.allergens && recipe.allergens.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold').text('Allergene: ');
          doc.font('Helvetica').text(recipe.allergens.join(', '));
          doc.moveDown();
        }
        
        doc.fontSize(14).font('Helvetica-Bold').text('Zutaten:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          doc.text(`• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}`);
        }
        doc.moveDown();
        
        doc.fontSize(14).font('Helvetica-Bold').text('Zubereitung:');
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica');
        recipe.steps.forEach((step, idx) => {
          doc.text(`${idx + 1}. ${step}`);
          doc.moveDown(0.5);
        });
        
        doc.end();
      } else if (format === 'docx') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, NumberFormat } = await import('docx');
        
        const children: any[] = [
          new Paragraph({
            text: recipe.name,
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Kategorie: ${recipe.category} | Portionen: ${recipe.portions} | Zeit: ${recipe.prepTime} Min.` }),
            ],
          }),
          new Paragraph({ text: '' }),
        ];
        
        if (recipe.allergens && recipe.allergens.length > 0) {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: 'Allergene: ', bold: true }),
              new TextRun({ text: recipe.allergens.join(', ') }),
            ],
          }));
        }
        
        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zutaten:', heading: HeadingLevel.HEADING_2 })
        );
        
        for (const ing of ingredients) {
          const allergenInfo = ing.allergens && ing.allergens.length > 0 ? ` (${ing.allergens.join(', ')})` : '';
          children.push(new Paragraph({ text: `• ${ing.amount} ${ing.unit} ${ing.name}${allergenInfo}` }));
        }
        
        children.push(
          new Paragraph({ text: '' }),
          new Paragraph({ text: 'Zubereitung:', heading: HeadingLevel.HEADING_2 })
        );
        
        recipe.steps.forEach((step, idx) => {
          children.push(new Paragraph({ text: `${idx + 1}. ${step}` }));
        });
        
        const doc = new Document({
          sections: [{ children }],
        });
        
        const buffer = await Packer.toBuffer(doc);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${recipe.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.docx"`);
        res.send(buffer);
      } else {
        res.status(400).json({ error: "Unsupported format. Use 'pdf' or 'docx'" });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === GUEST COUNTS ===
  app.get("/api/guests", async (req, res) => {
    const { start, end } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const counts = await storage.getGuestCounts(startDate, endDate);
    res.json(counts);
  });

  app.post("/api/guests", async (req, res) => {
    try {
      const parsed = insertGuestCountSchema.parse(req.body);
      const existing = await storage.getGuestCountByDateMeal(parsed.date, parsed.meal);
      if (existing) {
        const updated = await storage.updateGuestCount(existing.id, parsed);
        return res.json(updated);
      }
      const created = await storage.createGuestCount(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/guests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateGuestCount(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/guests/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteGuestCount(id);
    res.status(204).send();
  });

  // === CATERING EVENTS ===
  app.get("/api/catering", async (req, res) => {
    const events = await storage.getCateringEvents();
    res.json(events);
  });

  app.get("/api/catering/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const event = await storage.getCateringEvent(id);
    if (!event) return res.status(404).json({ error: "Not found" });
    res.json(event);
  });

  app.post("/api/catering", async (req, res) => {
    try {
      const parsed = insertCateringEventSchema.parse(req.body);
      const created = await storage.createCateringEvent(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/catering/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateCateringEvent(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/catering/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteCateringEvent(id);
    res.status(204).send();
  });

  // === STAFF ===
  app.get("/api/staff", async (req, res) => {
    const members = await storage.getStaff();
    res.json(members);
  });

  app.get("/api/staff/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const member = await storage.getStaffMember(id);
    if (!member) return res.status(404).json({ error: "Not found" });
    res.json(member);
  });

  app.post("/api/staff", async (req, res) => {
    try {
      const parsed = insertStaffSchema.parse(req.body);
      const created = await storage.createStaff(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateStaff(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteStaff(id);
    res.status(204).send();
  });

  // === SCHEDULE ===
  app.get("/api/schedule", async (req, res) => {
    const { start, end } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const entries = await storage.getScheduleEntries(startDate, endDate);
    res.json(entries);
  });

  app.post("/api/schedule", async (req, res) => {
    try {
      const parsed = insertScheduleEntrySchema.parse(req.body);
      const created = await storage.createScheduleEntry(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/schedule/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateScheduleEntry(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/schedule/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteScheduleEntry(id);
    res.status(204).send();
  });

  // === MENU PLANS ===
  app.get("/api/menu-plans", async (req, res) => {
    const { start, end } = req.query;
    const startDate = (start as string) || new Date().toISOString().split('T')[0];
    const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const plans = await storage.getMenuPlans(startDate, endDate);
    res.json(plans);
  });

  app.post("/api/menu-plans", async (req, res) => {
    try {
      const parsed = insertMenuPlanSchema.parse(req.body);
      const created = await storage.createMenuPlan(parsed);
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/menu-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await storage.updateMenuPlan(id, req.body);
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/menu-plans/:id", async (req, res) => {
    const id = parseInt(req.params.id, 10);
    await storage.deleteMenuPlan(id);
    res.status(204).send();
  });

  // === HACCP REPORT PDF EXPORT ===
  app.get("/api/haccp-logs/export", async (req, res) => {
    try {
      const { start, end } = req.query;
      const logs = await storage.getHaccpLogs();
      const fridges = await storage.getFridges();
      
      // Filter by date range if provided
      let filteredLogs = logs;
      if (start && end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);
        endDate.setHours(23, 59, 59);
        filteredLogs = logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
      }
      
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="HACCP_Bericht_${new Date().toISOString().split('T')[0]}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('HACCP Temperaturbericht', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' });
      doc.moveDown(2);
      
      // Group by fridge
      const fridgeMap = new Map<number, typeof filteredLogs>();
      for (const log of filteredLogs) {
        if (!fridgeMap.has(log.fridgeId)) fridgeMap.set(log.fridgeId, []);
        fridgeMap.get(log.fridgeId)!.push(log);
      }
      
      for (const [fridgeId, fridgeLogs] of fridgeMap) {
        const fridge = fridges.find(f => f.id === fridgeId);
        if (!fridge) continue;
        
        doc.fontSize(14).font('Helvetica-Bold').text(fridge.name);
        doc.fontSize(10).font('Helvetica').text(`Sollbereich: ${fridge.tempMin}°C bis ${fridge.tempMax}°C`);
        doc.moveDown(0.5);
        
        // Table header
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Datum/Zeit', 50, doc.y, { width: 120, continued: true });
        doc.text('Temp.', 170, doc.y, { width: 50, continued: true });
        doc.text('Status', 220, doc.y, { width: 60, continued: true });
        doc.text('Benutzer', 280, doc.y);
        doc.moveDown(0.3);
        
        doc.font('Helvetica').fontSize(9);
        for (const log of fridgeLogs.slice(0, 20)) {
          const date = new Date(log.timestamp).toLocaleString('de-DE');
          doc.text(date, 50, doc.y, { width: 120, continued: true });
          doc.text(`${log.temperature}°C`, 170, doc.y, { width: 50, continued: true });
          doc.text(log.status, 220, doc.y, { width: 60, continued: true });
          doc.text(log.user, 280, doc.y);
        }
        
        if (fridgeLogs.length > 20) {
          doc.text(`... und ${fridgeLogs.length - 20} weitere Einträge`);
        }
        
        doc.moveDown(1.5);
      }
      
      if (filteredLogs.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine HACCP-Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('HACCP export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === MENU PLAN EXPORT (PDF, XLSX, DOCX) ===
  app.get("/api/menu-plans/export", async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const plans = await storage.getMenuPlans(startDate, endDate);
      const recipes = await storage.getRecipes();
      
      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      const courseNames: Record<string, string> = { soup: 'Suppe', main_meat: 'Fleisch', side1: 'Beilage 1', side2: 'Beilage 2', main_veg: 'Vegetarisch', dessert: 'Dessert', main: 'Gericht' };
      
      const dateMap = new Map<string, { meal: string; course: string; recipeName: string; portions: number }[]>();
      for (const plan of plans) {
        if (!dateMap.has(plan.date)) dateMap.set(plan.date, []);
        const recipe = recipes.find(r => r.id === plan.recipeId);
        dateMap.get(plan.date)!.push({
          meal: plan.meal,
          course: (plan as any).course || 'main',
          recipeName: recipe?.name || '-',
          portions: plan.portions
        });
      }
      
      const sortedDates = Array.from(dateMap.keys()).sort();
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Menüplan');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mahlzeit', key: 'meal', width: 15 },
          { header: 'Gang', key: 'course', width: 15 },
          { header: 'Rezept', key: 'recipe', width: 30 },
          { header: 'Portionen', key: 'portions', width: 12 }
        ];
        
        for (const date of sortedDates) {
          const entries = dateMap.get(date)!;
          for (const entry of entries) {
            sheet.addRow({
              date: new Date(date).toLocaleDateString('de-DE'),
              meal: mealNames[entry.meal] || entry.meal,
              course: courseNames[entry.course] || entry.course,
              recipe: entry.recipeName,
              portions: entry.portions
            });
          }
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('Menüplan', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${startDate} bis ${endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      for (const date of sortedDates) {
        const d = new Date(date);
        doc.fontSize(14).font('Helvetica-Bold').text(d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
        doc.moveDown(0.5);
        
        const entries = dateMap.get(date)!;
        const meals = ['breakfast', 'lunch', 'dinner'];
        for (const meal of meals) {
          const mealEntries = entries.filter(e => e.meal === meal);
          if (mealEntries.length > 0) {
            doc.fontSize(11).font('Helvetica-Bold').text(mealNames[meal]);
            for (const entry of mealEntries) {
              doc.fontSize(10).font('Helvetica').text(`  ${courseNames[entry.course] || entry.course}: ${entry.recipeName} (${entry.portions} Port.)`);
            }
          }
        }
        doc.moveDown();
      }
      
      if (sortedDates.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('Menu plan export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === GUEST COUNTS EXPORT ===
  app.get("/api/guest-counts/export", async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const counts = await storage.getGuestCounts(startDate, endDate);
      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Gästezahlen');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mahlzeit', key: 'meal', width: 15 },
          { header: 'Erwachsene', key: 'adults', width: 12 },
          { header: 'Kinder', key: 'children', width: 12 },
          { header: 'Gesamt', key: 'total', width: 12 },
          { header: 'Notizen', key: 'notes', width: 30 }
        ];
        
        for (const count of counts) {
          sheet.addRow({
            date: new Date(count.date).toLocaleDateString('de-DE'),
            meal: mealNames[count.meal] || count.meal,
            adults: count.adults,
            children: count.children,
            total: count.adults + count.children,
            notes: count.notes || ''
          });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Gaestezahlen_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Gaestezahlen_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('Gästezahlen', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${startDate} bis ${endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      const dateMap = new Map<string, typeof counts>();
      for (const count of counts) {
        if (!dateMap.has(count.date)) dateMap.set(count.date, []);
        dateMap.get(count.date)!.push(count);
      }
      
      for (const [date, dayCounts] of Array.from(dateMap.entries()).sort()) {
        const d = new Date(date);
        doc.fontSize(12).font('Helvetica-Bold').text(d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }));
        
        for (const count of dayCounts) {
          doc.fontSize(10).font('Helvetica').text(`  ${mealNames[count.meal]}: ${count.adults} Erw. + ${count.children} Kinder = ${count.adults + count.children} Gesamt`);
        }
        doc.moveDown(0.5);
      }
      
      if (counts.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('Guest counts export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // === SCHEDULE EXPORT ===
  app.get("/api/schedule/export", async (req, res) => {
    try {
      const { start, end, format = 'pdf' } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const entries = await storage.getScheduleEntries(startDate, endDate);
      const staffList = await storage.getStaff();
      
      const typeNames: Record<string, string> = { shift: 'Schicht', vacation: 'Urlaub', sick: 'Krank', off: 'Frei' };
      const shiftNames: Record<string, string> = { early: 'Früh', late: 'Spät', night: 'Nacht' };
      
      if (format === 'xlsx') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Dienstplan');
        
        sheet.columns = [
          { header: 'Datum', key: 'date', width: 15 },
          { header: 'Mitarbeiter', key: 'staff', width: 20 },
          { header: 'Typ', key: 'type', width: 12 },
          { header: 'Schicht', key: 'shift', width: 12 },
          { header: 'Notizen', key: 'notes', width: 30 }
        ];
        
        for (const entry of entries) {
          const staffMember = staffList.find(s => s.id === entry.staffId);
          sheet.addRow({
            date: new Date(entry.date).toLocaleDateString('de-DE'),
            staff: staffMember?.name || 'Unbekannt',
            type: typeNames[entry.type] || entry.type,
            shift: entry.shift ? shiftNames[entry.shift] || entry.shift : '-',
            notes: entry.notes || ''
          });
        }
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.xlsx"`);
        await workbook.xlsx.write(res);
        return;
      }
      
      // Default: PDF
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Dienstplan_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('Dienstplan', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${startDate} bis ${endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      const dateMap = new Map<string, typeof entries>();
      for (const entry of entries) {
        if (!dateMap.has(entry.date)) dateMap.set(entry.date, []);
        dateMap.get(entry.date)!.push(entry);
      }
      
      for (const [date, dayEntries] of Array.from(dateMap.entries()).sort()) {
        const d = new Date(date);
        doc.fontSize(12).font('Helvetica-Bold').text(d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' }));
        
        for (const entry of dayEntries) {
          const staffMember = staffList.find(s => s.id === entry.staffId);
          const typeText = typeNames[entry.type] || entry.type;
          const shiftText = entry.shift ? ` (${shiftNames[entry.shift] || entry.shift})` : '';
          doc.fontSize(10).font('Helvetica').text(`  ${staffMember?.name || 'Unbekannt'}: ${typeText}${shiftText}`);
        }
        doc.moveDown(0.5);
      }
      
      if (entries.length === 0) {
        doc.fontSize(12).font('Helvetica').text('Keine Einträge im ausgewählten Zeitraum.', { align: 'center' });
      }
      
      doc.end();
    } catch (error: any) {
      console.error('Schedule export error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
