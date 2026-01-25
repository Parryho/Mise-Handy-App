import { 
  type User, type InsertUser,
  type Recipe, type InsertRecipe,
  type Ingredient, type InsertIngredient,
  type Fridge, type InsertFridge,
  type HaccpLog, type InsertHaccpLog,
  type GuestCount, type InsertGuestCount,
  type CateringEvent, type InsertCateringEvent,
  type Staff, type InsertStaff,
  type ScheduleEntry, type InsertScheduleEntry,
  type MenuPlan, type InsertMenuPlan,
  users, recipes, ingredients, fridges, haccpLogs,
  guestCounts, cateringEvents, staff, scheduleEntries, menuPlans
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

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

  // Guest counts
  getGuestCounts(startDate: string, endDate: string): Promise<GuestCount[]>;
  getGuestCountByDateMeal(date: string, meal: string): Promise<GuestCount | undefined>;
  createGuestCount(count: InsertGuestCount): Promise<GuestCount>;
  updateGuestCount(id: number, count: Partial<InsertGuestCount>): Promise<GuestCount | undefined>;
  deleteGuestCount(id: number): Promise<void>;

  // Catering events
  getCateringEvents(): Promise<CateringEvent[]>;
  getCateringEvent(id: number): Promise<CateringEvent | undefined>;
  createCateringEvent(event: InsertCateringEvent): Promise<CateringEvent>;
  updateCateringEvent(id: number, event: Partial<InsertCateringEvent>): Promise<CateringEvent | undefined>;
  deleteCateringEvent(id: number): Promise<void>;

  // Staff
  getStaff(): Promise<Staff[]>;
  getStaffMember(id: number): Promise<Staff | undefined>;
  createStaff(member: InsertStaff): Promise<Staff>;
  updateStaff(id: number, member: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<void>;

  // Schedule
  getScheduleEntries(startDate: string, endDate: string): Promise<ScheduleEntry[]>;
  getScheduleEntry(id: number): Promise<ScheduleEntry | undefined>;
  createScheduleEntry(entry: InsertScheduleEntry): Promise<ScheduleEntry>;
  updateScheduleEntry(id: number, entry: Partial<InsertScheduleEntry>): Promise<ScheduleEntry | undefined>;
  deleteScheduleEntry(id: number): Promise<void>;

  // Menu plans
  getMenuPlans(startDate: string, endDate: string): Promise<MenuPlan[]>;
  getMenuPlan(id: number): Promise<MenuPlan | undefined>;
  createMenuPlan(plan: InsertMenuPlan): Promise<MenuPlan>;
  updateMenuPlan(id: number, plan: Partial<InsertMenuPlan>): Promise<MenuPlan | undefined>;
  deleteMenuPlan(id: number): Promise<void>;
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

  // Guest counts
  async getGuestCounts(startDate: string, endDate: string): Promise<GuestCount[]> {
    return db.select().from(guestCounts)
      .where(and(gte(guestCounts.date, startDate), lte(guestCounts.date, endDate)));
  }

  async getGuestCountByDateMeal(date: string, meal: string): Promise<GuestCount | undefined> {
    const [count] = await db.select().from(guestCounts)
      .where(and(eq(guestCounts.date, date), eq(guestCounts.meal, meal)));
    return count;
  }

  async createGuestCount(count: InsertGuestCount): Promise<GuestCount> {
    const [created] = await db.insert(guestCounts).values(count).returning();
    return created;
  }

  async updateGuestCount(id: number, count: Partial<InsertGuestCount>): Promise<GuestCount | undefined> {
    const [updated] = await db.update(guestCounts).set(count).where(eq(guestCounts.id, id)).returning();
    return updated;
  }

  async deleteGuestCount(id: number): Promise<void> {
    await db.delete(guestCounts).where(eq(guestCounts.id, id));
  }

  // Catering events
  async getCateringEvents(): Promise<CateringEvent[]> {
    return db.select().from(cateringEvents).orderBy(desc(cateringEvents.date));
  }

  async getCateringEvent(id: number): Promise<CateringEvent | undefined> {
    const [event] = await db.select().from(cateringEvents).where(eq(cateringEvents.id, id));
    return event;
  }

  async createCateringEvent(event: InsertCateringEvent): Promise<CateringEvent> {
    const [created] = await db.insert(cateringEvents).values(event).returning();
    return created;
  }

  async updateCateringEvent(id: number, event: Partial<InsertCateringEvent>): Promise<CateringEvent | undefined> {
    const [updated] = await db.update(cateringEvents).set(event).where(eq(cateringEvents.id, id)).returning();
    return updated;
  }

  async deleteCateringEvent(id: number): Promise<void> {
    await db.delete(cateringEvents).where(eq(cateringEvents.id, id));
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    return db.select().from(staff);
  }

  async getStaffMember(id: number): Promise<Staff | undefined> {
    const [member] = await db.select().from(staff).where(eq(staff.id, id));
    return member;
  }

  async createStaff(member: InsertStaff): Promise<Staff> {
    const [created] = await db.insert(staff).values(member).returning();
    return created;
  }

  async updateStaff(id: number, member: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [updated] = await db.update(staff).set(member).where(eq(staff.id, id)).returning();
    return updated;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // Schedule
  async getScheduleEntries(startDate: string, endDate: string): Promise<ScheduleEntry[]> {
    return db.select().from(scheduleEntries)
      .where(and(gte(scheduleEntries.date, startDate), lte(scheduleEntries.date, endDate)));
  }

  async getScheduleEntry(id: number): Promise<ScheduleEntry | undefined> {
    const [entry] = await db.select().from(scheduleEntries).where(eq(scheduleEntries.id, id));
    return entry;
  }

  async createScheduleEntry(entry: InsertScheduleEntry): Promise<ScheduleEntry> {
    const [created] = await db.insert(scheduleEntries).values(entry).returning();
    return created;
  }

  async updateScheduleEntry(id: number, entry: Partial<InsertScheduleEntry>): Promise<ScheduleEntry | undefined> {
    const [updated] = await db.update(scheduleEntries).set(entry).where(eq(scheduleEntries.id, id)).returning();
    return updated;
  }

  async deleteScheduleEntry(id: number): Promise<void> {
    await db.delete(scheduleEntries).where(eq(scheduleEntries.id, id));
  }

  // Menu plans
  async getMenuPlans(startDate: string, endDate: string): Promise<MenuPlan[]> {
    return db.select().from(menuPlans)
      .where(and(gte(menuPlans.date, startDate), lte(menuPlans.date, endDate)));
  }

  async getMenuPlan(id: number): Promise<MenuPlan | undefined> {
    const [plan] = await db.select().from(menuPlans).where(eq(menuPlans.id, id));
    return plan;
  }

  async createMenuPlan(plan: InsertMenuPlan): Promise<MenuPlan> {
    const [created] = await db.insert(menuPlans).values(plan).returning();
    return created;
  }

  async updateMenuPlan(id: number, plan: Partial<InsertMenuPlan>): Promise<MenuPlan | undefined> {
    const [updated] = await db.update(menuPlans).set(plan).where(eq(menuPlans.id, id)).returning();
    return updated;
  }

  async deleteMenuPlan(id: number): Promise<void> {
    await db.delete(menuPlans).where(eq(menuPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
