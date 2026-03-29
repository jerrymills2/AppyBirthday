import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("appybday.db");

export const initDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      name TEXT, birthday TEXT, anniversary TEXT,
      address TEXT, interests TEXT, loveLanguage TEXT,
      groups TEXT, budget REAL, photo TEXT,
      score INTEGER DEFAULT 0,
      streakMonths INTEGER DEFAULT 0,
      lastStreakMonth TEXT
    );
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, date TEXT, action TEXT,
      points INTEGER, note TEXT
    );
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, item TEXT, date TEXT, occasion TEXT
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, date TEXT, type TEXT,
      notes TEXT, upcoming INTEGER
    );
    CREATE TABLE IF NOT EXISTS prayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, date TEXT, note TEXT
    );
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT, target INTEGER,
      personId INTEGER, period TEXT
    );
    CREATE TABLE IF NOT EXISTS kids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, name TEXT, birthday TEXT
    );
    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, name TEXT, type TEXT
    );
    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profileId INTEGER, memory TEXT
    );
  `);
};

export const getAllProfiles = () => {
  const rows = db.getAllSync("SELECT * FROM profiles ORDER BY score DESC");
  return rows.map((p) => ({
    ...p,
    groups: tryParse(p.groups, []),
    loveLanguage: tryParse(p.loveLanguage, []),
    log: getLogsForProfileSync(p.id),
    kids: db.getAllSync("SELECT * FROM kids WHERE profileId=?", [p.id]),
    pets: db.getAllSync("SELECT * FROM pets WHERE profileId=?", [p.id]),
    gifts: db.getAllSync("SELECT * FROM gifts WHERE profileId=?", [p.id]),
    prayers: db.getAllSync("SELECT * FROM prayers WHERE profileId=? ORDER BY date DESC LIMIT 20", [p.id]),
    meetings: db.getAllSync("SELECT * FROM meetings WHERE profileId=?", [p.id]),
    memories: db.getAllSync("SELECT memory FROM memories WHERE profileId=?", [p.id]).map((r) => r.memory),
  }));
};

const getLogsForProfileSync = (profileId) =>
  db.getAllSync("SELECT * FROM logs WHERE profileId=? ORDER BY date DESC LIMIT 50", [profileId]);

export const saveProfile = (profile) => {
  db.runSync(
    `INSERT OR REPLACE INTO profiles
     (id,name,birthday,anniversary,address,interests,loveLanguage,groups,budget,photo,score,streakMonths,lastStreakMonth)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      profile.id, profile.name, profile.birthday, profile.anniversary,
      profile.address, profile.interests, JSON.stringify(Array.isArray(profile.loveLanguage) ? profile.loveLanguage : profile.loveLanguage ? [profile.loveLanguage] : []),
      JSON.stringify(profile.groups || []),
      profile.budget || 0, profile.photo || null,
      profile.score || 0, profile.streakMonths || 0, profile.lastStreakMonth || "",
    ]
  );

  // Save nested data
  db.runSync("DELETE FROM kids WHERE profileId=?", [profile.id]);
  (profile.kids || []).forEach((k) =>
    db.runSync("INSERT INTO kids (profileId,name,birthday) VALUES (?,?,?)", [profile.id, k.name, k.birthday])
  );

  db.runSync("DELETE FROM pets WHERE profileId=?", [profile.id]);
  (profile.pets || []).forEach((p) =>
    db.runSync("INSERT INTO pets (profileId,name,type) VALUES (?,?,?)", [profile.id, p.name, p.type])
  );

  db.runSync("DELETE FROM memories WHERE profileId=?", [profile.id]);
  (profile.memories || []).forEach((m) =>
    db.runSync("INSERT INTO memories (profileId,memory) VALUES (?,?)", [profile.id, m])
  );
};

export const deleteProfile = (id) => {
  ["logs", "gifts", "meetings", "prayers", "kids", "pets", "memories"].forEach((table) =>
    db.runSync(`DELETE FROM ${table} WHERE profileId=?`, [id])
  );
  db.runSync("DELETE FROM profiles WHERE id=?", [id]);
};

export const addLog = (profileId, entry) => {
  db.runSync(
    "INSERT INTO logs (profileId,date,action,points,note) VALUES (?,?,?,?,?)",
    [profileId, entry.date, entry.action, entry.points, entry.note || ""]
  );
};

export const addGift = (profileId, gift) => {
  db.runSync(
    "INSERT INTO gifts (profileId,item,date,occasion) VALUES (?,?,?,?)",
    [profileId, gift.item, gift.date, gift.occasion || ""]
  );
};

export const addMeeting = (profileId, meeting) => {
  db.runSync(
    "INSERT INTO meetings (profileId,date,type,notes,upcoming) VALUES (?,?,?,?,?)",
    [profileId, meeting.date, meeting.type, meeting.notes || "", meeting.upcoming ? 1 : 0]
  );
};

export const addPrayer = (profileId, note) => {
  const date = new Date().toISOString().slice(0, 10);
  db.runSync("INSERT INTO prayers (profileId,date,note) VALUES (?,?,?)", [profileId, date, note]);
};

export const getAllGoals = () => db.getAllSync("SELECT * FROM goals");

export const saveGoal = (goal) => {
  if (goal.id) {
    db.runSync("UPDATE goals SET label=?,target=?,personId=?,period=? WHERE id=?",
      [goal.label, goal.target, goal.personId, goal.period, goal.id]);
  } else {
    db.runSync("INSERT INTO goals (label,target,personId,period) VALUES (?,?,?,?)",
      [goal.label, goal.target, goal.personId || null, goal.period]);
  }
};

export const deleteGoal = (id) => db.runSync("DELETE FROM goals WHERE id=?", [id]);

const tryParse = (val, fallback) => {
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
};
