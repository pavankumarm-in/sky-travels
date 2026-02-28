export const authStore = {
  getToken() {
    return localStorage.getItem("token");
  },
  getUser() {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },
  setSession({ token, user }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (user?.email) {
      localStorage.setItem("lastLoginEmail", user.email);
      localStorage.setItem("defaultLoginEmail", user.email);
    }
  },
  clear() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  isAdmin() {
    const user = this.getUser();
    return user?.role === "ADMIN";
  },
};

const redirect = (path) => {
  window.location.href = path;
};

export const goToDefaultDashboard = () => {
  if (!authStore.isAuthenticated()) {
    redirect("/login.html");
    return;
  }
  if (authStore.isAdmin()) {
    redirect("/admin.html");
    return;
  }
  redirect("/packages.html");
};

export const requireAuth = () => {
  if (!authStore.isAuthenticated()) {
    redirect("/login.html");
    return false;
  }
  return true;
};

export const requireGuest = () => {
  if (authStore.isAuthenticated()) {
    goToDefaultDashboard();
    return false;
  }
  return true;
};

export const requireUser = () => {
  if (!authStore.isAuthenticated()) {
    redirect("/login.html");
    return false;
  }
  if (authStore.isAdmin()) {
    redirect("/admin.html");
    return false;
  }
  return true;
};

export const requireAdmin = () => {
  if (!authStore.isAuthenticated()) {
    redirect("/login.html");
    return false;
  }
  if (!authStore.isAdmin()) {
    redirect("/packages.html");
    return false;
  }
  return true;
};
