export interface Ingredient {
  name: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
}

export function capitalizeWord(w: string): string {
  if (!w) return '';
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
}

export function parseNumericQuantity(raw: string): number {
  const val = raw.replace(',', '.').trim();

  const fractionMap: Record<string, number> = {
    '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875
  };
  if (fractionMap[val]) return fractionMap[val];

  if (val.includes('/')) {
    const parts = val.split(/\s+/);
    if (parts.length === 2) {
      const whole = parseFloat(parts[0]);
      const fracParts = parts[1].split('/');
      return whole + (parseFloat(fracParts[0]) / parseFloat(fracParts[1]));
    } else {
      const fracParts = val.split('/');
      return parseFloat(fracParts[0]) / parseFloat(fracParts[1]);
    }
  }

  return parseFloat(val) || 0;
}

export function parseIngredientLineHeuristic(line: string): Ingredient {
  const cleanLine = line.trim();
  if (!cleanLine) return { name: '', quantity: null, unit: '', optional: false };

  const optionalKeywords = ['valfri', 'valfritt', 'optional', 'kan uteslutas'];
  const isOptional = optionalKeywords.some(kw => cleanLine.toLowerCase().includes(kw));

  const numRegex = /^(\d+[\s\.,\/]?\d*|½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)/;
  const numMatch = cleanLine.match(numRegex);

  let quantity: number | null = null;
  let remaining = cleanLine;

  if (numMatch) {
    const rawQty = numMatch[1].trim();
    quantity = parseNumericQuantity(rawQty);
    remaining = cleanLine.slice(numMatch[0].length).trim();
  }

  const unitList = [
    'g', 'kg', 'dl', 'cl', 'ml', 'l', 'msk', 'tsk', 'krm', 'st', 'förp', 'burk', 
    'port', 'klyfta', 'klyftor', 'nypa', 'näve', 'gfp', 'tub', 'skiva', 'skivor',
    'tbsp', 'tsp', 'cup', 'cups', 'oz', 'lb', 'grms', 'grm', 'grams', 'gram', 'pcs', 'can', 'pack', 'package'
  ];

  const words = remaining.split(/\s+/);
  let unit = '';
  let name = remaining;

  if (words.length > 0) {
    const firstWord = words[0].toLowerCase().replace(/[\(\)]/g, '');
    if (unitList.includes(firstWord)) {
      unit = words[0];
      name = words.slice(1).join(' ');
    }
  }

  let cleanName = name;
  optionalKeywords.forEach(kw => {
    const reg = new RegExp(`\\(?,?\\s*${kw}\\s*\\)?`, 'gi');
    cleanName = cleanName.replace(reg, '');
  });
  cleanName = cleanName.trim().replace(/^-\s*/, '');

  return {
    name: cleanName || line,
    quantity: quantity === 0 ? null : quantity,
    unit: unit || null,
    optional: isOptional
  };
}

export function classifyOcrText(text: string): { ingredients: Ingredient[]; instructions: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  const ingredients: Ingredient[] = [];
  const instructions: string[] = [];

  let currentSection: 'unknown' | 'ingredients' | 'instructions' = 'unknown';

  const ingredientHeaders = ['ingredienser', 'ingredients', 'fyllning', 'topping', 'deg', 'till servering'];
  const instructionHeaders = ['gör så här', 'instruktioner', 'så här gör du', 'tillagning', 'instructions', 'steps', 'preparation', 'metod', 'gör såhär', 'work'];

  lines.forEach(line => {
    const lower = line.toLowerCase();
    
    // Check if line is a header
    if (ingredientHeaders.some(h => lower.includes(h)) && !lower.includes('steg') && !lower.includes('vispa')) {
      currentSection = 'ingredients';
      return; 
    }
    if (instructionHeaders.some(h => lower.includes(h))) {
      currentSection = 'instructions';
      return; 
    }

    const hasNumber = /^(\d+|½|¼|¾|⅓|⅔|⅛|⅜|⅝|⅞)/.test(line);
    const hasUnit = /\b(g|kg|dl|cl|ml|l|msk|tsk|krm|st|förp|burk|port|klyftor|klyfta|nypa|näve|gfp|tub|tbsp|tsp|cup|cups|oz|lb|can|pack|package|pcs|skivor|skiva)\b/i.test(line);
    
    const hasStepNumber = /^\d+[\.\s]/.test(line);
    const isLong = line.length > 55;
    
    if (currentSection === 'ingredients') {
      if (hasStepNumber || isLong) {
        instructions.push(line);
      } else {
        ingredients.push(parseIngredientLineHeuristic(line));
      }
    } else if (currentSection === 'instructions') {
      if ((hasNumber || hasUnit) && !isLong && !/^(koka|vispa|blanda|sätt|ugn|grädda|stek|hacka|strö|skär|tillsätt)/i.test(lower)) {
        ingredients.push(parseIngredientLineHeuristic(line));
      } else {
        instructions.push(line);
      }
    } else {
      if ((hasNumber || hasUnit) && !isLong && !/^(koka|vispa|blanda|sätt|ugn|grädda|stek|hacka|strö|skär|tillsätt)/i.test(lower)) {
        ingredients.push(parseIngredientLineHeuristic(line));
      } else if (line.length > 25 || hasStepNumber) {
        instructions.push(line);
      } else {
        // Short text line, classify based on content
        if (/[a-zA-Z]/.test(line)) {
          ingredients.push(parseIngredientLineHeuristic(line));
        }
      }
    }
  });

  return { 
    ingredients: ingredients.filter(i => i.name.trim() !== ''), 
    instructions: instructions.filter(s => s.trim() !== '') 
  };
}

export function cleanHtmlToText(html: string): string {
  // Remove script and style tags and their contents
  let clean = html.replace(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi, '');
  
  // Replace typical block tags with newlines
  clean = clean.replace(/<\/(div|p|li|h1|h2|h3|h4|h5|h6|tr|section|article)>/gi, '\n');
  
  // Replace <br> tags with newlines
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  
  // Strip all other HTML tags
  clean = clean.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  clean = decodeHtmlEntities(clean);
  
  // Remove excessive empty lines or spaces
  return clean
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

export function scrapeHtmlFallback(html: string, url: string) {
  let name = '';
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) name = titleMatch[1].replace(/-[^-]+$/, '').trim();

  const h1Match = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  if (h1Match) name = h1Match[1].replace(/<[^>]*>/g, '').trim();

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const contentToParse = bodyMatch ? bodyMatch[1] : html;
  const rawText = cleanHtmlToText(contentToParse);
  const classified = classifyOcrText(rawText);

  return {
    name: decodeHtmlEntities(name) || 'Scraped Recipe',
    description: null,
    image: null,
    url,
    preparationTime: 15,
    cookingTime: 20,
    servings: 4,
    cuisine: 'International',
    ingredients: classified.ingredients.length > 0 ? classified.ingredients : [{ name: '', quantity: null, unit: '', optional: false }],
    instructions: classified.instructions.length > 0 ? classified.instructions : [''],
    nutrition: {
      calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0,
      iron: 0, calcium: 0, potassium: 0, magnesium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0
    }
  };
}
