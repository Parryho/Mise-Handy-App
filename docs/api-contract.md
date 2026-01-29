# Mise API Contract

## Base URL
```
/api
```

## Authentication

All protected routes require a valid session cookie. Unauthenticated requests return:
```json
{ "error": "Nicht angemeldet" }
```

### Error Responses
All API errors follow a unified format:
```json
{ "error": "Error message" }
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new user account (requires admin approval).

**Request Body:**
```json
{
  "name": "string (min 2 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "position": "string (kitchen position)"
}
```

**Response (201):**
```json
{
  "message": "Registrierung erfolgreich!...",
  "user": { "id": "string", "name": "string", "email": "string", "isApproved": false }
}
```

### POST /api/auth/login
Authenticate and create session.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "position": "string",
    "role": "admin|souschef|koch|fruehkoch|lehrling|abwasch|guest",
    "isApproved": true
  }
}
```

### POST /api/auth/logout
Destroy current session.

**Response (200):**
```json
{ "message": "Erfolgreich abgemeldet" }
```

### GET /api/auth/me
Get current authenticated user.

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "position": "string",
  "role": "string",
  "isApproved": boolean
}
```

### GET /api/auth/positions
Get available kitchen positions.

**Response (200):**
```json
["Küchenchef", "Sous-Chef", "Koch", "Früh-Koch", "Lehrling", "Abwasch", "Küchenhilfe", "Patissier", "Commis"]
```

### GET /api/auth/check-setup
Check if initial setup is needed.

**Response (200):**
```json
{ "needsSetup": boolean }
```

### POST /api/auth/setup
Create initial admin account (only when no users exist).

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

---

## Admin Endpoints (requireAdmin)

### GET /api/admin/users
Get all users.

**Response (200):** Array of users

### PUT /api/admin/users/:id
Update user role/approval status.

**Request Body:**
```json
{
  "role": "string",
  "isApproved": boolean,
  "position": "string"
}
```

### DELETE /api/admin/users/:id
Delete a user.

**Response (204):** No content

### GET /api/admin/settings
Get all app settings.

**Response (200):**
```json
{ "key1": "value1", "key2": "value2" }
```

### PUT /api/admin/settings/:key
Update a setting.

**Request Body:**
```json
{ "value": "string" }
```

---

## Recipe Endpoints (requireAuth)

### GET /api/recipes
Get all recipes with optional filters.

**Query Parameters:**
- `q` (string, optional): Search term (min 2 chars)
- `category` (string, optional): Filter by category

**Response (200):** Array of Recipe objects

### GET /api/recipes/:id
Get single recipe with ingredients.

**Response (200):**
```json
{
  "id": 1,
  "name": "string",
  "category": "Soups|Starters|Mains|MainsVeg|Sides|Desserts|Salads|Breakfast|Snacks|Drinks",
  "portions": 4,
  "prepTime": 30,
  "image": "string|null",
  "sourceUrl": "string|null",
  "steps": ["string"],
  "allergens": ["A", "B", "C", ...],
  "ingredientsList": [
    { "id": 1, "recipeId": 1, "name": "string", "amount": 100, "unit": "g", "allergens": [] }
  ]
}
```

### POST /api/recipes
Create new recipe.

**Request Body:**
```json
{
  "name": "string",
  "category": "string",
  "portions": 4,
  "prepTime": 30,
  "image": "string|null",
  "sourceUrl": "string|null",
  "steps": ["string"],
  "allergens": ["string"],
  "ingredientsList": [
    { "name": "string", "amount": 100, "unit": "g", "allergens": [] }
  ]
}
```

**Response (201):** Created Recipe

### PUT /api/recipes/:id
Update recipe.

**Response (200):** Updated Recipe

### DELETE /api/recipes/:id
Delete recipe.

**Response (204):** No content

### POST /api/recipes/import
Import recipe from URL (web scraping).

**Request Body:**
```json
{ "url": "string" }
```

**Response (201):** Created Recipe with ingredients

### GET /api/recipes/:id/export/:format
Export recipe as PDF or DOCX.

**Path Parameters:**
- `format`: `pdf` or `docx`

**Response:** Binary file download

### GET /api/recipes/:id/ingredients
Get ingredients for a recipe.

**Response (200):** Array of Ingredient objects

---

## Fridge Endpoints (requireAuth)

### GET /api/fridges
Get all fridges.

**Response (200):**
```json
[
  { "id": 1, "name": "Kühlraum", "tempMin": 0, "tempMax": 4 }
]
```

### POST /api/fridges
Create fridge.

**Request Body:**
```json
{ "name": "string", "tempMin": 0, "tempMax": 4 }
```

### PUT /api/fridges/:id
Update fridge.

### DELETE /api/fridges/:id
Delete fridge.

**Response (204):** No content

---

## HACCP Log Endpoints (requireAuth)

### GET /api/haccp-logs
Get all HACCP logs.

### GET /api/fridges/:id/logs
Get logs for specific fridge.

### POST /api/haccp-logs
Create HACCP log entry.

**Request Body:**
```json
{
  "fridgeId": 1,
  "temperature": 3.5,
  "timestamp": "2024-01-15T10:00:00Z",
  "user": "string",
  "status": "ok|warning|critical",
  "notes": "string|null"
}
```

### GET /api/haccp-logs/export
Export HACCP report as PDF.

**Query Parameters:**
- `start` (date string, optional)
- `end` (date string, optional)

**Response:** PDF file download

---

## Guest Count Endpoints (requireAuth)

### GET /api/guests
Get guest counts for date range.

**Query Parameters:**
- `start` (date string, default: today)
- `end` (date string, default: +7 days)

**Response (200):**
```json
[
  { "id": 1, "date": "2024-01-15", "meal": "breakfast|lunch|dinner", "adults": 50, "children": 10, "notes": "string|null" }
]
```

### POST /api/guests
Create or update guest count.

**Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "meal": "breakfast|lunch|dinner",
  "adults": 50,
  "children": 10,
  "notes": "string|null"
}
```

### PUT /api/guests/:id
Update guest count.

### DELETE /api/guests/:id
Delete guest count.

---

## Catering Event Endpoints (requireAuth)

### GET /api/catering
Get all catering events.

### GET /api/catering/:id
Get single event.

### POST /api/catering
Create event.

**Request Body:**
```json
{
  "clientName": "string",
  "eventName": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "personCount": 100,
  "dishes": ["string"],
  "notes": "string|null"
}
```

### PUT /api/catering/:id
Update event.

### DELETE /api/catering/:id
Delete event.

---

## Staff Endpoints (requireAuth)

### GET /api/staff
Get all staff members.

### GET /api/staff/:id
Get single staff member.

### POST /api/staff
Create staff member.

**Request Body:**
```json
{
  "name": "string",
  "role": "string",
  "color": "#3b82f6",
  "email": "string|null",
  "phone": "string|null"
}
```

### PUT /api/staff/:id
Update staff member.

### DELETE /api/staff/:id
Delete staff member.

---

## Shift Type Endpoints (requireAuth)

### GET /api/shift-types
Get all shift types.

**Response (200):**
```json
[
  { "id": 1, "name": "Frühstück", "startTime": "06:00", "endTime": "14:30", "color": "#22c55e" }
]
```

### POST /api/shift-types
Create shift type.

### PUT /api/shift-types/:id
Update shift type.

### DELETE /api/shift-types/:id
Delete shift type.

---

## Schedule Entry Endpoints (requireAuth)

### GET /api/schedule
Get schedule entries for date range.

**Query Parameters:**
- `start` (date string, default: today)
- `end` (date string, default: +30 days)

**Response (200):**
```json
[
  {
    "id": 1,
    "staffId": 1,
    "date": "2024-01-15",
    "type": "shift|vacation|sick|off",
    "shiftTypeId": 1,
    "shift": "early|late|night (legacy)",
    "notes": "string|null"
  }
]
```

### POST /api/schedule
Create schedule entry.

### PUT /api/schedule/:id
Update schedule entry.

### DELETE /api/schedule/:id
Delete schedule entry.

---

## Menu Plan Endpoints (requireAuth)

### GET /api/menu-plans
Get menu plans for date range.

**Query Parameters:**
- `start` (date string, default: today)
- `end` (date string, default: +7 days)

**Response (200):**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "meal": "breakfast|lunch|dinner",
    "course": "soup|main_meat|side1|side2|main_veg|dessert|main",
    "recipeId": 1,
    "portions": 50,
    "notes": "string|null"
  }
]
```

### POST /api/menu-plans
Create menu plan entry.

### PUT /api/menu-plans/:id
Update menu plan.

### DELETE /api/menu-plans/:id
Delete menu plan.

### GET /api/menu-plans/export
Export menu plan (PDF, XLSX, DOCX).

**Query Parameters:**
- `start` (date string)
- `end` (date string)
- `format`: `pdf|xlsx|docx`

---

## Task Endpoints (requireAuth)

### GET /api/tasks
Get tasks for a specific date.

**Query Parameters:**
- `date` (YYYY-MM-DD, default: today)

**Response (200):**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "title": "string",
    "note": "string|null",
    "assignedToUserId": "string|null",
    "status": "open|done",
    "priority": 0,
    "createdAt": "timestamp"
  }
]
```

### POST /api/tasks
Create task.

**Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "title": "string",
  "note": "string|null",
  "assignedToUserId": "string|null",
  "status": "open",
  "priority": 0
}
```

### PATCH /api/tasks/:id/status
Update task status.

**Request Body:**
```json
{ "status": "open|done" }
```

### DELETE /api/tasks/:id
Delete task.

---

## Seed Endpoints (requireAdmin)

### POST /api/seed
Seed initial data (fridges, shift types, staff).

### POST /api/seed-recipes
Seed 150+ Austrian/Styrian recipes.

---

## Allergen Codes (EU Standard)

| Code | Allergen |
|------|----------|
| A | Gluten (Getreide) |
| B | Krebstiere |
| C | Ei |
| D | Fisch |
| E | Erdnuss |
| F | Soja |
| G | Milch/Laktose |
| H | Schalenfrüchte |
| I | Sellerie |
| J | Senf |
| K | Sesam |
| L | Schwefeldioxid/Sulfite |
| M | Lupine |
| N | Weichtiere |

---

## Recipe Categories

| ID | German Label | Symbol |
|----|--------------|--------|
| Soups | Suppen | 🥄 |
| Starters | Vorspeisen | 🍽️ |
| Mains | Hauptspeise Fleisch | 🥩 |
| MainsVeg | Hauptspeise Veg | 🥗 |
| Sides | Beilagen | 🥔 |
| Desserts | Desserts | 🍰 |
| Salads | Salate | 🥬 |
| Breakfast | Frühstück | ☕ |
| Snacks | Snacks | 🥨 |
| Drinks | Getränke | 🍹 |

---

## User Roles & Permissions

| Role | Level | Description |
|------|-------|-------------|
| admin | 100 | Full access, user management |
| souschef | 80 | Kitchen management |
| koch | 60 | Standard kitchen access |
| fruehkoch | 50 | Morning shift access |
| lehrling | 30 | Apprentice access |
| abwasch | 20 | Dishwasher access |
| guest | 10 | Minimal access (unapproved) |
