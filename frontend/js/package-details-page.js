import { api } from "./api.js";
import { requireUser } from "./auth.js";
import { initAppShell, qs } from "./common-page.js";
import { getPackageImages } from "./images.js";
import { showToast } from "./ui.js";

const getPackageId = () => new URLSearchParams(window.location.search).get("id");

const renderDetails = async () => {
  const packageId = getPackageId();
  if (!packageId) throw new Error("Missing package id");

  const res = await api.getPackageById(packageId);
  const pkg = res.data;
  const images = getPackageImages(pkg);
  images.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
  qs("detailsContainer").innerHTML = `
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
};

const start = async () => {
  if (!requireUser()) return;
  initAppShell("packages");
  try {
    await renderDetails();
  } catch (error) {
    showToast(error.message, "error");
  }
};

start();
