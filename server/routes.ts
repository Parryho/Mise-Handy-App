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

  // === MENU PLAN PDF EXPORT ===
  app.get("/api/menu-plans/export", async (req, res) => {
    try {
      const { start, end } = req.query;
      const startDate = (start as string) || new Date().toISOString().split('T')[0];
      const endDate = (end as string) || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const plans = await storage.getMenuPlans(startDate, endDate);
      const recipes = await storage.getRecipes();
      
      const PDFDocument = (await import('pdfkit')).default;
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Menuplan_${startDate}_${endDate}.pdf"`);
      
      doc.pipe(res);
      
      doc.fontSize(20).font('Helvetica-Bold').text('Menüplan', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`${startDate} bis ${endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      const meals = ['breakfast', 'lunch', 'dinner'];
      const mealNames: Record<string, string> = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen' };
      
      // Group by date
      const dateMap = new Map<string, { meal: string; recipeName: string; portions: number }[]>();
      for (const plan of plans) {
        if (!dateMap.has(plan.date)) dateMap.set(plan.date, []);
        const recipe = recipes.find(r => r.id === plan.recipeId);
        dateMap.get(plan.date)!.push({
          meal: plan.meal,
          recipeName: recipe?.name || 'Kein Rezept',
          portions: plan.portions
        });
      }
      
      // Sort dates
      const sortedDates = Array.from(dateMap.keys()).sort();
      
      for (const date of sortedDates) {
        const d = new Date(date);
        doc.fontSize(14).font('Helvetica-Bold').text(d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }));
        doc.moveDown(0.5);
        
        const entries = dateMap.get(date)!;
        for (const meal of meals) {
          const entry = entries.find(e => e.meal === meal);
          if (entry) {
            doc.fontSize(11).font('Helvetica').text(`${mealNames[meal]}: ${entry.recipeName} (${entry.portions} Portionen)`);
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

  return httpServer;
}
