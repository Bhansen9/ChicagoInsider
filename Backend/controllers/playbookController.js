const {
  addPlaceToPlaybook,
  createPlaybook,
  deletePlaceFromPlaybook,
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

module.exports = {
  addPlace,
  create,
  deletePlace,
  index
};
