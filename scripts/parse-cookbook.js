const fs = require('fs');
const path = require('path');

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=["']?([^"'\s]+)["']?/);
      if (match) return match[1];
    }
  } catch (e) {
    console.error('Error reading API key from .env:', e);
  }
  return null;
}

const GEMINI_API_KEY = getApiKey();
if (!GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY. Please set it in your environment or .env file.");
  process.exit(1);
}

async function main() {
  const cookbookDir = path.join(__dirname, '../cookBook');
  const files = fs.readdirSync(cookbookDir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));
  console.log(`Found ${files.length} images in cookbook directory.`);

  const parts = [];
  parts.push({
    text: `Du är en expert på matlagning och recepttolkning. Läs igenom alla de bifogade bilderna från en kokbok.
Identifiera alla unika recept i bilderna. Vissa recept kan sträcka sig över flera bilder (t.ex. ingredienser på en bild och instruktioner på nästa). Gruppera dessa korrekt till ett och samma recept.

För varje recept du hittar, extrahera all information och returnera en JSON-array med receptobjekt som matchar exakt detta format:
{
  "name": "Receptets namn",
  "description": "En kort beskrivning eller sammanfattning av receptet",
  "preparationTime": 20, // i minuter (heltal)
  "cookingTime": 30, // i minuter (heltal)
  "totalTime": 50, // i minuter (heltal)
  "servings": 4, // antal portioner (heltal)
  "difficulty": "Easy" | "Medium" | "Hard",
  "cuisine": "Vietnamese" | "Thai" | "Korean" | "Japanese" | "Swedish" | "Italian" | "Mexican" | "American" | "French" | "Indian" | "Greek" | "Spanish" | "Chinese" | "International",
  "mealTypes": ["breakfast" | "lunch" | "dinner" | "snack"],
  "occasions": ["weekday" | "weekend" | "family dinner" | "celebration" | "meal prep"],
  "flavorProfile": ["spicy" | "sweet" | "savory" | "sour" | "umami" | "creamy" | "tangy" | "rich" | "light" | "fresh"],
  "moodTags": ["comfort food" | "healthy" | "high protein" | "cozy" | "quick and easy"],
  "spiceLevel": 0 till 5,
  "ingredients": [
    { "name": "ingrediensnamn", "quantity": 100, "unit": "g", "optional": false }
  ],
  "instructions": [
    "Steg 1...",
    "Steg 2..."
  ],
  "nutrition": {
    "calories": 400,
    "protein": 25,
    "carbohydrates": 40,
    "fat": 15,
    "fiber": 3,
    "sugar": 5,
    "sodium": 300,
    "iron": 0,
    "calcium": 0,
    "potassium": 0,
    "magnesium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "vitaminD": 0,
    "vitaminB12": 0
  }
}

Viktigt:
- Returnera ENBART en giltig JSON-array. Inga förklarande texter.
- Texten för receptets namn, ingredienser och instruktioner ska extraheras på originalspråket (svenska om kokboken är på svenska).
- Uppskatta realistiska näringsvärden (calories, protein, carbohydrates, fat, etc.) per portion baserat på ingredienserna om de inte står i texten.
- Se till att alla ingrediensmängder är siffror (eller null om ingen mängd anges) och enheterna är standardiserade (t.ex. "g", "dl", "st", "msk", "tsk").`
  });

  for (const file of files) {
    const filePath = path.join(cookbookDir, file);
    console.log(`Loading ${file}...`);
    const data = fs.readFileSync(filePath);
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: data.toString('base64')
      }
    });
  }

  console.log("Sending request to Gemini API...");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini API error:", err);
    return;
  }

  const result = await response.json();
  const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) {
    console.error("No text returned from Gemini.");
    return;
  }

  fs.writeFileSync(path.join(__dirname, '../cookbook_parsed.json'), jsonText.trim(), 'utf8');
  console.log("Saved parsed recipes to cookbook_parsed.json!");
}

main().catch(console.error);
