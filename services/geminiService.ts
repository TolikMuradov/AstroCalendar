import { DailyInsight, UserProfile, ComparisonResult, YearlyInsight, MonthlyInsight, MonthlyDayInsight, TarotReading } from '../types';
import Constants from 'expo-constants';

const OPENAI_KEY = Constants.expoConfig?.extra?.openaiApiKey || '';
const GROQ_KEY = Constants.expoConfig?.extra?.groqApiKey || '';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callOpenAI(prompt: string, maxTokens: number = 2048) {
  if (!OPENAI_KEY) {
    console.error('OpenAI API Key is missing!');
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a mystical astrologer. Always respond with valid JSON only.' },
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

async function callGroq(prompt: string, maxTokens: number = 4096) {
  if (!GROQ_KEY) {
    console.error('Groq API Key is missing!');
    throw new Error('Groq API key not configured');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a mystical spiritual guide. Always respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
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
  if (!text) throw new Error('Empty response from Groq');

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

  const data = await callOpenAI(prompt);
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

  const data = await callOpenAI(prompt);
  return { ...data, year, locale: profile.locale, generatedAt: new Date().toISOString() };
}

export async function getPartnerComparison(userProfile: UserProfile, partnerName: string, partnerBirthDate: string): Promise<ComparisonResult> {
  const partnerYear = new Date(partnerBirthDate).getFullYear();
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const partnerAnimal = animals[(partnerYear - 4) % 12];
  const langName = userProfile.locale === 'tr' ? 'Turkish' : userProfile.locale === 'th' ? 'Thai' : 'English';

  const prompt = `Compare compatibility between ${userProfile.name} (${userProfile.computedProfile.westernZodiac.sign}, ${userProfile.computedProfile.chineseZodiac.animal}) and ${partnerName} (${partnerAnimal}).
  Language: ${langName}.
  Return ONLY valid JSON: { "harmonyScore": integer (0-100), "summary": "...", "strengths": ["...","..."], "challenges": ["...","..."] }`;

  return await callOpenAI(prompt);
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

  const data = await callGroq(prompt, 8000);
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

  return await callOpenAI(prompt, 1024);
}

export async function generateDailyTarotReading(
  profile: UserProfile, cardName: string, cardKeywords: string[]
): Promise<{ overallEnergy: string; emotionalTone: string; subtleAdvice: string }> {
  const langName = profile.locale === 'tr' ? 'Turkish' : profile.locale === 'th' ? 'Thai' : profile.locale === 'es' ? 'Spanish' : profile.locale === 'fr' ? 'French' : profile.locale === 'de' ? 'German' : profile.locale === 'ja' ? 'Japanese' : 'English';

  const prompt = `You are generating a DAILY tarot interpretation for ${profile.name}.
Keep it calm, elegant and grounded.
Avoid dramatic exaggeration.
Avoid horoscope clichés.
Speak directly to the user.
Do not predict specific events.
Focus on mindset and awareness.
180–250 words total.
Structured in 3 sections:
1) Overall Energy
2) Emotional Tone
3) Subtle Advice

Card Name: ${cardName}
Card Keywords: ${cardKeywords.join(', ')}
User Zodiac: ${profile.computedProfile.westernZodiac.sign}
Today Date: ${new Date().toISOString().split('T')[0]}
Language: ALL text in ${langName}.

Return ONLY valid JSON:
{
  "overallEnergy": "text for section 1",
  "emotionalTone": "text for section 2",
  "subtleAdvice": "text for section 3"
}`;

  return await callOpenAI(prompt, 1024);
}

function getLangName(locale: string): string {
  const map: Record<string, string> = { tr: 'Turkish', th: 'Thai', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese' };
  return map[locale] || 'English';
}

export async function generatePPFCardInterpretation(
  profile: UserProfile,
  cardName: string,
  isReversed: boolean,
  position: 'Past' | 'Present' | 'Future',
  category: string,
  readingContext?: string
): Promise<{ cardMeaning: string; personalInterpretation: string }> {
  const langName = getLangName(profile.locale);
  const orientation = isReversed ? 'Reversed' : 'Upright';
  const contextLine = readingContext ? `\nSpecific situation the user described: ${readingContext}` : '';

  const prompt = `You are an experienced fortune teller who reads tarot cards for a living. You've seen thousands of people sit across from you. You speak like a real human — warm, direct, sometimes blunt, sometimes gentle. You're not a professor or a textbook. You talk the way a wise older friend would.

Rules:
- Sound like a REAL person talking, not an encyclopedia article.
- Use short sentences mixed with longer ones. Vary your rhythm.
- You can say things like "Look...", "Here's the thing...", "This card doesn't lie...", "I won't sugarcoat this...", "You already know this deep down..."
- Be warm but honest. Don't flatter blindly.
- Don't sound like a self-help book or a horoscope column.
- No emojis. No bullet points. Just flowing, natural speech.
- Don't predict specific events. But you CAN say things like "something's been weighing on you" or "there's a pattern here you're not seeing".
- 200-300 words total across both sections.
- Address the user by name sometimes.

Card: ${cardName} (${orientation})
Position: ${position}
Category: ${category}${contextLine}
User: ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element})
Today: ${new Date().toISOString().split('T')[0]}

Language: ALL text in ${langName}. Write naturally in that language as a native speaker would speak — not translated-sounding.

Return ONLY valid JSON:
{
  "cardMeaning": "What this card traditionally means in this position and orientation — but explain it the way you'd explain it to someone sitting across from you at a dimly lit table. Not a textbook definition. Make it feel alive.",
  "personalInterpretation": "Now talk directly to the user. Be personal. Be real. Connect the card to their life, their zodiac energy, the category they chose. Don't start with generic phrases like 'For you this may reflect'. Start with something that grabs them — like you actually see something in the cards."
}`;

  return await callOpenAI(prompt, 1024);
}

export async function generatePPFFinalIntegration(
  profile: UserProfile,
  pastCardName: string,
  presentCardName: string,
  futureCardName: string,
  category: string
): Promise<{ finalIntegration: string }> {
  const langName = getLangName(profile.locale);

  const prompt = `You are an experienced fortune teller wrapping up a reading. You've just laid out three cards — Past (${pastCardName}), Present (${presentCardName}), Future (${futureCardName}) — for ${profile.name} about their ${category}.

Now tie it all together in 120-180 words. This is your closing message.

Rules:
- Talk like a real person, not a self-help book.
- Connect the three cards into one story — show the thread.
- Be honest. If the cards show tension, say it. If they show hope, let it land.
- End with something that sticks — a thought they'll carry with them.
- No emojis. No bullet points. No repeating what you already said about each card.
- Sound like you're looking the person in the eye and giving them your honest take.

Language: ALL text in ${langName}. Write like a native speaker, naturally.

Return ONLY valid JSON:
{
  "finalIntegration": "text"
}`;

  return await callOpenAI(prompt, 512);
}

export async function generateYTECardInterpretation(
  profile: UserProfile,
  cardName: string,
  isReversed: boolean,
  position: 'You' | 'Them' | 'Energy',
  personName: string,
  relationship: string
): Promise<{ cardMeaning: string; personalInterpretation: string }> {
  const langName = getLangName(profile.locale);
  const orientation = isReversed ? 'Reversed' : 'Upright';

  const positionContext = position === 'You'
    ? `This card represents ${profile.name}'s energy and role in the connection.`
    : position === 'Them'
    ? `This card represents ${personName}'s energy and role in the connection.`
    : `This card represents the energy BETWEEN ${profile.name} and ${personName} — the invisible current running through the relationship.`;

  const prompt = `You are an experienced fortune teller who reads tarot cards for a living. You've seen thousands of people sit across from you. You speak like a real human — warm, direct, sometimes blunt, sometimes gentle.

This is a RELATIONSHIP tarot reading — "You – Them – Energy" spread.
${profile.name} is asking about their connection with ${personName} (${relationship}).

${positionContext}

Rules:
- Sound like a REAL person talking, not a textbook.
- Use short sentences mixed with longer ones.
- You can say things like "Look...", "Here's the thing...", "This card doesn't lie...", "I won't sugarcoat this..."
- Be warm but honest about relationship dynamics. Don't flatter blindly.
- No emojis. No bullet points. Just flowing, natural speech.
- 200-300 words total across both sections.
- Address ${profile.name} by name sometimes.

Card: ${cardName} (${orientation})
Position: ${position === 'You' ? `You (${profile.name})` : position === 'Them' ? `Them (${personName})` : 'Energy Between'}
Relationship: ${relationship}
User: ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element})
Today: ${new Date().toISOString().split('T')[0]}

Language: ALL text in ${langName}. Write naturally as a native speaker would.

Return ONLY valid JSON:
{
  "cardMeaning": "What this card means in this position — explain it like you're talking to someone across the table. Make it about the relationship dynamic, not a generic definition.",
  "personalInterpretation": "Now talk directly to ${profile.name}. Be personal. Be real. Connect the card to their relationship with ${personName}. Start with something that grabs them."
}`;

  return await callOpenAI(prompt, 1024);
}

export async function generateYTEFinalIntegration(
  profile: UserProfile,
  youCardName: string,
  themCardName: string,
  energyCardName: string,
  personName: string,
  relationship: string
): Promise<{ finalIntegration: string }> {
  const langName = getLangName(profile.locale);

  const prompt = `You are an experienced fortune teller wrapping up a relationship reading. You've just laid out three cards — You (${youCardName}), Them (${themCardName}), Energy Between (${energyCardName}) — for ${profile.name} about their connection with ${personName} (${relationship}).

Now tie it all together in 120-180 words. This is your closing message.

Rules:
- Talk like a real person, not a self-help book.
- Connect the three cards into one story about the relationship dynamic.
- Be honest. If the cards show tension, say it. If they show deep connection, let it land.
- End with something that sticks — a thought about what this connection truly needs.
- No emojis. No bullet points. No repeating what you already said about each card.
- Sound like you're looking ${profile.name} in the eye and giving your honest take on this connection.

Language: ALL text in ${langName}. Write like a native speaker, naturally.

Return ONLY valid JSON:
{
  "finalIntegration": "text"
}`;

  return await callOpenAI(prompt, 512);
}

export async function generateLoveCardInterpretation(
  profile: UserProfile,
  cardName: string,
  isReversed: boolean,
  position: 'Heart' | 'Connection' | 'Future',
  partnerName: string
): Promise<{ cardMeaning: string; personalInterpretation: string }> {
  const langName = getLangName(profile.locale);
  const orientation = isReversed ? 'Reversed' : 'Upright';

  const positionContext = position === 'Heart'
    ? `This card represents ${profile.name}'s deepest feelings and heart energy right now.`
    : position === 'Connection'
    ? `This card represents the romantic energy flowing between ${profile.name} and ${partnerName} — the chemistry, the tension, the unspoken.`
    : `This card reveals where this love story is heading — the potential, the warning, the promise.`;

  const prompt = `You are a romantic fortune teller who specializes in LOVE readings. You've helped thousands of lovers, heartbroken souls, and hopeful romantics. You speak with warmth, passion, and honesty. Your style is intimate — like a wise friend who truly SEES people's hearts.

This is a LOVE READING — the most intimate spread you offer.
${profile.name} is asking about their romantic connection with ${partnerName}.

${positionContext}

Rules:
- Be WARM and PASSIONATE — this is about LOVE, the most powerful human force.
- Use romantic, evocative language but stay grounded and honest.
- You can say things like "Your heart already knows...", "Love doesn't lie, and neither does this card...", "There's fire here...", "I can feel the pull between you two..."
- Be honest about challenges but always with compassion.
- No emojis. No bullet points. Just flowing, heartfelt speech.
- 200-300 words total across both sections.
- Address ${profile.name} by name sometimes.

Card: ${cardName} (${orientation})
Position: ${position === 'Heart' ? 'Your Heart' : position === 'Connection' ? 'The Connection' : 'Love\'s Future'}
User: ${profile.name}, ${profile.computedProfile.westernZodiac.sign} (${profile.computedProfile.westernZodiac.element})
Today: ${new Date().toISOString().split('T')[0]}

Language: ALL text in ${langName}. Write naturally as a native speaker would.

Return ONLY valid JSON:
{
  "cardMeaning": "What this card means in the context of love — explain it intimately, like you're reading someone's heart across a candlelit table.",
  "personalInterpretation": "Now speak directly to ${profile.name} about their love life with ${partnerName}. Be personal, passionate, and real. Start with something that grabs their heart."
}`;

  return await callOpenAI(prompt, 1024);
}

export async function generateLoveFinalIntegration(
  profile: UserProfile,
  heartCardName: string,
  connectionCardName: string,
  futureCardName: string,
  partnerName: string
): Promise<{ finalIntegration: string }> {
  const langName = getLangName(profile.locale);

  const prompt = `You are a romantic fortune teller wrapping up a LOVE reading. You've just laid out three cards — Your Heart (${heartCardName}), The Connection (${connectionCardName}), Love's Future (${futureCardName}) — for ${profile.name} about their romantic connection with ${partnerName}.

Now tie it all together in 120-180 words. This is your closing love message.

Rules:
- This is about LOVE — be warm, passionate, and deeply personal.
- Connect the three cards into one love story — show how the heart, the connection, and the future weave together.
- Be honest. If the cards show heartbreak potential, say it with compassion. If they show deep love, let it bloom.
- End with something that resonates in the heart — a truth about love they'll carry with them.
- No emojis. No bullet points. No repeating what you already said about each card.
- Sound like you're holding ${profile.name}'s hands across the table, giving them your honest, loving truth.

Language: ALL text in ${langName}. Write like a native speaker, naturally.

Return ONLY valid JSON:
{
  "finalIntegration": "text"
}`;

  return await callOpenAI(prompt, 512);
}
