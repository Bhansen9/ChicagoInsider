const auth = window.ChicagoInsiderAuth;
const form = document.querySelector("[data-auth-form]");
const message = document.querySelector("#authMessage");
const resendConfirmationBtn = document.querySelector("#resendConfirmationBtn");
let pendingConfirmationEmail = "";

function setMessage(text, type = "error") {
  if (!message) return;
  message.textContent = text || "";
  message.classList.toggle("is-success", type === "success");
}

function setBusy(isBusy) {
  const button = form?.querySelector("button[type='submit']");
  if (!button) return;
  button.disabled = isBusy;
  button.dataset.originalText ||= button.textContent;
  button.textContent = isBusy ? "Please wait..." : button.dataset.originalText;
}

function redirectTarget() {
  return new URLSearchParams(window.location.search).get("redirect") || "Home_Page.html";
}

function parseRecoverySessionFromUrl() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = Number(params.get("expires_in") || 3600);

  if (!accessToken) return;

  auth.saveAuthState({
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn
    }
  });

  window.history.replaceState({}, document.title, window.location.pathname);
}

function values() {
  return Object.fromEntries(new FormData(form).entries());
}

async function handleLogin() {
  const data = values();
  await auth.login({
    email: data.email,
    password: data.password
  });
  window.location.href = redirectTarget();
}

async function handleSignup() {
  const data = values();
  if (!form.querySelector("#termsAccepted")?.checked) {
    throw new Error("Please accept the terms and conditions.");
  }

  const result = await auth.signup({
    username: data.username,
    email: data.email,
    password: data.password
  });

  if (result.emailConfirmationRequired) {
    pendingConfirmationEmail = data.email;
    if (resendConfirmationBtn) resendConfirmationBtn.hidden = false;
    setMessage("Account created. Check spam/junk, or resend the confirmation email.", "success");
    return;
  }

  window.location.href = redirectTarget();
}

async function handleForgotPassword() {
  const data = values();
  await auth.forgotPassword(data.email);
  setMessage("Password reset email sent. Check your inbox.", "success");
}

async function handleResetPassword() {
  const data = values();
  if (data.password !== data.confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  await auth.resetPassword(data.password);
  setMessage("Password updated. Redirecting to login...", "success");
  window.setTimeout(() => {
    auth.clearAuthState();
    window.location.href = "Login_Page.html";
  }, 900);
}

const handlers = {
  login: handleLogin,
  signup: handleSignup,
  forgot: handleForgotPassword,
  reset: handleResetPassword
};

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.parentElement.querySelector("input");
    input.type = input.type === "password" ? "text" : "password";
  });
});

resendConfirmationBtn?.addEventListener("click", async () => {
  const email = pendingConfirmationEmail || values().email;
  if (!email) {
    setMessage("Enter your email address first.");
    return;
  }

  resendConfirmationBtn.disabled = true;
  try {
    await auth.resendConfirmation(email);
    setMessage("Confirmation email resent. Check spam/junk too.", "success");
  } catch (error) {
    setMessage(error.message || "Could not resend confirmation email.");
  } finally {
    resendConfirmationBtn.disabled = false;
  }
});

if (document.body.dataset.authPage === "reset") {
  parseRecoverySessionFromUrl();
}

if (["login", "signup"].includes(document.body.dataset.authPage)) {
  auth.redirectIfAuthenticated();
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const handler = handlers[document.body.dataset.authPage];
  if (!handler) return;

  setBusy(true);
  setMessage("");

  try {
    await handler();
  } catch (error) {
    setMessage(error.message || "Something went wrong.");
  } finally {
    setBusy(false);
  }
});
