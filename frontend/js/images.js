const fallbackSeedsByTitle = {
  "Swiss Alps Explorer": "swiss-alps",
  "Bali Tropical Retreat": "bali-retreat",
  "Dubai Luxury Escape": "dubai-luxury",
  "Thailand Highlights": "thailand-highlights",
  "Maldives Island Bliss": "maldives-bliss",
  "Japan Sakura Trails": "japan-sakura",
  "Vietnam Culture Route": "vietnam-culture",
  "Singapore Family Fun": "singapore-family",
  "Europe Grand Sampler": "europe-sampler",
  "Australia Coastal Journey": "australia-coast",
};

const generateFallbackImages = (title) => {
  const seed = fallbackSeedsByTitle[title] || encodeURIComponent(title);
  return [
    `https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80`,
    `https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80`,
    `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80`,
  ];
};

export const getPackageImages = (pkg) => {
  if (Array.isArray(pkg?.images) && pkg.images.length >= 1) return pkg.images;
  return generateFallbackImages(pkg?.title || "travel");
};
