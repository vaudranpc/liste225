// models/Player.js
const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    position: {
      type: String,
      enum: ["GK", "CB", "RB", "LB", "CM", "RW", "LW", "ST"],
      required: true,
    },
    photoBase64: { type: String, required: true }, // image en base64 (sans le préfixe data:image/...)
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", playerSchema);
