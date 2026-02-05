
import { DailyInsight, UserProfile, ComparisonResult, YearlyInsight, MonthlyInsight, MonthlyDayInsight } from "../types";

// Using Groq API (FREE, fast, reliable!)
const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callAI(prompt: string, maxTokens: number = 2048) {
  if (!API_KEY) {
    console.error("Groq API Key is missing! Add VITE_GROQ_API_KEY to .env.local");
    throw new Error("VITE_GROQ_API_KEY not configured");
  }

  try {
    console.log("Requesting AI insight from Groq...");
    
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: "You are a mystical astrologer. Always respond with valid JSON only. No markdown, no explanation, just pure JSON." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Error:", errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      throw new Error("Empty response from Groq");
    }

    console.log("AI Response received:", text.substring(0, 100) + "...");
    
    // Clean up potential markdown formatting
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
    
  } catch (error: any) {
    console.error("AI Generation Error:", error.message);
    throw error;
  }
}


export async function generateDailyInsight(profile: UserProfile, date: string): Promise<DailyInsight> {
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';
  const prompt = `You are a mystical astrologer. Generate a daily insight JSON for ${profile.name}, a ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element} element) and ${profile.computedProfile.chineseZodiac.animal}. 
  Language: ${langName} for all text fields (title, desc, ritual names and steps).
  Date: ${date}.
  
  Return ONLY valid JSON with this exact structure:
  {
    "score": integer (0-100),
    "title": "A highly mystical, poetic title",
    "desc": "A LONG, detailed, and profound daily horoscope (approx. 80-120 words). It MUST speak directly to the user about their specific energy today, potential challenges, emotional state, and opportunities. Do not be generic. Make it feel magical and personal.",
    "color": "Lucky color name in ENGLISH ONLY (e.g., 'Red', 'Emerald Green', 'Sapphire Blue', 'Golden', 'Lavender')",
    "luckyNumbers": [3 unique integers between 1-99],
    "ritual": { "title": "Ritual name", "steps": ["Detailed Step 1", "Detailed Step 2", "Detailed Step 3"] }
  }`;

  const data = await callAI(prompt);
  
  return {
    energyScore: data.score,
    title: data.title,
    description: data.desc,
    color: data.color,
    luckyNumbers: data.luckyNumbers,
    focusOn: [],
    avoid: [],
    ritual: data.ritual,
    date,
    locale: profile.locale,
    generatedAt: new Date().toISOString()
  };
}

export async function generateYearlyInsight(profile: UserProfile, year: number): Promise<YearlyInsight> {
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';
  const prompt = `Generate a yearly forecast for ${year} for a ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element}) and ${profile.computedProfile.chineseZodiac.animal}.
  Language: ${langName}.
  
  Return ONLY valid JSON with this exact structure:
  {
    "theme": "Overarching theme for the year",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "challenges": ["Challenge 1", "Challenge 2"],
    "recommendations": ["Advice 1", "Advice 2"]
  }`;

  const data = await callAI(prompt);
  return { ...data, year, locale: profile.locale, generatedAt: new Date().toISOString() };
}

export async function getPartnerComparison(userProfile: UserProfile, partnerName: string, partnerBirthDate: string): Promise<ComparisonResult> {
  const partnerYear = new Date(partnerBirthDate).getFullYear();
  const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const partnerAnimal = animals[(partnerYear - 4) % 12];
  const langName = userProfile.locale === 'tr' ? 'Turkish' : userProfile.locale === 'th' ? 'Thai' : 'English';

  const prompt = `Compare compatibility between ${userProfile.name} (${userProfile.computedProfile.westernZodiac.sign}, ${userProfile.computedProfile.chineseZodiac.animal}) and ${partnerName} (${partnerAnimal}).
  Language: ${langName}.
  
  Return ONLY valid JSON with this exact structure:
  {
    "harmonyScore": integer (0-100),
    "summary": "Short mystical relationship summary",
    "strengths": ["Strength 1", "Strength 2"],
    "challenges": ["Challenge 1", "Challenge 2"]
  }`;

  return await callAI(prompt);
}

// Generate entire month's spiritual calendar (1 AI request per month per user)
export async function generateMonthlyInsight(profile: UserProfile, year: number, month: number): Promise<MonthlyInsight> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString(profile.locale === 'tr' ? 'tr-TR' : profile.locale === 'th' ? 'th-TH' : 'en-US', { month: 'long' });
  
  // Determine weekends for the month
  const weekendDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) weekendDays.push(d);
  }

  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';
  
  const prompt = `You are a mystical spiritual guide and astrologer. Generate a COMPLETE monthly spiritual calendar for ${monthName} ${year}.
Person: ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element} element), Chinese zodiac: ${profile.computedProfile.chineseZodiac.animal}.
Language: ALL text must be in ${langName}.

IMPORTANT GUIDELINES:
- Create meaningful, non-overwhelming daily rituals that feel achievable
- Use a gentle, psychological, supportive tone - like a caring spiritual friend
- Weekends (days: ${weekendDays.join(', ')}) should have either "rest at home" or "go outside" suggestions
- For drinks: suggest herbal teas, water infusions, smoothies, warm milk with spices (NEVER suggest meat or heavy foods)
- Stones should be real crystals with genuine metaphysical properties
- Colors should vary throughout the month
- Day types should follow a balanced rhythm: not too many "action" days in a row, mix in "rest" and "reflection"
- Affirmations should be personal, empowering, and brief
- IMPORTANT: wearColor MUST ALWAYS be in ENGLISH regardless of language setting (e.g., "Green", "Royal Blue", "Coral", "Lavender")

Return ONLY valid JSON with this exact structure:
{
  "monthTheme": "An inspiring theme for ${monthName} (15-25 words)",
  "days": [
    {
      "day": 1,
      "dayType": "cleansing|manifestation|rest|action|reflection|social|gratitude|creativity",
      "message": "A warm, personal spiritual message for this day (30-50 words). Speak directly to the person.",
      "stone": "Crystal/stone name in ENGLISH",
      "stoneEnergy": "Brief explanation of what this stone brings today (10-15 words)",
      "activity": "A simple, achievable activity suggestion",
      "drink": "A specific drink recommendation (herbal tea, water infusion, etc)",
      "wearColor": "Color name in ENGLISH ONLY (e.g., 'Green', 'Navy Blue', 'Coral Pink')",
      "affirmation": "A short, powerful I-statement affirmation",
      "isWeekend": false,
      "weekendTip": null
    }
    ... repeat for all ${daysInMonth} days
  ]
}

CRITICAL: Generate exactly ${daysInMonth} day objects (day 1 to ${daysInMonth}). Weekend days (${weekendDays.join(', ')}) must have isWeekend: true and weekendTip with either a "stay home and..." or "go out and..." suggestion.`;

  const data = await callAI(prompt, 8000); // Larger token limit for full month
  
  // Ensure isWeekend flags are correct
  const days: MonthlyDayInsight[] = data.days.map((d: any, index: number) => ({
    day: d.day || index + 1,
    dayType: d.dayType || 'reflection',
    message: d.message || '',
    stone: d.stone || 'Clear Quartz',
    stoneEnergy: d.stoneEnergy || '',
    activity: d.activity || '',
    drink: d.drink || 'Warm water with lemon',
    wearColor: d.wearColor || 'White',
    affirmation: d.affirmation || '',
    isWeekend: weekendDays.includes(d.day || index + 1),
    weekendTip: weekendDays.includes(d.day || index + 1) ? (d.weekendTip || 'Rest and recharge') : undefined
  }));

  return {
    year,
    month,
    locale: profile.locale,
    monthTheme: data.monthTheme || `A month of growth and discovery`,
    days,
    generatedAt: new Date().toISOString()
  };
}
