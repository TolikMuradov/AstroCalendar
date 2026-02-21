
import { ComputedProfile, DailyInsight, UserProfile, YearlyInsight } from '../types';

export const getWesternZodiac = (date: string) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", element: "Fire" };
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Taurus", element: "Earth" };
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Gemini", element: "Air" };
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cancer", element: "Water" };
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", element: "Fire" };
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", element: "Earth" };
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", element: "Air" };
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Scorpio", element: "Water" };
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagittarius", element: "Fire" };
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricorn", element: "Earth" };
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Aquarius", element: "Air" };
  return { sign: "Pisces", element: "Water" };
};

export const getChineseZodiac = (year: number) => {
  const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const elements = ["Metal", "Metal", "Water", "Water", "Wood", "Wood", "Fire", "Fire", "Earth", "Earth"];
  const animal = animals[(year - 4) % 12];
  const element = elements[year % 10];
  const yinYang = year % 2 === 0 ? "Yang" : "Yin";
  return { animal, element, yinYang };
};

// Get the zodiac animal for the current year (for yearly forecast heading)
export const getCurrentYearAnimal = (): string => {
  const year = new Date().getFullYear();
  const animals = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  return animals[(year - 4) % 12];
};

export const getChineseAnimalIcon = (animal: string) => {
  const icons: any = {
    Rat: "🐀", Ox: "🐂", Tiger: "🐅", Rabbit: "🐇", Dragon: "🐉", 
    Snake: "🐍", Horse: "🐎", Goat: "🐐", Monkey: "🐒", Rooster: "🐓", 
    Dog: "🐕", Pig: "🐖"
  };
  return icons[animal] || "🏮";
};

export const computeProfile = (birthDate: string): ComputedProfile => {
  const year = new Date(birthDate).getFullYear();
  return {
    westernZodiac: getWesternZodiac(birthDate),
    chineseZodiac: getChineseZodiac(year)
  };
};

export const getElementTrait = (element: string, locale: string) => {
  const traits: any = {
    tr: { Fire: "Canlılık", Earth: "Denge", Air: "Zihin", Water: "Sezgi" },
    th: { Fire: "ชีวิตชีวา", Earth: "เสถียรภาพ", Air: "ปัญญา", Water: "สัญชาต" },
    en: { Fire: "Vitality", Earth: "Stability", Air: "Intellect", Water: "Intuition" }
  };
  return traits[locale]?.[element] || traits['en']?.[element] || "";
};

export const getZodiacIcon = (sign: string) => {
  const icons: any = {
    Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
    Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
    Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓"
  };
  return icons[sign] || "✨";
};

export const getFallbackDailyInsight = (profile: UserProfile, date: string): DailyInsight => {
  const dayInt = new Date(date).getDate();
  const monthInt = new Date(date).getMonth();
  const seed = (dayInt + monthInt + profile.name.length + profile.birthDate.length) % 10;
  
  const pool = profile.locale === 'tr' ? {
    titles: ["Göklerin Rehberliği", "İçsel Pusula", "Aura Senkronu", "Yıldız Işığı", "Element Uyanışı"],
    descriptions: {
      Fire: "Bugün içindeki ateş parlıyor. Enerjini yeni projelere ve cesur adımlara yönlendir.",
      Earth: "Köklerine dönme vakti. Pratik çözümler ve sabır bugün senin en büyük gücün.",
      Air: "Fikirlerin rüzgar gibi esiyor. İletişim kanallarını açık tut, mucizeler fısıltılarda saklı.",
      Water: "Duyguların derin bir okyanus gibi. Sezgilerine güven, su akar yolunu bulur."
    }
  } : profile.locale === 'th' ? {
    titles: ["แนวทางจากท้องฟ้า", "เข็มทิศด้านใน", "ซิงค์ออร่า", "ปัญญาแสงดาว", "การตื่นตัวขององค์ประกอบ"],
    descriptions: {
      Fire: "ไฟของคุณวันนี้ช่วยให้เสพแรง มุ่งพลังงานนี้ไปสู่ขั้นตอนที่กล้าหาญและการลงทุนใหม่",
      Earth: "ถึงเวลาที่จะยึดติดตัวเอง ความอดทน และขั้นตอนที่ตามตัวเป็นสำนักหีบของคุณวันนี้",
      Air: "ความคิดไหลเหมือนลม ให้ช่องทางการสื่อสารของคุณเปิด",
      Water: "อารมณ์ของคุณเหมือนมหาสมุทรลึก เชื่อใจสัญชาตญาณของคุณ น้ำรู้วิธีการไป"
    }
  } : {
    titles: ["Celestial Guide", "Inner Compass", "Aura Sync", "Starlight Wisdom", "Elemental Awakening"],
    descriptions: {
      Fire: "Your inner fire is burning bright. Direct this energy toward bold steps.",
      Earth: "Time to ground yourself. Patience and practical steps are your superpowers today.",
      Air: "Thoughts flow like the wind. Keep communication channels open.",
      Water: "Emotions are like a deep ocean. Trust your intuition; the water knows the way."
    }
  };

  const element = profile.computedProfile.westernZodiac.element as keyof typeof pool.descriptions;
  
  return {
    date,
    locale: profile.locale,
    energyScore: 65 + (seed * 3.5),
    title: pool.titles[seed % pool.titles.length],
    description: pool.descriptions[element],
    color: seed % 2 === 0 ? "Royal Purple" : "Emerald Green",
    luckyNumbers: [(seed * 7) % 99 + 1, (seed * 13) % 99 + 1, (seed * 22) % 99 + 1],
    focusOn: [],
    avoid: [],
    ritual: {
      title: profile.locale === 'tr' ? "Günün Ritüeli" : profile.locale === 'th' ? "พิธีประจำวัน" : "Today's Ritual",
      steps: profile.locale === 'tr' ? [
        "3 derin nefes al ve şiddeti bırak",
        "Bugün için bir niyet belirle (başarı, sevgi, huzur)",
        "Dışarı çık ve 5 dakika doğada zaman geçir",
        "Kendine teşekkür et ve bir hoşlanmışlığını yazıp dikra et",
        "Günü başlatmaya hazır olun, kendine güven"
      ] : profile.locale === 'th' ? [
        "หายใจลึก 3 ครั้งและปล่อยความตึงเครียด",
        "กำหนด 'เจตนา' สำหรับวันนี้ (ความสำเร็จ ความรักหรือสันติภาพ)",
        "ออกไปข้างนอกและใช้เวลา 5 นาทีในธรรมชาติ",
        "ให้เกียรติตัวเองและเขียนสิ่งที่คุณขอบคุณ",
        "เริ่มวันของคุณด้วยความมั่นใจ"
      ] : [
        "Take 3 deep breaths and release tension",
        "Set an intention for today (success, love, peace)",
        "Step outside and spend 5 minutes in nature",
        "Write or say one thing you're grateful for",
        "Begin your day with confidence and self-belief"
      ]
    },
    generatedAt: new Date().toISOString()
  };
};

export const getFallbackYearlyInsight = (profile: UserProfile, year: number): YearlyInsight => {
  const seed = (year + profile.birthDate.length) % 5;
  const isTr = profile.locale === 'tr';
  const isTh = profile.locale === 'th';
  
  return {
    year,
    locale: profile.locale,
    theme: isTr ? "Ruhsal Genişleme ve Yeni Temeller" : isTh ? "การขยายตัวทางจิตใจและรากฐานใหม่" : "Spiritual Expansion & New Foundations",
    strengths: isTr ? ["Yaratıcılık", "Dayanıklılık", "Netlik"] : isTh ? ["ความสร้างสรรค์", "ความยืดหยุ่น", "ความชัดเจน"] : ["Creativity", "Resilience", "Clarity"],
    challenges: isTr ? ["Sabırsızlık", "Aşırı Analiz"] : isTh ? ["ความไม่อดทน", "การวิเคราะห์มากเกินไป"] : ["Impatience", "Over-analysis"],
    recommendations: isTr ? ["Meditasyon yap", "Doğada vakit geçir"] : isTh ? ["ทำสมาธิ", "ใช้เวลาในธรรมชาติ"] : ["Meditate", "Spend time in nature"],
    generatedAt: new Date().toISOString()
  };
};
