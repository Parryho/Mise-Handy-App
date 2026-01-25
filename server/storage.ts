import { 
  type User, type InsertUser,
  type Recipe, type InsertRecipe,
  type Ingredient, type InsertIngredient,
  type Fridge, type InsertFridge,
  type HaccpLog, type InsertHaccpLog,
  users, recipes, ingredients, fridges, haccpLogs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<void>;
  
  getIngredients(recipeId: number): Promise<Ingredient[]>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  deleteIngredientsByRecipe(recipeId: number): Promise<void>;
  
  getFridges(): Promise<Fridge[]>;
  getFridge(id: number): Promise<Fridge | undefined>;
  createFridge(fridge: InsertFridge): Promise<Fridge>;
  updateFridge(id: number, fridge: Partial<InsertFridge>): Promise<Fridge | undefined>;
  deleteFridge(id: number): Promise<void>;
  
  getHaccpLogs(): Promise<HaccpLog[]>;
  getHaccpLogsByFridge(fridgeId: number): Promise<HaccpLog[]>;
  createHaccpLog(log: InsertHaccpLog): Promise<HaccpLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRecipes(): Promise<Recipe[]> {
    return db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db.update(recipes).set(recipe).where(eq(recipes.id, id)).returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async getIngredients(recipeId: number): Promise<Ingredient[]> {
    return db.select().from(ingredients).where(eq(ingredients.recipeId, recipeId));
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db.insert(ingredients).values(ingredient).returning();
    return created;
  }

  async deleteIngredientsByRecipe(recipeId: number): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
  }

  async getFridges(): Promise<Fridge[]> {
    return db.select().from(fridges);
  }

  async getFridge(id: number): Promise<Fridge | undefined> {
    const [fridge] = await db.select().from(fridges).where(eq(fridges.id, id));
    return fridge;
  }

  async createFridge(fridge: InsertFridge): Promise<Fridge> {
    const [created] = await db.insert(fridges).values(fridge).returning();
    return created;
  }

  async updateFridge(id: number, fridge: Partial<InsertFridge>): Promise<Fridge | undefined> {
    const [updated] = await db.update(fridges).set(fridge).where(eq(fridges.id, id)).returning();
    return updated;
  }

  async deleteFridge(id: number): Promise<void> {
    await db.delete(fridges).where(eq(fridges.id, id));
  }

  async getHaccpLogs(): Promise<HaccpLog[]> {
    return db.select().from(haccpLogs).orderBy(desc(haccpLogs.timestamp));
  }

  async getHaccpLogsByFridge(fridgeId: number): Promise<HaccpLog[]> {
    return db.select().from(haccpLogs).where(eq(haccpLogs.fridgeId, fridgeId)).orderBy(desc(haccpLogs.timestamp));
  }

  async createHaccpLog(log: InsertHaccpLog): Promise<HaccpLog> {
    const [created] = await db.insert(haccpLogs).values(log).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
