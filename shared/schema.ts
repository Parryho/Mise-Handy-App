import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, doublePrecision, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Recipe Categories - Single source of truth for client and server
export const RECIPE_CATEGORIES = [
  { id: "ClearSoups", label: "Klare Suppen", symbol: "🍜" },
  { id: "CreamSoups", label: "Cremesuppen", symbol: "🥣" },
  { id: "MainMeat", label: "Haupt-Fleisch", symbol: "🥩" },
  { id: "MainVegan", label: "Haupt-Vegan/Vegi", symbol: "🥦" },
  { id: "Sides", label: "Beilagen", symbol: "🥔" },
  { id: "ColdSauces", label: "Kalte Saucen", symbol: "🫙" },
  { id: "HotSauces", label: "Warme Saucen", symbol: "🍲" },
  { id: "Salads", label: "Salate", symbol: "🥬" },
  { id: "HotDesserts", label: "Warme Dessert", symbol: "🍮" },
  { id: "ColdDesserts", label: "Kalte Dessert", symbol: "🍨" },
] as const;

export type RecipeCategoryId = typeof RECIPE_CATEGORIES[number]["id"];

// Session table (managed by connect-pg-simple, defined here so Drizzle doesn't delete it)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(), // JSON stored as text
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Roles: admin (Küchenchef), souschef, koch, fruehkoch, lehrling, abwasch, guest
// Positions: Küchenchef, Sous-Chef, Koch, Früh-Koch, Lehrling, Abwasch, Küchenhilfe, etc.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(), // email for login
  password: text("password").notNull(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  position: text("position").notNull().default("Koch"), // Küchenposition (Koch, Lehrling, Früh-Koch, Abwasch...)
  role: text("role").notNull().default("guest"), // admin, souschef, koch, fruehkoch, lehrling, abwasch, guest
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// App settings for visibility control
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  portions: integer("portions").notNull().default(1),
  prepTime: integer("prep_time").notNull().default(0),
  image: text("image"),
  sourceUrl: text("source_url"),
  steps: text("steps").array().notNull().default([]),
  allergens: text("allergens").array().notNull().default([]),
  // R2-T3: Tags for filtering (e.g., vegetarisch, schnell, vegan)
  tags: text("tags").array().notNull().default([]),
  // R2-T4: Track last modification
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  amount: doublePrecision("amount").notNull(),
  unit: text("unit").notNull(),
  allergens: text("allergens").array().notNull().default([]),
});

export const fridges = pgTable("fridges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  tempMin: doublePrecision("temp_min").notNull(),
  tempMax: doublePrecision("temp_max").notNull(),
});

export const haccpLogs = pgTable("haccp_logs", {
  id: serial("id").primaryKey(),
  fridgeId: integer("fridge_id").references(() => fridges.id, { onDelete: "cascade" }).notNull(),
  temperature: doublePrecision("temperature").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  user: text("user").notNull(),
  status: text("status").notNull(),
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const registerUserSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  position: z.string().min(1, "Bitte Küchenposition wählen"),
});
export const loginUserSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(1, "Passwort erforderlich"),
});
export const insertAppSettingSchema = createInsertSchema(appSettings).omit({ id: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export const insertFridgeSchema = createInsertSchema(fridges).omit({ id: true });
export const insertHaccpLogSchema = createInsertSchema(haccpLogs).omit({ id: true }).extend({
  timestamp: z.string().or(z.date()).transform(val => typeof val === 'string' ? new Date(val) : val),
});

// Guest counts per meal
export const guestCounts = pgTable("guest_counts", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD format
  meal: text("meal").notNull(), // breakfast, lunch, dinner
  adults: integer("adults").notNull().default(0),
  children: integer("children").notNull().default(0),
  notes: text("notes"),
});

// Catering events
export const cateringEvents = pgTable("catering_events", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  eventName: text("event_name").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").notNull(), // HH:MM
  personCount: integer("person_count").notNull(),
  dishes: text("dishes").array().notNull().default([]),
  notes: text("notes"),
});

// Staff members
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  color: text("color").notNull().default("#3b82f6"),
  email: text("email"),
  phone: text("phone"),
  // R2-T7: Link staff to user account (optional)
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
});

// Shift types (Dienste) with times
export const shiftTypes = pgTable("shift_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  color: text("color").notNull().default("#F37021"),
});

// Schedule entries (shifts and absences)
export const scheduleEntries = pgTable("schedule_entries", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id, { onDelete: "cascade" }).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  type: text("type").notNull(), // shift, vacation, sick, off
  shiftTypeId: integer("shift_type_id").references(() => shiftTypes.id, { onDelete: "set null" }), // reference to shift type
  shift: text("shift"), // legacy: early, late, night (only for type=shift)
  notes: text("notes"),
});

// Menu plans
export const menuPlans = pgTable("menu_plans", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  meal: text("meal").notNull(), // breakfast, lunch, dinner
  course: text("course").notNull().default("main"), // soup, main_meat, side1, side2, main_veg, dessert, main (for breakfast)
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "set null" }),
  portions: integer("portions").notNull().default(1),
  notes: text("notes"),
});

export const insertGuestCountSchema = createInsertSchema(guestCounts).omit({ id: true });
export const insertCateringEventSchema = createInsertSchema(cateringEvents).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertShiftTypeSchema = createInsertSchema(shiftTypes).omit({ id: true });
export const insertScheduleEntrySchema = createInsertSchema(scheduleEntries).omit({ id: true });
export const insertMenuPlanSchema = createInsertSchema(menuPlans).omit({ id: true });

// Tasks for "Heute" module
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // YYYY-MM-DD
  title: text("title").notNull(),
  note: text("note"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("open"), // open | done
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const updateTaskStatusSchema = z.object({
  status: z.enum(["open", "done"]),
});

// R2-T12: Task Templates for recurring checklists
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Items stored as JSON array: [{ title: string, note?: string, priority?: number }]
  items: text("items").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Fridge = typeof fridges.$inferSelect;
export type InsertFridge = z.infer<typeof insertFridgeSchema>;
export type HaccpLog = typeof haccpLogs.$inferSelect;
export type InsertHaccpLog = z.infer<typeof insertHaccpLogSchema>;
export type GuestCount = typeof guestCounts.$inferSelect;
export type InsertGuestCount = z.infer<typeof insertGuestCountSchema>;
export type CateringEvent = typeof cateringEvents.$inferSelect;
export type InsertCateringEvent = z.infer<typeof insertCateringEventSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type ShiftType = typeof shiftTypes.$inferSelect;
export type InsertShiftType = z.infer<typeof insertShiftTypeSchema>;
export type ScheduleEntry = typeof scheduleEntries.$inferSelect;
export type InsertScheduleEntry = z.infer<typeof insertScheduleEntrySchema>;
export type MenuPlan = typeof menuPlans.$inferSelect;
export type InsertMenuPlan = z.infer<typeof insertMenuPlanSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
