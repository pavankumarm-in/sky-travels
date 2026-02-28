import { authStore } from "./auth.js";
import { bindGlobalActions, initTheme, setActiveNav } from "./ui.js";

export const qs = (id) => document.getElementById(id);

export const initAppShell = (activeNav) => {
  initTheme();
  bindGlobalActions();
  setActiveNav(activeNav);

  const user = authStore.getUser();
  const userMeta = qs("userMeta");
  if (user && userMeta) {
    userMeta.textContent = `${user.name} (${user.role})`;
  }
};
