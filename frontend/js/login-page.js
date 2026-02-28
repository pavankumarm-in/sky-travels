import { api } from "./api.js";
import { authStore, goToDefaultDashboard, requireGuest } from "./auth.js";
import { initTheme, showToast } from "./ui.js";

const qs = (id) => document.getElementById(id);
const showFieldError = (id, message) => {
  qs(id).textContent = message || "";
};
const clearErrors = () => {
  showFieldError("loginEmailError", "");
  showFieldError("loginPasswordError", "");
};

const bindAuthForms = () => {
  qs("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    try {
      const email = qs("loginEmail").value.trim();
      const password = qs("loginPassword").value;
      let hasError = false;
      if (!email) {
        showFieldError("loginEmailError", "Email is required");
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError("loginEmailError", "Enter a valid email");
        hasError = true;
      }
      if (!password) {
        showFieldError("loginPasswordError", "Password is required");
        hasError = true;
      }
      if (hasError) return;

      const res = await api.login({ email, password });
      authStore.setSession(res.data);
      showToast("Login successful");
      setTimeout(goToDefaultDashboard, 300);
    } catch (error) {
      if (error.message.toLowerCase().includes("invalid credentials")) {
        showFieldError("loginPasswordError", "Invalid email or password");
      } else {
        showToast(error.message, "error");
      }
    }
  });

};

const start = () => {
  initTheme();
  if (!requireGuest()) return;
  const defaultLoginEmail = localStorage.getItem("defaultLoginEmail");
  const lastLoginEmail = localStorage.getItem("lastLoginEmail");
  const lastSignupEmail = localStorage.getItem("lastSignupEmail");
  const preferredEmail = defaultLoginEmail || lastLoginEmail || lastSignupEmail;
  if (preferredEmail) {
    qs("loginEmail").value = preferredEmail;
    qs("loginPassword").focus();
  }
  bindAuthForms();
};

start();
