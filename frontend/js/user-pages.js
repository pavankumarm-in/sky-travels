import { api } from "./api.js";
import { requireUser } from "./auth.js";
import { getPackageImages } from "./images.js";
import { initAppShell, qs, showToast } from "./app-shell.js";

const startBookingsPage = async () => {
  const grid = qs("bookingsGrid");
  if (!grid) return;

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
    qs("pageMeta").textContent = state.totalPages <= 1 ? "" : `Page ${state.page} / ${state.totalPages}`;
    setPagerState();

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

  qs("prevPage").addEventListener("click", async () => {
    if (state.page > 1) {
      state.page -= 1;
      try {
        await renderBookings();
      } catch (error) {
        showToast(error.message, "error");
      }
    }
  });

  qs("nextPage").addEventListener("click", async () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      try {
        await renderBookings();
      } catch (error) {
        showToast(error.message, "error");
      }
    }
  });

  try {
    await renderBookings();
  } catch (error) {
    showToast(error.message, "error");
  }
};

const startPackageDetailsPage = async () => {
  const detailsContainer = qs("detailsContainer");
  if (!detailsContainer) return;

  const packageId = new URLSearchParams(window.location.search).get("id");
  if (!packageId) {
    showToast("Missing package id", "error");
    return;
  }

  try {
    const res = await api.getPackageById(packageId);
    const pkg = res.data;
    const images = getPackageImages(pkg);
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    detailsContainer.innerHTML = `
    <article class="details-card">
      <div class="details-hero-panel">
        <button class="carousel-btn prev" id="prevImg" type="button">&lt;</button>
        <img class="details-image" id="detailsHeroImg" src="${images[0]}" alt="${pkg.title}" loading="lazy" />
        <button class="carousel-btn next" id="nextImg" type="button">&gt;</button>
      </div>
      <p class="badge">${pkg.country}</p>
      <h2>${pkg.title}</h2>
      <p class="muted">${pkg.duration}</p>
      <p class="price">INR ${pkg.price.toLocaleString("en-IN")} <span>from Bangalore</span></p>
      <p><strong>Seats Available:</strong> ${pkg.availableSeats} / ${pkg.totalSeats}</p>
      <p>${pkg.description}</p>
      <h3>Destinations</h3>
      <div class="chip-row">${pkg.destinations.map((d) => `<span>${d}</span>`).join("")}</div>
      <h3>Full Itinerary</h3>
      <ol>${pkg.itinerary.map((line) => `<li>${line}</li>`).join("")}</ol>
    </article>
  `;

    let imageIndex = 0;
    const detailsHero = qs("detailsHeroImg");
    const setImage = (delta) => {
      imageIndex = (imageIndex + delta + images.length) % images.length;
      detailsHero.src = images[imageIndex];
    };
    qs("prevImg").addEventListener("click", () => setImage(-1));
    qs("nextImg").addEventListener("click", () => setImage(1));
  } catch (error) {
    showToast(error.message, "error");
  }
};

const start = async () => {
  if (!requireUser()) return;
  const activeNav = qs("bookingsGrid") ? "bookings" : "packages";
  initAppShell(activeNav);
  await startBookingsPage();
  await startPackageDetailsPage();
};

start();
