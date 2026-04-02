/**
 * Add/update the Interjection (Pandamdam) lesson in Grammar module.
 * Run: node scripts/upsert-interjection-lesson.js (from server dir, with MONGODB_URI in .env)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../src/db");

const Module = require("../src/models/Module");
const Lesson = require("../src/models/Lesson");

const LANGUAGE_PAGES = [
  {
    label: "Naga Bicol",
    definition:
      "An Pandamdam iyo an tataramon na nagpapahayag nin emosyon o reaksyon.",
    examples: ["Aray!", "Hoy! Kumusta ka na?"],
    categories: [],
  },
  {
    label: "Rinconada Bikol",
    definition:
      "A Pandamdam amo yan su saritang nagpapabayad sa emosyon o reaksyon.",
    examples: ["Aray!", "Hoy! Kumusta na ika?"],
    categories: [],
  },
  {
    label: "Filipino",
    definition: "Ang Pandamdam ay salitang nagpapahayag ng damdamin o emosyon.",
    examples: ["Aray!", "Hoy! Kumusta ka?"],
    categories: [],
  },
  {
    label: "English",
    definition: "An interjection expresses emotion or reaction.",
    examples: ["Ouch!", "Hey! How are you?"],
    categories: [],
  },
];

async function run() {
  await connectDB();
  let mod = await Module.findOne({ slug: "grammar" });
  if (!mod) {
    mod = await Module.create({
      title: "Grammar",
      description: "Parts of speech — flip through each language.",
      order: 99,
      slug: "grammar",
    });
    console.log('Created "grammar" module.');
  }

  const existing = await Lesson.findOne({ slug: "lesson-2-interjection" });
  const payload = {
    moduleId: mod._id,
    title: "Lesson 2: Interjection (Pandamdam)",
    slug: "lesson-2-interjection",
    order: 2,
    content: "",
    languagePages: LANGUAGE_PAGES,
  };

  if (existing) {
    await Lesson.findByIdAndUpdate(existing._id, { $set: payload });
    console.log("Updated lesson: Lesson 2: Interjection (Pandamdam)");
  } else {
    await Lesson.create(payload);
    console.log("Created lesson: Lesson 2: Interjection (Pandamdam)");
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
