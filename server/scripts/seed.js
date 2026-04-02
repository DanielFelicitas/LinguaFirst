/**
 * Run once: node scripts/seed.js (from server dir, with MONGODB_URI in .env)
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const connectDB = require("../src/db");

const Module = require("../src/models/Module");
const Lesson = require("../src/models/Lesson");
const Quiz = require("../src/models/Quiz");
const VocabularyWord = require("../src/models/VocabularyWord");

async function run() {
  await connectDB();
  const existing = await Module.countDocuments();
  if (existing > 0) {
    console.log("Database already has modules — skipping seed.");
    process.exit(0);
  }

  const m1 = await Module.create({
    title: "Greetings & basics",
    description: "Essential phrases to start a conversation.",
    order: 1,
    slug: "greetings-basics",
  });

  await Lesson.create({
    moduleId: m1._id,
    title: "Hello and goodbye",
    slug: "hello-goodbye",
    order: 1,
    content: `## Magandang araw!

| Bikol | English |
|-------|---------|
| Marhay na aga | Good morning |
| Marhay na hapon | Good afternoon |
| Marhay na banggi | Good evening |
| Paalam | Goodbye |
| Salamat | Thank you |

Practice saying each phrase out loud.`,
  });

  await Lesson.create({
    moduleId: m1._id,
    title: "Introducing yourself",
    slug: "introducing-yourself",
    order: 2,
    content: `## Ako si…

Use **Ako si** before your name (I am…).

Example: *Ako si Maria.* — I am Maria.`,
  });

  const m2 = await Module.create({
    title: "Numbers & time",
    description: "Count and tell time in Bikol.",
    order: 2,
    slug: "numbers-time",
  });

  await Lesson.create({
    moduleId: m2._id,
    title: "Numbers 1–10",
    slug: "numbers-1-10",
    order: 1,
    content: `## Numbers

| | |
|-|-|
| Sarô | One |
| Duwa | Two |
| Tulo | Three |
| Apat | Four |
| Limâ | Five |`,
  });

  const m3 = await Module.create({
    title: "Grammar",
    description: "Parts of speech — flip through each language.",
    order: 3,
    slug: "grammar",
  });

  await Lesson.create({
    moduleId: m3._id,
    title: "Lesson 1: Noun",
    slug: "lesson-1-noun",
    order: 1,
    content: "",
    languagePages: [
      {
        label: "Naga Bicol",
        definition:
          "An pangangaran iyo an tataramon na nagpapahiling nin tawo, lugar, butang, ideya, o animal. Ini an klase nin pangngaran na ginagamit tang magpahiling nin bagay na konkreto o abstrakto.",
        examples: [
          " tawo (person)",
          " libro (book)",
          " Naga (Naga)",
          " kaogmahan (happiness)",
        ],
        categories: [
          { title: "Common", description: "Ordinary na pangangaran na dai espesyal na pagpapahayag (e.g. libro, kanding)." },
          { title: "Proper", description: "Espesyal na pangangaran para sa tawo, lugar, o institusyon (e.g. Naga, Maria)." },
          { title: "Collective", description: "Grupo o tipon nin mga butang (e.g. harong, kakawat)." },
        ],
      },
      {
        label: "Rinconada Bikol",
        definition:
          "An pangaranan amo an tataramon na nagpapahiling nin tawo, lugar, butang, ideya, o sadi man na bagay na makapangaranan. Ini an klase nin pangngaran na ginagamit tang magpahiling nin bagay na konkreto o abstrakto.",
        examples: [
          " tawo (person)",
          " libro (book)",
          " Iriga (Iriga)",
          " kaogmahan (happiness)",
        ],
        categories: [
          { title: "Common", description: "Ordinary na pangangaran (e.g. libro, kanding)." },
          { title: "Proper", description: "Espesyal na pangangaran para sa tawo o lugar (e.g. Iriga, Juan)." },
          { title: "Collective", description: "Grupo o tipon nin mga butang (e.g. harong, kakawat)." },
        ],
      },
      {
        label: "Filipino",
        definition:
          "Ang pangngalan ay salitang tumutukoy sa tao, lugar, bagay, ideya, o hayop. Ito ang bahagi ng pananalita na nagpapangalan ng mga pangalan na maaaring konkreto o abstrakto.",
        examples: [
          " guro (teacher)",
          " lungsod (city)",
          " Mayon (Mayon)",
          " kalayaan (freedom)",
        ],
        categories: [
          { title: "Common", description: "Ordinaryong pangalan ng bagay (e.g. libro, mesa)." },
          { title: "Proper", description: "Espesyal na pangalan ng tao o lugar (e.g. Mayon, Pilipinas)." },
          { title: "Collective", description: "Pangalan ng pangkat o grupo (e.g. mag-aaral, magkakapatid)." },
        ],
      },
      {
        label: "English",
        definition:
          "A noun is a word that names a person, place, thing, idea, or animal. It is the part of speech used to identify and label entities in the world—concrete or abstract.",
        examples: [
          " teacher (person)",
          " book (thing)",
          " Naga (place)",
          " happiness (idea)",
        ],
        categories: [
          { title: "Common", description: "General names for things (e.g. book, city)." },
          { title: "Proper", description: "Specific names for people, places, institutions (e.g. Naga, Maria)." },
          { title: "Collective", description: "Names for groups or collections (e.g. team, family)." },
        ],
      },
    ],
  });

  await Lesson.create({
    moduleId: m3._id,
    title: "Lesson 2: Interjection (Pandamdam)",
    slug: "lesson-2-interjection",
    order: 2,
    content: "",
    languagePages: [
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
    ],
  });

  await Quiz.create({
    title: "Greetings check-in",
    moduleId: m1._id,
    questions: [
      {
        prompt: 'What does "Salamat" mean?',
        options: ["Please", "Thank you", "Goodbye", "Hello"],
        correctIndex: 1,
      },
      {
        prompt: 'Which phrase means "Good morning"?',
        options: ["Marhay na banggi", "Marhay na aga", "Paalam", "Marhay na hapon"],
        correctIndex: 1,
      },
    ],
  });

  await VocabularyWord.insertMany([
    { bikol: "Dai", english: "No / Don't", example: "Dai man.", tags: ["basic"] },
    { bikol: "Iyo", english: "Yes", example: "Iyo, marhay.", tags: ["basic"] },
    { bikol: "Tano", english: "When", example: "Tano ka magbalik?", tags: ["question"] },
    { bikol: "Hain", english: "Where", example: "Hain an libro?", tags: ["question"] },
  ]);

  console.log("Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
