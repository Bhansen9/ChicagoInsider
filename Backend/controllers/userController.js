const userService = require("../services/userService");

async function updateProfile(req, res, next) {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body || {}, req.supabase);
    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  updateProfile
};
