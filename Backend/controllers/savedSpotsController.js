const {
  createSavedSpot,
  deleteSavedSpot,
  listSavedSpots
} = require("../services/userDataService");

async function create(req, res, next) {
  try {
    const savedSpot = await createSavedSpot(req.user.id, req.body || {}, req.supabase);
    res.status(201).json({ savedSpot });
  } catch (error) {
    next(error);
  }
}

async function index(req, res, next) {
  try {
    res.json({ savedSpots: await listSavedSpots(req.user.id, req.supabase) });
  } catch (error) {
    next(error);
  }
}

async function destroy(req, res, next) {
  try {
    res.json(await deleteSavedSpot(req.user.id, req.params.id, req.supabase));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  destroy,
  index
};
