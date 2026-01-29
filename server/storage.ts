import {
  type User, type InsertUser,
  type Recipe, type InsertRecipe,
  type Ingredient, type InsertIngredient,
  type Fridge, type InsertFridge,
  type HaccpLog, type InsertHaccpLog,
  type GuestCount, type InsertGuestCount,
  type CateringEvent, type InsertCateringEvent,
  type Staff, type InsertStaff,
  type ShiftType, type InsertShiftType,
  type ScheduleEntry, type InsertScheduleEntry,
  type MenuPlan, type InsertMenuPlan,
  type AppSetting, type InsertAppSetting,
  type Task, type InsertTask,
  type TaskTemplate, type InsertTaskTemplate,
  users, recipes, ingredients, fridges, haccpLogs,
  guestCounts, cateringEvents, staff, shiftTypes, scheduleEntries, menuPlans, appSettings, tasks, taskTemplates
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // App settings
  getSetting(key: string): Promise<AppSetting | undefined>;
  getAllSettings(): Promise<AppSetting[]>;
  setSetting(key: string, value: string): Promise<AppSetting>;
  
  getRecipes(filters?: { q?: string; category?: string }): Promise<Recipe[]>;
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

  // Shift types (Dienste)
  getShiftTypes(): Promise<ShiftType[]>;
  getShiftType(id: number): Promise<ShiftType | undefined>;
  createShiftType(shiftType: InsertShiftType): Promise<ShiftType>;
  updateShiftType(id: number, shiftType: Partial<InsertShiftType>): Promise<ShiftType | undefined>;
  deleteShiftType(id: number): Promise<void>;

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

  // Tasks
  getTasksByDate(date: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, patch: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;

  // R2-T12: Task Templates
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplate(id: number): Promise<TaskTemplate | undefined>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: number, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: number): Promise<void>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // App settings
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting;
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings);
  }

  async setSetting(key: string, value: string): Promise<AppSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(appSettings).set({ value }).where(eq(appSettings.key, key)).returning();
      return updated;
    } else {
      const [created] = await db.insert(appSettings).values({ key, value }).returning();
      return created;
    }
  }

  async getRecipes(filters?: { q?: string; category?: string }): Promise<Recipe[]> {
    let query = db.select().from(recipes);

    if (filters?.category) {
      query = query.where(eq(recipes.category, filters.category)) as typeof query;
    }

    const results = await query;

    // Filter by search term in name (case-insensitive)
    if (filters?.q && filters.q.length >= 2) {
      const searchTerm = filters.q.toLowerCase();
      return results.filter(r => r.name.toLowerCase().includes(searchTerm));
    }

    return results;
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
    // R2-T4: Always update updatedAt on modification
    const [updated] = await db.update(recipes).set({
      ...recipe,
      updatedAt: new Date(),
    }).where(eq(recipes.id, id)).returning();
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

  // Shift types (Dienste)
  async getShiftTypes(): Promise<ShiftType[]> {
    return db.select().from(shiftTypes);
  }

  async getShiftType(id: number): Promise<ShiftType | undefined> {
    const [shiftType] = await db.select().from(shiftTypes).where(eq(shiftTypes.id, id));
    return shiftType;
  }

  async createShiftType(shiftType: InsertShiftType): Promise<ShiftType> {
    const [created] = await db.insert(shiftTypes).values(shiftType).returning();
    return created;
  }

  async updateShiftType(id: number, shiftType: Partial<InsertShiftType>): Promise<ShiftType | undefined> {
    const [updated] = await db.update(shiftTypes).set(shiftType).where(eq(shiftTypes.id, id)).returning();
    return updated;
  }

  async deleteShiftType(id: number): Promise<void> {
    await db.delete(shiftTypes).where(eq(shiftTypes.id, id));
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

  // Tasks
  async getTasksByDate(date: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.date, date)).orderBy(desc(tasks.priority));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }

  async updateTask(id: number, patch: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks).set(patch).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // R2-T12: Task Templates
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return db.select().from(taskTemplates).orderBy(taskTemplates.name);
  }

  async getTaskTemplate(id: number): Promise<TaskTemplate | undefined> {
    const [template] = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
    return template;
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const [created] = await db.insert(taskTemplates).values(template).returning();
    return created;
  }

  async updateTaskTemplate(id: number, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const [updated] = await db.update(taskTemplates).set(template).where(eq(taskTemplates.id, id)).returning();
    return updated;
  }

  async deleteTaskTemplate(id: number): Promise<void> {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, id));
  }
}

export const storage = new DatabaseStorage();
