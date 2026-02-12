// Voice input utility functions - extracted from VoiceInput component

// Columns that the user fills via voice (skipping اليوم and التاريخ which are pre-filled)
export const COLUMNS = [
  "الخطة",
  "تاريخ التسميع الفعلي",
  "عدد الصفحات",
  "التسميع عند طالب",
  "الاستماع لشيخ",
  "التسميع المنزلي",
  "الأخطاء",
  "التقدير",
  "ملاحظات",
];

export const SEPARATOR_KEYWORD = "انتهى";
export const SEPARATOR_VARIANTS = ["انتهى", "انتهي", "انتهت", "انتها", "إنتهى", "إنتهي"];
export const SEPARATOR_REGEX = new RegExp(`(${SEPARATOR_VARIANTS.join("|")})`, "gi");

// Column indices for special processing
export const DATE_COL_INDICES = [1]; // تاريخ التسميع الفعلي
export const NUMBER_COL_INDICES = [2, 6]; // عدد الصفحات, الأخطاء
export const CHECKBOX_COL_INDICES = [3, 4, 5]; // التسميع عند طالب, الاستماع لشيخ, التسميع المنزلي
export const GRADE_COL_INDEX = 7; // التقدير
export const PLAN_COL_INDEX = 0; // الخطة (surah range)

export const GRADE_OPTIONS = ["ممتاز", "جيد جدا", "جيد جداً", "جيد", "مقبول", "لم يسمع"];

// Normalize grade variants
const GRADE_MAP: Record<string, string> = {
  "ممتاز": "ممتاز",
  "جيد جدا": "جيد جدا",
  "جيد جداً": "جيد جدا",
  "جيد": "جيد",
  "مقبول": "مقبول",
  "لم يسمع": "لم يسمع",
  "ما سمع": "لم يسمع",
  "لم يسمّع": "لم يسمع",
};

export const ARABIC_WORD_TO_NUM: Record<string, number> = {
  "واحد": 1, "اثنين": 2, "اثنان": 2, "ثلاثة": 3, "ثلاث": 3, "اربعة": 4, "أربعة": 4, "اربع": 4, "أربع": 4,
  "خمسة": 5, "خمس": 5, "ستة": 6, "ست": 6, "سبعة": 7, "سبع": 7, "ثمانية": 8, "ثماني": 8, "ثمان": 8,
  "تسعة": 9, "تسع": 9, "عشرة": 10, "عشر": 10, "احدعش": 11, "إحدعش": 11, "حداشر": 11, "احد عشر": 11, "أحد عشر": 11,
  "اثنعش": 12, "إثنعش": 12, "اطنعش": 12, "اثنا عشر": 12, "إثنا عشر": 12, "اتناشر": 12,
  "ثلاثطعش": 13, "ثلتطعش": 13, "ثلاث عشر": 13, "ثلاثة عشر": 13, "تلتاشر": 13,
  "اربعطعش": 14, "أربعطعش": 14, "اربع عشر": 14, "أربعة عشر": 14, "اربعتاشر": 14,
  "خمسطعش": 15, "خمستاشر": 15, "خمس عشر": 15, "خمسة عشر": 15,
  "ستطعش": 16, "سطعش": 16, "ست عشر": 16, "ستة عشر": 16, "ستاشر": 16,
  "سبعطعش": 17, "سبعتاشر": 17, "سبع عشر": 17, "سبعة عشر": 17,
  "ثمنطعش": 18, "تمنطعش": 18, "ثمانية عشر": 18, "تمنتاشر": 18, "ثماني عشر": 18,
  "تسعطعش": 19, "تسعتاشر": 19, "تسع عشر": 19, "تسعة عشر": 19,
  "عشرين": 20, "واحد وعشرين": 21, "اثنين وعشرين": 22, "ثلاثة وعشرين": 23,
  "اربعة وعشرين": 24, "أربعة وعشرين": 24, "خمسة وعشرين": 25, "ستة وعشرين": 26,
  "سبعة وعشرين": 27, "ثمانية وعشرين": 28, "تسعة وعشرين": 29, "ثلاثين": 30, "واحد وثلاثين": 31,
};

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

export function normalizeArabicDigits(s: string): string {
  return s.replace(/[٠-٩]/g, d => ARABIC_DIGITS[d] || d);
}

/**
 * Enhanced normalization for spoken Arabic numbers including word-to-digit conversion
 * and standard digit normalization.
 */
/**
 * Enhanced normalization for spoken Arabic numbers including word-to-digit conversion
 * and standard digit normalization.
 */
export function normalizeArabicNumbers(text: string): string {
  // 1. Convert standard Arabic/Persian digits like "١" -> "1"
  let norm = normalizeArabicDigits(text);
  
  // 2. Convert written words to digits (e.g., "خمسة" -> "5")
  // We sort keys by length to match longest phrases first (e.g. "خمسة عشر" before "خمسة")
  const sortedKeys = Object.keys(ARABIC_WORD_TO_NUM).sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    if (norm.includes(key)) {
      // Use regex with word boundaries to avoid partial replacement issues where possible, 
      // though Arabic word boundaries can be tricky. We'll use simple replacement for now 
      // as our keys are specific enough.
      const regex = new RegExp(key, "g"); 
      norm = norm.replace(regex, ARABIC_WORD_TO_NUM[key].toString());
    }
  }
  
  return norm;
}

export function spokenToDate(text: string): string {
  let t = normalizeArabicDigits(text.trim());

  const digitalMatch = t.match(/^(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?$/);
  if (digitalMatch) {
    const day = digitalMatch[1];
    const month = digitalMatch[2];
    const year = digitalMatch[3] || new Date().getFullYear().toString();
    return `${day}/${month}/${year}`;
  }

  const nums: number[] = [];
  let remaining = t;
  const sortedKeys = Object.keys(ARABIC_WORD_TO_NUM).sort((a, b) => b.length - a.length);

  let safety = 0;
  while (remaining.trim() && safety < 10) {
    safety++;
    let found = false;
    const r = remaining.trim();
    for (const key of sortedKeys) {
      if (r.startsWith(key)) {
        nums.push(ARABIC_WORD_TO_NUM[key]);
        remaining = r.slice(key.length);
        found = true;
        break;
      }
    }
    if (!found) {
      const digitMatch = r.match(/^(\d+)/);
      if (digitMatch) {
        nums.push(parseInt(digitMatch[1]));
        remaining = r.slice(digitMatch[0].length);
      } else {
        const skip = r.match(/^\S+\s*/);
        remaining = skip ? r.slice(skip[0].length) : "";
      }
    }
  }

  if (nums.length >= 2) {
    const day = nums[0];
    const month = nums[1];
    const year = nums[2] || new Date().getFullYear();
    return `${day}/${month}/${year}`;
  } else if (nums.length === 1) {
    return text;
  }

  return text;
}

const RANGE_KEYWORDS_FROM = ["من", "مِن"];
const RANGE_KEYWORDS_TO = ["إلى", "الى", "الي", "إلي", "لـ", "ل"];

export function spokenToSurahRange(text: string): string {
  let t = normalizeArabicDigits(text.trim());
  const fromPattern = RANGE_KEYWORDS_FROM.join("|");
  const toPattern = RANGE_KEYWORDS_TO.join("|");
  const regex = new RegExp(`^(.+?)\\s+(?:${fromPattern})\\s+(.+?)\\s+(?:${toPattern})\\s+(.+)$`, "i");
  const match = t.match(regex);

  if (match) {
    const surah = match[1].trim();
    const fromText = match[2].trim();
    const toText = match[3].trim();
    const fromNum = extractNumber(fromText);
    const toNum = extractNumber(toText);
    if (fromNum !== null && toNum !== null) {
      return `${surah} (${fromNum}-${toNum})`;
    }
  }

  return text;
}

export function extractNumber(text: string): number | null {
  const t = normalizeArabicDigits(text.trim());
  const digitMatch = t.match(/^(\d+)$/);
  if (digitMatch) return parseInt(digitMatch[1]);

  const sortedKeys = Object.keys(ARABIC_WORD_TO_NUM).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (t === key || t.startsWith(key)) {
      return ARABIC_WORD_TO_NUM[key];
    }
  }
  return null;
}

/** Convert spoken text to a number string (for عدد الصفحات and الأخطاء) */
export function spokenToNumber(text: string): string {
  const num = extractNumber(text);
  if (num !== null) return num.toString();
  // Try normalizing digits
  const normalized = normalizeArabicDigits(text.trim());
  const match = normalized.match(/(\d+)/);
  if (match) return match[1];
  return text;
}

/** Convert spoken text to checkbox value (for التسميع عند طالب, الاستماع لشيخ, التسميع المنزلي) */
export function spokenToCheckbox(text: string): string {
  const t = text.trim();
  const doneVariants = ["تم", "تمّ", "نعم", "اه", "أه", "ايوا", "أيوا", "صح", "تمام"];
  const notDoneVariants = ["لا", "لم يتم", "لم", "ما تم", "لسا", "لسه"];
  
  for (const v of notDoneVariants) {
    if (t === v || t.includes(v)) return "FALSE";
  }
  for (const v of doneVariants) {
    if (t === v || t.includes(v)) return "TRUE";
  }
  return text;
}

/** Convert spoken text to grade (for التقدير) */
export function spokenToGrade(text: string): string {
  const t = text.trim();
  // Try exact and partial matching
  const sortedKeys = Object.keys(GRADE_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (t === key || t.includes(key)) {
      return GRADE_MAP[key];
    }
  }
  return text;
}
/**
 * Clean transcript by removing fillers, duplicates, and noise
 */
export function cleanArabicTranscript(text: string): string {
  if (!text) return "";
  
  // 1. Remove filler words
  const fillers = ["آ", "آآ", "امم", "مم", "ها", "ضحك", "كحة", "سعال", "اه", "أه", "إه"];
  // Create a regex to match fillers as whole words
  const fillerRegex = new RegExp(`\\b(${fillers.join("|")})\\b`, "gi");
  let clean = text.replace(fillerRegex, " ");

  // 2. Remove duplicated consecutive words (e.g., "نعم نعم" -> "نعم")
  clean = clean.replace(/\b(\S+)\s+\1\b/g, "$1");

  // 3. Split into tokens to filter short ones
  // We keep digits even if length is 1 (e.g. "1", "5")
  // We remove anything else with length < 2
  const tokens = clean.split(/\s+/).filter(w => {
    const trimmed = w.trim();
    if (!trimmed) return false;
    
    // Always keep numbers (English or Arabic digits)
    if (/^[\d٠-٩]+$/.test(trimmed)) return true;
    
    // Keep words with 2 or more characters
    return trimmed.length >= 2;
  });

  return tokens.join(" ").trim();
}
