const authService = require("../services/authService");
const userService = require("../services/userService");

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body || {}));
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.json(await authService.logout(req.accessToken));
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const data = await userService.getDashboardData(req.user.id, req.supabase);
    res.json({
      user: authService.publicAuthUser(req.user),
      ...data
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    res.json(await authService.refreshSession(req.body?.refreshToken || req.body?.refresh_token));
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    res.json(await authService.forgotPassword(req.body || {}));
  } catch (error) {
    next(error);
  }
}

async function resendConfirmation(req, res, next) {
  try {
    res.json(await authService.resendSignupConfirmation(req.body || {}));
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    res.json(await authService.resetPassword({
      accessToken: req.accessToken,
      userId: req.user.id,
      password: req.body?.password
    }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  resendConfirmation,
  resetPassword,
  signup
};
