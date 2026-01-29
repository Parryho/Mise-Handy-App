import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import crypto from "crypto";

const app = express();
const isDev = process.env.NODE_ENV !== "production";

// CORS: In dev allow all origins for LAN access, in production disable
app.use(cors({
  origin: isDev ? true : false,
  credentials: true,
}));
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Extend Express Request type for requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Generate unique request ID
app.use((req, _res, next) => {
  req.requestId = crypto.randomBytes(8).toString("hex");
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = ["password", "token", "secret", "authorization", "cookie"];

function sanitizeForLog(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const sanitized: any = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof obj[key] === "object") {
      sanitized[key] = sanitizeForLog(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
}

// R2-T1: Structured logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Get user from session if available
      const session = (req as any).session;
      const userId = session?.userId || "-";

      // Structured log format: [requestId] user=X METHOD /path STATUS DURATIONms
      let logLine = `[${req.requestId}] user=${userId} ${req.method} ${path} ${res.statusCode} ${duration}ms`;

      // Add sanitized response for non-successful requests or in dev mode
      if (capturedJsonResponse && (res.statusCode >= 400 || isDev)) {
        const sanitized = sanitizeForLog(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitized)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Interner Serverfehler";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Port aus .env (z.B. PORT=3000), sonst 5000
  const port = parseInt(process.env.PORT || "5000", 10);

  // LAN-Zugriff: 0.0.0.0 erlaubt Verbindungen von anderen Geräten im Netzwerk
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port} (LAN accessible)`);
  });
})();
