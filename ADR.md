# Architecture Decision Records

## ADR-001: CORS Konfiguration (2025-01-27)

**Kontext:** Backend soll im LAN erreichbar sein (z.B. Handy im WLAN).

**Entscheidung:**
- Development: `origin: true` (alle Origins erlaubt)
- Production: `origin: false` (CORS deaktiviert, da same-origin deployment erwartet)

**Begründung:** Minimale Konfiguration. Falls Production später separate Origins braucht, kann `origin` auf eine Allowlist (z.B. ENV-Variable `CORS_ORIGINS`) umgestellt werden.
