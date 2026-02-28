const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "../../frontend")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Sky Travels API is running" });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
