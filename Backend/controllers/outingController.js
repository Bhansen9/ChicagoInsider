const {
  addOutingContributor,
  createOuting,
  deleteOutingContributor,
  listOutings,
  updateOutingContributor
} = require("../services/userDataService");

async function create(req, res, next) {
  try {
    const outing = await createOuting(req.user.id, req.body || {}, req.supabase);
    res.status(201).json({ outing });
  } catch (error) {
    next(error);
  }
}

async function index(req, res, next) {
  try {
    res.json({ outings: await listOutings(req.user.id, req.supabase) });
  } catch (error) {
    next(error);
  }
}

async function addContributor(req, res, next) {
  try {
    const contributor = await addOutingContributor(
      req.user.id,
      req.params.outingId,
      req.body || {},
      req.supabase
    );
    res.status(201).json({ contributor });
  } catch (error) {
    next(error);
  }
}

async function updateContributor(req, res, next) {
  try {
    const contributor = await updateOutingContributor(
      req.user.id,
      req.params.outingId,
      req.params.userId,
      req.body || {},
      req.supabase
    );
    res.json({ contributor });
  } catch (error) {
    next(error);
  }
}

async function deleteContributor(req, res, next) {
  try {
    res.json(await deleteOutingContributor(
      req.user.id,
      req.params.outingId,
      req.params.userId,
      req.supabase
    ));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addContributor,
  create,
  deleteContributor,
  index,
  updateContributor
};
