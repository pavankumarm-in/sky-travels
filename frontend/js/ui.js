import { authStore } from "./auth.js";

const ensureToastRoot = () => {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
};

export const showToast = (message, type = "success") => {
  const container = ensureToastRoot();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const now = new Date();
  const timestamp = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  toast.innerHTML = `
    <div class="toast-header">
      <span class="toast-type">${type === "error" ? "Error" : "Success"}</span>
      <span class="toast-time">${timestamp}</span>
    </div>
    <p class="toast-message">${message}</p>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
};

export const initTheme = () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") document.body.classList.add("light");

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  const updateToggleUi = () => {
    const isLight = document.body.classList.contains("light");
    toggle.classList.toggle("is-light", isLight);
    toggle.classList.toggle("is-dark", !isLight);
    toggle.setAttribute("aria-pressed", String(isLight));
  };
  updateToggleUi();

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    const activeTheme = document.body.classList.contains("light") ? "light" : "dark";
    localStorage.setItem("theme", activeTheme);
    updateToggleUi();
  });
};

export const bindGlobalActions = () => {
  const logout = document.getElementById("logoutBtn");
  if (logout) {
    logout.addEventListener("click", () => {
      authStore.clear();
      window.location.href = "/login.html";
    });
  }

  const adminLinks = document.querySelectorAll("[data-admin-only='true']");
  adminLinks.forEach((link) => {
    if (!authStore.isAdmin()) link.style.display = "none";
  });
};

export const setActiveNav = (pageKey) => {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.dataset.nav === pageKey) el.classList.add("active-link");
    else el.classList.remove("active-link");
  });
};
