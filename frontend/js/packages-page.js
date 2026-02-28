import { api } from "./api.js";
import { authStore, requireUser } from "./auth.js";
import { initAppShell, qs, showToast } from "./app-shell.js";
import { getPackageImages } from "./images.js";

const state = {
  page: 1,
  totalPages: 1,
  selectedPackage: null,
  defaultPaymentMethod: null,
  defaultPaymentLabel: null,
  minPriceBound: 0,
  maxPriceBound: 0,
  filterTimer: null,
};
const CHILD_FARE_MULTIPLIER = 0.5;

const showFieldError = (id, message) => {
  const el = qs(id);
  if (el) el.textContent = message || "";
};

const setPaymentFieldVisibility = () => {
  const method = qs("paymentMethod").value;
  const isUpi = method === "UPI";
  const isCard = method === "CC" || method === "DC";
  const isNetbanking = method === "NETBANKING";

  const upiFields = qs("upiFields");
  const cardFields = qs("cardFields");
  const netbankingFields = qs("netbankingFields");

  const upiInput = qs("upiValue");
  const cardNumberInput = qs("cardNumber");
  const cardCvvInput = qs("cardCvv");
  const cardExpiryInput = qs("cardExpiry");
  const netbankingInput = qs("netbankingBank");

  upiFields.classList.toggle("hidden", !isUpi);
  cardFields.classList.toggle("hidden", !isCard);
  netbankingFields.classList.toggle("hidden", !isNetbanking);
  upiFields.hidden = !isUpi;
  cardFields.hidden = !isCard;
  netbankingFields.hidden = !isNetbanking;

  upiInput.disabled = !isUpi;
  cardNumberInput.disabled = !isCard;
  cardCvvInput.disabled = !isCard;
  cardExpiryInput.disabled = !isCard;
  netbankingInput.disabled = !isNetbanking;

  upiInput.required = isUpi;
  cardNumberInput.required = isCard;
  cardCvvInput.required = isCard;
  cardExpiryInput.required = isCard;
  netbankingInput.required = isNetbanking;
};

const clearPaymentFieldErrors = () => {
  showFieldError("paymentMethodError", "");
  showFieldError("paymentTravellersError", "");
  showFieldError("paymentTravelDateError", "");
  showFieldError("upiError", "");
  showFieldError("cardNumberError", "");
  showFieldError("cardMetaError", "");
  showFieldError("netbankingError", "");
};

const hydrateDefaultPaymentFields = () => {
  const method = qs("paymentMethod").value;
  const label = state.defaultPaymentLabel || "";
  if (!label) return;

  if (method === "UPI" && label.startsWith("UPI:")) {
    qs("upiValue").value = label.slice(4).trim();
  }
  if ((method === "CC" || method === "DC") && label.startsWith(`${method}:`)) {
    const expMatch = label.match(/EXP:([0-9]{2}\/[0-9]{2})/);
    if (expMatch) qs("cardExpiry").value = expMatch[1];
  }
  if (method === "NETBANKING" && label.startsWith("NETBANKING:")) {
    const bank = label.split(":")[1]?.trim() || "";
    qs("netbankingBank").value = bank;
  }
};

const buildPaymentDetails = () => {
  const method = qs("paymentMethod").value;
  clearPaymentFieldErrors();

  if (!method) {
    showFieldError("paymentMethodError", "Select a payment method");
    return null;
  }

  if (method === "UPI") {
    const upi = qs("upiValue").value.trim();
    if (!upi) {
      showFieldError("upiError", "Enter UPI ID or number");
      return null;
    }
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/.test(upi) && !/^[0-9]{10}$/.test(upi)) {
      showFieldError("upiError", "Enter valid UPI ID or 10-digit number");
      return null;
    }
    return { paymentMethod: method, paymentLabel: `UPI:${upi}` };
  }

  if (method === "CC" || method === "DC") {
    const cardNumberRaw = qs("cardNumber").value.trim();
    const cardNumber = cardNumberRaw.replace(/\s+/g, "");
    const cvv = qs("cardCvv").value.trim();
    const expiry = qs("cardExpiry").value.trim();

    if (!/^[0-9]{12,19}$/.test(cardNumber)) {
      showFieldError("cardNumberError", "Enter a valid card number");
      return null;
    }
    if (!/^[0-9]{3,4}$/.test(cvv) || !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(expiry)) {
      showFieldError("cardMetaError", "Enter valid CVV and Expiry (MM/DD)");
      return null;
    }
    const masked = `****${cardNumber.slice(-4)}`;
    return { paymentMethod: method, paymentLabel: `${method}:${masked} | EXP:${expiry}` };
  }

  const bank = qs("netbankingBank").value;
  if (!bank) {
    showFieldError("netbankingError", "Select a bank");
    return null;
  }
  return { paymentMethod: method, paymentLabel: `NETBANKING:${bank}` };
};

const setPagerState = () => {
  const prev = qs("prevPage");
  const next = qs("nextPage");
  const singlePage = state.totalPages <= 1;
  prev.disabled = state.page <= 1 || singlePage;
  next.disabled = state.page >= state.totalPages || singlePage;
  prev.style.visibility = singlePage ? "hidden" : "visible";
  next.style.visibility = singlePage ? "hidden" : "visible";
};

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getEstimatedAmount = ({ adults, children, price }) =>
  adults * price + children * price * CHILD_FARE_MULTIPLIER;

const clampTravellerInputsToSeats = () => {
  const pkg = state.selectedPackage;
  if (!pkg) return;
  const maxSeats = Math.max(1, Number(pkg.availableSeats || 1));
  const adultsInput = qs("paymentAdults");
  const childrenInput = qs("paymentChildren");

  adultsInput.max = String(maxSeats);
  childrenInput.max = String(maxSeats);

  let adults = Number(adultsInput.value || 1);
  let children = Number(childrenInput.value || 0);

  if (!Number.isInteger(adults) || adults < 1) adults = 1;
  if (!Number.isInteger(children) || children < 0) children = 0;
  if (adults > maxSeats) adults = maxSeats;
  if (adults + children > maxSeats) children = Math.max(0, maxSeats - adults);

  adultsInput.value = String(adults);
  childrenInput.value = String(children);
};

const renderPaymentSummary = () => {
  const pkg = state.selectedPackage;
  if (!pkg) return;
  clampTravellerInputsToSeats();
  const adults = Number(qs("paymentAdults").value || 0);
  const children = Number(qs("paymentChildren").value || 0);
  const travelDate = qs("paymentTravelDate").value;
  const seatsBooked = adults + children;
  const totalAmount = Math.max(0, getEstimatedAmount({ adults, children, price: pkg.price }));
  qs("paymentSummary").innerHTML = `
    <div class="payment-summary-card">
      <p class="payment-summary-title">${pkg.title}</p>
      <div class="summary-row">
        <span class="summary-label">Travel Start Date</span>
        <span class="summary-value">${formatDate(travelDate)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Travellers</span>
        <span class="summary-value">${adults} Adults, ${children} Children (Total ${seatsBooked})</span>
      </div>
      <div class="summary-row total">
        <span class="summary-label">Total Amount</span>
        <span class="summary-value">INR ${totalAmount.toLocaleString("en-IN")}</span>
      </div>
    </div>
  `;
};

const openPaymentModal = ({ pkg }) => {
  state.selectedPackage = pkg;
  const maxSeats = Math.max(1, Number(pkg.availableSeats || 1));
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  qs("paymentModalTitle").textContent = `Trip & Payment Details - ${pkg.title}`;
  qs("paymentAdults").value = String(Math.min(1, maxSeats) || 1);
  qs("paymentChildren").value = "0";
  qs("paymentTravelDate").value = tomorrow;
  qs("paymentTravelDate").min = tomorrow;
  clampTravellerInputsToSeats();
  renderPaymentSummary();
  if (state.defaultPaymentMethod) qs("paymentMethod").value = state.defaultPaymentMethod;
  setPaymentFieldVisibility();
  hydrateDefaultPaymentFields();
  qs("paymentModal").classList.remove("hidden");
};

const resetPendingSelection = () => {
  state.selectedPackage = null;
};

const closePaymentModal = ({ resetSelection = false } = {}) => {
  qs("paymentModal").classList.add("hidden");
  qs("paymentModalTitle").textContent = "Trip & Payment Details";
  qs("paymentForm").reset();
  clearPaymentFieldErrors();
  if (resetSelection) resetPendingSelection();
  state.selectedPackage = null;
};

const loadPaymentPreference = async () => {
  try {
    const res = await api.getPaymentPreference();
    state.defaultPaymentMethod = res.data.defaultPaymentMethod;
    state.defaultPaymentLabel = res.data.defaultPaymentLabel;
  } catch (error) {
    // non-blocking
  }
};

const renderPackages = async () => {
  const search = qs("searchInput").value.trim();
  const minPrice = Number(qs("minPriceInput").value || 0);
  const maxPrice = Number(qs("maxPriceInput").value || 0);

  const res = await api.listPackages({
    search,
    minPrice,
    maxPrice,
    page: state.page,
    limit: 6,
  });

  const items = res.data.items || [];
  state.totalPages = res.data.pagination?.totalPages || 1;
  qs("pageMeta").textContent =
    state.totalPages <= 1
      ? "Everything you searched fits in one curated view."
      : `Page ${state.page} / ${state.totalPages}`;
  setPagerState();

  const grid = qs("packagesGrid");
  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = "<p class='muted'>No packages found.</p>";
    return;
  }

  items.forEach((pkg) => {
    const gallery = getPackageImages(pkg);
    gallery.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
    const card = document.createElement("article");
    card.className = "package-card";
    card.innerHTML = `
      <div class="package-main">
        <div class="hero-panel">
          <button class="carousel-btn prev" id="prevImg_${pkg._id}" type="button">&lt;</button>
          <img class="hero-image" id="heroImg_${pkg._id}" src="${gallery[0]}" alt="${pkg.title}" loading="lazy" />
          <button class="carousel-btn next" id="nextImg_${pkg._id}" type="button">&gt;</button>
        </div>
        <p class="badge">${pkg.country}</p>
        <h3>${pkg.title}</h3>
        <p class="muted">${pkg.duration}</p>
        <p class="price">INR ${pkg.price.toLocaleString("en-IN")} <span>from Bangalore</span></p>
        <p><strong>Remaining Seats:</strong> ${pkg.availableSeats} / ${pkg.totalSeats}</p>
        <p>${pkg.description}</p>
        <div class="chip-row">${pkg.destinations.map((d) => `<span>${d}</span>`).join("")}</div>
      </div>
      <div class="package-footer">
      <div class="actions">
        <a href="/package-details.html?id=${pkg._id}" class="ghost-link">View details</a>
        <button id="book_${pkg._id}" class="primary">Book & Pay</button>
      </div>
      </div>
    `;
    grid.appendChild(card);

    let imageIndex = 0;
    const hero = card.querySelector(`#heroImg_${pkg._id}`);
    const setImage = (delta) => {
      imageIndex = (imageIndex + delta + gallery.length) % gallery.length;
      hero.src = gallery[imageIndex];
    };
    card.querySelector(`#prevImg_${pkg._id}`).addEventListener("click", () => setImage(-1));
    card.querySelector(`#nextImg_${pkg._id}`).addEventListener("click", () => setImage(1));

    card.querySelector(`#book_${pkg._id}`).addEventListener("click", () => openPaymentModal({ pkg }));
  });
};

const formatINR = (value) => `INR ${Number(value).toLocaleString("en-IN")}`;

const syncPriceLabels = () => {
  qs("minPriceLabel").textContent = formatINR(qs("minPriceInput").value || 0);
  qs("maxPriceLabel").textContent = formatINR(qs("maxPriceInput").value || 0);
};

const loadPriceBounds = async () => {
  const res = await api.listPackages({ page: 1, limit: 200 });
  const all = res.data.items || [];
  if (!all.length) return;

  const prices = all.map((p) => p.price).filter((n) => typeof n === "number");
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  state.minPriceBound = min;
  state.maxPriceBound = max;

  const minSlider = qs("minPriceInput");
  const maxSlider = qs("maxPriceInput");
  minSlider.min = String(min);
  minSlider.max = String(max);
  minSlider.step = "500";
  maxSlider.min = String(min);
  maxSlider.max = String(max);
  maxSlider.step = "500";
  minSlider.value = String(min);
  maxSlider.value = String(max);
  syncPriceLabels();
};

const scheduleFilter = () => {
  if (state.filterTimer) clearTimeout(state.filterTimer);
  state.filterTimer = setTimeout(async () => {
    state.page = 1;
    await safeLoad(renderPackages);
  }, 250);
};

const bindEvents = () => {
  qs("searchInput").addEventListener("input", scheduleFilter);
  qs("minPriceInput").addEventListener("input", async () => {
    const min = Number(qs("minPriceInput").value);
    const max = Number(qs("maxPriceInput").value);
    if (min > max) qs("maxPriceInput").value = String(min);
    syncPriceLabels();
    scheduleFilter();
  });
  qs("maxPriceInput").addEventListener("input", async () => {
    const min = Number(qs("minPriceInput").value);
    const max = Number(qs("maxPriceInput").value);
    if (max < min) qs("minPriceInput").value = String(max);
    syncPriceLabels();
    scheduleFilter();
  });
  qs("prevPage").addEventListener("click", async () => {
    if (state.page > 1) {
      state.page -= 1;
      await safeLoad(renderPackages);
    }
  });
  qs("nextPage").addEventListener("click", async () => {
    if (state.page < state.totalPages) {
      state.page += 1;
      await safeLoad(renderPackages);
    }
  });
  qs("closePaymentModalBtn").addEventListener("click", () => closePaymentModal({ resetSelection: true }));
  qs("cancelPaymentBtn").addEventListener("click", () => closePaymentModal({ resetSelection: true }));
  qs("paymentAdults").addEventListener("input", renderPaymentSummary);
  qs("paymentChildren").addEventListener("input", renderPaymentSummary);
  qs("paymentTravelDate").addEventListener("input", renderPaymentSummary);
  qs("paymentMethod").addEventListener("change", () => {
    clearPaymentFieldErrors();
    setPaymentFieldVisibility();
    renderPaymentSummary();
  });
  qs("paymentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearPaymentFieldErrors();
    const pkg = state.selectedPackage;
    if (!pkg?._id) {
      showToast("No package selected", "error");
      closePaymentModal({ resetSelection: true });
      return;
    }

    const adults = Number(qs("paymentAdults").value);
    const children = Number(qs("paymentChildren").value);
    const travelDate = qs("paymentTravelDate").value;
    const today = new Date().toISOString().split("T")[0];

    if (!Number.isInteger(adults) || adults < 1 || adults > 20) {
      showFieldError("paymentTravellersError", "Adults must be between 1 and 20");
      return;
    }
    if (!Number.isInteger(children) || children < 0 || children > 20) {
      showFieldError("paymentTravellersError", "Children must be between 0 and 20");
      return;
    }
    if (adults + children > 20) {
      showFieldError("paymentTravellersError", "Total travellers cannot exceed 20");
      return;
    }
    if (adults + children > pkg.availableSeats) {
      showFieldError("paymentTravellersError", "Not enough remaining seats");
      return;
    }
    if (!travelDate || travelDate <= today) {
      showFieldError("paymentTravelDateError", "Travel date must be a future date");
      return;
    }

    const payment = buildPaymentDetails();
    const makeDefault = qs("makePaymentDefault").checked;
    if (!payment) return;
    const { paymentMethod, paymentLabel } = payment;

    const btn = qs("confirmPaymentBtn");
    btn.disabled = true;
    btn.textContent = "Processing...";
    try {
      const createRes = await api.createBooking({ packageId: pkg._id, adults, children, travelDate });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await api.payBooking(createRes.data._id, {
        paymentMethod,
        paymentLabel,
        makeDefault,
      });
      if (makeDefault) {
        state.defaultPaymentMethod = paymentMethod;
        state.defaultPaymentLabel = paymentLabel;
        const existing = authStore.getUser();
        if (existing) {
          authStore.setSession({
            token: authStore.getToken(),
            user: {
              ...existing,
              defaultPaymentMethod: paymentMethod,
              defaultPaymentLabel: paymentLabel,
            },
          });
        }
      }
      showToast("Payment successful. Awaiting admin confirmation.");
      closePaymentModal({ resetSelection: true });
      await renderPackages();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Pay Now";
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
  initAppShell("packages");
  setPaymentFieldVisibility();
  await loadPriceBounds();
  await loadPaymentPreference();
  bindEvents();
  await safeLoad(renderPackages);
};

start();
