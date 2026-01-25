# Mise - befor Serve

## Overview

Mise is a professional kitchen management application designed for chefs and food service operations. Rebranded from ChefMate with orange (#F37021) color scheme. It provides recipe management with EU allergen tracking (14 allergens per regulation 1169/2011), HACCP temperature logging for food safety compliance, and PDF report generation. The application is built as a mobile-first Progressive Web App (PWA) with bilingual support (German/English).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: React Context API via custom `AppProvider` in `lib/store.tsx`
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a mobile-first design pattern with a fixed bottom navigation bar. Pages are located in `client/src/pages/` and shared components in `client/src/components/`.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

The server uses a storage abstraction layer (`server/storage.ts`) implementing the `IStorage` interface, allowing for potential swapping of data backends.

### Data Storage
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Schema**: Defined in `shared/schema.ts` using Drizzle ORM
- **Tables**: 
  - `users` - User authentication
  - `recipes` - Recipe storage with allergen tracking
  - `ingredients` - Recipe ingredients with individual allergen codes
  - `fridges` - Temperature monitoring units
  - `haccp_logs` - Temperature compliance logs

### Key Features
1. **Recipe Management**: CRUD operations with web scraping from German recipe sites (Chefkoch, etc.)
2. **Allergen Tracking**: EU-14 allergen codes (A-N) on both recipe and ingredient level
3. **HACCP Logging**: Temperature monitoring with OK/WARNING/CRITICAL status
4. **Internationalization**: German/English translations via custom i18n context
5. **PWA Support**: Manifest and mobile optimizations for installable app experience

### API Structure
- `GET/POST /api/recipes` - List and create recipes
- `GET/PUT/DELETE /api/recipes/:id` - Individual recipe operations
- `GET/POST /api/fridges` - Fridge unit management
- `GET/POST /api/haccp-logs` - Temperature logging
- `POST /api/scrape` - Recipe scraping from URLs

## External Dependencies

### Database
- PostgreSQL database required (connection via `DATABASE_URL` environment variable)
- Drizzle Kit for schema migrations (`npm run db:push`)

### Third-Party Libraries
- **jsPDF**: Client-side PDF generation for HACCP reports
- **Cheerio**: Server-side HTML parsing for recipe scraping
- **date-fns**: Date formatting and manipulation

### Recipe Scraping Sources
Supported German recipe platforms:
- chefkoch.de
- gutekueche.at
- ichkoche.at
- essen-und-trinken.de
- lecker.de
- kitchen-stories.com

### Fonts (Google Fonts)
- Inter (body text)
- Oswald (headings)
- Roboto Mono (monospace)