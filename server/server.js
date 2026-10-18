
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const progressRoutes = require("./routes/progressRoutes");

const app = express();

console.log("SERVER FILE:", __filename);

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Axlero LMS Backend is running!",
  });
});

// Authentication routes
app.use(
  "/api/auth",
  (req, res, next) => {
    console.log("AUTH REQUEST:", req.method, req.url);
    next();
  },
  authRoutes
);

console.log("Auth routes mounted at /api/auth");

// Course routes
app.use("/api/courses", courseRoutes);
console.log("Course routes mounted at /api/courses");

// Enrollment routes
app.use("/api/enrollments", enrollmentRoutes);
console.log("Enrollment routes mounted at /api/enrollments");
// Enrollment routes
app.use("/api/enrollments", enrollmentRoutes);
console.log("Enrollment routes mounted at /api/enrollments");

// Progress routes
app.use("/api/progress", progressRoutes);
console.log("Progress routes mounted at /api/progress");

// Start server after MongoDB connects
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Atlas connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });
