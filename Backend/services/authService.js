const {
  createSupabaseUserClient,
  getSupabaseAnonClient,
  getSupabaseServiceClient
} = require("../data/supabaseClient");

class ApiError extends Error {
  constructor(message, statusCode = 500, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function requiredClient(client, message, code = "SUPABASE_NOT_CONFIGURED") {
  if (client) return client;
  throw new ApiError(message, 503, code);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError("Enter a valid email address.", 400, "INVALID_EMAIL");
  }
}

function validatePassword(password) {
  if (String(password || "").length < 8) {
    throw new ApiError("Password must be at least 8 characters.", 400, "WEAK_PASSWORD");
  }
}

function validateUsername(username) {
  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    throw new ApiError(
      "Username must be 3-32 characters and use letters, numbers, dashes, or underscores.",
      400,
      "INVALID_USERNAME"
    );
  }
}

function publicAuthUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at,
    user_metadata: user.user_metadata || {}
  };
}

function publicProfile(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    profile_photo: profile.profile_photo || profile.avatar_url || null,
    bio: profile.bio || null,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

function usernameFromEmail(email) {
  return normalizeUsername(String(email || "").split("@")[0] || "user");
}

async function usernameExists(username, excludingUserId = "") {
  const service = requiredClient(
    getSupabaseServiceClient(),
    "SUPABASE_SERVICE_ROLE_KEY is required in Backend/.env for profile checks.",
    "SUPABASE_SERVICE_ROLE_REQUIRED"
  );

  let query = service
    .from("users")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (excludingUserId) query = query.neq("id", excludingUserId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new ApiError(error.message, 500, "PROFILE_LOOKUP_FAILED");
  return Boolean(data);
}

async function uniqueUsername(base, userId = "") {
  const normalizedBase = normalizeUsername(base) || `user-${String(userId).slice(0, 8)}`;
  let candidate = normalizedBase.slice(0, 32);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (!(await usernameExists(candidate, userId))) return candidate;
    const suffix = `-${String(userId || Date.now()).replace(/-/g, "").slice(attempt, attempt + 6) || attempt}`;
    candidate = `${normalizedBase.slice(0, 32 - suffix.length)}${suffix}`;
  }

  return `user-${String(userId).replace(/-/g, "").slice(0, 12)}`;
}

async function upsertProfileForAuthUser(user, overrides = {}) {
  const service = requiredClient(
    getSupabaseServiceClient(),
    "SUPABASE_SERVICE_ROLE_KEY is required in Backend/.env to create user profiles.",
    "SUPABASE_SERVICE_ROLE_REQUIRED"
  );

  const email = normalizeEmail(overrides.email || user.email);
  const requestedUsername = normalizeUsername(
    overrides.username || user.user_metadata?.username || usernameFromEmail(email)
  );
  const username = await uniqueUsername(requestedUsername, user.id);

  const profileRow = {
    id: user.id,
    username,
    email,
    profile_photo: overrides.profile_photo || user.user_metadata?.profile_photo || null,
    avatar_url: overrides.profile_photo || user.user_metadata?.profile_photo || null,
    bio: overrides.bio || null,
    display_name: username
  };

  const { data, error } = await service
    .from("users")
    .upsert(profileRow, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw new ApiError(error.message, 500, "PROFILE_UPSERT_FAILED");
  }

  return data;
}

async function getProfileByUserId(userId, supabaseClient = null) {
  const client = supabaseClient || requiredClient(
    getSupabaseServiceClient(),
    "SUPABASE_SERVICE_ROLE_KEY is required in Backend/.env to read profiles.",
    "SUPABASE_SERVICE_ROLE_REQUIRED"
  );

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500, "PROFILE_LOOKUP_FAILED");
  return data;
}

function cleanRedirectTo(redirectTo) {
  const value = String(redirectTo || "").trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.toString();
  } catch (error) {
    return "";
  }
}

async function signup({ username, email, password, profile_photo, bio, redirectTo }) {
  const auth = requiredClient(
    getSupabaseAnonClient(),
    "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    "SUPABASE_AUTH_NOT_CONFIGURED"
  );
  requiredClient(
    getSupabaseServiceClient(),
    "SUPABASE_SERVICE_ROLE_KEY is required in Backend/.env to create profile rows.",
    "SUPABASE_SERVICE_ROLE_REQUIRED"
  );

  const cleanEmail = normalizeEmail(email);
  const cleanUsername = normalizeUsername(username);
  validateEmail(cleanEmail);
  validatePassword(password);
  validateUsername(cleanUsername);

  if (await usernameExists(cleanUsername)) {
    throw new ApiError("That username is already taken.", 409, "USERNAME_TAKEN");
  }

  const emailRedirectTo = cleanRedirectTo(redirectTo);
  const signupOptions = {
    data: {
      username: cleanUsername,
      profile_photo: profile_photo || null
    }
  };

  if (emailRedirectTo) signupOptions.emailRedirectTo = emailRedirectTo;

  const { data, error } = await auth.auth.signUp({
    email: cleanEmail,
    password,
    options: signupOptions
  });

  if (error) throw new ApiError(error.message, 400, "SIGNUP_FAILED");
  if (!data?.user?.id) throw new ApiError("Supabase did not return a user.", 500, "SIGNUP_NO_USER");

  const profile = await upsertProfileForAuthUser(data.user, {
    username: cleanUsername,
    email: cleanEmail,
    profile_photo,
    bio
  });

  return {
    user: publicAuthUser(data.user),
    session: data.session,
    profile: publicProfile(profile),
    emailConfirmationRequired: !data.session
  };
}

async function resendSignupConfirmation({ email, redirectTo }) {
  const auth = requiredClient(
    getSupabaseAnonClient(),
    "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    "SUPABASE_AUTH_NOT_CONFIGURED"
  );

  const cleanEmail = normalizeEmail(email);
  validateEmail(cleanEmail);

  const emailRedirectTo = cleanRedirectTo(redirectTo);
  const resendOptions = emailRedirectTo ? { emailRedirectTo } : undefined;
  const { error } = await auth.auth.resend({
    type: "signup",
    email: cleanEmail,
    options: resendOptions
  });

  if (error) throw new ApiError(error.message, 400, "CONFIRMATION_RESEND_FAILED");
  return { ok: true };
}

async function login({ email, password }) {
  const auth = requiredClient(
    getSupabaseAnonClient(),
    "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    "SUPABASE_AUTH_NOT_CONFIGURED"
  );

  const cleanEmail = normalizeEmail(email);
  validateEmail(cleanEmail);
  if (!password) throw new ApiError("Password is required.", 400, "PASSWORD_REQUIRED");

  const { data, error } = await auth.auth.signInWithPassword({
    email: cleanEmail,
    password
  });

  if (error) throw new ApiError(error.message, 401, "LOGIN_FAILED");
  if (!data?.user?.id || !data?.session) throw new ApiError("Login did not return a session.", 401, "LOGIN_NO_SESSION");

  let profile = await getProfileByUserId(data.user.id).catch(() => null);
  if (!profile) {
    profile = await upsertProfileForAuthUser(data.user, { email: cleanEmail });
  }

  return {
    user: publicAuthUser(data.user),
    session: data.session,
    profile: publicProfile(profile)
  };
}

async function logout(accessToken) {
  const service = getSupabaseServiceClient();
  if (!service || !accessToken) return { ok: true };

  const { error } = await service.auth.admin.signOut(accessToken, "global");
  if (error) throw new ApiError(error.message, 400, "LOGOUT_FAILED");
  return { ok: true };
}

async function refreshSession(refreshToken) {
  const auth = requiredClient(
    getSupabaseAnonClient(),
    "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    "SUPABASE_AUTH_NOT_CONFIGURED"
  );

  if (!refreshToken) throw new ApiError("refreshToken is required.", 400, "REFRESH_TOKEN_REQUIRED");

  const { data, error } = await auth.auth.refreshSession({
    refresh_token: refreshToken
  });

  if (error) throw new ApiError(error.message, 401, "SESSION_REFRESH_FAILED");
  return data;
}

async function forgotPassword({ email, redirectTo }) {
  const auth = requiredClient(
    getSupabaseAnonClient(),
    "Supabase Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.",
    "SUPABASE_AUTH_NOT_CONFIGURED"
  );
  const cleanEmail = normalizeEmail(email);
  validateEmail(cleanEmail);

  const options = redirectTo ? { redirectTo } : undefined;
  const { error } = await auth.auth.resetPasswordForEmail(cleanEmail, options);
  if (error) throw new ApiError(error.message, 400, "PASSWORD_RESET_EMAIL_FAILED");

  return { ok: true };
}

async function resetPassword({ accessToken, userId, password }) {
  validatePassword(password);

  const service = getSupabaseServiceClient();
  if (service && userId) {
    const { error } = await service.auth.admin.updateUserById(userId, { password });
    if (error) throw new ApiError(error.message, 400, "PASSWORD_RESET_FAILED");
    return { ok: true };
  }

  const userClient = createSupabaseUserClient(accessToken);
  if (!userClient) {
    throw new ApiError("Supabase Auth is not configured.", 503, "SUPABASE_AUTH_NOT_CONFIGURED");
  }

  const { error } = await userClient.auth.updateUser({ password });
  if (error) throw new ApiError(error.message, 400, "PASSWORD_RESET_FAILED");

  return { ok: true };
}

module.exports = {
  ApiError,
  forgotPassword,
  getProfileByUserId,
  login,
  logout,
  normalizeEmail,
  normalizeUsername,
  publicAuthUser,
  publicProfile,
  refreshSession,
  resendSignupConfirmation,
  resetPassword,
  signup,
  uniqueUsername,
  upsertProfileForAuthUser,
  usernameExists,
  validateEmail,
  validatePassword,
  validateUsername
};
