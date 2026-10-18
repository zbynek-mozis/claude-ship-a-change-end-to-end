const express = require("express");
const store = require("../db/store");

const router = express.Router();

// GET /users — list every user
router.get("/", (req, res) => {
  res.json(store.getAllUsers());
});

// GET /users/:id — fetch a single user, or 404 if it doesn't exist
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = store.getUserById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

// POST /users — create a user; name and email are required
router.post("/", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }

  const user = store.createUser({ name, email });
  res.status(201).json(user);
});

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

// PUT /users/:id — replace a user's name and email; both are required
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const { name, email } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email)) {
    return res
      .status(400)
      .json({ error: "name and email are required and must be non-empty strings" });
  }

  const user = store.updateUser(id, { name, email });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

module.exports = router;
