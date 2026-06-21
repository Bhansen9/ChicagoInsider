const { createClient } = require("@supabase/supabase-js");
const { getSupabaseConfig, isSupabaseConfigured } = require("../config/environment");

let serverClient = null;
let serviceClient = null;
let anonClient = null;

const baseAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false
};

function createSupabaseClient(key, options = {}) {
  const { url } = getSupabaseConfig();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: baseAuthOptions,
    ...options
  });
}

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  if (!serverClient) {
    const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
    serverClient = createClient(url, serviceRoleKey || anonKey, {
      auth: baseAuthOptions
    });
  }

  return serverClient;
}

function getSupabaseAnonClient() {
  const { anonKey } = getSupabaseConfig();
  if (!anonKey) return null;

  if (!anonClient) {
    anonClient = createSupabaseClient(anonKey);
  }

  return anonClient;
}

function getSupabaseServiceClient() {
  const { serviceRoleKey } = getSupabaseConfig();
  if (!serviceRoleKey) return null;

  if (!serviceClient) {
    serviceClient = createSupabaseClient(serviceRoleKey);
  }

  return serviceClient;
}

function createSupabaseUserClient(accessToken) {
  const { anonKey } = getSupabaseConfig();
  const token = String(accessToken || "").trim();
  if (!anonKey || !token) return null;

  return createSupabaseClient(anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

const exportedClient = getSupabaseClient() || {
  from() {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.");
  }
};

module.exports = exportedClient;
module.exports.getSupabaseClient = getSupabaseClient;
module.exports.getSupabaseAnonClient = getSupabaseAnonClient;
module.exports.getSupabaseServiceClient = getSupabaseServiceClient;
module.exports.createSupabaseUserClient = createSupabaseUserClient;
module.exports.isSupabaseConfigured = isSupabaseConfigured;
