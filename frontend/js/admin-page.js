import { api } from "./api.js";
import { authStore, requireAdmin } from "./auth.js";
import { initAppShell, qs } from "./common-page.js";
import { showToast } from "./ui.js";

const state = { chart: null, uploadedImagePaths: [], confirmResolver: null };
const isValidImageRef = (img) =>
  /^https?:\/\/\S+$/i.test(img) ||
  /^\/uploads\/\S+$/i.test(img) ||
  /^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(img);

const getSelectedImageSource = () =>
  document.querySelector('input[name="imageSource"]:checked')?.value || "links";

const setImageSource = (value) => {
  const links = qs("imageLinksSection");
  const upload = qs("imageUploadSection");
  const linksInput = qs("packageImagesLinks");
  const uploadInput = qs("packageImageFiles");
  const uploadBtn = qs("uploadPackageImagesBtn");
  const usingUpload = value === "upload";
  links.classList.toggle("hidden", usingUpload);
  links.hidden = usingUpload;
  upload.classList.toggle("hidden", !usingUpload);
  upload.hidden = !usingUpload;
  linksInput.disabled = usingUpload;
  uploadInput.disabled = !usingUpload;
  uploadBtn.disabled = !usingUpload;
  linksInput.required = !usingUpload;
  uploadInput.required = usingUpload && state.uploadedImagePaths.length === 0;
};

const validatePackageForm = () => {
  const form = qs("packageForm");
  const mode = getSelectedImageSource();
  const linksInput = qs("packageImagesLinks");
  const uploadInput = qs("packageImageFiles");
  const linkImages = linksInput.value
    .split("\n")
    .map((d) => d.trim())
    .filter(Boolean);
  const hasFilesSelected = Boolean(uploadInput.files && uploadInput.files.length > 0);

  uploadInput.setCustomValidity("");
  linksInput.setCustomValidity("");

  if (mode === "links") {
    if (linkImages.length < 2) {
      linksInput.setCustomValidity("Add at least 2 image links");
    }
  } else if (state.uploadedImagePaths.length < 2 && !hasFilesSelected) {
    uploadInput.setCustomValidity("Upload at least 2 images");
  }

  if (!form.reportValidity()) {
    return false;
  }

  if (mode === "upload" && state.uploadedImagePaths.length < 2) {
    showToast("Upload at least 2 images first", "error");
    return false;
  }

  return true;
};

const collectImagesFromForm = () => {
  const mode = getSelectedImageSource();
  if (mode === "upload") {
    return state.uploadedImagePaths.filter(Boolean);
  }
  return qs("packageImagesLinks")
    .value.split("\n")
    .map((d) => d.trim())
    .filter(Boolean);
};

const clearPackageForm = () => {
  qs("packageForm").reset();
  qs("packageId").value = "";
  state.uploadedImagePaths = [];
  qs("uploadedImagesMeta").textContent = "";
  qs("packageModalTitle").textContent = "Create Package";
  qs("packageSubmitBtn").textContent = "Create Package";
  document.querySelector('input[name="imageSource"][value="links"]').checked = true;
  setImageSource("links");
};

const openPackageModal = ({ mode = "create", pkg = null } = {}) => {
  clearPackageForm();
  if (mode === "edit" && pkg) {
    qs("packageModalTitle").textContent = "Edit Package";
    qs("packageSubmitBtn").textContent = "Edit Package";
    qs("packageId").value = pkg._id;
    qs("packageTitle").value = pkg.title;
    qs("packageCountry").value = pkg.country;
    qs("packageDuration").value = pkg.duration;
    qs("packagePrice").value = pkg.price;
    qs("packageTotalSeats").value = pkg.totalSeats;
    qs("packageAvailableSeats").value = pkg.availableSeats;
    qs("packageDestinations").value = pkg.destinations.join(", ");
    qs("packageItinerary").value = pkg.itinerary.join("\n");
    qs("packageDescription").value = pkg.description;

    const images = pkg.images || [];
    const hasUploadOnly =
      images.length > 0 && images.every((img) => /^\/uploads\//i.test(img) || /^data:image\//i.test(img));
    if (hasUploadOnly) {
      document.querySelector('input[name="imageSource"][value="upload"]').checked = true;
      setImageSource("upload");
      state.uploadedImagePaths = [...images];
      qs("packageImageFiles").required = false;
      qs("uploadedImagesMeta").textContent = `${state.uploadedImagePaths.length} image(s) selected`;
    } else {
      document.querySelector('input[name="imageSource"][value="links"]').checked = true;
      setImageSource("links");
      qs("packageImagesLinks").value = images.join("\n");
    }
  }
  qs("packageModal").classList.remove("hidden");
};

const closePackageModal = () => {
  qs("packageModal").classList.add("hidden");
};

const openDeleteConfirmModal = ({ title, message, confirmLabel = "Delete" }) => {
  qs("deleteConfirmTitle").textContent = title || "Confirm Delete";
  qs("deleteConfirmMessage").textContent = message || "This action cannot be undone.";
  qs("confirmDeleteBtn").textContent = confirmLabel;
  qs("deleteConfirmModal").classList.remove("hidden");
};

const closeDeleteConfirmModal = ({ confirmed = false } = {}) => {
  qs("deleteConfirmModal").classList.add("hidden");
  if (state.confirmResolver) {
    state.confirmResolver(Boolean(confirmed));
    state.confirmResolver = null;
  }
};

const askDeleteConfirmation = ({ title, message, confirmLabel }) =>
  new Promise((resolve) => {
    if (state.confirmResolver) state.confirmResolver(false);
    state.confirmResolver = resolve;
    openDeleteConfirmModal({ title, message, confirmLabel });
  });

const initTabs = () => {
  const tabButtons = document.querySelectorAll(".admin-view-link");
  const panels = document.querySelectorAll(".tab-panel");
  const setActive = (targetId) => {
    tabButtons.forEach((btn) =>
      btn.classList.toggle("active-link", btn.dataset.adminViewTarget === targetId)
    );
    panels.forEach((panel) => panel.classList.toggle("active", panel.id === targetId));
  };
  tabButtons.forEach((btn) =>
    btn.addEventListener("click", () => setActive(btn.dataset.adminViewTarget))
  );
  setActive("dashboardTab");
};

const renderAnalytics = async () => {
  const res = await api.adminAnalytics();
  const d = res.data;
  const totalViews = Number(d.totalBookings || 0);
  const totalBookings = Number(d.successfulBookings || 0);
  const totalUsers = Number(d.totalUsers || 0);
  const totalRevenue = Number(d.totalRevenue || 0);
  qs("analyticsKpis").innerHTML = `
    <div class="kpi-card"><p class="muted">Total Users</p><h3>${totalUsers.toLocaleString("en-IN")}</h3></div>
    <div class="kpi-card"><p class="muted">Total Views</p><h3>${totalViews.toLocaleString("en-IN")}</h3></div>
    <div class="kpi-card"><p class="muted">Total Bookings</p><h3>${totalBookings.toLocaleString("en-IN")}</h3></div>
    <div class="kpi-card"><p class="muted">Total Revenue</p><h3>INR ${totalRevenue.toLocaleString("en-IN")}</h3></div>
  `;
  if (state.chart) state.chart.destroy();
  state.chart = new Chart(qs("analyticsChart"), {
    type: "bar",
    data: {
      labels: ["Total Users", "Total Views", "Total Bookings"],
      datasets: [
        {
          data: [totalUsers, totalViews, totalBookings],
          backgroundColor: ["#5fcf8d", "#3cc8cc", "#4f8dfd"],
          borderRadius: 8,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } },
  });
};

const renderUsers = async () => {
  const res = await api.adminUsers({ page: 1, limit: 100 });
  const usersList = qs("usersList");
  const loggedInUser = authStore.getUser();
  usersList.innerHTML = "";
  res.data.items.forEach((user) => {
    const isLoggedInAdmin =
      Boolean(loggedInUser) &&
      (loggedInUser._id === user._id ||
        (loggedInUser.email && user.email && loggedInUser.email.toLowerCase() === user.email.toLowerCase()));
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div>
        <p><strong>${user.name}</strong></p>
        <p class="muted">${user.email} | ${user.role}</p>
      </div>
      ${
        isLoggedInAdmin
          ? `<div class="muted">Current logged-in admin</div>`
          : `<div class="actions">
        <button id="delete_user_${user._id}" class="danger-icon-btn" type="button" aria-label="Delete user">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 6h18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M7 6l1 13a1 1 0 0 0 1 .92h6a1 1 0 0 0 1-.92L17 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
            <path d="M10 10v6M14 10v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
          </svg>
        </button>
      </div>`
      }
    `;
    usersList.appendChild(row);
    if (!isLoggedInAdmin) {
      row.querySelector(`#delete_user_${user._id}`).addEventListener("click", async () => {
        const ok = await askDeleteConfirmation({
          title: "Delete User",
          message: `Delete user ${user.email}? This action cannot be undone.`,
          confirmLabel: "Delete User",
        });
        if (!ok) return;
        try {
          await api.deleteUser(user._id);
          showToast("User deleted");
          await Promise.all([renderUsers(), renderAnalytics(), renderAuditLogs()]);
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    }
  });
};

const renderAuditLogs = async () => {
  const res = await api.auditLogs({ page: 1, limit: 20 });
  const auditList = qs("auditList");
  auditList.innerHTML = "";
  const logs = res.data.logs || [];
  const bookingLogs = logs.filter((log) => log.entity === "BOOKING");
  if (!bookingLogs.length) {
    auditList.innerHTML = "<p class='muted'>No booking audit history found yet.</p>";
    return;
  }

  const bookingIds = [...new Set(bookingLogs.map((log) => String(log.entityId || "")).filter(Boolean))];
  const bookingDetailsEntries = await Promise.all(
    bookingIds.map(async (bookingId) => {
      try {
        const bookingRes = await api.adminBookingById(bookingId);
        return [bookingId, bookingRes.data];
      } catch (error) {
        return [bookingId, null];
      }
    })
  );
  const bookingDetailsById = Object.fromEntries(bookingDetailsEntries);

  bookingLogs.forEach((log) => {
    const details = log.newData || log.oldData || {};
    const booking = bookingDetailsById[String(log.entityId)] || null;
    const person = details.userName || details.name || booking?.userId?.name || details.userId || "-";
    const email = details.userEmail || details.email || booking?.userId?.email || "-";
    const seats =
      details.seatsBooked ??
      booking?.seatsBooked ??
      (Number.isFinite(Number(details.adults)) || Number.isFinite(Number(details.children))
        ? Number(details.adults || 0) + Number(details.children || 0)
        : "-");
    const amountValue = details.totalAmount ?? booking?.totalAmount;
    const amount = amountValue != null ? `INR ${Number(amountValue).toLocaleString("en-IN")}` : "-";
    const status = details.bookingStatus || booking?.bookingStatus || details.paymentStatus || booking?.paymentStatus || "-";
    const bookingId = details.bookingId || log.entityId;
    const performerRaw = String(log.performedBy || "-");
    const performerMatch = performerRaw.match(/^(USER|ADMIN):([a-f0-9]{24})$/i);
    const performer =
      performerMatch && (booking?.userId?.name || details.userName)
        ? `${performerMatch[1].toUpperCase()}:${booking?.userId?.name || details.userName} (${performerMatch[2]})`
        : performerRaw;
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div>
        <p><strong>${log.action}</strong></p>
        <p class="muted">Booking ID: ${bookingId}</p>
        <p class="muted">Person: ${person}</p>
        <p class="muted">Email: ${email}</p>
        <p class="muted">Seats: ${seats}</p>
        <p class="muted">Total Amount: ${amount}</p>
        <p class="muted">Status: ${status}</p>
        <p class="muted">Performed By: ${performer}</p>
      </div>
      <div class="muted">${new Date(log.createdAt).toLocaleString()}</div>
    `;
    auditList.appendChild(row);
  });
};

const renderAdminPackages = async () => {
  const res = await api.listPackages({ page: 1, limit: 200 });
  const box = qs("adminPackages");
  box.innerHTML = "";
  res.data.items.forEach((pkg) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div>
        <p><strong>${pkg.title}</strong></p>
        <p class="muted">${pkg.country} | INR ${pkg.price.toLocaleString("en-IN")}</p>
        <p class="muted">Seats: ${pkg.availableSeats} / ${pkg.totalSeats}</p>
      </div>
      <div class="actions">
        <button id="edit_${pkg._id}">Edit</button>
        <button id="delete_${pkg._id}">Delete</button>
      </div>
    `;
    box.appendChild(row);
    row.querySelector(`#edit_${pkg._id}`).addEventListener("click", () => openPackageModal({ mode: "edit", pkg }));
    row.querySelector(`#delete_${pkg._id}`).addEventListener("click", async () => {
      const ok = await askDeleteConfirmation({
        title: "Delete Package",
        message: `Delete package "${pkg.title}"? This action cannot be undone.`,
        confirmLabel: "Delete Package",
      });
      if (!ok) return;
      try {
        await api.deletePackage(pkg._id);
        showToast("Package deleted");
        await loadAdminData();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
};

const bindPackageForm = () => {
  qs("packageForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      if (!validatePackageForm()) return;

      const id = qs("packageId").value;
      const payload = {
        title: qs("packageTitle").value.trim(),
        country: qs("packageCountry").value.trim(),
        duration: qs("packageDuration").value.trim(),
        price: Number(qs("packagePrice").value),
        totalSeats: Number(qs("packageTotalSeats").value),
        availableSeats: Number(qs("packageAvailableSeats").value),
        destinations: qs("packageDestinations").value.split(",").map((d) => d.trim()).filter(Boolean),
        images: collectImagesFromForm(),
        itinerary: qs("packageItinerary").value.split("\n").map((d) => d.trim()).filter(Boolean),
        description: qs("packageDescription").value.trim(),
      };

      if (payload.itinerary.length < 3) throw new Error("Itinerary must have at least 3 lines");
      if (!Array.isArray(payload.images) || payload.images.length < 2) throw new Error("Add at least 2 images");
      if (!payload.images.every((img) => isValidImageRef(img))) {
        throw new Error("Images must be valid links or uploaded images");
      }
      if (!Number.isInteger(payload.totalSeats) || payload.totalSeats < 1) throw new Error("Total seats must be at least 1");
      if (!Number.isInteger(payload.availableSeats) || payload.availableSeats < 0 || payload.availableSeats > payload.totalSeats) {
        throw new Error("Available seats must be between 0 and total seats");
      }

      if (id) await api.updatePackage(id, payload);
      else await api.createPackage(payload);

      showToast(id ? "Package updated" : "Package created");
      closePackageModal();
      await loadAdminData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });
};

const bindImageUpload = () => {
  const uploadBtn = qs("uploadPackageImagesBtn");
  const fileInput = qs("packageImageFiles");
  uploadBtn.addEventListener("click", async () => {
    try {
      if (getSelectedImageSource() !== "upload") {
        showToast("Switch to Upload Images mode", "error");
        return;
      }
      const files = fileInput.files;
      if (!files || files.length === 0) throw new Error("Select one or more images to upload");
      const res = await api.uploadPackageImages(files);
      const uploaded = res.data || [];
      state.uploadedImagePaths = [...new Set([...state.uploadedImagePaths, ...uploaded])];
      qs("uploadedImagesMeta").textContent = `${state.uploadedImagePaths.length} image(s) selected`;
      fileInput.required = state.uploadedImagePaths.length === 0;
      fileInput.value = "";
      showToast("Images uploaded");
    } catch (error) {
      showToast(error.message, "error");
    }
  });
};

const bindModalControls = () => {
  qs("openCreatePackageBtn").addEventListener("click", () => openPackageModal({ mode: "create" }));
  qs("closePackageModalBtn").addEventListener("click", closePackageModal);
  qs("cancelPackageFormBtn").addEventListener("click", closePackageModal);
  qs("packageModal").addEventListener("click", (event) => {
    if (event.target.id === "packageModal") closePackageModal();
  });
  qs("closeDeleteConfirmBtn").addEventListener("click", () => closeDeleteConfirmModal({ confirmed: false }));
  qs("cancelDeleteConfirmBtn").addEventListener("click", () => closeDeleteConfirmModal({ confirmed: false }));
  qs("confirmDeleteBtn").addEventListener("click", () => closeDeleteConfirmModal({ confirmed: true }));
  qs("deleteConfirmModal").addEventListener("click", (event) => {
    if (event.target.id === "deleteConfirmModal") closeDeleteConfirmModal({ confirmed: false });
  });

  document.querySelectorAll('input[name="imageSource"]').forEach((el) => {
    el.addEventListener("change", () => setImageSource(el.value));
  });
};

const renderBookingsApproval = async () => {
  const res = await api.adminBookings({ page: 1, limit: 30, bookingStatus: "AWAITING_ADMIN_CONFIRMATION" });
  const box = qs("bookingsApprovalList");
  const pendingCountBadge = qs("pendingCountBadge");
  box.innerHTML = "";
  const items = res.data.items || [];
  pendingCountBadge.textContent = String(items.length);
  pendingCountBadge.classList.toggle("hidden", items.length === 0);
  if (!items.length) {
    box.innerHTML = "<p class='muted'>No bookings awaiting confirmation.</p>";
    return;
  }
  items.forEach((booking) => {
    const adults = Number.isInteger(booking.adults) ? booking.adults : booking.persons || 0;
    const children = Number.isInteger(booking.children) ? booking.children : 0;
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <div>
        <p><strong>${booking.packageId?.title || "Package"}</strong></p>
        <p class="muted">${booking.userId?.name || "User"} (${booking.userId?.email || "-"})</p>
        <p class="muted">${adults} Adults, ${children} Children | INR ${booking.totalAmount.toLocaleString("en-IN")}</p>
        <p class="muted">Txn: ${booking.transactionId || "-"}</p>
      </div>
      <div class="actions">
        <button id="confirm_${booking._id}" class="primary">Confirm Booking</button>
      </div>
    `;
    box.appendChild(row);
    row.querySelector(`#confirm_${booking._id}`).addEventListener("click", async () => {
      try {
        await api.confirmBooking(booking._id);
        showToast("Booking confirmed");
        await loadAdminData();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
};

const loadAdminData = async () => {
  await Promise.all([renderAnalytics(), renderUsers(), renderAuditLogs(), renderAdminPackages(), renderBookingsApproval()]);
};

const start = async () => {
  if (!requireAdmin()) return;
  initAppShell("admin");
  initTabs();
  bindPackageForm();
  bindImageUpload();
  bindModalControls();
  setImageSource("links");
  await loadAdminData();
  setInterval(renderAnalytics, 15000);
};

start();
