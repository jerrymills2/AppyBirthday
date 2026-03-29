export const BLUE = "#185FA5";
export const GOLD = "#BA7517";
export const LIGHT_BLUE = "#E6F1FB";
export const LIGHT_GOLD = "#FAEEDA";
export const RED = "#E24B4A";
export const GREEN = "#3B6D11";
export const LIGHT_GREEN = "#EAF3DE";
export const PURPLE = "#534AB7";
export const LIGHT_PURPLE = "#EEEDFE";

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

export const profileSummary = (p) =>
  `Name: ${p.name}. Birthday: ${fmtDate(p.birthday) || "unknown"}. Interests: ${p.interests || "unknown"}. Love languages (ranked): ${Array.isArray(p.loveLanguage) && p.loveLanguage.length ? p.loveLanguage.map((ll, i) => `${i + 1}. ${ll}`).join(", ") : p.loveLanguage || "unknown"}. Kids: ${p.kids?.map((k) => k.name).join(",") || "none"}. Pets: ${p.pets?.map((pt) => pt.name).join(",") || "none"}. Memories: ${p.memories?.join("; ") || "none"}. Past gifts: ${p.gifts?.map((g) => g.item).join(",") || "none"}.`;
