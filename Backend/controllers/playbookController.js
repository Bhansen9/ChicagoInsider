const {
  addPlaceToDefaultPlaybook,
  addPlaceToPlaybook,
  createPlaybook,
  deletePlaceFromDefaultPlaybook,
  deletePlaceFromPlaybook,
  getOrCreateDefaultPlaybook,
  listPlaybooks
} = require("../services/userDataService");

async function create(req, res, next) {
  try {
    const playbook = await createPlaybook(req.user.id, req.body || {}, req.supabase);
    res.status(201).json({ playbook });
  } catch (error) {
    next(error);
  }
}

async function index(req, res, next) {
  try {
    res.json({ playbooks: await listPlaybooks(req.user.id, req.supabase) });
  } catch (error) {
    next(error);
  }
}

async function showDefault(req, res, next) {
  try {
    const playbook = await getOrCreateDefaultPlaybook(req.user.id, req.supabase);
    res.json({ playbook });
  } catch (error) {
    next(error);
  }
}

async function addPlace(req, res, next) {
  try {
    const playbookPlace = await addPlaceToPlaybook(
      req.user.id,
      req.params.playbookId,
      req.body || {},
      req.supabase
    );
    res.status(201).json({ playbookPlace });
  } catch (error) {
    next(error);
  }
}

async function addDefaultPlace(req, res, next) {
  try {
    const playbookPlace = await addPlaceToDefaultPlaybook(
      req.user.id,
      req.body || {},
      req.supabase
    );
    res.status(201).json({ playbookPlace });
  } catch (error) {
    next(error);
  }
}

async function deletePlace(req, res, next) {
  try {
    res.json(await deletePlaceFromPlaybook(
      req.user.id,
      req.params.playbookId,
      req.params.placeId,
      req.supabase
    ));
  } catch (error) {
    next(error);
  }
}

async function deleteDefaultPlace(req, res, next) {
  try {
    res.json(await deletePlaceFromDefaultPlaybook(
      req.user.id,
      req.params.placeId,
      req.supabase
    ));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addDefaultPlace,
  addPlace,
  create,
  deleteDefaultPlace,
  deletePlace,
  index,
  showDefault
};
