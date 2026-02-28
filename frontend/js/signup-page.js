import { api } from "./api.js";
import { requireGuest } from "./auth.js";
import { initTheme, showToast } from "./ui.js";

const qs = (id) => document.getElementById(id);
const showFieldError = (id, message) => {
  qs(id).textContent = message || "";
};
const clearErrors = () => {
  showFieldError("signupNameError", "");
  showFieldError("signupEmailError", "");
  showFieldError("signupPasswordError", "");
};

const bindSignup = () => {
  qs("signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();
    try {
      const name = qs("signupName").value.trim();
      const email = qs("signupEmail").value.trim();
      const password = qs("signupPassword").value;

      let hasError = false;
      if (!name || name.length < 3) {
        showFieldError("signupNameError", "Name must be at least 3 characters");
        hasError = true;
      }
      if (!email) {
        showFieldError("signupEmailError", "Email is required");
        hasError = true;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError("signupEmailError", "Enter a valid email");
        hasError = true;
      }
      if (!password || password.length < 8) {
        showFieldError("signupPasswordError", "Password must be at least 8 characters");
        hasError = true;
      }
      if (hasError) return;

      await api.signup({ name, email, password });
      localStorage.setItem("lastSignupEmail", email);
      localStorage.setItem("defaultLoginEmail", email);
      showToast("Signup completed. Please login.");
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 600);
    } catch (error) {
      if (error.message.toLowerCase().includes("email")) {
        showFieldError("signupEmailError", error.message);
      } else {
        showToast(error.message, "error");
      }
    }
  });
};

const start = () => {
  initTheme();
  if (!requireGuest()) return;
  bindSignup();
};

start();
