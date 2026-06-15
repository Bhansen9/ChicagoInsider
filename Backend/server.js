const express = require("express");
const path = require("path");
const {
  appDir,
  getCorsOrigins,
  getGoogleMapsBrowserKey,
  getGooglePlacesApiKey,
  getPort,
  isSupabaseConfigured,
  loadedEnvFiles
} = require("./config/environment");

const recommendationsRouter = require("./routes/recommendations");
const placesRouter = require("./routes/placesRoutes");
const configRouter = require("./routes/config");

const app = express();
const PORT = getPort();
const frontendDir = path.join(appDir, "Frontend");
const configuredCorsOrigins = new Set(getCorsOrigins());

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  if (configuredCorsOrigins.has(origin)) return true;

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedCorsOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.static(frontendDir));

app.use("/api/recommendations", recommendationsRouter);
app.use("/api/places", placesRouter);
app.use("/api/config", configRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "Home_Page.html"));
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Chicago Insider backend is running",
    uptimeSeconds: Math.round(process.uptime()),
    config: {
      envFilesLoaded: loadedEnvFiles.length,
      googleMapsConfigured: Boolean(getGoogleMapsBrowserKey()),
      googlePlacesConfigured: Boolean(getGooglePlacesApiKey()),
      supabaseConfigured: isSupabaseConfigured()
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Something went wrong on the Chicago Insider backend."
  });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Chicago Insider running at http://localhost:${port}`);
    if (!getGoogleMapsBrowserKey()) {
      console.warn("Google Maps browser key is not configured. Map widgets will use fallback UI.");
    }
    if (!getGooglePlacesApiKey()) {
      console.warn("Google Places API key is not configured. Place APIs will use local seed data.");
    }
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is busy. Stop the other process and restart this app.`);
      process.exit(1);
    }

    throw error;
  });
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = {
  app,
  startServer
};
