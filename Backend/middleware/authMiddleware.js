const {
  createSupabaseUserClient,
  getSupabaseAnonClient
} = require("../data/supabaseClient");

function authError(message = "Authentication required.") {
  const error = new Error(message);
  error.statusCode = 401;
  error.code = "AUTH_REQUIRED";
  return error;
}

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (!/^bearer$/i.test(scheme) || !token) return "";
  return token.trim();
}

async function authMiddleware(req, res, next) {
  try {
    const accessToken = extractBearerToken(req);
    if (!accessToken) throw authError();

    const authClient = getSupabaseAnonClient();
    if (!authClient) {
      const error = new Error("Supabase Auth is not configured.");
      error.statusCode = 503;
      error.code = "SUPABASE_NOT_CONFIGURED";
      throw error;
    }

    const { data, error } = await authClient.auth.getUser(accessToken);
    if (error || !data?.user) {
      throw authError("Your session is missing or expired. Please sign in again.");
    }

    const userClient = createSupabaseUserClient(accessToken);
    if (!userClient) {
      const configError = new Error("Supabase user client could not be created.");
      configError.statusCode = 503;
      configError.code = "SUPABASE_USER_CLIENT_UNAVAILABLE";
      throw configError;
    }

    req.accessToken = accessToken;
    req.user = data.user;
    req.supabase = userClient;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authMiddleware;
