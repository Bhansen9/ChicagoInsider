const { createClient } = require("@supabase/supabase-js");
const { getSupabaseConfig, isSupabaseConfigured } = require("../config/environment");

let supabase = null;

function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  if (!supabase) {
    const { url, anonKey } = getSupabaseConfig();
    supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabase;
}

const exportedClient = getSupabaseClient() || {
  from() {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.");
  }
};

module.exports = exportedClient;
module.exports.getSupabaseClient = getSupabaseClient;
module.exports.isSupabaseConfigured = isSupabaseConfigured;
