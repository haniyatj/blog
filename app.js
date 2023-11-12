//////main server file/////////
const express = require("express");
const app = express();
const mongoose = require("mongoose");
require("dotenv").config();

const router = require("./server");
app.use(express.json()); // Parse JSON request bodies before passing them to routes
app.use("/", router);

mongoose.connect("mongodb://localhost:27017/blog", {
  useUnifiedTopology: true, // Use the new Server Discovery and Monitoring engine
});
const db = mongoose.connection;
db.on("open", () => {
  console.log("monogdb connected");
});
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
