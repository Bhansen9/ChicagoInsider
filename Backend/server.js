const express = require("express");
const path = require("path");

const recommendationsRouter = require("./routes/recommendations");
const placesRouter = require("./routes/places");
const configRouter = require("./routes/config");

const app = express();
const PORT = 3000;
const frontendDir = path.join(__dirname, "..", "Frontend");

app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || origin === "http://localhost:3000") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.static(frontendDir));

app.use("/api/recommendations", recommendationsRouter);
app.use("/api/places", placesRouter);
app.use("/api/config", configRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "Home_Page.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Something went wrong while preparing Chicago recommendations."
  });
});

function startServer(port) {
  const server = app.listen(port, () => {
    console.log("Chicago Lens AI running at http://localhost:3000");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error("Port 3000 is busy. Stop the other process and restart this app.");
      process.exit(1);
      return;
    }

    throw error;
  });
}

startServer(PORT);
