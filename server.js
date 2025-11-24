// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
//const Post = require("./models/Post");
const Player = require("./models/Player"); // ✅ AJOUT
const Selection = require("./models/Selection"); // ✅ AJOUT

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "5mb" })); // important pour le base64
app.use(express.static(path.join(__dirname, "public")));

// MongoDB
const MONGO_URI =
  "mongodb+srv://vaudranxgroup_db_user:jyOqziCKZJJ6oxpY@mvpfoot.87dxzzn.mongodb.net/?appName=mvpfoot";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connecté à MongoDB"))
  .catch((err) => console.error("❌ Erreur MongoDB :", err.message));

/* =========================
   API JOUEURS
   ========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "liste.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "joueurs.html"));
});

// Lister tous les joueurs
app.get("/api/players", async (req, res) => {
  try {
    const players = await Player.find().sort({ fullName: 1 });
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Créer un joueur
app.post("/api/players", async (req, res) => {
  try {
    const { fullName, position, photoBase64 } = req.body;

    if (!fullName || !position || !photoBase64) {
      return res
        .status(400)
        .json({ error: "Nom, poste et photo sont obligatoires" });
    }

    const player = new Player({ fullName, position, photoBase64 });
    const saved = await player.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// (optionnel) supprimer un joueur
app.delete("/api/players/:id", async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

/* =========================
   API SÉLECTIONS (23 JOUEURS)
   ========================= */

// Créer une sélection
app.post("/api/selections", async (req, res) => {
  try {
    const {
      authorName,
      gk = [],
      cb = [],
      rb = [],
      lb = [],
      cm = [],
      rw = [],
      lw = [],
      st = [],
    } = req.body;

    if (!authorName) {
      return res
        .status(400)
        .json({ error: "Le nom du sélectionneur est obligatoire" });
    }

    const normalize = (x) => {
      if (!x) return [];
      return Array.isArray(x) ? x : [x];
    };

    const gkIds = normalize(gk);
    const cbIds = normalize(cb);
    const rbIds = normalize(rb);
    const lbIds = normalize(lb);
    const cmIds = normalize(cm);
    const rwIds = normalize(rw);
    const lwIds = normalize(lw);
    const stIds = normalize(st);

    // Vérifications des quotas
    if (gkIds.length !== 3)
      return res.status(400).json({ error: "Il faut exactement 3 gardiens" });
    if (cbIds.length !== 5)
      return res
        .status(400)
        .json({ error: "Il faut exactement 5 défenseurs centraux" });
    if (rbIds.length !== 2)
      return res
        .status(400)
        .json({ error: "Il faut exactement 2 latéraux droits" });
    if (lbIds.length !== 2)
      return res
        .status(400)
        .json({ error: "Il faut exactement 2 latéraux gauches" });
    if (cmIds.length !== 7)
      return res
        .status(400)
        .json({ error: "Il faut exactement 7 milieux de terrain" });
    if (rwIds.length !== 3)
      return res
        .status(400)
        .json({ error: "Il faut exactement 3 ailiers droits" });
    if (lwIds.length !== 2)
      return res
        .status(400)
        .json({ error: "Il faut exactement 2 ailiers gauches" });
    if (stIds.length !== 3)
      return res.status(400).json({ error: "Il faut exactement 3 buteurs" });

    const total =
      gkIds.length +
      cbIds.length +
      rbIds.length +
      lbIds.length +
      cmIds.length +
      rwIds.length +
      lwIds.length +
      stIds.length;

    if (total !== 27) {
      return res.status(400).json({
        error: `La sélection doit contenir 23 joueurs (actuellement ${total})`,
      });
    }

    const selection = new Selection({
      authorName,
      gk: gkIds,
      cb: cbIds,
      rb: rbIds,
      lb: lbIds,
      cm: cmIds,
      rw: rwIds,
      lw: lwIds,
      st: stIds,
    });

    const saved = await selection.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Lister toutes les sélections
app.get("/api/selections", async (req, res) => {
  try {
    const selections = await Selection.find().sort({ createdAt: -1 });
    res.json(selections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer une sélection détaillée (avec joueurs)
app.get("/api/selections/:id", async (req, res) => {
  try {
    const selection = await Selection.findById(req.params.id)
      .populate("gk")
      .populate("cb")
      .populate("rb")
      .populate("lb")
      .populate("cm")
      .populate("rw")
      .populate("lw")
      .populate("st");

    if (!selection) {
      return res.status(404).json({ error: "Sélection introuvable" });
    }

    res.json(selection);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/stats/players", async (req, res) => {
  try {
    // On charge toutes les sélections avec les joueurs peuplés
    const selections = await Selection.find()
      .populate("gk")
      .populate("cb")
      .populate("rb")
      .populate("lb")
      .populate("cm")
      .populate("rw")
      .populate("lw")
      .populate("st");

    // Structure de base
    const stats = {
      GK: {},
      CB: {},
      RB: {},
      LB: {},
      CM: {},
      RW: {},
      LW: {},
      ST: {},
    };

    const addToStats = (posKey, playersArray) => {
      playersArray.forEach((p) => {
        if (!p || !p._id) return;
        const id = p._id.toString();
        if (!stats[posKey][id]) {
          stats[posKey][id] = {
            playerId: id,
            fullName: p.fullName,
            photoBase64: p.photoBase64,
            position: posKey,
            count: 0,
          };
        }
        stats[posKey][id].count += 1;
      });
    };

    // Parcourir toutes les sélections
    selections.forEach((sel) => {
      addToStats("GK", sel.gk || []);
      addToStats("CB", sel.cb || []);
      addToStats("RB", sel.rb || []);
      addToStats("LB", sel.lb || []);
      addToStats("CM", sel.cm || []);
      addToStats("RW", sel.rw || []);
      addToStats("LW", sel.lw || []);
      addToStats("ST", sel.st || []);
    });

    // Transformer en tableaux triés
    const result = {};
    Object.keys(stats).forEach((posKey) => {
      result[posKey] = Object.values(stats[posKey]).sort(
        (a, b) => b.count - a.count
      );
    });

    res.json({
      totalSelections: selections.length,
      stats: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur stats" });
  }
});

// Démarrage
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
