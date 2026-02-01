/**
 * Auto-categorization logic for Dutch vocabulary
 * This module categorizes words based on their meaning and context
 */

export interface CategoryRule {
  categories: string[];
  keywords: string[];
  dutchKeywords?: string[];
}

// Comprehensive categorization rules
const CATEGORY_RULES: CategoryRule[] = [
  // Food & Dining
  {
    categories: ["food", "dining"],
    keywords: [
      "eat", "drink", "food", "meal", "breakfast", "lunch", "dinner",
      "hungry", "thirsty", "taste", "cook", "restaurant", "menu", "order",
      "dish", "soup", "salad", "meat", "fish", "vegetable", "fruit",
      "bread", "cheese", "milk", "coffee", "tea", "water", "wine", "beer"
    ],
    dutchKeywords: [
      "eten", "drinken", "voedsel", "maaltijd", "ontbijt", "lunch", "diner",
      "honger", "dorst", "smaak", "koken", "restaurant", "menu", "bestellen"
    ]
  },

  // Work & Career
  {
    categories: ["work", "career"],
    keywords: [
      "work", "job", "career", "office", "meeting", "colleague", "boss",
      "employee", "salary", "contract", "interview", "company", "business",
      "project", "deadline", "email", "report", "presentation"
    ],
    dutchKeywords: [
      "werk", "baan", "carrière", "kantoor", "vergadering", "collega",
      "baas", "werknemer", "salaris", "contract", "sollicitatie"
    ]
  },

  // Travel & Transportation
  {
    categories: ["travel", "transport"],
    keywords: [
      "travel", "trip", "journey", "vacation", "holiday", "airport", "flight",
      "train", "bus", "bike", "car", "taxi", "metro", "station", "ticket",
      "passport", "luggage", "hotel", "booking", "destination"
    ],
    dutchKeywords: [
      "reizen", "reis", "vakantie", "vliegveld", "vlucht", "trein",
      "bus", "fiets", "auto", "station", "kaartje", "hotel"
    ]
  },

  // Home & Housing
  {
    categories: ["home", "housing"],
    keywords: [
      "home", "house", "apartment", "room", "kitchen", "bedroom", "bathroom",
      "living room", "furniture", "rent", "landlord", "neighbor", "address",
      "door", "window", "floor", "ceiling", "wall", "bed", "table", "chair"
    ],
    dutchKeywords: [
      "huis", "woning", "appartement", "kamer", "keuken", "slaapkamer",
      "badkamer", "woonkamer", "huur", "huisbaas", "buur", "adres"
    ]
  },

  // Health & Medical
  {
    categories: ["health", "medical"],
    keywords: [
      "health", "doctor", "hospital", "medicine", "pharmacy", "sick", "ill",
      "pain", "headache", "fever", "cold", "cough", "appointment", "treatment",
      "insurance", "prescription", "emergency", "ambulance"
    ],
    dutchKeywords: [
      "gezondheid", "dokter", "ziekenhuis", "medicijn", "apotheek",
      "ziek", "pijn", "hoofdpijn", "koorts", "verkouden", "afspraak"
    ]
  },

  // Education & School
  {
    categories: ["education", "school"],
    keywords: [
      "school", "student", "teacher", "class", "lesson", "study", "learn",
      "exam", "test", "homework", "book", "university", "course", "degree",
      "education", "knowledge", "read", "write", "practice"
    ],
    dutchKeywords: [
      "school", "student", "leraar", "les", "studeren", "leren",
      "examen", "huiswerk", "boek", "universiteit", "opleiding"
    ]
  },

  // Shopping & Money
  {
    categories: ["shopping", "money"],
    keywords: [
      "shop", "store", "buy", "sell", "price", "cost", "cheap", "expensive",
      "money", "pay", "cash", "card", "bank", "account", "euro", "receipt",
      "discount", "sale", "market", "supermarket"
    ],
    dutchKeywords: [
      "winkel", "kopen", "verkopen", "prijs", "kosten", "goedkoop",
      "duur", "geld", "betalen", "pinnen", "bank", "euro", "korting"
    ]
  },

  // Time & Calendar
  {
    categories: ["time", "calendar"],
    keywords: [
      "time", "hour", "minute", "day", "week", "month", "year", "today",
      "tomorrow", "yesterday", "morning", "afternoon", "evening", "night",
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
      "January", "February", "March", "April", "May", "June", "July", "August",
      "September", "October", "November", "December"
    ],
    dutchKeywords: [
      "tijd", "uur", "minuut", "dag", "week", "maand", "jaar", "vandaag",
      "morgen", "gisteren", "ochtend", "middag", "avond", "nacht"
    ]
  },

  // Social & Communication
  {
    categories: ["social", "communication"],
    keywords: [
      "friend", "family", "mother", "father", "sister", "brother", "child",
      "talk", "speak", "conversation", "phone", "call", "message", "email",
      "meet", "visit", "party", "celebration", "birthday", "wedding"
    ],
    dutchKeywords: [
      "vriend", "familie", "moeder", "vader", "zus", "broer", "kind",
      "praten", "spreken", "gesprek", "telefoon", "bellen", "bericht"
    ]
  },

  // Weather & Nature
  {
    categories: ["weather", "nature"],
    keywords: [
      "weather", "sun", "rain", "snow", "wind", "cloud", "temperature",
      "hot", "cold", "warm", "cool", "tree", "flower", "plant", "park",
      "garden", "forest", "river", "sea", "mountain", "animal", "bird"
    ],
    dutchKeywords: [
      "weer", "zon", "regen", "sneeuw", "wind", "wolk", "temperatuur",
      "warm", "koud", "boom", "bloem", "park", "tuin", "dier", "vogel"
    ]
  },

  // Numbers & Counting
  {
    categories: ["numbers", "counting"],
    keywords: [
      "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
      "number", "count", "first", "second", "third", "many", "few", "some", "all"
    ],
    dutchKeywords: [
      "een", "twee", "drie", "vier", "vijf", "zes", "zeven", "acht", "negen", "tien",
      "aantal", "tellen", "eerste", "tweede", "veel", "weinig"
    ]
  },

  // Emotions & Feelings
  {
    categories: ["emotions", "feelings"],
    keywords: [
      "happy", "sad", "angry", "excited", "tired", "bored", "interested",
      "love", "hate", "like", "dislike", "feel", "emotion", "mood",
      "scared", "afraid", "worried", "calm", "relaxed"
    ],
    dutchKeywords: [
      "blij", "verdrietig", "boos", "moe", "verveeld", "geïnteresseerd",
      "liefde", "haten", "houden van", "voelen", "gevoel", "bang", "rustig"
    ]
  },

  // Government & Official
  {
    categories: ["government", "official"],
    keywords: [
      "government", "city hall", "municipality", "official", "document",
      "registration", "visa", "permit", "passport", "ID", "tax", "law",
      "police", "fine", "form", "application"
    ],
    dutchKeywords: [
      "overheid", "gemeente", "stadhuis", "officieel", "document",
      "registratie", "visum", "vergunning", "paspoort", "belasting"
    ]
  },

  // Clothing & Appearance
  {
    categories: ["clothing", "appearance"],
    keywords: [
      "clothes", "shirt", "pants", "dress", "shoes", "hat", "jacket",
      "wear", "color", "size", "small", "large", "fashion", "style"
    ],
    dutchKeywords: [
      "kleding", "shirt", "broek", "jurk", "schoenen", "jas",
      "dragen", "kleur", "maat", "klein", "groot", "mode"
    ]
  },

  // Technology & Internet
  {
    categories: ["technology", "internet"],
    keywords: [
      "computer", "internet", "website", "email", "phone", "mobile",
      "app", "software", "online", "download", "upload", "wifi",
      "password", "login", "digital", "screen", "keyboard"
    ],
    dutchKeywords: [
      "computer", "internet", "website", "telefoon", "mobiel",
      "app", "online", "downloaden", "wifi", "wachtwoord"
    ]
  }
];

/**
 * Auto-categorize a word based on its Dutch and English text
 */
export function autoCategorize(
  dutch: string,
  english: string,
  existingCategories: string[] = []
): string[] {
  // If categories already exist, return them
  if (existingCategories && existingCategories.length > 0) {
    return existingCategories;
  }

  const categories = new Set<string>();
  const searchText = `${dutch.toLowerCase()} ${english.toLowerCase()}`;

  // Check each rule
  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;

    // Check English keywords
    for (const keyword of rule.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Check Dutch keywords
    if (rule.dutchKeywords) {
      for (const keyword of rule.dutchKeywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }
    }

    // If we have matches, add the categories
    if (matchCount > 0) {
      rule.categories.forEach(cat => categories.add(cat));
    }
  }

  // Return array of categories, or ["general"] if none found
  return categories.size > 0 ? Array.from(categories) : ["general"];
}

/**
 * Suggest additional categories for a word based on its context
 */
export function suggestCategories(
  dutch: string,
  english: string,
  example?: string
): string[] {
  const searchText = `${dutch.toLowerCase()} ${english.toLowerCase()} ${
    example?.toLowerCase() || ""
  }`;

  const suggestions = new Set<string>();

  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;

    // Check all keywords
    const allKeywords = [
      ...rule.keywords,
      ...(rule.dutchKeywords || [])
    ];

    for (const keyword of allKeywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }

    // Suggest if there are 2+ matches
    if (matchCount >= 2) {
      rule.categories.forEach(cat => suggestions.add(cat));
    }
  }

  return Array.from(suggestions);
}

/**
 * Get all available categories
 */
export function getAllCategories(): string[] {
  const categories = new Set<string>();
  CATEGORY_RULES.forEach(rule => {
    rule.categories.forEach(cat => categories.add(cat));
  });
  return Array.from(categories).sort();
}
