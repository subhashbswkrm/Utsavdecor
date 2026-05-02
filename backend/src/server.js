require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const productsRoute = require("./routes/products");
const bookingsRoute = require("./routes/bookings");
const reviewsRoute = require("./routes/reviews");
const adminRoute = require("./routes/admin");
const paymentsRoute = require("./routes/payments");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(",") : "*"
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Utsav Decor API running" });
});

app.use("/api/products", productsRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/admin", adminRoute);
app.use("/api/payments", paymentsRoute);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
