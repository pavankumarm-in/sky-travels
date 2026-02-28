const bcrypt = require("bcryptjs");
const Package = require("../models/Package");
const User = require("../models/User");
const ROLES = require("../constants/roles");
const packageSeedData = require("./packageSeedData");
const { connectDatabase } = require("../config/database");

const ensureDefaultAdmin = async () => {
  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
  if (existingAdmin) return;

  const hashedPassword = await bcrypt.hash("Admin@12345", 10);
  await User.create({
    name: "Administrator",
    email: "admin@skytravels.com",
    password: hashedPassword,
    role: ROLES.ADMIN,
  });
  console.log("[SEED] Default admin created: admin@skytravels.com / Admin@12345");
};

const ensureSeedDataOnFirstRun = async () => {
  const hasPackages = (await Package.countDocuments()) > 0;
  if (!hasPackages) {
    await Package.insertMany(
      packageSeedData.map((pkg) => ({
        ...(() => {
          const totalSeats = Math.floor(Math.random() * 31) + 30; // 30-60
          const minAvailable = Math.max(4, Math.floor(totalSeats * 0.2));
          const availableSeats =
            Math.floor(Math.random() * (totalSeats - minAvailable + 1)) + minAvailable;
          return { totalSeats, availableSeats };
        })(),
        ...pkg,
        createdBy: "SYSTEM",
        updatedBy: "SYSTEM",
      }))
    );
    console.log("[SEED] Inserted default travel packages (10)");
  }
  await Package.updateMany(
    { totalSeats: { $exists: false } },
    [
      {
        $set: {
          totalSeats: { $add: [{ $floor: { $multiply: [{ $rand: {} }, 31] } }, 30] },
        },
      },
      {
        $set: {
          availableSeats: {
            $add: [{ $floor: { $multiply: [{ $rand: {} }, { $subtract: ["$totalSeats", 4] }] } }, 4],
          },
        },
      },
    ]
  );
  await Package.updateMany(
    { availableSeats: { $exists: false } },
    [{ $set: { availableSeats: "$totalSeats" } }]
  );

  const missingImages = await Package.find({
    $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
  });
  for (const pkg of missingImages) {
    await Package.findByIdAndUpdate(pkg._id, {
      images: [
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1400&q=80",
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=80",
      ],
    });
  }

  const allPackages = await Package.find({}, { totalSeats: 1, availableSeats: 1 });
  const uniqueSeatPairs = new Set(allPackages.map((p) => `${p.totalSeats}-${p.availableSeats}`));
  if (allPackages.length > 1 && uniqueSeatPairs.size === 1) {
    for (const pkg of allPackages) {
      const totalSeats = Math.floor(Math.random() * 31) + 30;
      const minAvailable = Math.max(4, Math.floor(totalSeats * 0.2));
      const availableSeats =
        Math.floor(Math.random() * (totalSeats - minAvailable + 1)) + minAvailable;
      await Package.findByIdAndUpdate(pkg._id, { totalSeats, availableSeats });
    }
  }
  await ensureDefaultAdmin();
};

const seedPackages = async () => {
  await connectDatabase();
  await ensureSeedDataOnFirstRun();
  process.exit(0);
};

if (require.main === module) {
  seedPackages().catch((error) => {
    console.error("[SEED] Failed:", error.message);
    process.exit(1);
  });
}

module.exports = { ensureSeedDataOnFirstRun };
