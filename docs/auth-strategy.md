# Mise Authentication Strategy

## Overview

Mise uses session-based authentication with PostgreSQL session storage. This document describes the authentication flow for both web and mobile clients.

## Session Configuration

```typescript
{
  store: PgSession (connect-pg-simple),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true (production only),
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 days
  }
}
```

### Session Table
Sessions are persisted in PostgreSQL:
```sql
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar PRIMARY KEY,
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);
CREATE INDEX "IDX_session_expire" ON "session" ("expire");
```

## Authentication Flow

### 1. Registration Flow
```
┌─────────┐     POST /api/auth/register     ┌─────────┐
│ Client  │ ──────────────────────────────► │ Server  │
│         │  { name, email, password,       │         │
│         │    position }                   │         │
└─────────┘                                 └────┬────┘
                                                 │
                                                 ▼
                                         ┌──────────────┐
                                         │ Validate &   │
                                         │ Hash Password│
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Create User  │
                                         │ isApproved=  │
                                         │ false        │
                                         └──────┬───────┘
                                                │
                                                ▼
                               ◄──── 201 { user, message } ────
```

### 2. Admin Approval
- New users have `isApproved: false` and `role: "guest"`
- Admin must approve via PUT `/api/admin/users/:id`
- Unapproved users receive 403 on login attempt

### 3. Login Flow
```
┌─────────┐     POST /api/auth/login        ┌─────────┐
│ Client  │ ──────────────────────────────► │ Server  │
│         │  { email, password }            │         │
└─────────┘                                 └────┬────┘
                                                 │
                                                 ▼
                                         ┌──────────────┐
                                         │ Verify creds │
                                         │ Check approve│
                                         └──────┬───────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ Create       │
                                         │ Session      │
                                         └──────┬───────┘
                                                │
                                                ▼
                              ◄──── 200 { user } + Set-Cookie ────
```

### 4. Session Verification (Protected Routes)
```
┌─────────┐     GET /api/recipes           ┌─────────┐
│ Client  │ ──────────────────────────────►│ Server  │
│         │  Cookie: connect.sid=xxx       │         │
└─────────┘                                └────┬────┘
                                                │
                                                ▼
                                         ┌──────────────┐
                                         │ requireAuth  │
                                         │ Middleware   │
                                         └──────┬───────┘
                                                │
                              ┌─────────────────┴─────────────────┐
                              ▼                                   ▼
                     Valid Session?                        No Session
                              │                                   │
                              ▼                                   ▼
                    Check user.isApproved              401 "Nicht angemeldet"
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
               Approved            Not Approved
                    │                   │
                    ▼                   ▼
              Continue           401 "Keine Berechtigung"
```

## Middleware

### requireAuth
Verifies user is logged in and approved:
```typescript
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isApproved) {
    return res.status(401).json({ error: "Keine Berechtigung" });
  }
  req.user = user;
  next();
};
```

### requireAdmin
Verifies user has admin role:
```typescript
const requireAdmin = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Keine Berechtigung" });
  }
  req.user = user;
  next();
};
```

## Mobile App Integration

### Cookie Handling
Mobile clients must:
1. Store the `connect.sid` cookie from login response
2. Include cookie in all subsequent requests
3. Handle cookie expiration (7 days)

### React Native / Expo Example
```typescript
// Login and store session
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    // Cookie is automatically handled by fetch with credentials
    return await response.json();
  }
  throw new Error('Login failed');
};

// Authenticated request
const fetchRecipes = async () => {
  const response = await fetch(`${API_URL}/api/recipes`, {
    credentials: 'include' // Include session cookie
  });
  return response.json();
};
```

### Alternative: Custom Session Header
For mobile apps where cookies are problematic:
```typescript
// Store session ID from Set-Cookie header
const sessionId = extractSessionId(response.headers.get('Set-Cookie'));
await AsyncStorage.setItem('sessionId', sessionId);

// Include in subsequent requests
const response = await fetch(url, {
  headers: {
    'Cookie': `connect.sid=${sessionId}`
  }
});
```

## Security Considerations

### Session Secret
- **Production**: `SESSION_SECRET` environment variable is **required**
- **Development**: Falls back to insecure default (with warning)
- Generate with: `openssl rand -base64 32`

### Password Hashing
- bcrypt with 10 rounds
- Passwords never stored in plain text

### Cookie Security
| Flag | Production | Development |
|------|------------|-------------|
| secure | true | false |
| httpOnly | true | true |
| sameSite | lax | lax |

### Rate Limiting (Recommended)
Consider adding rate limiting to:
- `/api/auth/login` - Prevent brute force
- `/api/auth/register` - Prevent spam accounts

## Error Responses

| HTTP Status | Error | Meaning |
|-------------|-------|---------|
| 401 | "Nicht angemeldet" | No valid session |
| 401 | "Keine Berechtigung" | User not approved |
| 401 | "Ungültige Anmeldedaten" | Wrong email/password |
| 403 | "Keine Berechtigung" | Admin required |
| 403 | "Ihr Konto wurde noch nicht freigeschaltet..." | Account pending approval |

## Role Hierarchy

```
admin (100)
    └── Full access to all endpoints
        └── User management
        └── App settings
        └── Seed data

souschef (80)
    └── All authenticated routes

koch (60)
    └── All authenticated routes

fruehkoch (50)
    └── All authenticated routes

lehrling (30)
    └── All authenticated routes

abwasch (20)
    └── All authenticated routes

guest (10)
    └── Cannot access any protected routes
    └── Must be approved first
```

## Environment Variables

```env
# Required in production
SESSION_SECRET=your-secure-random-string

# Database connection
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Optional
NODE_ENV=production  # Enables secure cookies
```

## Default Admin Account

On first server start, a default admin is created:
- Email: `admin@mise.app`
- Password: `admin123`
- **Change this immediately in production!**
