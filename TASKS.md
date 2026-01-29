# TASKS.md

## Regeln
- 1 Ticket = 1 klarer Nutzen
- Definition of Done ist verpflichtend
- Mobile, Web und Backend sauber trennen

---

## Epic 0 – Foundation
(Tooling, Basis, Sicherheit, Setup)

### R1

**R1-T1** | ✅ Session-Persistenz (PostgreSQL)
- **Kurzbeschreibung:** express-session mit connect-pg-simple (oder PgStore) anbinden; Session-Tabelle anlegen. Sessions überleben Server-Neustart.
- **Betroffene Bereiche:** server, db
- **Definition of Done:** Session-Store auf PostgreSQL umgestellt; Neustart löscht keine Sessions; Login bleibt erhalten.

**R1-T2** | ✅ SESSION_SECRET aus Env, Prod-Check
- **Kurzbeschreibung:** SESSION_SECRET ausschließlich aus Umgebungsvariable; in Production fehlt Secret → Start abbrechen bzw. Warnung.
- **Betroffene Bereiche:** server
- **Definition of Done:** App startet in Prod nicht mit Default-/Zufalls-Secret; Doku (.env.example) angepasst.

**R1-T3** | ✅ requireAuth für Rezepte-APIs
- **Kurzbeschreibung:** Alle Rezept-Endpoints (GET/POST/PUT/DELETE /api/recipes, Import, Export, Ingredients) mit requireAuth schützen.
- **Betroffene Bereiche:** server
- **Definition of Done:** Ungeloggt liefern Rezept-APIs 401; geloggt funktionieren alle Rezept-Aktionen wie bisher.

**R1-T4** | ✅ requireAuth für Menü, Gäste, HACCP
- **Kurzbeschreibung:** Menu-Plans, Guests, Catering, Fridges, HACCP-Logs sowie zugehörige Export-Routen mit requireAuth schützen.
- **Betroffene Bereiche:** server
- **Definition of Done:** Ungeloggt 401 auf allen genannten Routes; geloggt unverändertes Verhalten.

**R1-T5** | ✅ requireAuth für Schedule, Staff, ShiftTypes
- **Kurzbeschreibung:** Staff, ShiftTypes, Schedule (CRUD + Export) mit requireAuth schützen.
- **Betroffene Bereiche:** server
- **Definition of Done:** Ungeloggt 401; geloggt bestehender Ablauf unverändert.

**R1-T6** | ✅ requireAdmin für GET /api/admin/settings
- **Kurzbeschreibung:** GET /api/admin/settings nur mit requireAdmin aufrufbar; Nicht-Admin erhält 403.
- **Betroffene Bereiche:** server
- **Definition of Done:** Als Staff 403 beim Abruf der Settings; als Admin 200 und korrekte Daten.

**R1-T7** | ✅ Einheitliche API-Error-Responses
- **Kurzbeschreibung:** 401/403/404 und weitere Fehler als einheitliches Objekt (z.B. `{ error: string, code?: string }`) zurückgeben; bestehende Konsumenten anpassen.
- **Betroffene Bereiche:** server
- **Definition of Done:** Alle relevanten Fehlerantworten nutzen dasselbe Format; Client zeigt sinnvolle Meldungen (z.B. „Nicht angemeldet", „Keine Berechtigung").

### R2

**R2-T1** | ✅ Strukturiertes Logging
- **Kurzbeschreibung:** API-Requests mit Request-ID, User (falls eingeloggt), Route, Status, Dauer loggen; keine Passwörter/Token.
- **Betroffene Bereiche:** server
- **Definition of Done:** Jeder API-Call erscheint strukturiert im Log; Debugging einer konkreten Anfrage möglich.

**R2-T2** | ✅ Rate-Limiting Login/Register
- **Kurzbeschreibung:** Login- und Register-Endpoints rate-limiten (z.B. pro IP / pro User); bei Überschreitung 429.
- **Betroffene Bereiche:** server
- **Definition of Done:** Nach konfigurierter Anzahl Requests 429; normale Nutzung nicht eingeschränkt.

---

## Epic 1 – Wissen / Rezepte
(Core Value: „Wie mache ich Risotto?“)

### R1

**R1-T8** | ✅ Globale Rezeptsuche (API)
- **Kurzbeschreibung:** GET /api/recipes um Query-Parameter `q` (und optional `category`) erweitern; Suche in name (und ggf. category).
- **Betroffene Bereiche:** server, shared
- **Definition of Done:** GET /api/recipes?q=Risotto liefert passende Rezepte; ohne q unverändertes Verhalten (alle bzw. gefiltert nach category).

**R1-T9** | ✅ Globale Rezeptsuche (UI)
- **Kurzbeschreibung:** Suchfeld auf Rezepte-Seite; Suche global (nicht nur in gewählter Kategorie), nutzt `q`; Min. 2 Zeichen, Debounce.
- **Betroffene Bereiche:** client
- **Definition of Done:** „Risotto" eingeben liefert Treffer über alle Kategorien; Kategorien-Filter optional kombinierbar.

**R1-T10** | ✅ Kategorien-Konsistenz Client ↔ Seed
- **Kurzbeschreibung:** Kategorien-Liste im Client mit Seed/DB abgleichen (z.B. Mains vs. MainsVeg); einheitliche IDs/Labels.
- **Betroffene Bereiche:** client, shared
- **Definition of Done:** Keine leeren Kategorien durch Mismatch; alle Seed-Kategorien in UI nutzbar.

**R1-T11** | ✅ Leerzustand Rezepte-Suche
- **Kurzbeschreibung:** Bei Suche ohne Treffer explizite Meldung „Keine Treffer" (kein leeres weisses Feld).
- **Betroffene Bereiche:** client
- **Definition of Done:** Suche ohne Ergebnis zeigt klaren Hinweis; ggf. Tipp „Kategorie wechseln" oder „Suchbegriff anpassen".

### R2

**R2-T3** | ✅ Rezepte tags (Schema + Migration)
- **Kurzbeschreibung:** Spalte `tags` (text[]) in recipes; Migration; Zod-Schema anpassen.
- **Betroffene Bereiche:** shared, db
- **Definition of Done:** Migration läuft; Rezepte haben optional tags; API akzeptiert/gibt tags zurück.
- **Hinweis:** `npm run db:push` ausführen für DB-Migration

**R2-T4** | ✅ Rezepte updated_at
- **Kurzbeschreibung:** Spalte `updated_at` (timestamp) in recipes; bei INSERT/UPDATE setzen; Migration.
- **Betroffene Bereiche:** shared, db
- **Definition of Done:** Migration läuft; Änderungen an Rezepten aktualisieren updated_at.
- **Hinweis:** `npm run db:push` ausführen für DB-Migration

**R2-T5** | ✅ Tags in Rezept-UI
- **Kurzbeschreibung:** Tags bei Rezept-Detail anzeigen; optional Filter „Nach Tag" (z.B. vegetarisch, schnell).
- **Betroffene Bereiche:** client
- **Definition of Done:** Tags sichtbar; Filter optional nutzbar; keine Regression bei Rezepten ohne Tags.

**R2-T6** | ✅ JSON-Bulk-Import Rezepte
- **Kurzbeschreibung:** POST /api/recipes/import-json (Admin); Body = Array von Rezepten im definierten JSON-Schema; Validierung, transaktional einfügen.
- **Betroffene Bereiche:** server, shared
- **Definition of Done:** Gültiges JSON wird importiert; Fehlerhafte Einträge führen zu klarem Fehler (kein teilweiser Import ohne Rollback); DoD aus Import-Schema-Spec erfüllt.

---

## Epic 2 – Dienstplan
(Core Value: „Wie arbeite ich die nächsten Tage?“)

### R1
- Keine zusätzlichen R1-Tickets; Absicherung erfolgt über Epic 0 (requireAuth für Schedule/Staff/ShiftTypes).

### R2

**R2-T7** | ✅ staff.user_id Migration
- **Kurzbeschreibung:** FK `staff.user_id` → users; Migration; optional Unique-Konstraint.
- **Betroffene Bereiche:** shared, db
- **Definition of Done:** Migration läuft; Staff-Einträge können einem User zugeordnet werden.
- **Hinweis:** `npm run db:push` ausführen für DB-Migration

**R2-T8** | Staff-User-Verknüpfung im UI
- **Kurzbeschreibung:** Im Staff-Bereich (Dienstplan) User auswählbar zuordnen; Anzeige „Verknüpfter User".
- **Betroffene Bereiche:** client
- **Definition of Done:** Staff-Mitglied optional mit User verknüpft; Zuordnung in UI änderbar.

**R2-T9** | ✅ „Meine Schichten" (Schedule-Filter mine=1)
- **Kurzbeschreibung:** GET /api/schedule?mine=1 filtert Einträge auf den verknüpften Staff des eingeloggten Users; UI-Toggle „Nur meine Schichten".
- **Betroffene Bereiche:** server, client
- **Definition of Done:** Mit mine=1 nur eigene Einträge; Toggle funktioniert; ohne Verknüpfung leer oder alle (Definition festhalten).

**R2-T10** | ✅ Gäste in Hauptnav
- **Kurzbeschreibung:** Gäste-Seite (bzw. /guests) in Layout-Navigation aufnehmen.
- **Betroffene Bereiche:** client
- **Definition of Done:** Gäste über Nav erreichbar; bestehende Gäste-Funktion unverändert.

**R2-T11** | ✅ Reports in Hauptnav
- **Kurzbeschreibung:** Reports-Seite (bzw. /reports) in Layout-Navigation aufnehmen.
- **Betroffene Bereiche:** client
- **Definition of Done:** Reports über Nav erreichbar; Exporte wie bisher nutzbar.

---

## Epic 3 – Heute / Tasks
(Core Value: „Was ist heute zu tun?“)

### R1

**R1-T12** | ✅ Heute-Seite anlegen
- **Kurzbeschreibung:** Neue Route /today (oder /heute); Platzhalter-Inhalt „Heute"; keine Nav-Anbindung noch.
- **Betroffene Bereiche:** client
- **Definition of Done:** /today erreichbar; Seite rendert; Inhalt klar als „Heute" erkennbar.

**R1-T13** | ✅ Heute in Layout-Nav
- **Kurzbeschreibung:** Navigations-Eintrag „Heute" (Icon + Label) in Layout hinzufügen; Route /today.
- **Betroffene Bereiche:** client
- **Definition of Done:** Heute von jeder Seite über Nav erreichbar; aktiver Zustand korrekt.

**R1-T14** | ✅ Tasks pro Tag laden
- **Kurzbeschreibung:** Heute-Seite ruft GET /api/tasks?date= auf; Default date = heute; Liste anzeigen (Title, Status, ggf. Priorität).
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Heutige Tasks erscheinen; leere Liste wenn keine Tasks.

**R1-T15** | ✅ Task anlegen
- **Kurzbeschreibung:** Formular Titel (Pflicht), optional Note, Priorität; POST /api/tasks; neue Tasks erscheinen in der Liste.
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Anlegen funktioniert; Liste aktualisiert sich; Validierungsfehler werden angezeigt.

**R1-T16** | ✅ Task abhaken (Status open/done)
- **Kurzbeschreibung:** Checkbox/Toggle pro Task; PATCH /api/tasks/:id/status mit status open | done; UI aktualisieren.
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Umstellen open ↔ done funktioniert; Zustand bleibt nach Reload erhalten.

**R1-T17** | ✅ Task löschen
- **Kurzbeschreibung:** Löschen-Button pro Task; DELETE /api/tasks/:id; Bestätigung (z.B. Alert-Dialog); Liste neu laden.
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Task verschwindet nach Bestätigung; bei Abbruch keine Änderung.

**R1-T18** | ✅ Datumswähler Heute
- **Kurzbeschreibung:** Datumswähler auf Heute-Seite; bei Änderung GET /api/tasks?date= mit neuem Datum; Tasks für gewähltes Datum anzeigen.
- **Betroffene Bereiche:** client
- **Definition of Done:** Wechsel des Datums lädt passende Tasks; Default bleibt heute.

**R1-T19** | ✅ Leerzustand Heute
- **Kurzbeschreibung:** Wenn keine Tasks für gewähltes Datum: klare Meldung „Keine Tasks" (o.ä.); kein leerer weisser Block.
- **Betroffene Bereiche:** client
- **Definition of Done:** Leerer Zustand mit Text und ggf. CTA „Task anlegen".

### R2

**R2-T12** | ✅ Task-Templates (Schema + API)
- **Kurzbeschreibung:** Tabelle task_templates (id, name, items JSONB oder 1:n); CRUD-API (Admin); Migration.
- **Betroffene Bereiche:** server, shared, db
- **Definition of Done:** Templates anleg-/bearbeit-/löschbar; API dokumentiert.
- **Hinweis:** `npm run db:push` ausführen für DB-Migration

**R2-T13** | ✅ „Tages-Checkliste aus Vorlage"
- **Kurzbeschreibung:** Auf Heute-Seite „Aus Vorlage übernehmen"; Template wählen, Datum (default heute); Tasks aus Template für Datum anlegen.
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Ein Klick erstellt Tasks aus Template für gewähltes Datum; Duplikate vermeiden (Definition z.B. „pro Tag nur einmal pro Template").

**R2-T14** | ✅ Menüplan-Anbindung Heute
- **Kurzbeschreibung:** Heute-Seite zeigt „Heutige Gerichte" aus Menu-Plan (datum = heute); Links zu Rezepten.
- **Betroffene Bereiche:** client, server
- **Definition of Done:** Heutige Menü-Einträge sichtbar; Klick öffnet Rezept; keine Menü-Daten → leerer Block oder Hinweis.

**R2-T15** | ✅ UX große Buttons Heute
- **Kurzbeschreibung:** Touch-Targets für Task-Checkbox, Löschen, „Task anlegen", Datumswähler mind. 44x44px; ausreichend Abstand.
- **Betroffene Bereiche:** client
- **Definition of Done:** Heute-Seite auf Tablet/Handy bedienbar; keine zu kleinen Klickflächen.

---

## Epic 4 – Admin & Rollen
(Core Value: Kontrolle & Pflege durch Admin)

### R1

**R1-T20** | ✅ Admin-Tabs nur für Admin
- **Kurzbeschreibung:** Settings: Tabs „Benutzer", „Sichtbarkeit" nur anzeigen wenn user.role === admin; Staff sieht nur „Allgemein" (z.B. Sprache).
- **Betroffene Bereiche:** client
- **Definition of Done:** Als Staff keine User-/Sichtbarkeit-Tabs; als Admin alle Tabs wie bisher.

### R2

**R2-T16** | Rollen-basierte Sicht (Admin vs. Staff)
- **Kurzbeschreibung:** Konsistente Nutzung von isAdmin/user.role: Links, Buttons, Routen (z.B. /admin) nur für Admin; Staff kann nichts Admin-relevantes auslösen.
- **Betroffene Bereiche:** client
- **Definition of Done:** Staff hat keinen Zugriff auf User-Management, Settings-Schreiben, Seeds, Bulk-Import; Admin unverändert.

**R2-T17** | User-Staff-Verknüpfung in Admin
- **Kurzbeschreibung:** In Admin User-Übersicht optional Staff-Mitglied anzeigen/verknüpfen (falls staff.user_id); umgekehrt in Staff-UI bereits R2-T8.
- **Betroffene Bereiche:** client
- **Definition of Done:** Admin sieht bei User zugehöriges Staff (falls vorhanden); Verknüpfung editierbar.

---

## Epic 5 – Datenbank & Seeds
(Core Value: App ist ab Tag 1 nutzbar)

### R1

**R1-T21** | ✅ JSON-Import-Schema (Dokumentation)
- **Kurzbeschreibung:** Spezifikation des Rezept-Import-Formats (JSON-Schema): title, category, tags, portions, ingredients, steps, times, notes, allergens, images; mind. ein Beispiel-Rezept als JSON.
- **Betroffene Bereiche:** shared, docs
- **Definition of Done:** Schema + Beispiel in Repo (z.B. docs/recipe-import-schema.json + Beispiel); von Bulk-Import (R2-T6) referenzierbar.

**R1-T22** | ✅ Starter-Pack Seed (20 Rezepte + 10 Standards)
- **Kurzbeschreibung:** Seed-Route/Script: 20 Rezepte (gemäß Kategorienvorschlag: Frühstück, Basics, Beilagen, Fleisch/Fisch, Veggie, Dessert, …) + 10 „Standards" (HACCP/Checklisten-ähnlich, z.B. als Rezepte oder eigene Entität); idempotent oder „nur wenn leer".
- **Betroffene Bereiche:** server, shared, db
- **Definition of Done:** Ein Aufruf (z.B. POST /api/seed-starter) füllt 20 Rezepte + 10 Standards; wiederholter Aufruf überschreibt nicht (oder nur nach expliziter Bestätigung).

**R1-T23** | ✅ Seed-Route nur wenn leer / nur Admin
- **Kurzbeschreibung:** /api/seed und /api/seed-recipes (bzw. Starter-Pack) nur für Admin oder nur wenn keine Daten vorhanden (Erstsetup); sonst 403.
- **Betroffene Bereiche:** server
- **Definition of Done:** Als Staff 403 auf Seed; als Admin oder bei leerer DB erlaubt; kein versehentliches Überschreiben in Produktion.

**R1-T24** | ✅ Kategorien-Enum (shared)
- **Kurzbeschreibung:** Zentrales Kategorien-Enum (z.B. in shared/schema oder shared/constants) für Rezepte; Client und Server nutzen dasselbe.
- **Betroffene Bereiche:** shared
- **Definition of Done:** Eine Quelle der Wahrheit für Kategorien; Client/Seed/API konsistent.

### R2
- Keine zusätzlichen R2-Tickets für Epic 5; Optional: „10 Standards“ als Task-Templates (R2-T12) abbilden – in R2-T13 berücksichtigen.

---

## Epic 6 – Mobile Vorbereitung
(Core Value: Expo-App kann andocken)

### R1

**R1-T25** | ✅ API-Contract (Dokumentation)
- **Kurzbeschreibung:** Liste der öffentlichen API-Endpoints (Methoden, Pfade, Query/Body, Auth) als Markdown oder OpenAPI-ähnlich; keine Implementierungsänderung.
- **Betroffene Bereiche:** docs, server
- **Definition of Done:** Dokumentation im Repo; alle genutzten Endpoints erfasst; Auth-Art (Session/Bearer) vermerkt.

**R1-T26** | ✅ Auth-Strategie für Mobile (Dokumentation)
- **Kurzbeschreibung:** Kurz dokumentieren: Web = Session/Cookie; Mobile (später) = Bearer-Token; wie Login-Endpoint erweitert werden könnte (z.B. ?client=mobile → Token); keine Umsetzung.
- **Betroffene Bereiche:** docs
- **Definition of Done:** Doku beschreibt Strategie; Referenz für spätere Mobile-Implementierung.

### R2

**R2-T18** | API-Versionierung (Prefix /api/v1)
- **Kurzbeschreibung:** Optional alle API-Routen unter /api/v1 verschieben (oder Proxy); Dokumentation anpassen; Clients auf /api/v1 umstellen.
- **Betroffene Bereiche:** server, client
- **Definition of Done:** API unter /api/v1 erreichbar; Keine Regression; Doku aktualisiert.

**R2-T19** | CORS-Allowlist (ENV)
- **Kurzbeschreibung:** CORS-Origins aus ENV (z.B. CORS_ORIGINS); in Produktion keine wildcard; Vorbereitung für spätere Mobile-Origin.
- **Betroffene Bereiche:** server
- **Definition of Done:** Erlaubte Origins konfigurierbar; Prod nutzt Allowlist; Doku angepasst.

---

## R3 / R4 – Backlog (nur Epics + Stichpunkte)

### R3 – Templates & Automatisierung
- Task-Templates erweitern (Wiederholung daily/weekly)
- Menüplan-Vorlagen („Wochen-Schema“)
- Optional: Erinnerungen für HACCP-Checks
- Reporting: einfache Auswertungen (HACCP, Gäste)

### R4 – Reporting & Qualität
- HACCP-/Gäste-Reports ausbauen
- Audit-Log für Admin-Aktionen
- Strukturierte Error-States clientseitig (zentral)
- Optional: PWA/Offline-Vorbereitung

---

## Zusammenfassung Ticket-Anzahl

| Epic | R1 | R2 |
|------|----|----|
| 0 – Foundation | 7 | 2 |
| 1 – Rezepte | 4 | 4 |
| 2 – Dienstplan | 0 | 5 |
| 3 – Heute | 8 | 4 |
| 4 – Admin | 1 | 2 |
| 5 – DB & Seeds | 4 | 0 |
| 6 – Mobile | 2 | 2 |
| **Summe** | **26** | **19** |

R1 + R2 zusammen 45 Tickets. Alle im Format 1–3h, einzeln testbar, ohne übergreifende Multi-Modul-Änderungen.

---

## Tagesplan – R1-Tickets

**Stand:** 2025-01-29
**Erledigt:** 26/26 R1-Tickets ✅
**Status:** R1 KOMPLETT ABGESCHLOSSEN

### Alle R1-Tickets ✅
| Tag | Tickets | Status |
|-----|---------|--------|
| Tag 1 | R1-T24, R1-T10, R1-T8, R1-T9, R1-T11 | ✅ |
| Tag 2 | R1-T20, R1-T21, R1-T23 | ✅ |
| Tag 3 | R1-T22, R1-T25, R1-T26 | ✅ |

---

## Nächste Phase: R2

**Erledigt:** 10/19 R2-Tickets ✅
**Offen:** 9 R2-Tickets

### Tag 1 – Logging & Rate-Limiting ✅
| Ticket | Beschreibung | Status |
|--------|--------------|--------|
| R2-T1 | Strukturiertes Logging | ✅ |
| R2-T2 | Rate-Limiting Login/Register | ✅ |

### Tag 2 – Rezepte erweitern ✅
| Ticket | Beschreibung | Status |
|--------|--------------|--------|
| R2-T3 | Rezepte tags (Schema) | ✅ |
| R2-T4 | Rezepte updated_at | ✅ |
| R2-T5 | Tags in Rezept-UI | ✅ |
| R2-T6 | JSON-Bulk-Import Rezepte | ✅ |

### Tag 3 – Dienstplan erweitern (4/5) ✅
| Ticket | Beschreibung | Status |
|--------|--------------|--------|
| R2-T7 | staff.user_id Migration | ✅ |
| R2-T8 | Staff-User-Verknüpfung UI | ⏳ offen |
| R2-T9 | "Meine Schichten" Filter | ✅ |
| R2-T10 | Gäste in Hauptnav | ✅ |
| R2-T11 | Reports in Hauptnav | ✅ |

**WICHTIG:** Nach Schemaänderungen `npm run db:push` ausführen!

### Tag 4 – Task-Templates & Heute
| Ticket | Beschreibung | Epic |
|--------|--------------|------|
| R2-T12 | Task-Templates (Schema + API) | Epic 3 |
| R2-T13 | Tages-Checkliste aus Vorlage | Epic 3 |
| R2-T14 | Menüplan-Anbindung Heute | Epic 3 |
| R2-T15 | UX große Buttons Heute | Epic 3 |

### Tag 5 – Admin & Mobile
| Ticket | Beschreibung | Epic |
|--------|--------------|------|
| R2-T16 | Rollen-basierte Sicht | Epic 4 |
| R2-T17 | User-Staff-Verknüpfung Admin | Epic 4 |
| R2-T18 | API-Versionierung /api/v1 | Epic 6 |
| R2-T19 | CORS-Allowlist (ENV) | Epic 6 |
