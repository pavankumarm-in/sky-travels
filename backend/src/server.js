const app = require("./app");
const { port } = require("./config/env");
const { connectDatabase } = require("./config/database");
const { ensureSeedDataOnFirstRun } = require("./seeds/seedPackages");

const startServer = async () => {
  console.log("[SERVER] Starting Sky Travels backend...");
  await connectDatabase();
  await ensureSeedDataOnFirstRun();

  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
};

startServer();
