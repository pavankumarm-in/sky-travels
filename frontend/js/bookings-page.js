import { api } from "./api.js";
import { requireUser } from "./auth.js";
import { initAppShell, qs } from "./common-page.js";
import { showToast } from "./ui.js";

const state = { page: 1, totalPages: 1 };

const setPagerState = () => {
  const prev = qs("prevPage");
  const next = qs("nextPage");
  const singlePage = state.totalPages <= 1;
  prev.disabled = state.page <= 1 || singlePage;
  next.disabled = state.page >= state.totalPages || singlePage;
  prev.style.visibility = singlePage ? "hidden" : "visible";
  next.style.visibility = singlePage ? "hidden" : "visible";
};

const renderBookings = async () => {
  const res = await api.myBookings({ page: state.page, limit: 10, paymentStatus: "SUCCESS" });
  const items = res.data.items || [];
  state.totalPages = res.data.pagination?.totalPages || 1;
  qs("pageMeta").textContent =
    state.totalPages <= 1
      ? ""
      : `Page ${state.page} / ${state.totalPages}`;
  setPagerState();

  const grid = qs("bookingsGrid");
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = "<p class='muted'>No bookings yet.</p>";
    return;
  }

  items.forEach((booking) => {
    const adults = Number.isInteger(booking.adults) ? booking.adults : booking.persons || 0;
    const children = Number.isInteger(booking.children) ? booking.children : 0;
    const seatsBooked = booking.seatsBooked || adults + children;
    const card = document.createElement("article");
    card.className = "booking-card";
    card.innerHTML = `
      <h3>${booking.packageId?.title || "Package"}</h3>
      <p><strong>Travellers:</strong> ${adults} Adults, ${children} Children</p>
      <p><strong>Seats Booked:</strong> ${seatsBooked}</p>
      <p><strong>Total:</strong> INR ${booking.totalAmount.toLocaleString("en-IN")}</p>
      <p><strong>Payment:</strong> ${booking.paymentStatus}</p>
      <p><strong>Booking:</strong> ${booking.bookingStatus}</p>
      <p><strong>Payment Method:</strong> ${booking.paymentMethod || "-"}</p>
      <p><strong>Transaction ID:</strong> ${booking.transactionId || "-"}</p>
      <p><strong>Created At:</strong> ${new Date(booking.createdAt).toLocaleString()}</p>
    `;
    grid.appendChild(card);
  });
};

const bindEvents = () => {
  qs("prevPage").addEventListener("click", async () => {
    if (state.page > 1) {
      state.page -= 1;
      await safeLoad(renderBookings);
    }
  });
  qs("nextPage").addEventListener("click", async () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      await safeLoad(renderBookings);
    }
  });
};

const safeLoad = async (fn) => {
  try {
    await fn();
  } catch (error) {
    showToast(error.message, "error");
  }
};

const start = async () => {
  if (!requireUser()) return;
  initAppShell("bookings");
  bindEvents();
  await safeLoad(renderBookings);
};

start();
