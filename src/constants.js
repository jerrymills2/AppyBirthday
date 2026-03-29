export const BLUE = "#185FA5";
export const GOLD = "#BA7517";
export const LIGHT_BLUE = "#E6F1FB";
export const LIGHT_GOLD = "#FAEEDA";
export const RED = "#E24B4A";
export const GREEN = "#3B6D11";
export const LIGHT_GREEN = "#EAF3DE";
export const PURPLE = "#534AB7";
export const LIGHT_PURPLE = "#EEEDFE";
export const PINK = "#C2185B";
export const LIGHT_PINK = "#FCE4EC";

export const LOVE_LANGUAGES = [
  "Words of Affirmation",
  "Acts of Service",
  "Receiving Gifts",
  "Quality Time",
  "Physical Touch",
];

export const GROUPS = [
  "Family",
  "Church",
  "Work",
  "Childhood Friends",
  "College Friends",
  "Neighbors",
  "Other",
];

// Relationship types with their associated holidays and icons
export const RELATIONSHIP_TYPES = [
  { label: "Wife",        icon: "💍", holidays: ["valentine", "anniversary", "mothers_day"] },
  { label: "Husband",     icon: "💍", holidays: ["valentine", "anniversary", "fathers_day"] },
  { label: "Mother",      icon: "👩", holidays: ["mothers_day"] },
  { label: "Father",      icon: "👨", holidays: ["fathers_day"] },
  { label: "Daughter",    icon: "👧", holidays: ["valentine", "daughters_day"] },
  { label: "Son",         icon: "👦", holidays: ["sons_day"] },
  { label: "Sister",      icon: "👩", holidays: ["siblings_day"] },
  { label: "Brother",     icon: "👦", holidays: ["siblings_day"] },
  { label: "Grandmother", icon: "👵", holidays: ["mothers_day", "grandparents_day"] },
  { label: "Grandfather", icon: "👴", holidays: ["fathers_day", "grandparents_day"] },
  { label: "Aunt",        icon: "👩", holidays: ["aunts_uncles_day"] },
  { label: "Uncle",       icon: "👨", holidays: ["aunts_uncles_day"] },
  { label: "Friend",      icon: "🤝", holidays: ["friendship_day"] },
  { label: "Fiancée",     icon: "💍", holidays: ["valentine"] },
  { label: "Fiancé",      icon: "💍", holidays: ["valentine"] },
  { label: "Other",       icon: "👤", holidays: [] },
];

// Calculate the Nth weekday of a given month
// weekday: 0=Sun, 1=Mon ... 6=Sat
const nthWeekday = (year, month, weekday, n) => {
  let count = 0;
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    if (date.getDay() === weekday) {
      count++;
      if (count === n) return date;
    }
  }
  return null;
};

// Returns days until a holiday for a given year (or next year if passed)
const daysUntilDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return null;
  return Math.ceil((date - today) / 86400000);
};

// Get all upcoming holiday dates for the current/next year
export const getHolidayDates = (year) => ({
  valentine:       new Date(year, 1, 14),           // Feb 14
  mothers_day:     nthWeekday(year, 4, 0, 2),       // 2nd Sunday of May
  fathers_day:     nthWeekday(year, 5, 0, 3),       // 3rd Sunday of June
  grandparents_day: nthWeekday(year, 8, 0, 1),      // 1st Sunday of September
  daughters_day:   new Date(year, 8, 25),            // Sep 25
  sons_day:        new Date(year, 2, 4),             // Mar 4
  siblings_day:    new Date(year, 3, 10),            // Apr 10
  aunts_uncles_day: new Date(year, 6, 26),           // Jul 26
  friendship_day:  nthWeekday(year, 7, 0, 1),       // 1st Sunday of August
  anniversary:     null, // handled separately via profile.anniversary
});

export const HOLIDAY_LABELS = {
  valentine:        { label: "Valentine's Day", icon: "❤️" },
  mothers_day:      { label: "Mother's Day",    icon: "🌸" },
  fathers_day:      { label: "Father's Day",    icon: "👔" },
  grandparents_day: { label: "Grandparents Day",icon: "🌟" },
  daughters_day:    { label: "Daughters Day",   icon: "🌺" },
  sons_day:         { label: "Sons Day",         icon: "⭐" },
  siblings_day:     { label: "Siblings Day",    icon: "🤝" },
  aunts_uncles_day: { label: "Aunts/Uncles Day",icon: "💛" },
  friendship_day:   { label: "Friendship Day",  icon: "🤝" },
  anniversary:      { label: "Anniversary",     icon: "💍" },
};

// Returns upcoming holiday reminders for a profile within `withinDays`
export const getHolidayReminders = (profile, withinDays = 30) => {
  if (!profile.relationshipType) return [];
  const rel = RELATIONSHIP_TYPES.find((r) => r.label === profile.relationshipType);
  if (!rel) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const reminders = [];

  rel.holidays.forEach((holidayKey) => {
    if (holidayKey === "anniversary") return; // handled by nextOcc on profile.anniversary

    // Check this year, then next year
    for (const y of [year, year + 1]) {
      const dates = getHolidayDates(y);
      const date = dates[holidayKey];
      if (!date) continue;
      date.setHours(0, 0, 0, 0);
      const days = Math.ceil((date - today) / 86400000);
      if (days >= 0 && days <= withinDays) {
        const meta = HOLIDAY_LABELS[holidayKey];
        reminders.push({
          id: profile.id,
          name: profile.name,
          type: `${meta.icon} ${meta.label}`,
          days,
          holidayKey,
          relationship: profile.relationshipType,
        });
        break; // found the nearest occurrence
      }
      if (days > withinDays) break;
    }
  });

  return reminders;
};

export const ACTIONS = [
  { label: "Phone call", points: 5, icon: "📞" },
  { label: "Letter sent", points: 10, icon: "✉️" },
  { label: "Gift sent", points: 15, icon: "🎁" },
  { label: "Coffee date", points: 20, icon: "☕" },
  { label: "Planned visit", points: 25, icon: "🗓️" },
  { label: "Prayer", points: 8, icon: "🙏" },
  { label: "Encouragement", points: 8, icon: "💛" },
];

export const LETTER_TEMPLATES = [
  { label: "Birthday", prompt: "Write a warm, heartfelt birthday letter" },
  { label: "Encouragement", prompt: "Write an uplifting encouragement letter" },
  { label: "Thank you", prompt: "Write a sincere thank-you letter" },
  { label: "Just thinking of you", prompt: "Write a casual warm letter" },
  { label: "Congratulations", prompt: "Write a congratulations letter" },
  { label: "Pastoral encouragement", prompt: "Write a pastoral letter of spiritual encouragement" },
  { label: "Valentine's Day", prompt: "Write a warm, loving Valentine's Day message" },
  { label: "Mother's Day", prompt: "Write a heartfelt Mother's Day letter" },
  { label: "Father's Day", prompt: "Write a heartfelt Father's Day letter" },
];

export const BADGES = [
  { id: "first_contact", icon: "🌱", label: "First Step", desc: "Log your first engagement", check: (ps, ls) => ls.length >= 1 },
  { id: "pen_pal", icon: "✍️", label: "Pen Pal", desc: "Send 5 letters", check: (ps, ls) => ls.filter((l) => l.action === "Letter sent").length >= 5 },
  { id: "social_butterfly", icon: "🦋", label: "Social Butterfly", desc: "Coffee dates with 5 people", check: (ps) => ps.filter((p) => (p.log || []).some((l) => l.action === "Coffee date")).length >= 5 },
  { id: "faithful_friend", icon: "🔥", label: "Faithful Friend", desc: "6-month streak with anyone", check: (ps) => ps.some((p) => p.streakMonths >= 6) },
  { id: "gift_giver", icon: "🎁", label: "Gift Giver", desc: "Send 10 gifts", check: (ps, ls) => ls.filter((l) => l.action === "Gift sent").length >= 10 },
  { id: "prayer_warrior", icon: "🙏", label: "Prayer Warrior", desc: "Log 20 prayers", check: (ps, ls) => ls.filter((l) => l.action === "Prayer").length >= 20 },
  { id: "inner_circle", icon: "👑", label: "Inner Circle", desc: "Bring someone to 200+ pts", check: (ps) => ps.some((p) => (p.score || 0) >= 200) },
  { id: "connector", icon: "🌐", label: "Connector", desc: "10 people in your network", check: (ps) => ps.length >= 10 },
  { id: "encourager", icon: "💛", label: "Encourager", desc: "Send 10 encouragements", check: (ps, ls) => ls.filter((l) => l.action === "Encouragement").length >= 10 },
  { id: "centurion", icon: "💯", label: "Centurion", desc: "Reach 100 total points", check: (ps) => ps.reduce((a, p) => a + (p.score || 0), 0) >= 100 },
];

export const TABS = [
  "Dashboard", "People", "Birthdays", "Reminders",
  "Scores", "Badges", "AI Insights", "Christmas",
  "Groups", "Letters", "Goals", "Tools",
];

export const newProfile = () => ({
  id: Date.now(),
  name: "",
  birthday: "",
  anniversary: "",
  address: "",
  interests: "",
  loveLanguage: [],
  relationshipType: "",
  groups: [],
  budget: 0,
  kids: [],
  pets: [],
  memories: [],
  log: [],
  meetings: [],
  gifts: [],
  prayers: [],
  score: 0,
  streakMonths: 0,
  lastStreakMonth: "",
  photo: null,
});

export const getTier = (sc) => {
  if (sc >= 200) return { label: "Inner Circle", color: PURPLE, bg: LIGHT_PURPLE };
  if (sc >= 100) return { label: "Close Friend", color: BLUE, bg: LIGHT_BLUE };
  if (sc >= 40) return { label: "Friend", color: GOLD, bg: LIGHT_GOLD };
  return { label: "Acquaintance", color: "#888780", bg: "#F1EFE8" };
};

export const getInitials = (n) =>
  n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

export const nextOcc = (mmdd) => {
  if (!mmdd) return null;
  const today = new Date();
  const [m, d] = mmdd.split("-").map(Number);
  let next = new Date(today.getFullYear(), m - 1, d);
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
};

export const fmtDate = (mmdd) => {
  if (!mmdd) return "";
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(2000, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric" });
};

export const daysSince = (iso) =>
  iso ? Math.round((Date.now() - new Date(iso)) / 86400000) : 999;

export const thisYear = () => new Date().getFullYear().toString();

export const decayedScore = (p) => {
  const ds = daysSince(p.log?.[0]?.date);
  if (ds > 60) return Math.max(0, (p.score || 0) - Math.floor((ds - 60) / 30) * 5);
  return p.score || 0;
};

export const profileSummary = (p) => {
  const rel = p.relationshipType ? ` Relationship: ${p.relationshipType}.` : "";
  const langs = Array.isArray(p.loveLanguage) && p.loveLanguage.length
    ? p.loveLanguage.map((ll, i) => `${i + 1}. ${ll}`).join(", ")
    : p.loveLanguage || "unknown";
  return `Name: ${p.name}.${rel} Birthday: ${fmtDate(p.birthday) || "unknown"}. Interests: ${p.interests || "unknown"}. Love languages (ranked): ${langs}. Kids: ${p.kids?.map((k) => k.name).join(",") || "none"}. Pets: ${p.pets?.map((pt) => pt.name).join(",") || "none"}. Memories: ${p.memories?.join("; ") || "none"}. Past gifts: ${p.gifts?.map((g) => g.item).join(",") || "none"}.`;
};
