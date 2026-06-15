const fs = require('fs');
const path = require('path');

// 1. Ingredients Nutrition DB (Values per 100g)
const INGREDIENTS_DB = [
  {
    keywords: ['kycklingfil', 'kycklingbröst', 'kycklinglårfil', 'kycklingfiléer', 'kycklingfilé', 'kycklingklubbor', 'prosciuttolindad kyckling'],
    calories: 110, protein: 23, carbs: 0, fat: 2, fiber: 0, sugar: 0, sodium: 70,
    iron: 1.0, calcium: 15, potassium: 220, magnesium: 25, vitaminA: 10, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.3
  },
  {
    keywords: ['kycklingfärs'],
    calories: 120, protein: 20, carbs: 0, fat: 4.5, fiber: 0, sugar: 0, sodium: 80,
    iron: 1.1, calcium: 15, potassium: 210, magnesium: 23, vitaminA: 10, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.3
  },
  {
    keywords: ['kyckling', 'buffalo wings', 'vingar', 'kycklingben', 'kycklingburgare'],
    calories: 150, protein: 20, carbs: 0, fat: 8, fiber: 0, sugar: 0, sodium: 80,
    iron: 1.1, calcium: 15, potassium: 210, magnesium: 23, vitaminA: 15, vitaminC: 0, vitaminD: 0.1, vitaminB12: 0.3
  },
  {
    keywords: ['bacon'],
    calories: 340, protein: 14, carbs: 0.5, fat: 30, fiber: 0, sugar: 0.5, sodium: 1500,
    iron: 1.2, calcium: 10, potassium: 250, magnesium: 15, vitaminA: 0, vitaminC: 0, vitaminD: 0.3, vitaminB12: 0.8
  },
  {
    keywords: ['nötfärs', 'köttfärs', 'blandfärs', 'färs', 'oxfärs'],
    calories: 200, protein: 19, carbs: 0, fat: 14, fiber: 0, sugar: 0, sodium: 70,
    iron: 2.2, calcium: 15, potassium: 270, magnesium: 20, vitaminA: 0, vitaminC: 0, vitaminD: 0.2, vitaminB12: 2.0
  },
  {
    keywords: ['lax', 'laxfilé', 'laxsida'],
    calories: 200, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 60,
    iron: 0.8, calcium: 15, potassium: 360, magnesium: 30, vitaminA: 40, vitaminC: 0, vitaminD: 10.0, vitaminB12: 4.0
  },
  {
    keywords: ['tonfisk'],
    calories: 130, protein: 28, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 50,
    iron: 1.5, calcium: 10, potassium: 320, magnesium: 35, vitaminA: 20, vitaminC: 0, vitaminD: 2.0, vitaminB12: 2.5
  },
  {
    keywords: ['vispgrädde', 'grädde', 'matlagningsgrädde', 'vispgrädde 40%'],
    calories: 370, protein: 2, carbs: 3, fat: 40, fiber: 0, sugar: 3, sodium: 40,
    iron: 0.1, calcium: 80, potassium: 100, magnesium: 10, vitaminA: 370, vitaminC: 0.6, vitaminD: 0.5, vitaminB12: 0.3
  },
  {
    keywords: ['smör', 'bordsask', 'bregott'],
    calories: 720, protein: 0.8, carbs: 0.7, fat: 81, fiber: 0, sugar: 0.7, sodium: 700,
    iron: 0.02, calcium: 24, potassium: 24, magnesium: 2, vitaminA: 680, vitaminC: 0, vitaminD: 1.5, vitaminB12: 0.1
  },
  {
    keywords: ['margarin', 'olja', 'olivolja', 'rapsolja', 'solrosolja', 'matolja', 'frityrolja', 'stekfett', 'kokolja'],
    calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, sugar: 0, sodium: 2,
    iron: 0.05, calcium: 1, potassium: 1, magnesium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['parmesan', 'parmesanost', 'pecorino', 'västerbottensost', 'grana padano', 'riven ost cheddar', 'cheddarost', 'cheddar', 'riven ost'],
    calories: 400, protein: 30, carbs: 1, fat: 30, fiber: 0, sugar: 0, sodium: 1200,
    iron: 0.5, calcium: 1000, potassium: 120, magnesium: 40, vitaminA: 250, vitaminC: 0, vitaminD: 0.5, vitaminB12: 1.5
  },
  {
    keywords: ['ost', 'hushållsost', 'gratängost', 'pizzapost', 'grovriven ost', 'skivad ost'],
    calories: 350, protein: 25, carbs: 1.5, fat: 28, fiber: 0, sugar: 0.1, sodium: 600,
    iron: 0.2, calcium: 700, potassium: 80, magnesium: 25, vitaminA: 200, vitaminC: 0, vitaminD: 0.4, vitaminB12: 1.2
  },
  {
    keywords: ['mozzarella'],
    calories: 280, protein: 22, carbs: 2, fat: 20, fiber: 0, sugar: 1, sodium: 500,
    iron: 0.2, calcium: 500, potassium: 80, magnesium: 20, vitaminA: 150, vitaminC: 0, vitaminD: 0.2, vitaminB12: 0.6
  },
  {
    keywords: ['ricotta'],
    calories: 174, protein: 11, carbs: 3, fat: 13, fiber: 0, sugar: 2, sodium: 100,
    iron: 0.4, calcium: 200, potassium: 100, magnesium: 15, vitaminA: 120, vitaminC: 0, vitaminD: 0.2, vitaminB12: 0.3
  },
  {
    keywords: ['äggula', 'äggulor'],
    calories: 320, protein: 16, carbs: 1.0, fat: 28, fiber: 0, sugar: 0.6, sodium: 50,
    iron: 5.5, calcium: 130, potassium: 110, magnesium: 10, vitaminA: 380, vitaminC: 0, vitaminD: 5.0, vitaminB12: 2.0
  },
  {
    keywords: ['ägg', 'äggen'],
    calories: 140, protein: 12, carbs: 0.8, fat: 10, fiber: 0, sugar: 0.6, sodium: 140,
    iron: 1.8, calcium: 56, potassium: 130, magnesium: 12, vitaminA: 160, vitaminC: 0, vitaminD: 2.0, vitaminB12: 1.3
  },
  {
    keywords: ['pasta', 'spaghetti', 'lasagneplattor', 'lasagne', 'nudlar', 'ramen', 'makaroner', 'durumvetemjöl', 'ravioli'],
    calories: 350, protein: 11, carbs: 75, fat: 1.5, fiber: 3, sugar: 1, sodium: 5,
    iron: 1.5, calcium: 20, potassium: 150, magnesium: 35, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['ris', 'jasminris', 'basmatiris', 'risottoris', 'sushiris', 'kokt ris'],
    calories: 350, protein: 7, carbs: 78, fat: 0.5, fiber: 1, sugar: 0.1, sodium: 5,
    iron: 0.8, calcium: 10, potassium: 100, magnesium: 25, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['baguette', 'ciabatta', 'bröd', 'hamburgerbröd', 'brödskivor', 'briochebröd', 'tortilla', 'vetetortilla', 'brödskiva', 'brödmix', 'flatbread', 'pitabröd'],
    calories: 265, protein: 8.5, carbs: 52, fat: 3, fiber: 2.5, sugar: 2, sodium: 550,
    iron: 1.4, calcium: 50, potassium: 120, magnesium: 25, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['potatis', 'potatisar'],
    calories: 75, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, sugar: 0.8, sodium: 6,
    iron: 0.8, calcium: 12, potassium: 420, magnesium: 23, vitaminA: 1, vitaminC: 20, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['vetemjöl', 'mjöl', 'ströbröd', 'panko', 'pankoströbröd', 'crumble'],
    calories: 360, protein: 10, carbs: 76, fat: 1.5, fiber: 3, sugar: 1, sodium: 5,
    iron: 1.2, calcium: 15, potassium: 120, magnesium: 25, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['krossade tomater', 'passerade tomater', 'tomatpuré', 'tomatpure'],
    calories: 32, protein: 1.3, carbs: 6.0, fat: 0.2, fiber: 1.8, sugar: 4.2, sodium: 15,
    iron: 0.6, calcium: 18, potassium: 250, magnesium: 14, vitaminA: 45, vitaminC: 15, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['soltorkade tomater', 'soltorkade tomater i olja'],
    calories: 220, protein: 5.0, carbs: 15, fat: 16, fiber: 6, sugar: 12, sodium: 900,
    iron: 2.5, calcium: 70, potassium: 600, magnesium: 40, vitaminA: 100, vitaminC: 20, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['tomat', 'tomater', 'körsbärstomater', 'kvisttomat', 'plommontomater', 'kvisttomater'],
    calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5,
    iron: 0.3, calcium: 10, potassium: 237, magnesium: 11, vitaminA: 42, vitaminC: 14, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['crème fraiche', 'creme fraiche', 'smetana', 'creme fraiche med'],
    calories: 300, protein: 2.1, carbs: 2.9, fat: 30, fiber: 0, sugar: 2.9, sodium: 45,
    iron: 0.05, calcium: 90, potassium: 120, magnesium: 8, vitaminA: 300, vitaminC: 0.5, vitaminD: 0.2, vitaminB12: 0.3
  },
  {
    keywords: ['gräddfil', 'yoghurt', 'grekisk yoghurt', 'turkisk yoghurt', 'färskost', 'philadelphia', 'kvarg', 'ostcreme'],
    calories: 120, protein: 4.5, carbs: 4.0, fat: 10, fiber: 0, sugar: 4.0, sodium: 50,
    iron: 0.05, calcium: 110, potassium: 140, magnesium: 11, vitaminA: 100, vitaminC: 0.5, vitaminD: 0.1, vitaminB12: 0.4
  },
  {
    keywords: ['avokado', 'avokador'],
    calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 6.7, sugar: 0.7, sodium: 7,
    iron: 0.6, calcium: 12, potassium: 485, magnesium: 29, vitaminA: 7, vitaminC: 10, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['jordnötter', 'cashewnötter', 'valnötter', 'hasselnot', 'hasselnötter', 'nötter', 'sesamfrön', 'sesamfrö'],
    calories: 600, protein: 20, carbs: 21, fat: 51, fiber: 7.5, sugar: 4.5, sodium: 12,
    iron: 3.8, calcium: 110, potassium: 630, magnesium: 260, vitaminA: 5, vitaminC: 1, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['fläskfilé', 'fläskkarre', 'fläskkarré', 'kotlett', 'kotletter', 'fläsk', 'ribs', 'revbensspjäll', 'skinkschnitzel'],
    calories: 143, protein: 21, carbs: 0, fat: 6.5, fiber: 0, sugar: 0, sodium: 60,
    iron: 1.1, calcium: 10, potassium: 340, magnesium: 22, vitaminA: 2, vitaminC: 0, vitaminD: 0.5, vitaminB12: 0.6
  },
  {
    keywords: ['skinka', 'prosciutto', 'parmaskinka', 'kalkonskinka'],
    calories: 130, protein: 20, carbs: 1, fat: 5, fiber: 0, sugar: 0.5, sodium: 1200,
    iron: 0.9, calcium: 10, potassium: 300, magnesium: 18, vitaminA: 0, vitaminC: 0, vitaminD: 0.2, vitaminB12: 0.7
  },
  {
    keywords: ['korv', 'falukorv', 'bratwurst', 'korvar'],
    calories: 250, protein: 11, carbs: 4, fat: 21, fiber: 0, sugar: 1, sodium: 800,
    iron: 1.2, calcium: 20, potassium: 180, magnesium: 12, vitaminA: 0, vitaminC: 0, vitaminD: 0.5, vitaminB12: 0.8
  },
  {
    keywords: ['mjölk', 'mellanmjölk'],
    calories: 45, protein: 3.5, carbs: 4.8, fat: 1.5, fiber: 0, sugar: 4.8, sodium: 45,
    iron: 0.02, calcium: 120, potassium: 150, magnesium: 12, vitaminA: 40, vitaminC: 1, vitaminD: 1.0, vitaminB12: 0.4
  },
  {
    keywords: ['strösocker', 'socker', 'honung', 'lönnsirap', 'farinsocker', 'sirap', 'gelésocker'],
    calories: 387, protein: 0.2, carbs: 99, fat: 0, fiber: 0, sugar: 99, sodium: 1,
    iron: 0.05, calcium: 2, potassium: 5, magnesium: 1, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['gul lök', 'gula lökar', 'rödlök', 'rödlökar', 'schalottenlök', 'purjolök', 'salladslök', 'lök'],
    keywords_exclude: ['vitlök'],
    calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1, fiber: 1.7, sugar: 4.2, sodium: 4,
    iron: 0.2, calcium: 23, potassium: 146, magnesium: 10, vitaminA: 2, vitaminC: 7.4, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['vitlök', 'vitlöksklyfta', 'vitlöksklyftor', 'vitlöksklyftorfinhackade'],
    calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, sugar: 1.0, sodium: 17,
    iron: 1.7, calcium: 181, potassium: 401, magnesium: 25, vitaminA: 1, vitaminC: 31, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['spenat', 'mangold', 'grönkål', 'bladspenat'],
    calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79,
    iron: 2.7, calcium: 99, potassium: 558, magnesium: 79, vitaminA: 469, vitaminC: 28, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['paprika', 'paprikor', 'röd paprika'],
    calories: 31, protein: 1.0, carbs: 6.0, fat: 0.3, fiber: 2.1, sugar: 4.2, sodium: 4,
    iron: 0.4, calcium: 10, potassium: 211, magnesium: 12, vitaminA: 157, vitaminC: 127, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['gurka'],
    calories: 15, protein: 0.6, carbs: 3.6, fat: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2,
    iron: 0.3, calcium: 16, potassium: 147, magnesium: 13, vitaminA: 5, vitaminC: 2.8, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['citron', 'lime', 'citronsaft', 'limesaft'],
    calories: 30, protein: 1.1, carbs: 9.0, fat: 0.3, fiber: 2.8, sugar: 2.5, sodium: 2,
    iron: 0.6, calcium: 26, potassium: 138, magnesium: 8, vitaminA: 1, vitaminC: 53, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['champinjoner', 'svamp', 'kantareller'],
    calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1.0, sugar: 2.0, sodium: 5,
    iron: 0.5, calcium: 3, potassium: 318, magnesium: 9, vitaminA: 0, vitaminC: 2.1, vitaminD: 0.2, vitaminB12: 0.1
  },
  {
    keywords: ['buljong', 'fond', 'kycklingfond', 'kalvfond', 'grönsaksfond', 'buljongtärning', 'buljongtärningar'],
    calories: 20, protein: 2.0, carbs: 2.0, fat: 0.5, fiber: 0, sugar: 1.0, sodium: 4000,
    iron: 0.2, calcium: 10, potassium: 50, magnesium: 5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['majonnäs', 'majo', 'aioli'],
    calories: 680, protein: 1.0, carbs: 1.0, fat: 75, fiber: 0, sugar: 1.0, sodium: 600,
    iron: 0.2, calcium: 10, potassium: 20, magnesium: 2, vitaminA: 20, vitaminC: 0, vitaminD: 0.5, vitaminB12: 0.1
  },
  {
    keywords: ['soja', 'sojasås', 'japansk soja', 'kinesisk soja'],
    calories: 60, protein: 9.0, carbs: 6.0, fat: 0.1, fiber: 0.8, sugar: 1.0, sodium: 5600,
    iron: 1.4, calcium: 30, potassium: 430, magnesium: 40, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['kokosmjölk'],
    calories: 230, protein: 2.3, carbs: 6.0, fat: 24, fiber: 2.2, sugar: 3.3, sodium: 15,
    iron: 1.6, calcium: 16, potassium: 263, magnesium: 37, vitaminA: 0, vitaminC: 1.0, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['röda linser', 'linser', 'currypaste', 'currypasta', 'kikärter', 'kikärtor', 'bönor', 'vita bönor', 'kidneybönor'],
    calories: 120, protein: 8.0, carbs: 18, fat: 1.5, fiber: 5.5, sugar: 1.5, sodium: 10,
    iron: 2.5, calcium: 30, potassium: 290, magnesium: 35, vitaminA: 5, vitaminC: 1, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['morot', 'morötter'],
    calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69,
    iron: 0.3, calcium: 33, potassium: 320, magnesium: 12, vitaminA: 835, vitaminC: 5.9, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['äpple', 'äpplen'],
    calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1,
    iron: 0.1, calcium: 6, potassium: 107, magnesium: 5, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['hallon'],
    calories: 52, protein: 1.2, carbs: 12, fat: 0.6, fiber: 6.5, sugar: 4.4, sodium: 1,
    iron: 0.7, calcium: 25, potassium: 151, magnesium: 22, vitaminA: 2, vitaminC: 26, vitaminD: 0, vitaminB12: 0
  },
  {
    keywords: ['choklad', 'mörk choklad', 'kakao'],
    calories: 540, protein: 6.0, carbs: 55, fat: 33, fiber: 8, sugar: 45, sodium: 20,
    iron: 8.0, calcium: 50, potassium: 550, magnesium: 230, vitaminA: 10, vitaminC: 0, vitaminD: 1.5, vitaminB12: 0.2
  }
];

// Fallback profile for minor ingredients / seasonings
const DEFAULT_INGREDIENT = {
  calories: 40, protein: 1, carbs: 5, fat: 1, fiber: 1, sugar: 2, sodium: 50,
  iron: 0.5, calcium: 20, potassium: 150, magnesium: 15, vitaminA: 20, vitaminC: 2, vitaminD: 0, vitaminB12: 0
};

// 2. Map ingredient name to database item
function findIngredientData(name) {
  const cleanName = name.toLowerCase().trim();
  for (const item of INGREDIENTS_DB) {
    // Check exclusion keywords first
    if (item.keywords_exclude && item.keywords_exclude.some(ex => cleanName.includes(ex))) {
      continue;
    }
    // Check match keywords
    if (item.keywords.some(kw => cleanName.includes(kw))) {
      return item;
    }
  }
  return null;
}

// 3. Convert unit and quantity to weight in grams
function estimateWeight(name, quantity, unit) {
  const cleanName = name.toLowerCase().trim();
  
  if (quantity === null || quantity === undefined) {
    // Seasonings and general defaults when quantity is missing
    if (['salt', 'peppar', 'svartpeppar', 'vitpeppar', 'chiliflakes', 'chilipeppar', 'pepparkorn', 'paprikapulver', 'oregano', 'timjan', 'kanel', 'kardemumma', 'muskotnöt', 'kryddor', 'kryddnejlika', 'spiskummin'].some(x => cleanName.includes(x))) {
      return 2;
    }
    if (['vatten'].some(x => cleanName.includes(x))) {
      return 100;
    }
    if (['basilika', 'persilja', 'koriander', 'dill', 'gräslök', 'salvia', 'spenat', 'mangold'].some(x => cleanName.includes(x))) {
      return 10;
    }
    if (['olja', 'smör', 'olivolja', 'rapsolja'].some(x => cleanName.includes(x))) {
      return 15; // 1 tbsp for cooking
    }
    if (['parmesan', 'parmesanost', 'pecorino', 'västerbottensost', 'riven ost', 'ost'].some(x => cleanName.includes(x))) {
      return 20; // portion for topping
    }
    if (['ris', 'pasta', 'spaghetti', 'potatis'].some(x => cleanName.includes(x))) {
      return 70; // typical serving carbs (dry)
    }
    if (['gräddfil', 'crème fraiche', 'majonnäs', 'yoghurt'].some(x => cleanName.includes(x))) {
      return 30; // 2 tbsp
    }
    return 15; // General default
  }

  const q = Number(quantity);
  const u = (unit || '').toLowerCase().trim();

  if (u === 'g' || u === 'gram') return q;
  if (u === 'kg') return q * 1000;
  
  if (u === 'dl') {
    if (['grädde', 'vispgrädde', 'creme', 'fraiche', 'mjölk', 'vatten', 'gräddfil', 'tomat', 'buljong', 'kokos', 'fond', 'yoghurt', 'smetana'].some(x => cleanName.includes(x))) {
      return q * 100;
    }
    if (['mjöl', 'panko', 'ströbröd', 'kakao', 'crumble'].some(x => cleanName.includes(x))) {
      return q * 60;
    }
    if (['socker', 'sirap', 'honung'].some(x => cleanName.includes(x))) {
      return q * 90;
    }
    if (['ris', 'pasta', 'havregryn'].some(x => cleanName.includes(x))) {
      return q * 80;
    }
    if (['smör', 'olja'].some(x => cleanName.includes(x))) {
      return q * 95;
    }
    return q * 80;
  }

  if (u === 'msk') {
    if (['olja', 'smör', 'fett', 'margarin'].some(x => cleanName.includes(x))) {
      return q * 13;
    }
    if (['socker', 'honung', 'sirap'].some(x => cleanName.includes(x))) {
      return q * 13;
    }
    if (['mjöl', 'panko', 'ströbröd', 'kakao'].some(x => cleanName.includes(x))) {
      return q * 8;
    }
    return q * 15;
  }

  if (u === 'tsk') return q * 5;
  if (u === 'krm') return q * 1;

  // Defaults for piece units: 'st', 'klyfta', 'klyftor', 'förp', 'skiva', 'skivor', 'näve', 'burk', 'tub', etc.
  if (['kycklingfil', 'kycklingbröst', 'kycklingfiléer', 'kycklingfilé', 'prosciuttolindad kyckling'].some(x => cleanName.includes(x))) {
    return q * 125;
  }
  if (['bacon'].some(x => cleanName.includes(x))) {
    if (u === 'förp' || cleanName.includes('förp')) return q * 140;
    return q * 15; // single slice
  }
  if (['buljongtärning', 'buljongtärningar'].some(x => cleanName.includes(x))) {
    return q * 10;
  }
  if (['laxfilé', 'laxfiléer', 'lax'].some(x => cleanName.includes(x))) {
    return q * 125;
  }
  if (['tortilla', 'tortillas'].some(x => cleanName.includes(x))) {
    return q * 40;
  }
  if (['hamburgerbröd', 'briochebröd', 'brioche'].some(x => cleanName.includes(x))) {
    return q * 60;
  }
  if (['baguette'].some(x => cleanName.includes(x))) {
    if (cleanName.includes('halv') || q === 0.5) return q * 125;
    return q * 250;
  }
  if (['korv', 'korvar'].some(x => cleanName.includes(x))) {
    return q * 75;
  }
  if (['tomater', 'tomat', 'romantica', 'plommontomater'].some(x => cleanName.includes(x))) {
    if (cleanName.includes('körsbär') || cleanName.includes('små')) return q * 15;
    return q * 80;
  }
  if (['potatis', 'potatisar'].some(x => cleanName.includes(x))) {
    return q * 85;
  }
  if (['avokado', 'avokador'].some(x => cleanName.includes(x))) {
    return q * 150;
  }
  if (['mozzarella', 'mozzarellaboll'].some(x => cleanName.includes(x))) {
    return q * 125;
  }
  if (['citron', 'lime'].some(x => cleanName.includes(x))) {
    return q * 100;
  }
  if (['schalottenlök', 'vitlöksklyfta', 'vitlöksklyftor'].some(x => cleanName.includes(x))) {
    return q * 5;
  }
  if (['vitlök'].some(x => cleanName.includes(x))) {
    if (cleanName.includes('klyfta') || cleanName.includes('klyftor')) return q * 5;
    return q * 40; // whole bulb
  }
  if (['lök', 'rödlök', 'gul lök'].some(x => cleanName.includes(x))) {
    return q * 100;
  }
  if (['chili', 'chilifrukt', 'chilipeppar'].some(x => cleanName.includes(x))) {
    return q * 10;
  }
  if (['krossade tomater', 'passerade tomater', 'kokosmjölk', 'kikärter', 'bönor', 'linser'].some(x => cleanName.includes(x))) {
    if (u === 'burk' || u === 'förp') return q * 400;
  }
  if (['näve', 'spenat', 'mangold'].some(x => cleanName.includes(x))) {
    return q * 20;
  }
  if (['fläskfilé'].some(x => cleanName.includes(x))) {
    return q * 500;
  }
  if (['fläskkarré', 'kotlett'].some(x => cleanName.includes(x))) {
    return q * 150;
  }
  if (['ribs', 'revbensspjäll'].some(x => cleanName.includes(x))) {
    return q * 500;
  }
  if (['parmaskinka', 'prosciutto'].some(x => cleanName.includes(x))) {
    if (u === 'förp' || cleanName.includes('förp')) return q * 80;
    return q * 10;
  }
  if (['tonfisk'].some(x => cleanName.includes(x))) {
    if (u === 'burk') return q * 150;
  }
  if (['kruka', 'basilika', 'persilja', 'koriander'].some(x => cleanName.includes(x))) {
    return q * 30;
  }

  // General default for 1 piece of something unspecified
  return q * 50;
}

// 4. Load, Recalculate and Save Recipes
function run() {
  const recipesPath = path.join(__dirname, '../recipes.json');
  const recipesTsPath = path.join(__dirname, '../recipes.ts');

  if (!fs.existsSync(recipesPath)) {
    console.error('recipes.json not found!');
    return;
  }

  const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'));
  console.log(`Processing ${recipes.length} recipes...`);

  recipes.forEach(recipe => {
    const servings = Number(recipe.servings) || 4;
    
    // Sum nutrients for all ingredients
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;
    let totalIron = 0;
    let totalCalcium = 0;
    let totalPotassium = 0;
    let totalMagnesium = 0;
    let totalVitaminA = 0;
    let totalVitaminC = 0;
    let totalVitaminD = 0;
    let totalVitaminB12 = 0;

    recipe.ingredients.forEach(ing => {
      const dbItem = findIngredientData(ing.name) || DEFAULT_INGREDIENT;
      const weight = estimateWeight(ing.name, ing.quantity, ing.unit);
      
      const factor = weight / 100;
      totalCalories += (dbItem.calories * factor);
      totalProtein += (dbItem.protein * factor);
      totalCarbs += (dbItem.carbs * factor);
      totalFat += (dbItem.fat * factor);
      totalFiber += (dbItem.fiber * factor);
      totalSugar += (dbItem.sugar * factor);
      totalSodium += (dbItem.sodium * factor);
      totalIron += (dbItem.iron * factor);
      totalCalcium += (dbItem.calcium * factor);
      totalPotassium += (dbItem.potassium * factor);
      totalMagnesium += (dbItem.magnesium * factor);
      totalVitaminA += (dbItem.vitaminA * factor);
      totalVitaminC += (dbItem.vitaminC * factor);
      totalVitaminD += (dbItem.vitaminD * factor);
      totalVitaminB12 += (dbItem.vitaminB12 * factor);
    });

    // Divide by servings and round to 1 decimal place
    recipe.nutrition = {
      calories: Math.round(totalCalories / servings),
      protein: Math.round((totalProtein / servings) * 10) / 10,
      carbohydrates: Math.round((totalCarbs / servings) * 10) / 10,
      fat: Math.round((totalFat / servings) * 10) / 10,
      fiber: Math.round((totalFiber / servings) * 10) / 10,
      sugar: Math.round((totalSugar / servings) * 10) / 10,
      sodium: Math.round((totalSodium / servings) * 10) / 10,
      iron: Math.round((totalIron / servings) * 10) / 10,
      calcium: Math.round((totalCalcium / servings) * 10) / 10,
      potassium: Math.round((totalPotassium / servings) * 10) / 10,
      magnesium: Math.round((totalMagnesium / servings) * 10) / 10,
      vitaminA: Math.round((totalVitaminA / servings) * 10) / 10,
      vitaminC: Math.round((totalVitaminC / servings) * 10) / 10,
      vitaminD: Math.round((totalVitaminD / servings) * 10) / 10,
      vitaminB12: Math.round((totalVitaminB12 / servings) * 10) / 10
    };

    // Ensure realistic bounds for empty or non-calculated fields (minimum default values)
    if (recipe.nutrition.calories < 50) {
      recipe.nutrition.calories = 150;
      recipe.nutrition.protein = 5;
      recipe.nutrition.carbohydrates = 15;
      recipe.nutrition.fat = 5;
    }
  });

  // Save back to recipes.json
  fs.writeFileSync(recipesPath, JSON.stringify(recipes, null, 2), 'utf8');
  console.log('Successfully wrote updated recipes to recipes.json');

  // Save back to recipes.ts (as static TypeScript file)
  const tsContent = `export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  iron: number;
  calcium: number;
  potassium: number;
  magnesium: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminB12: number;
}

export interface Recipe {
  id: string;
  name: string;
  url: string;
  description: string;
  image: string;
  preparationTime: number;
  cookingTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  countryOfOrigin: string;
  region: string;
  mealType: string;
  occasions: string[];
  flavorProfile: string[];
  moodTags: string[];
  spiceLevel: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: Nutrition;
}

export const recipes: Recipe[] = ${JSON.stringify(recipes, null, 2)};
`;

  fs.writeFileSync(recipesTsPath, tsContent, 'utf8');
  console.log('Successfully wrote updated recipes to recipes.ts');

  // Display a preview of the first 3 recipes
  console.log('\nPreview of updated recipes:');
  recipes.slice(0, 3).forEach(r => {
    console.log(`- ${r.name}:`);
    console.log(`  Calories: ${r.nutrition.calories} kcal`);
    console.log(`  Protein: ${r.nutrition.protein}g`);
    console.log(`  Carbs: ${r.nutrition.carbohydrates}g`);
    console.log(`  Fat: ${r.nutrition.fat}g`);
  });
}

run();
