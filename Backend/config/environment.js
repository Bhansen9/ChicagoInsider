const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const backendDir = path.resolve(__dirname, "..");
const appDir = path.resolve(backendDir, "..");
const projectDir = path.resolve(appDir, "..");

const loadedEnvFiles = [];

function unique(values) {
  return [...new Set(values)];
}

function loadEnv() {
  const candidates = unique([
    path.resolve(process.cwd(), ".env"),
    path.resolve(backendDir, ".env"),
    path.resolve(appDir, ".env"),
    path.resolve(projectDir, ".env")
  ]);

  candidates.forEach((envPath) => {
    if (!fs.existsSync(envPath) || loadedEnvFiles.includes(envPath)) return;

    const result = dotenv.config({ path: envPath, override: false, quiet: true });
    if (!result.error) loadedEnvFiles.push(envPath);
  });

  return loadedEnvFiles;
}

loadEnv();

function env(name, fallback = "") {
  const value = process.env[name];
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

function envList(name, fallback = []) {
  const value = env(name);
  if (!value) return fallback;

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPort() {
  const port = Number(env("NODE_PORT", "3000"));
  return Number.isInteger(port) && port > 0 ? port : 3000;
}

function getCorsOrigins() {
  return envList("CORS_ORIGINS");
}

function getGoogleMapsBrowserKey() {
  return env("GOOGLE_MAPS_BROWSER_API_KEY") || env("GOOGLE_MAPS_API_KEY");
}

function getGooglePlacesApiKey() {
  return (
    env("GOOGLE_PLACES_API_KEY") ||
    env("GOOGLE_MAPS_API_KEY") ||
    env("GOOGLE_MAPS_BROWSER_API_KEY")
  );
}

function getSupabaseConfig() {
  return {
    url: env("SUPABASE_URL"),
    anonKey: env("SUPABASE_ANON_KEY"),
    serviceRoleKey: env("SUPABASE_SERVICE_ROLE_KEY")
  };
}

function isSupabaseConfigured() {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  return Boolean(url && (serviceRoleKey || anonKey));
}

module.exports = {
  appDir,
  backendDir,
  env,
  getCorsOrigins,
  getGoogleMapsBrowserKey,
  getGooglePlacesApiKey,
  getPort,
  getSupabaseConfig,
  isSupabaseConfigured,
  loadedEnvFiles
};
