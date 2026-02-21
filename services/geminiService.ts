import { DailyInsight, UserProfile, ComparisonResult, YearlyInsight, MonthlyInsight, MonthlyDayInsight, TarotReading } from '../types';
import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function callAI(prompt: string, maxTokens: number = 2048) {
  if (!API_KEY) {
    console.error('OpenAI API Key is missing! Add VITE_OPENAI_API_KEY to .env.local');
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a mystical astrologer. Always respond with valid JSON only. No markdown, no explanation, just pure JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');

  const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
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
    "ritual": { "title": "Ritual name", "steps": ["Meaningful Step 1 - uplifting and achievable (15-20 words)", "Meaningful Step 2 - builds on step 1", "Meaningful Step 3 - deepens the experience", "Meaningful Step 4 - brings joy and gratitude", "Meaningful Step 5 - empowering affirmation to close"] }
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
    generatedAt: new Date().toISOString(),
  };
}

export async function generateYearlyInsight(profile: UserProfile, year: number): Promise<YearlyInsight> {
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';
  const prompt = `Generate a yearly forecast for ${year} for a ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element}) and ${profile.computedProfile.chineseZodiac.animal}.
  Language: ${langName}.
  Return ONLY valid JSON: { "theme": "...", "strengths": ["...","...","..."], "challenges": ["...","..."], "recommendations": ["...","..."] }`;

  const data = await callAI(prompt);
  return { ...data, year, locale: profile.locale, generatedAt: new Date().toISOString() };
}

export async function getPartnerComparison(userProfile: UserProfile, partnerName: string, partnerBirthDate: string): Promise<ComparisonResult> {
  const partnerYear = new Date(partnerBirthDate).getFullYear();
  const animals = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  const partnerAnimal = animals[(partnerYear - 4) % 12];
  const langName = userProfile.locale === 'tr' ? 'Turkish' : userProfile.locale === 'th' ? 'Thai' : 'English';

  const prompt = `Compare compatibility between ${userProfile.name} (${userProfile.computedProfile.westernZodiac.sign}, ${userProfile.computedProfile.chineseZodiac.animal}) and ${partnerName} (${partnerAnimal}).
  Language: ${langName}.
  Return ONLY valid JSON: { "harmonyScore": integer (0-100), "summary": "...", "strengths": ["...","..."], "challenges": ["...","..."] }`;

  return await callAI(prompt);
}

export async function generateMonthlyInsight(profile: UserProfile, year: number, month: number): Promise<MonthlyInsight> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthName = new Date(year, month - 1).toLocaleDateString(
    profile.locale === 'tr' ? 'tr-TR' : profile.locale === 'th' ? 'th-TH' : 'en-US',
    { month: 'long' }
  );
  const weekendDays: number[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) weekendDays.push(d);
  }
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';

  const prompt = `You are a mystical spiritual guide. Generate a COMPLETE monthly spiritual calendar for ${monthName} ${year}.
Person: ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element}), Chinese: ${profile.computedProfile.chineseZodiac.animal}.
Language: ALL text in ${langName}. wearColor MUST ALWAYS be in ENGLISH.
Weekends: days ${weekendDays.join(', ')}.
Return JSON: { "monthTheme": "...", "days": [{ "day": 1, "dayType": "cleansing|manifestation|rest|action|reflection|social|gratitude|creativity", "message": "30-50 words", "stone": "Crystal name EN", "stoneEnergy": "10-15 words", "activity": "...", "drink": "herbal tea/water/smoothie", "wearColor": "Color EN", "affirmation": "I-statement", "isWeekend": false, "weekendTip": null }...] }
Generate exactly ${daysInMonth} days. Weekend days must have isWeekend:true and weekendTip.`;

  const data = await callAI(prompt, 8000);
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
    weekendTip: weekendDays.includes(d.day || index + 1) ? (d.weekendTip || 'Rest and recharge') : undefined,
  }));

  return { year, month, locale: profile.locale, monthTheme: data.monthTheme || 'A month of growth', days, generatedAt: new Date().toISOString() };
}

export async function generateTarotReading(
  profile: UserProfile, cardName: string, cardKeywords: string[], isReversed: boolean, arcana: string, suit?: string
): Promise<{ interpretation: string; guidance: string; affirmation: string }> {
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : 'English';
  const position = isReversed ? 'REVERSED' : 'UPRIGHT';
  const suitInfo = suit ? `Suit: ${suit}.` : '';

  const prompt = `Interpret a tarot card for ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element}), Chinese: ${profile.computedProfile.chineseZodiac.animal}.
Card: ${cardName} (${position}). Arcana: ${arcana}. ${suitInfo} Keywords: ${cardKeywords.join(', ')}.
Language: ALL text in ${langName}. Today: ${new Date().toISOString().split('T')[0]}.
Return JSON: { "interpretation": "80-120 words personal reading", "guidance": "40-60 words guidance", "affirmation": "one I-statement" }`;

  return await callAI(prompt, 1024);
}
