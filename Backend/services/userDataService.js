const { ApiError, normalizeEmail, normalizeUsername } = require("./authService");
const { ensurePlace } = require("./placeResolverService");
const { getSupabaseServiceClient } = require("../data/supabaseClient");

const OUTING_ROLES = new Set(["read", "suggest", "write"]);
const VISIBILITIES = new Set(["private", "shared", "public"]);
const OUTING_STATUSES = new Set(["draft", "planned", "completed", "archived"]);
const OUTING_SELECT = "*, outing_places(*, place:places(*)), outing_contributors(*)";

function cleanText(value, fallback, maxLength = 160) {
  const text = String(value || "").trim();
  return (text || fallback).slice(0, maxLength);
}

function cleanNullableText(value, maxLength = 500) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function cleanVisibility(value) {
  return VISIBILITIES.has(value) ? value : "private";
}

function cleanOutingStatus(value) {
  return OUTING_STATUSES.has(value) ? value : "draft";
}

function cleanOutingRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (!OUTING_ROLES.has(role)) {
    throw new ApiError("Contributor role must be read, suggest, or write.", 400, "INVALID_OUTING_ROLE");
  }
  return role;
}

function cleanTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError("Date/time value is invalid.", 400, "INVALID_DATE");
  }
  return date.toISOString();
}

function requireOwner(outing, userId) {
  if (!outing || outing.owner_id !== userId) {
    throw new ApiError("Only the outing creator can manage contributors.", 403, "OUTING_OWNER_REQUIRED");
  }
}

function publicContributorProfile(profile) {
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    profile_photo: profile.profile_photo || profile.avatar_url || null,
    bio: profile.bio || null
  };
}

async function attachContributorProfiles(outings) {
  const outingList = Array.isArray(outings) ? outings : [outings];
  const ids = [
    ...new Set(
      outingList
        .flatMap((outing) => outing?.outing_contributors || [])
        .map((contributor) => contributor.user_id)
        .filter(Boolean)
    )
  ];

  if (!ids.length) return outings;

  const service = getSupabaseServiceClient();
  if (!service) return outings;

  const { data, error } = await service
    .from("users")
    .select("id, username, profile_photo, avatar_url, bio")
    .in("id", ids);

  if (error) return outings;

  const profileById = new Map((data || []).map((profile) => [profile.id, publicContributorProfile(profile)]));
  outingList.forEach((outing) => {
    outing.outing_contributors = (outing.outing_contributors || []).map((contributor) => ({
      ...contributor,
      user: profileById.get(contributor.user_id) || null
    }));
  });

  return outings;
}

async function listSavedSpots(userId, supabase) {
  const { data, error } = await supabase
    .from("saved_spots")
    .select("*, place:places(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(error.message, 500, "SAVED_SPOTS_LOAD_FAILED");
  return data || [];
}

async function createSavedSpot(userId, body, supabase) {
  const place = await ensurePlace(body.place || body);
  const row = {
    user_id: userId,
    place_id: place.id,
    notes: cleanNullableText(body.notes, 500)
  };

  const { data, error } = await supabase
    .from("saved_spots")
    .upsert(row, { onConflict: "user_id,place_id" })
    .select("*, place:places(*)")
    .single();

  if (error) throw new ApiError(error.message, 400, "SAVED_SPOT_SAVE_FAILED");
  return data;
}

async function deleteSavedSpot(userId, id, supabase) {
  const { error } = await supabase
    .from("saved_spots")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw new ApiError(error.message, 400, "SAVED_SPOT_DELETE_FAILED");
  return { ok: true };
}

async function createPlaybook(userId, body, supabase) {
  const { data: playbook, error } = await supabase
    .from("playbooks")
    .insert({
      owner_id: userId,
      user_id: userId,
      title: cleanText(body.title, "Untitled Playbook"),
      description: cleanNullableText(body.description, 500),
      visibility: cleanVisibility(body.visibility)
    })
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 400, "PLAYBOOK_CREATE_FAILED");

  const places = Array.isArray(body.places) ? body.places : [];
  for (let index = 0; index < places.length; index += 1) {
    await addPlaceToPlaybook(userId, playbook.id, { place: places[index], position: index }, supabase);
  }

  return getPlaybook(playbook.id, supabase);
}

async function listPlaybooks(userId, supabase) {
  const { data, error } = await supabase
    .from("playbooks")
    .select("*, playbook_places(*, place:places(*))")
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(error.message, 500, "PLAYBOOKS_LOAD_FAILED");
  return data || [];
}

async function getPlaybook(playbookId, supabase) {
  const { data, error } = await supabase
    .from("playbooks")
    .select("*, playbook_places(*, place:places(*))")
    .eq("id", playbookId)
    .single();

  if (error) throw new ApiError(error.message, 404, "PLAYBOOK_NOT_FOUND");
  return data;
}

async function addPlaceToPlaybook(userId, playbookId, body, supabase) {
  const place = await ensurePlace(body.place || body);
  const { data, error } = await supabase
    .from("playbook_places")
    .upsert({
      playbook_id: playbookId,
      place_id: place.id,
      position: Number.isInteger(Number(body.position)) ? Number(body.position) : 0,
      notes: cleanNullableText(body.notes, 500)
    }, { onConflict: "playbook_id,place_id" })
    .select("*, place:places(*)")
    .single();

  if (error) throw new ApiError(error.message, 400, "PLAYBOOK_PLACE_SAVE_FAILED");
  return data;
}

async function deletePlaceFromPlaybook(userId, playbookId, placeId, supabase) {
  const { error } = await supabase
    .from("playbook_places")
    .delete()
    .eq("playbook_id", playbookId)
    .eq("place_id", placeId);

  if (error) throw new ApiError(error.message, 400, "PLAYBOOK_PLACE_DELETE_FAILED");
  return { ok: true };
}

async function createOuting(userId, body, supabase) {
  const startsAt = cleanTimestamp(body.starts_at || body.startsAt || body.date);
  const endsAt = cleanTimestamp(body.ends_at || body.endsAt);
  const { data: outing, error } = await supabase
    .from("outings")
    .insert({
      owner_id: userId,
      user_id: userId,
      creator_user_id: userId,
      title: cleanText(body.title, "Untitled Outing"),
      description: cleanNullableText(body.description, 800),
      starts_at: startsAt,
      ends_at: endsAt,
      status: cleanOutingStatus(body.status)
    })
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 400, "OUTING_CREATE_FAILED");

  const places = Array.isArray(body.places) ? body.places : [];
  for (let index = 0; index < places.length; index += 1) {
    await addPlaceToOuting(userId, outing.id, { place: places[index], position: index }, supabase);
  }

  const contributors = Array.isArray(body.contributors) ? body.contributors : [];
  for (const contributor of contributors) {
    await addOutingContributor(userId, outing.id, contributor, supabase);
  }

  return getOuting(outing.id, supabase);
}

async function listOutings(userId, supabase) {
  const { data, error } = await supabase
    .from("outings")
    .select(OUTING_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new ApiError(error.message, 500, "OUTINGS_LOAD_FAILED");
  return attachContributorProfiles(data || []);
}

async function getOuting(outingId, supabase) {
  const { data, error } = await supabase
    .from("outings")
    .select(OUTING_SELECT)
    .eq("id", outingId)
    .single();

  if (error) throw new ApiError(error.message, 404, "OUTING_NOT_FOUND");
  return attachContributorProfiles(data);
}

async function addPlaceToOuting(userId, outingId, body, supabase) {
  const place = await ensurePlace(body.place || body);
  const { data, error } = await supabase
    .from("outing_places")
    .upsert({
      outing_id: outingId,
      place_id: place.id,
      added_by: userId,
      position: Number.isInteger(Number(body.position)) ? Number(body.position) : 0,
      estimated_duration_minutes: body.estimatedDurationMinutes || body.estimated_duration_minutes || null,
      notes: cleanNullableText(body.notes, 500),
      planned_time: cleanTimestamp(body.plannedTime || body.planned_time)
    }, { onConflict: "outing_id,place_id" })
    .select("*, place:places(*)")
    .single();

  if (error) throw new ApiError(error.message, 400, "OUTING_PLACE_SAVE_FAILED");
  return data;
}

async function findContributorUser(body) {
  const service = getSupabaseServiceClient();
  if (!service) {
    throw new ApiError("SUPABASE_SERVICE_ROLE_KEY is required to look up contributor users.", 503, "SUPABASE_SERVICE_ROLE_REQUIRED");
  }

  if (body.userId) {
    const { data, error } = await service.from("users").select("*").eq("id", body.userId).maybeSingle();
    if (error) throw new ApiError(error.message, 500, "CONTRIBUTOR_LOOKUP_FAILED");
    if (data) return data;
  }

  const username = normalizeUsername(body.username);
  if (username) {
    const { data, error } = await service.from("users").select("*").eq("username", username).maybeSingle();
    if (error) throw new ApiError(error.message, 500, "CONTRIBUTOR_LOOKUP_FAILED");
    if (data) return data;
  }

  const email = normalizeEmail(body.email);
  if (email) {
    const { data, error } = await service.from("users").select("*").eq("email", email).maybeSingle();
    if (error) throw new ApiError(error.message, 500, "CONTRIBUTOR_LOOKUP_FAILED");
    if (data) return data;
  }

  throw new ApiError("Contributor user was not found.", 404, "CONTRIBUTOR_NOT_FOUND");
}

async function getOutingForContributorManagement(userId, outingId, supabase) {
  const { data, error } = await supabase
    .from("outings")
    .select("*")
    .eq("id", outingId)
    .single();

  if (error) throw new ApiError(error.message, 404, "OUTING_NOT_FOUND");
  requireOwner(data, userId);
  return data;
}

async function addOutingContributor(userId, outingId, body, supabase) {
  await getOutingForContributorManagement(userId, outingId, supabase);
  const contributor = await findContributorUser(body);
  const permission = cleanOutingRole(body.permission || body.role || "read");

  if (contributor.id === userId) {
    throw new ApiError("The outing creator already has full access.", 400, "CANNOT_INVITE_SELF");
  }

  const { data, error } = await supabase
    .from("outing_contributors")
    .upsert({
      outing_id: outingId,
      user_id: contributor.id,
      permission,
      invited_by: userId
    }, { onConflict: "outing_id,user_id" })
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 400, "CONTRIBUTOR_SAVE_FAILED");
  return {
    ...data,
    user: publicContributorProfile(contributor)
  };
}

async function updateOutingContributor(userId, outingId, contributorUserId, body, supabase) {
  await getOutingForContributorManagement(userId, outingId, supabase);
  const permission = cleanOutingRole(body.permission || body.role);

  const { data, error } = await supabase
    .from("outing_contributors")
    .update({ permission })
    .eq("outing_id", outingId)
    .eq("user_id", contributorUserId)
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 400, "CONTRIBUTOR_UPDATE_FAILED");
  const enriched = await attachContributorProfiles({ outing_contributors: [data] });
  return enriched.outing_contributors[0];
}

async function deleteOutingContributor(userId, outingId, contributorUserId, supabase) {
  await getOutingForContributorManagement(userId, outingId, supabase);

  const { error } = await supabase
    .from("outing_contributors")
    .delete()
    .eq("outing_id", outingId)
    .eq("user_id", contributorUserId);

  if (error) throw new ApiError(error.message, 400, "CONTRIBUTOR_DELETE_FAILED");
  return { ok: true };
}

module.exports = {
  addOutingContributor,
  addPlaceToPlaybook,
  createOuting,
  createPlaybook,
  createSavedSpot,
  deleteOutingContributor,
  deletePlaceFromPlaybook,
  deleteSavedSpot,
  listOutings,
  listPlaybooks,
  listSavedSpots,
  attachContributorProfiles,
  updateOutingContributor
};
