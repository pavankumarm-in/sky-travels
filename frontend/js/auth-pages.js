import { api } from "./api.js";
import { authStore, goToDefaultDashboard, requireGuest } from "./auth.js";
import { initTheme, qs, showToast } from "./app-shell.js";

const showFieldError = (id, message) => {
  const el = qs(id);
  if (el) el.textContent = message || "";
};

const initLoginPage = () => {
  const form = qs("loginForm");
  if (!form) return;

  const clearErrors = () => {
    showFieldError("loginEmailError", "");
    showFieldError("loginPasswordError", "");
  };

  form.addEventListener("submit", async (event) => {
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

  const defaultLoginEmail = localStorage.getItem("defaultLoginEmail");
  const lastLoginEmail = localStorage.getItem("lastLoginEmail");
  const lastSignupEmail = localStorage.getItem("lastSignupEmail");
  const preferredEmail = defaultLoginEmail || lastLoginEmail || lastSignupEmail;
  if (preferredEmail) {
    qs("loginEmail").value = preferredEmail;
    qs("loginPassword").focus();
  }
};

const initSignupPage = () => {
  const form = qs("signupForm");
  if (!form) return;

  const clearErrors = () => {
    showFieldError("signupNameError", "");
    showFieldError("signupEmailError", "");
    showFieldError("signupPasswordError", "");
  };

  form.addEventListener("submit", async (event) => {
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
  initLoginPage();
  initSignupPage();
};

start();
