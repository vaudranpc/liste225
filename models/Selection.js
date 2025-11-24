// models/Selection.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const selectionSchema = new Schema({
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  gk: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 3
  cb: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 4
  rb: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 2
  lb: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 2
  cm: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 5
  rw: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 2
  lw: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 2
  st: [{ type: Schema.Types.ObjectId, ref: "Player" }], // 3
});

module.exports = mongoose.model("Selection", selectionSchema);
