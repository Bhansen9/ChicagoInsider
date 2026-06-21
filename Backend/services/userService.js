const {
  ApiError,
  getProfileByUserId,
  normalizeUsername,
  publicProfile,
  usernameExists,
  validateUsername
} = require("./authService");
const { getSupabaseServiceClient } = require("../data/supabaseClient");
const { attachContributorProfiles } = require("./userDataService");

function cleanOptionalText(value, maxLength, fieldName) {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  if (text.length > maxLength) {
    throw new ApiError(`${fieldName} must be ${maxLength} characters or fewer.`, 400, "INVALID_PROFILE_FIELD");
  }
  return text || null;
}

function cleanUrl(value, fieldName) {
  if (value === undefined) return undefined;
  const text = String(value || "").trim();
  if (!text) return null;

  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
    return url.toString();
  } catch (error) {
    throw new ApiError(`${fieldName} must be a valid http(s) URL.`, 400, "INVALID_PROFILE_PHOTO");
  }
}

async function updateProfile(userId, payload, supabaseClient) {
  const row = {};

  if (payload.username !== undefined) {
    const username = normalizeUsername(payload.username);
    validateUsername(username);
    if (await usernameExists(username, userId)) {
      throw new ApiError("That username is already taken.", 409, "USERNAME_TAKEN");
    }
    row.username = username;
    row.display_name = username;
  }

  const hasProfilePhoto = Object.prototype.hasOwnProperty.call(payload, "profile_photo") ||
    Object.prototype.hasOwnProperty.call(payload, "profilePhoto");
  const profilePhotoValue = Object.prototype.hasOwnProperty.call(payload, "profile_photo")
    ? payload.profile_photo
    : payload.profilePhoto;
  const profilePhoto = hasProfilePhoto ? cleanUrl(profilePhotoValue, "Profile photo") : undefined;
  if (hasProfilePhoto) {
    row.profile_photo = profilePhoto;
    row.avatar_url = profilePhoto;
  }

  const bio = cleanOptionalText(payload.bio, 240, "Bio");
  if (bio !== undefined) row.bio = bio;

  if (!Object.keys(row).length) {
    return publicProfile(await getProfileByUserId(userId, supabaseClient));
  }

  const { data, error } = await supabaseClient
    .from("users")
    .update(row)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 400, "PROFILE_UPDATE_FAILED");

  const service = getSupabaseServiceClient();
  if (service) {
    await service.auth.admin.updateUserById(userId, {
      user_metadata: {
        username: data.username,
        profile_photo: data.profile_photo || null
      }
    });
  }

  return publicProfile(data);
}

async function getDashboardData(userId, supabaseClient) {
  const [profile, savedSpots, playbooks, outings, collections] = await Promise.all([
    getProfileByUserId(userId, supabaseClient),
    supabaseClient.from("saved_spots").select("*, place:places(*)").order("created_at", { ascending: false }),
    supabaseClient.from("playbooks").select("*, playbook_places(*, place:places(*))").order("created_at", { ascending: false }),
    supabaseClient
      .from("outings")
      .select("*, outing_places(*, place:places(*)), outing_contributors(*)")
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("collections")
      .select("*, collection_places(*, place:places(*))")
      .order("created_at", { ascending: false })
  ]);

  const failed = [savedSpots, playbooks, outings, collections].find((result) => result.error);
  if (failed?.error) throw new ApiError(failed.error.message, 500, "DASHBOARD_LOAD_FAILED");

  return {
    profile: publicProfile(profile),
    savedSpots: savedSpots.data || [],
    playbooks: playbooks.data || [],
    outings: await attachContributorProfiles(outings.data || []),
    collections: collections.data || []
  };
}

module.exports = {
  getDashboardData,
  updateProfile
};
