import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
  SafeAreaView, StatusBar, Platform,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

import { initDB, getAllProfiles, saveProfile, deleteProfile, addLog, addGift, addPrayer, getAllGoals, saveGoal, deleteGoal } from "./src/database";
import { callAI } from "./src/api";
import { requestPermissions, rescheduleAllNotifications } from "./src/notifications";
import {
  BLUE, GOLD, LIGHT_BLUE, LIGHT_GOLD, RED, GREEN, LIGHT_GREEN, PURPLE, LIGHT_PURPLE,
  LOVE_LANGUAGES, GROUPS, ACTIONS, LETTER_TEMPLATES, BADGES, TABS,
  newProfile, getTier, getInitials, nextOcc, fmtDate, daysSince, thisYear,
  decayedScore, profileSummary,
} from "./src/constants";

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ p, size = 42 }) => (
  <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
    <Text style={[styles.avatarText, { fontSize: size > 50 ? 20 : 15 }]}>
      {getInitials(p.name || "?")}
    </Text>
  </View>
);

const Pill = ({ label, color, bg }) => (
  <View style={[styles.pill, { backgroundColor: bg }]}>
    <Text style={[styles.pillText, { color }]}>{label}</Text>
  </View>
);

const SectionLabel = ({ text }) => <Text style={styles.sectionLabel}>{text}</Text>;

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

const Btn = ({ label, onPress, color = BLUE, fill = false, small = false, disabled = false }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    style={[
      styles.btn,
      { borderColor: color, backgroundColor: fill ? color : "transparent" },
      small && { paddingVertical: 5, paddingHorizontal: 12 },
      disabled && { opacity: 0.5 },
    ]}
  >
    <Text style={[styles.btnText, { color: fill ? "#fff" : color }, small && { fontSize: 12 }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const AIBlock = ({ text, color = BLUE, bg, onPrint, onCopy, onClear }) => (
  <View style={[styles.aiBlock, { backgroundColor: bg || LIGHT_BLUE }]}>
    <Text style={[styles.aiText, { color }]}>{text}</Text>
    <View style={styles.btnRow}>
      {onPrint && <Btn label="Print" onPress={onPrint} color={color} small />}
      {onCopy && <Btn label="Copy" onPress={onCopy} color={color} small />}
      {onClear && <Btn label="Clear" onPress={onClear} color={RED} small />}
    </View>
  </View>
);

// ─── EditProfile Screen ───────────────────────────────────────────────────────
const EditProfile = ({ profile, onSave, onCancel }) => {
  const [p, setP] = useState(profile);
  const set = (key, val) => setP((prev) => ({ ...prev, [key]: val }));
  const toggleGroup = (g) => {
    const gs = p.groups || [];
    set("groups", gs.includes(g) ? gs.filter((x) => x !== g) : [...gs, g]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[styles.backArrow, { color: BLUE }]}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{profile.name ? "Edit Person" : "New Person"}</Text>
        <Btn label="Save" onPress={() => onSave(p)} fill color={BLUE} small />
      </View>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={{ height: 10 }} />

        <SectionLabel text="Name *" />
        <TextInput style={styles.input} value={p.name} onChangeText={(v) => set("name", v)} placeholder="Full name" />

        <SectionLabel text="Birthday (MM-DD)" />
        <TextInput style={styles.input} value={p.birthday} onChangeText={(v) => set("birthday", v)} placeholder="03-15" keyboardType="numbers-and-punctuation" />

        <SectionLabel text="Anniversary (MM-DD)" />
        <TextInput style={styles.input} value={p.anniversary} onChangeText={(v) => set("anniversary", v)} placeholder="06-20" keyboardType="numbers-and-punctuation" />

        <SectionLabel text="Address" />
        <TextInput style={[styles.input, { height: 70 }]} value={p.address} onChangeText={(v) => set("address", v)} placeholder="123 Main St, City, State" multiline />

        <SectionLabel text="Interests & notes" />
        <TextInput style={[styles.input, { height: 80 }]} value={p.interests} onChangeText={(v) => set("interests", v)} placeholder="Loves hiking, coffee, classic literature..." multiline />

        <SectionLabel text="Love languages (tap to rank, tap again to remove)" />
        <View style={styles.chipRow}>
          {LOVE_LANGUAGES.map((ll) => {
            const langs = Array.isArray(p.loveLanguage) ? p.loveLanguage : p.loveLanguage ? [p.loveLanguage] : [];
            const rank = langs.indexOf(ll);
            const selected = rank !== -1;
            const toggleLL = () => {
              if (selected) {
                set("loveLanguage", langs.filter((x) => x !== ll));
              } else {
                set("loveLanguage", [...langs, ll]);
              }
            };
            return (
              <TouchableOpacity key={ll} onPress={toggleLL} style={[styles.chipBtn, selected && { backgroundColor: LIGHT_GOLD, borderColor: GOLD }]}>
                {selected && <Text style={{ fontSize: 11, color: GOLD, fontWeight: "700", marginRight: 3 }}>#{rank + 1}</Text>}
                <Text style={[styles.chipText, selected && { color: GOLD }]}>{ll}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {(() => { const langs = Array.isArray(p.loveLanguage) ? p.loveLanguage : p.loveLanguage ? [p.loveLanguage] : []; return langs.length > 0 ? (<Text style={{ fontSize: 12, color: GOLD, marginTop: 4 }}>Ranked: {langs.map((ll, i) => `${i + 1}. ${ll}`).join("  ·  ")}</Text>) : null; })()}

        <SectionLabel text="Groups" />
        <View style={styles.chipRow}>
          {GROUPS.map((g) => (
            <TouchableOpacity key={g} onPress={() => toggleGroup(g)} style={[styles.chipBtn, (p.groups || []).includes(g) && { backgroundColor: LIGHT_GREEN, borderColor: GREEN }]}>
              <Text style={[styles.chipText, (p.groups || []).includes(g) && { color: GREEN }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel text="Gift budget ($)" />
        <TextInput style={styles.input} value={p.budget ? String(p.budget) : ""} onChangeText={(v) => set("budget", Number(v) || 0)} placeholder="50" keyboardType="numeric" />

        <SectionLabel text="Kids (name + MM-DD birthday)" />
        {(p.kids || []).map((k, i) => (
          <View key={i} style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 6 }]} value={k.name} onChangeText={(v) => { const kids = [...(p.kids || [])]; kids[i] = { ...kids[i], name: v }; set("kids", kids); }} placeholder="Name" />
            <TextInput style={[styles.input, { width: 80 }]} value={k.birthday} onChangeText={(v) => { const kids = [...(p.kids || [])]; kids[i] = { ...kids[i], birthday: v }; set("kids", kids); }} placeholder="MM-DD" />
            <TouchableOpacity onPress={() => set("kids", (p.kids || []).filter((_, j) => j !== i))} style={{ marginLeft: 6 }}>
              <Text style={{ color: RED, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Btn label="+ Add kid" onPress={() => set("kids", [...(p.kids || []), { name: "", birthday: "" }])} color={BLUE} small />

        <SectionLabel text="Pets (name, type)" />
        {(p.pets || []).map((pt, i) => (
          <View key={i} style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 6 }]} value={pt.name} onChangeText={(v) => { const pets = [...(p.pets || [])]; pets[i] = { ...pets[i], name: v }; set("pets", pets); }} placeholder="Buddy" />
            <TextInput style={[styles.input, { width: 80 }]} value={pt.type} onChangeText={(v) => { const pets = [...(p.pets || [])]; pets[i] = { ...pets[i], type: v }; set("pets", pets); }} placeholder="Dog" />
            <TouchableOpacity onPress={() => set("pets", (p.pets || []).filter((_, j) => j !== i))} style={{ marginLeft: 6 }}>
              <Text style={{ color: RED, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Btn label="+ Add pet" onPress={() => set("pets", [...(p.pets || []), { name: "", type: "" }])} color={BLUE} small />

        <SectionLabel text="Memories" />
        {(p.memories || []).map((m, i) => (
          <View key={i} style={styles.row}>
            <TextInput style={[styles.input, { flex: 1, marginRight: 6 }]} value={m} onChangeText={(v) => { const mems = [...(p.memories || [])]; mems[i] = v; set("memories", mems); }} placeholder="A memory..." />
            <TouchableOpacity onPress={() => set("memories", (p.memories || []).filter((_, j) => j !== i))} style={{ marginLeft: 6 }}>
              <Text style={{ color: RED, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <Btn label="+ Add memory" onPress={() => set("memories", [...(p.memories || []), ""])} color={BLUE} small />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Profile Detail Screen ────────────────────────────────────────────────────
const ProfileDetail = ({ profile, onUpdate, onEdit, onDelete, onBack, onQuickLog }) => {
  const [logAction, setLogAction] = useState(null);
  const [logNote, setLogNote] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState("");
  const [healthReport, setHealthReport] = useState("");
  const [healthLoading, setHealthLoading] = useState(false);
  const [autoDraft, setAutoDraft] = useState("");
  const [autoDraftLoading, setAutoDraftLoading] = useState(false);
  const [starters, setStarters] = useState("");
  const [startersLoading, setStartersLoading] = useState(false);
  const [newGift, setNewGift] = useState("");
  const [newPrayer, setNewPrayer] = useState("");
  const [showGiftInput, setShowGiftInput] = useState(false);
  const [showPrayerInput, setShowPrayerInput] = useState(false);

  const p = profile;
  const tier = getTier(p.score || 0);
  const ds = decayedScore(p);
  const overdue = daysSince(p.log?.[0]?.date) > 30;
  const decayAmt = (p.score || 0) - ds;

  const logEngagement = () => {
    if (!logAction) return;
    onQuickLog(p, logAction, logNote);
    setLogAction(null);
    setLogNote("");
  };

  const runHealth = async () => {
    setHealthLoading(true); setHealthReport("");
    const logs = (p.log || []).slice(0, 20).map((l) => `${l.date}: ${l.action}`).join(", ");
    const dsSince = daysSince(p.log?.[0]?.date);
    const prompt = `You are a relationship coach. Analyze this person's relationship health and give a warm, constructive written report (about 200 words). Include: overall health rating (Thriving/Stable/Needs Attention/At Risk), what's going well, what needs improvement, and 3 specific actionable recommendations. Be encouraging and pastoral in tone.\n\nPerson: ${profileSummary(p)}\nDays since last contact: ${dsSince === 999 ? "Never contacted" : dsSince}.\nRecent interactions: ${logs || "None logged"}.\nEngagement score: ${p.score || 0}. Streak: ${p.streakMonths || 0} months.`;
    try { setHealthReport(await callAI(prompt, 800)); } catch (e) { setHealthReport("Error — update PROXY_URL in src/api.js first."); }
    setHealthLoading(false);
  };

  const runAutoDraft = async () => {
    setAutoDraftLoading(true); setAutoDraft("");
    const bd = nextOcc(p.birthday);
    const prompt = `Write a warm, heartfelt birthday letter (about 180 words) to ${p.name} from a close friend. Their birthday is ${bd !== null ? `in ${bd} days` : "coming up"}. ${profileSummary(p)} Make it personal and joyful. Start with "Dear ${p.name}," and end with a warm closing.`;
    try { setAutoDraft(await callAI(prompt, 700)); } catch { setAutoDraft("Error — update PROXY_URL in src/api.js first."); }
    setAutoDraftLoading(false);
  };

  const runStarters = async () => {
    setStartersLoading(true); setStarters("");
    const prompt = `Generate 5 personalized, specific conversation starters for an upcoming call or meetup with ${p.name}. ${profileSummary(p)} Make each one warm, curious, and specific to their life. Number them. Don't be generic.`;
    try { setStarters(await callAI(prompt, 500)); } catch { setStarters("Error."); }
    setStartersLoading(false);
  };

  const callAIMode = async (mode) => {
    setAiLoading(true); setAiMode(mode); setAiResult("");
    const base = profileSummary(p);
    const prompts = {
      gift: `Suggest 5 personalized gifts. ${base} Avoid past gifts. Numbered list.`,
      christmas: `Suggest 5 Christmas gifts. Budget $${p.budget || 50}. ${base} Numbered list.`,
      checkin: `Write a short warm 2-3 sentence check-in message to ${p.name}. ${base}`,
    };
    try { setAiResult(await callAI(prompts[mode])); } catch { setAiResult("Error — update PROXY_URL in src/api.js first."); }
    setAiLoading(false);
  };

  const printText = async (text) => {
    await Print.printAsync({ html: `<html><body style="font-family:Georgia,serif;padding:60px;font-size:14pt;line-height:1.8;"><pre style="white-space:pre-wrap;font-family:Georgia,serif;">${text}</pre></body></html>` });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingVertical: 10 }]}>
        <TouchableOpacity onPress={onBack}><Text style={[styles.backArrow, { color: BLUE }]}>←</Text></TouchableOpacity>
        <Avatar p={p} size={40} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.screenTitle} numberOfLines={1}>{p.name}</Text>
          <Pill label={tier.label} color={tier.color} bg={tier.bg} />
        </View>
        <Btn label="Edit" onPress={onEdit} color={BLUE} small />
        <View style={{ width: 4 }} />
        <Btn label="Del" onPress={() => Alert.alert("Delete", `Remove ${p.name}?`, [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => onDelete(p.id) }])} color={RED} small />
      </View>
      <ScrollView style={styles.container}>
        <View style={{ height: 10 }} />

        {overdue && <Card style={{ backgroundColor: "#FCEBEB", borderColor: RED }}><Text style={{ color: RED, fontSize: 13 }}>⚠️ No contact in {daysSince(p.log?.[0]?.date)} days{decayAmt > 0 ? ` — score decaying (−${decayAmt} pts)` : ""}</Text></Card>}
        {p.streakMonths > 1 && <Card style={{ backgroundColor: LIGHT_GOLD, borderColor: GOLD }}><Text style={{ color: GOLD, fontSize: 13 }}>🔥 {p.streakMonths}-month streak!</Text></Card>}

        <View style={styles.statsGrid}>
          {[["Birthday", fmtDate(p.birthday)], ["Anniversary", fmtDate(p.anniversary)], ["Score", `${ds} pts${decayAmt > 0 ? ` (−${decayAmt})` : ""}`], ["Budget", p.budget ? `$${p.budget}` : null]].map(([k, v]) =>
            v ? (
              <View key={k} style={[styles.statCell, { backgroundColor: k === "Score" && decayAmt > 0 ? "#FCEBEB" : LIGHT_BLUE }]}>
                <Text style={[styles.statLabel, { color: k === "Score" && decayAmt > 0 ? RED : BLUE }]}>{k}</Text>
                <Text style={[styles.statValue, { color: k === "Score" && decayAmt > 0 ? RED : BLUE, fontSize: 14 }]}>{v}</Text>
              </View>
            ) : null
          )}
        </View>

        {(() => { const langs = Array.isArray(p.loveLanguage) ? p.loveLanguage : p.loveLanguage ? [p.loveLanguage] : []; return langs.length > 0 ? (<Card><SectionLabel text="Love languages (ranked)" /><View style={styles.chipRow}>{langs.map((ll, i) => <View key={ll} style={[styles.chipBtn, { backgroundColor: LIGHT_GOLD, borderColor: GOLD }]}><Text style={{ fontSize: 11, color: GOLD, fontWeight: "700", marginRight: 3 }}>#{i + 1}</Text><Text style={[styles.chipText, { color: GOLD }]}>{ll}</Text></View>)}</View></Card>) : null; })()}
        {p.interests ? <Card><SectionLabel text="Interests & notes" /><Text style={styles.bodyText}>{p.interests}</Text></Card> : null}
        {p.address ? <Card><SectionLabel text="Address" /><Text style={styles.bodyText}>{p.address}</Text></Card> : null}
        {p.kids?.length > 0 && <Card><SectionLabel text="Kids" />{p.kids.map((k, i) => <Text key={i} style={styles.bodyText}>{k.name}{k.birthday ? ` — ${fmtDate(k.birthday)}` : ""}</Text>)}</Card>}
        {p.pets?.length > 0 && <Card><SectionLabel text="Pets" />{p.pets.map((pt, i) => <Text key={i} style={styles.bodyText}>{pt.name} ({pt.type})</Text>)}</Card>}
        {p.memories?.length > 0 && <Card><SectionLabel text="Memories" />{p.memories.map((m, i) => <Text key={i} style={styles.bodyText}>• {m}</Text>)}</Card>}

        <Card>
          <SectionLabel text="Gift history" />
          {(p.gifts || []).slice(0, 8).map((g, i) => <Text key={i} style={styles.logRow}>{g.date} — {g.item}{g.occasion ? ` (${g.occasion})` : ""}</Text>)}
          {showGiftInput ? (
            <View>
              <TextInput style={styles.input} value={newGift} onChangeText={setNewGift} placeholder="Gift item..." />
              <View style={styles.btnRow}>
                <Btn label="Save" onPress={() => { if (newGift.trim()) { const today = new Date().toISOString().slice(0, 10); addGift(p.id, { item: newGift, date: today }); onUpdate({ ...p, gifts: [...(p.gifts || []), { item: newGift, date: today }] }); setNewGift(""); setShowGiftInput(false); } }} color={GOLD} small />
                <Btn label="Cancel" onPress={() => setShowGiftInput(false)} color={RED} small />
              </View>
            </View>
          ) : <Btn label="+ Log gift" onPress={() => setShowGiftInput(true)} color={GOLD} small />}
        </Card>

        <Card>
          <SectionLabel text="Prayer log" />
          {(p.prayers || []).slice(0, 5).map((pr, i) => <Text key={i} style={styles.logRow}>{pr.date}{pr.note ? ` — ${pr.note}` : ""}</Text>)}
          {showPrayerInput ? (
            <View>
              <TextInput style={styles.input} value={newPrayer} onChangeText={setNewPrayer} placeholder="Prayer note (optional)..." />
              <View style={styles.btnRow}>
                <Btn label="Save" onPress={() => { const today = new Date().toISOString().slice(0, 10); addPrayer(p.id, newPrayer); onUpdate({ ...p, prayers: [{ date: today, note: newPrayer }, ...(p.prayers || [])] }); setNewPrayer(""); setShowPrayerInput(false); }} color={PURPLE} small />
                <Btn label="Cancel" onPress={() => setShowPrayerInput(false)} color={RED} small />
              </View>
            </View>
          ) : <Btn label="+ Log prayer" onPress={() => setShowPrayerInput(true)} color={PURPLE} small />}
        </Card>

        <Card style={{ backgroundColor: LIGHT_PURPLE, borderColor: PURPLE }}>
          <Text style={[styles.cardTitle, { color: PURPLE }]}>Smart AI</Text>
          <View style={styles.btnRow}>
            <Btn label={healthLoading ? "Analyzing..." : "Health report"} onPress={runHealth} color={PURPLE} small disabled={healthLoading} />
            <Btn label={autoDraftLoading ? "Writing..." : "Auto-draft letter"} onPress={runAutoDraft} color={PURPLE} small disabled={autoDraftLoading} />
            <Btn label={startersLoading ? "Thinking..." : "Conversation starters"} onPress={runStarters} color={PURPLE} small disabled={startersLoading} />
          </View>
          {healthReport ? <AIBlock text={healthReport} color={PURPLE} bg="rgba(83,74,183,0.07)" onPrint={() => printText(healthReport)} onClear={() => setHealthReport("")} /> : null}
          {autoDraft ? <AIBlock text={autoDraft} color={PURPLE} bg="rgba(83,74,183,0.07)" onPrint={() => printText(autoDraft)} onCopy={() => Alert.alert("Letter", autoDraft.slice(0, 80) + "...")} onClear={() => setAutoDraft("")} /> : null}
          {starters ? <AIBlock text={starters} color={PURPLE} bg="rgba(83,74,183,0.07)" onClear={() => setStarters("")} /> : null}
        </Card>

        <Card>
          <SectionLabel text="AI suggestions" />
          <View style={styles.btnRow}>
            {[["gift", "Gift ideas"], ["christmas", "Christmas gifts"], ["checkin", "Check-in message"]].map(([mode, label]) => (
              <Btn key={mode} label={aiLoading && aiMode === mode ? "Thinking..." : label} onPress={() => callAIMode(mode)} color={BLUE} small disabled={aiLoading} />
            ))}
          </View>
          {aiResult ? <AIBlock text={aiResult} color={BLUE} bg={LIGHT_BLUE} onClear={() => setAiResult("")} /> : null}
        </Card>

        <Card>
          <SectionLabel text="Log engagement" />
          <View style={styles.chipRow}>
            {ACTIONS.map((a) => (
              <TouchableOpacity key={a.label} onPress={() => setLogAction(logAction?.label === a.label ? null : a)} style={[styles.chipBtn, logAction?.label === a.label && { backgroundColor: LIGHT_GOLD, borderColor: GOLD }]}>
                <Text style={[styles.chipText, logAction?.label === a.label && { color: GOLD }]}>{a.icon} {a.label} +{a.points}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {logAction && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 13, marginBottom: 6 }}>Logging: {logAction.icon} {logAction.label} (+{logAction.points} pts)</Text>
              <TextInput style={styles.input} placeholder="Note (optional)..." value={logNote} onChangeText={setLogNote} />
              <View style={styles.btnRow}>
                <Btn label="Confirm" onPress={logEngagement} color={GOLD} fill small />
                <Btn label="Cancel" onPress={() => setLogAction(null)} color={RED} small />
              </View>
            </View>
          )}
        </Card>

        {p.log?.length > 0 && (
          <Card>
            <SectionLabel text="Recent activity" />
            {p.log.slice(0, 8).map((l, i) => (
              <Text key={i} style={styles.logRow}>
                <Text style={{ color: "#888" }}>{l.date}</Text>{" — "}{l.action}{" "}
                <Text style={{ color: GOLD }}>+{l.points}</Text>
                {l.note ? ` · ${l.note}` : ""}
              </Text>
            ))}
          </Card>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [goals, setGoals] = useState([]);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Dashboard");
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [newBadgeToast, setNewBadgeToast] = useState(null);
  const [letterPerson, setLetterPerson] = useState(null);
  const [letterTemplate, setLetterTemplate] = useState(LETTER_TEMPLATES[0]);
  const [letterResult, setLetterResult] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterExtra, setLetterExtra] = useState("");
  const [xmasLoading, setXmasLoading] = useState(false);
  const [xmasResult, setXmasResult] = useState("");
  const [xmasBudget, setXmasBudget] = useState("500");
  const [annualReview, setAnnualReview] = useState("");
  const [annualLoading, setAnnualLoading] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalForm, setNewGoalForm] = useState({ label: "", target: "12", personId: "" });

  useEffect(() => {
    initDB();
    setProfiles(getAllProfiles());
    setGoals(getAllGoals());
    setLoading(false);
    requestPermissions();
  }, []);

  const checkBadges = useCallback((updatedProfiles) => {
    const logs = updatedProfiles.flatMap((p) => p.log || []);
    BADGES.forEach((badge) => {
      if (!earnedBadges.includes(badge.id) && badge.check(updatedProfiles, logs)) {
        setEarnedBadges((prev) => [...prev, badge.id]);
        setNewBadgeToast(badge);
        setTimeout(() => setNewBadgeToast(null), 4000);
      }
    });
  }, [earnedBadges]);

  const refreshProfiles = useCallback(() => {
    const ps = getAllProfiles();
    setProfiles(ps);
    checkBadges(ps);
    rescheduleAllNotifications(ps);
  }, [checkBadges]);

  const handleSaveProfile = (p) => {
    if (!p.name.trim()) { Alert.alert("Name required"); return; }
    saveProfile(p);
    refreshProfiles();
    setEditing(null);
    setView("list");
  };

  const handleDeleteProfile = (id) => {
    deleteProfile(id);
    refreshProfiles();
    setSelected(null);
    setView("list");
  };

  const handleUpdateProfile = (updated) => {
    saveProfile(updated);
    refreshProfiles();
    const refreshed = getAllProfiles().find((x) => x.id === updated.id);
    if (refreshed) setSelected(refreshed);
  };

  const handleQuickLog = (profile, action, note) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const prevMonth = `${now.getFullYear()}-${now.getMonth() - 1}`;
    const streak = profile.lastStreakMonth === monthKey
      ? profile.streakMonths
      : profile.lastStreakMonth === prevMonth
      ? (profile.streakMonths || 0) + 1
      : 1;
    const entry = { date: now.toISOString().slice(0, 10), action: action.label, points: action.points, note: note || "" };
    const updated = { ...profile, score: (profile.score || 0) + action.points, streakMonths: streak, lastStreakMonth: monthKey };
    saveProfile(updated);
    addLog(profile.id, entry);
    refreshProfiles();
    if (selected?.id === profile.id) {
      const refreshed = getAllProfiles().find((x) => x.id === profile.id);
      if (refreshed) setSelected(refreshed);
    }
  };

  const callLetter = async () => {
    if (!letterPerson) return;
    setLetterLoading(true); setLetterResult("");
    const base = profileSummary(letterPerson);
    try {
      setLetterResult(await callAI(`${letterTemplate.prompt} to ${letterPerson.name} from a close friend. ${base} ${letterExtra ? `Context: ${letterExtra}.` : ""} About 180 words. Start "Dear ${letterPerson.name}," end warmly.`));
    } catch { setLetterResult("Error — update PROXY_URL in src/api.js first."); }
    setLetterLoading(false);
  };

  const callXmas = async () => {
    if (!profiles.length) { Alert.alert("Add people first!"); return; }
    setXmasLoading(true); setXmasResult("");
    const perPerson = Math.round(Number(xmasBudget) / profiles.length);
    const list = profiles.map((p) => { const langs = Array.isArray(p.loveLanguage) ? p.loveLanguage : p.loveLanguage ? [p.loveLanguage] : []; return `${p.name} (budget ~$${p.budget || perPerson}): interests=${p.interests || "unknown"}, love languages=${langs.length ? langs.join(", ") : "unknown"}`; }).join("\n");
    try {
      setXmasResult(await callAI(`Christmas gift list, 3 ideas per person, respect budgets.\n\n${list}\n\nFormat: ## [Name]\n1. idea\n2. idea\n3. idea`, 2000));
    } catch { setXmasResult("Error — update PROXY_URL in src/api.js first."); }
    setXmasLoading(false);
  };

  const runAnnualReview = async () => {
    setAnnualLoading(true); setAnnualReview("");
    const yr = thisYear();
    const yearLogs = profiles.flatMap((p) => (p.log || []).filter((l) => l.date?.startsWith(yr)));
    const topPeople = [...profiles].sort((a, b) => (b.log || []).filter((l) => l.date?.startsWith(yr)).length - (a.log || []).filter((l) => l.date?.startsWith(yr)).length).slice(0, 3).map((p) => p.name);
    const neglected = profiles.filter((p) => !(p.log || []).some((l) => l.date?.startsWith(yr))).map((p) => p.name);
    const prompt = `Write a warm, encouraging ${yr} relationship year-in-review (about 250 words). Be specific, pastoral, and motivating. End with 3 goals for next year.\n\nStats:\n- Total people: ${profiles.length}\n- Engagements this year: ${yearLogs.length}\n- Points earned: ${yearLogs.reduce((a, l) => a + l.points, 0)}\n- Most engaged with: ${topPeople.join(", ") || "nobody yet"}\n- Not yet contacted: ${neglected.join(", ") || "none — amazing!"}\n- Badges earned: ${earnedBadges.length}/${BADGES.length}`;
    try { setAnnualReview(await callAI(prompt, 900)); } catch { setAnnualReview("Error — update PROXY_URL in src/api.js first."); }
    setAnnualLoading(false);
  };

  const exportCSV = async () => {
    const rows = [["Name", "Birthday", "Anniversary", "Address", "Interests", "Love Language", "Groups", "Score", "Budget"]];
    profiles.forEach((p) => { const langs = Array.isArray(p.loveLanguage) ? p.loveLanguage : p.loveLanguage ? [p.loveLanguage] : []; rows.push([p.name, p.birthday, p.anniversary, p.address, p.interests, langs.join("|"), (p.groups || []).join("|"), p.score || 0, p.budget || 0]); });
    const csv = rows.map((r) => r.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const uri = FileSystem.documentDirectory + "appy-birthday.csv";
    await FileSystem.writeAsStringAsync(uri, csv);
    await Sharing.shareAsync(uri);
  };

  const sorted = [...profiles].sort((a, b) => decayedScore(b) - decayedScore(a));
  const filtered = sorted.filter((p) =>
    (!search || p.name.toLowerCase().includes(search.toLowerCase())) &&
    (!filterGroup || p.groups?.includes(filterGroup))
  );
  const reminders = profiles.flatMap((p) => {
    const items = [];
    const bd = nextOcc(p.birthday);
    if (bd !== null && bd <= 30) items.push({ name: p.name, type: "Birthday", days: bd, id: p.id });
    const an = nextOcc(p.anniversary);
    if (an !== null && an <= 30) items.push({ name: p.name, type: "Anniversary", days: an, id: p.id });
    p.kids?.forEach((k) => { const kd = nextOcc(k.birthday); if (kd !== null && kd <= 30) items.push({ name: p.name, type: `${k.name}'s Birthday`, days: kd, id: p.id }); });
    const ds = daysSince(p.log?.[0]?.date);
    if (ds > 30) items.push({ name: p.name, type: `No contact in ${ds} days`, days: null, id: p.id });
    return items;
  }).sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  const allBirthdays = profiles.flatMap((p) => {
    const items = [];
    if (p.birthday) { const d = nextOcc(p.birthday); if (d !== null) items.push({ name: p.name, type: "Birthday", label: fmtDate(p.birthday), days: d, id: p.id }); }
    if (p.anniversary) { const d = nextOcc(p.anniversary); if (d !== null) items.push({ name: p.name, type: "Anniversary", label: fmtDate(p.anniversary), days: d, id: p.id }); }
    p.kids?.forEach((k) => { if (k.birthday) { const d = nextOcc(k.birthday); if (d !== null) items.push({ name: p.name, type: `${k.name}'s Birthday`, label: fmtDate(k.birthday), days: d, id: p.id }); } });
    return items;
  }).sort((a, b) => a.days - b.days);

  const upcomingBirthdays = allBirthdays.filter((b) => b.type === "Birthday" && b.days <= 14);
  const yearStart = `${thisYear()}-01-01`;
  const yearLogs = profiles.flatMap((p) => (p.log || []).filter((l) => l.date >= yearStart));

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={BLUE} /></View>;

  if (view === "edit" || view === "new") {
    return <EditProfile profile={editing || newProfile()} onSave={handleSaveProfile} onCancel={() => { setEditing(null); setView("list"); }} />;
  }

  if (view === "profile" && selected) {
    return (
      <ProfileDetail
        profile={selected}
        onUpdate={handleUpdateProfile}
        onEdit={() => { setEditing(selected); setView("edit"); }}
        onDelete={handleDeleteProfile}
        onBack={() => { setSelected(null); setView("list"); }}
        onQuickLog={handleQuickLog}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={LIGHT_BLUE} />

      {newBadgeToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{newBadgeToast.icon} Badge earned: {newBadgeToast.label}!</Text>
          <Text style={styles.toastSub}>{newBadgeToast.desc}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.appTitle}>🎂 Appy Birthday</Text>
        <Btn label="+ Add" onPress={() => { setEditing(null); setView("new"); }} fill color={BLUE} small />
      </View>
      <ScrollView style={styles.container}>

        <TextInput style={[styles.input, { marginBottom: 8, marginTop: 0 }]} placeholder="Search people..." value={search} onChangeText={setSearch} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
          {["", ...GROUPS].map((g) => (
            <TouchableOpacity key={g || "all"} onPress={() => setFilterGroup(g)} style={[styles.chipBtn, filterGroup === g && { backgroundColor: LIGHT_BLUE, borderColor: BLUE }]}>
              <Text style={[styles.chipText, filterGroup === g && { color: BLUE }]}>{g || "All"}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && { backgroundColor: LIGHT_BLUE, borderColor: BLUE }]}>
              <Text style={[styles.tabText, tab === t && { color: BLUE, fontWeight: "600" }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Dashboard ──────────────────────────────────────────────────────── */}
        {tab === "Dashboard" && (
          <View>
            <View style={styles.statsGrid}>
              <View style={[styles.statCell, { backgroundColor: LIGHT_BLUE }]}>
                <Text style={[styles.statLabel, { color: BLUE }]}>People</Text>
                <Text style={[styles.statValue, { color: BLUE }]}>{profiles.length}</Text>
              </View>
              <View style={[styles.statCell, { backgroundColor: reminders.length > 0 ? "#FCEBEB" : LIGHT_GREEN }]}>
                <Text style={[styles.statLabel, { color: reminders.length > 0 ? RED : GREEN }]}>Reminders</Text>
                <Text style={[styles.statValue, { color: reminders.length > 0 ? RED : GREEN }]}>{reminders.length}</Text>
              </View>
              <View style={[styles.statCell, { backgroundColor: LIGHT_PURPLE }]}>
                <Text style={[styles.statLabel, { color: PURPLE }]}>Badges</Text>
                <Text style={[styles.statValue, { color: PURPLE }]}>{earnedBadges.length}/{BADGES.length}</Text>
              </View>
            </View>

            <Card style={{ backgroundColor: LIGHT_PURPLE, borderColor: PURPLE }}>
              <Text style={[styles.cardTitle, { color: PURPLE }]}>{thisYear()} Year in review</Text>
              <View style={[styles.row, { marginBottom: 10 }]}>
                <View style={{ marginRight: 20 }}><Text style={{ fontSize: 11, color: PURPLE }}>Engagements</Text><Text style={{ fontSize: 18, fontWeight: "600", color: PURPLE }}>{yearLogs.length}</Text></View>
                <View><Text style={{ fontSize: 11, color: PURPLE }}>Points earned</Text><Text style={{ fontSize: 18, fontWeight: "600", color: PURPLE }}>{yearLogs.reduce((a, l) => a + l.points, 0)}</Text></View>
              </View>
              <Btn label={annualLoading ? "Generating..." : "Generate AI year-in-review"} onPress={runAnnualReview} color={PURPLE} fill small disabled={annualLoading} />
              {annualReview ? <AIBlock text={annualReview} color={PURPLE} bg="rgba(83,74,183,0.07)" onClear={() => setAnnualReview("")} /> : null}
            </Card>

            {upcomingBirthdays.length > 0 && (
              <Card style={{ backgroundColor: LIGHT_GOLD, borderColor: GOLD }}>
                <Text style={[styles.cardTitle, { color: GOLD }]}>🎂 Birthdays in the next 14 days</Text>
                {upcomingBirthdays.map((b, i) => {
                  const person = profiles.find((x) => x.id === b.id);
                  return person ? (
                    <View key={i} style={[styles.rowBetween, { marginBottom: 8 }]}>
                      <Avatar p={person} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 14, fontWeight: "500" }}>{person.name}</Text>
                        <Text style={{ fontSize: 12, color: "#888" }}>{b.days === 0 ? "Today!" : b.days === 1 ? "Tomorrow" : `In ${b.days} days`}</Text>
                      </View>
                      <Btn label="Open" onPress={() => { setSelected(person); setView("profile"); }} color={GOLD} small />
                    </View>
                  ) : null;
                })}
              </Card>
            )}

            <Text style={[styles.cardTitle, { marginBottom: 6 }]}>Needs attention</Text>
            {reminders.slice(0, 5).map((r, i) => {
              const person = profiles.find((x) => x.id === r.id);
              return (
                <TouchableOpacity key={i} onPress={() => { if (person) { setSelected(person); setView("profile"); } }}>
                  <Card style={styles.row}>
                    <Text style={{ fontSize: 22 }}>{r.days !== null ? "🎂" : "💬"}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: "500" }}>{r.name}</Text>
                      <Text style={{ fontSize: 12, color: "#888" }}>{r.type}{r.days !== null ? ` — in ${r.days}d` : ""}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
            {reminders.length === 0 && <Text style={styles.emptyText}>All caught up! Everyone is loved well. 🎉</Text>}
          </View>
        )}

        {/* ── People ─────────────────────────────────────────────────────────── */}
        {tab === "People" && (
          <View>
            {filtered.map((p) => {
              const tier = getTier(decayedScore(p));
              const bd = nextOcc(p.birthday);
              const overdue = daysSince(p.log?.[0]?.date) > 30;
              return (
                <TouchableOpacity key={p.id} onPress={() => { setSelected(p); setView("profile"); }}>
                  <Card style={[styles.row, overdue && { borderLeftWidth: 3, borderLeftColor: RED }]}>
                    <Avatar p={p} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 15, fontWeight: "500" }}>{p.name}</Text>
                      <View style={styles.row}>
                        <Pill label={tier.label} color={tier.color} bg={tier.bg} />
                        {(p.groups || []).slice(0, 1).map((g) => <Pill key={g} label={g} color={GREEN} bg={LIGHT_GREEN} />)}
                      </View>
                      {bd !== null && bd <= 7 && <Text style={{ fontSize: 12, color: GOLD }}>🎂 Birthday in {bd === 0 ? "today!" : `${bd}d`}</Text>}
                    </View>
                    <Text style={{ color: BLUE, fontSize: 13 }}>{decayedScore(p)} pts</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
            {filtered.length === 0 && <Text style={styles.emptyText}>No people yet. Tap + Add to get started.</Text>}
          </View>
        )}

        {/* ── Birthdays ──────────────────────────────────────────────────────── */}
        {tab === "Birthdays" && (
          <View>
            {allBirthdays.map((b, i) => {
              const person = profiles.find((x) => x.id === b.id);
              return (
                <TouchableOpacity key={i} onPress={() => { if (person) { setSelected(person); setView("profile"); } }}>
                  <Card style={styles.rowBetween}>
                    <Text style={{ fontSize: 22 }}>{b.type.includes("Anniversary") ? "💍" : "🎂"}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: "500" }}>{b.name}</Text>
                      <Text style={{ fontSize: 12, color: "#888" }}>{b.type} — {b.label}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: b.days <= 7 ? RED : b.days <= 30 ? GOLD : "#aaa" }}>
                      {b.days === 0 ? "Today!" : b.days === 1 ? "Tomorrow" : `${b.days}d`}
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
            {allBirthdays.length === 0 && <Text style={styles.emptyText}>No birthdays yet. Add them in each person's profile.</Text>}
          </View>
        )}

        {/* ── Reminders ─────────────────────────────────────────────────────── */}
        {tab === "Reminders" && (
          <View>
            {reminders.map((r, i) => {
              const person = profiles.find((x) => x.id === r.id);
              return (
                <TouchableOpacity key={i} onPress={() => { if (person) { setSelected(person); setView("profile"); } }}>
                  <Card style={styles.rowBetween}>
                    <Text style={{ fontSize: 22 }}>{r.days !== null ? "🎂" : "💬"}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: "500" }}>{r.name}</Text>
                      <Text style={{ fontSize: 12, color: r.days !== null && r.days <= 7 ? RED : "#888" }}>{r.type}{r.days !== null ? ` — in ${r.days}d` : ""}</Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
            {reminders.length === 0 && <Text style={styles.emptyText}>No reminders right now!</Text>}
          </View>
        )}

        {/* ── Scores ────────────────────────────────────────────────────────── */}
        {tab === "Scores" && (
          <View>
            {sorted.map((p, i) => {
              const ds = decayedScore(p);
              const tier = getTier(ds);
              return (
                <TouchableOpacity key={p.id} onPress={() => { setSelected(p); setView("profile"); }}>
                  <Card style={styles.row}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "#bbb", width: 28 }}>#{i + 1}</Text>
                    <Avatar p={p} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={{ fontSize: 14, fontWeight: "500" }}>{p.name}</Text>
                      <Pill label={tier.label} color={tier.color} bg={tier.bg} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: tier.color }}>{ds}</Text>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Badges ────────────────────────────────────────────────────────── */}
        {tab === "Badges" && (
          <View>
            <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>{earnedBadges.length}/{BADGES.length} earned</Text>
            {BADGES.map((b) => (
              <Card key={b.id} style={[styles.row, !earnedBadges.includes(b.id) && { opacity: 0.4 }]}>
                <Text style={{ fontSize: 28 }}>{b.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>{b.label}</Text>
                  <Text style={{ fontSize: 12, color: "#888" }}>{b.desc}</Text>
                </View>
                {earnedBadges.includes(b.id) && <Text style={{ color: GREEN, fontSize: 18 }}>✓</Text>}
              </Card>
            ))}
          </View>
        )}

        {/* ── AI Insights ───────────────────────────────────────────────────── */}
        {tab === "AI Insights" && (
          <View>
            <Card style={{ backgroundColor: LIGHT_PURPLE, borderColor: PURPLE }}>
              <Text style={[styles.cardTitle, { color: PURPLE }]}>AI Insights Hub</Text>
              <Text style={{ fontSize: 13, color: "#888" }}>Deep AI analysis across all your relationships.</Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>📊 Annual relationship review</Text>
              <Btn label={annualLoading ? "Generating..." : "Generate year-in-review"} onPress={runAnnualReview} color={PURPLE} fill small disabled={annualLoading} />
              {annualReview ? <AIBlock text={annualReview} color={PURPLE} bg="rgba(83,74,183,0.07)" onClear={() => setAnnualReview("")} /> : null}
            </Card>
            <Card>
              <Text style={styles.cardTitle}>👤 Per-person insights</Text>
              <Text style={{ fontSize: 13, color: "#888" }}>Open any person → Smart AI → Health report, auto-draft letter, or conversation starters.</Text>
            </Card>
          </View>
        )}

        {/* ── Christmas ─────────────────────────────────────────────────────── */}
        {tab === "Christmas" && (
          <View>
            <Card>
              <Text style={styles.cardTitle}>🎄 Christmas Gift Planner</Text>
              <SectionLabel text="Total budget ($)" />
              <TextInput style={styles.input} value={xmasBudget} onChangeText={setXmasBudget} keyboardType="numeric" placeholder="500" />
              <Btn label={xmasLoading ? "Generating..." : "Generate gift list for everyone"} onPress={callXmas} color={RED} fill disabled={xmasLoading || !profiles.length} />
            </Card>
            {xmasResult ? (
              <Card>
                <Text style={styles.bodyText}>{xmasResult}</Text>
                <View style={styles.btnRow}>
                  <Btn label="Share" onPress={async () => { const uri = FileSystem.documentDirectory + "xmas-gifts.txt"; await FileSystem.writeAsStringAsync(uri, xmasResult); await Sharing.shareAsync(uri); }} color={RED} small />
                  <Btn label="Clear" onPress={() => setXmasResult("")} color={RED} small />
                </View>
              </Card>
            ) : null}
          </View>
        )}

        {/* ── Groups ────────────────────────────────────────────────────────── */}
        {tab === "Groups" && (
          <View>
            {GROUPS.map((g) => {
              const gps = profiles.filter((p) => (p.groups || []).includes(g));
              if (!gps.length) return null;
              return (
                <View key={g}>
                  <Text style={[styles.cardTitle, { marginTop: 12 }]}>{g} ({gps.length})</Text>
                  {gps.map((p) => (
                    <TouchableOpacity key={p.id} onPress={() => { setSelected(p); setView("profile"); }}>
                      <Card style={styles.row}>
                        <Avatar p={p} />
                        <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: "500" }}>{p.name}</Text>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
            {profiles.length === 0 && <Text style={styles.emptyText}>Add people and assign groups to see them here.</Text>}
          </View>
        )}

        {/* ── Letters ───────────────────────────────────────────────────────── */}
        {tab === "Letters" && (
          <View>
            <Card>
              <Text style={styles.cardTitle}>✉️ Letter Writer</Text>
              <SectionLabel text="Person" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {profiles.map((p) => (
                  <TouchableOpacity key={p.id} onPress={() => setLetterPerson(letterPerson?.id === p.id ? null : p)} style={[styles.chipBtn, letterPerson?.id === p.id && { backgroundColor: LIGHT_PURPLE, borderColor: PURPLE }]}>
                    <Text style={[styles.chipText, letterPerson?.id === p.id && { color: PURPLE }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <SectionLabel text="Template" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {LETTER_TEMPLATES.map((t) => (
                  <TouchableOpacity key={t.label} onPress={() => setLetterTemplate(t)} style={[styles.chipBtn, letterTemplate.label === t.label && { backgroundColor: LIGHT_BLUE, borderColor: BLUE }]}>
                    <Text style={[styles.chipText, letterTemplate.label === t.label && { color: BLUE }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <SectionLabel text="Extra context (optional)" />
              <TextInput style={[styles.input, { height: 60 }]} value={letterExtra} onChangeText={setLetterExtra} placeholder="Add any specific context..." multiline />
              <Btn label={letterLoading ? "Writing..." : "Generate letter"} onPress={callLetter} fill color={BLUE} disabled={!letterPerson || letterLoading} />
            </Card>
            {letterResult ? (
              <Card>
                <Text style={styles.bodyText}>{letterResult}</Text>
                <View style={styles.btnRow}>
                  <Btn label="Print" onPress={() => Print.printAsync({ html: `<pre style="font-family:Georgia;font-size:14pt;line-height:1.8;padding:60px">${letterResult}</pre>` })} color={BLUE} small />
                  <Btn label="Share" onPress={async () => { const uri = FileSystem.documentDirectory + "letter.txt"; await FileSystem.writeAsStringAsync(uri, letterResult); await Sharing.shareAsync(uri); }} color={BLUE} small />
                  <Btn label="Clear" onPress={() => setLetterResult("")} color={RED} small />
                </View>
              </Card>
            ) : null}
          </View>
        )}

        {/* ── Goals ─────────────────────────────────────────────────────────── */}
        {tab === "Goals" && (
          <View>
            {goals.map((g) => {
              const person = g.personId ? profiles.find((x) => x.id === Number(g.personId)) : null;
              const logs = person ? (person.log || []) : profiles.flatMap((p) => p.log || []);
              const progress = Math.min(logs.filter((l) => l.date >= `${thisYear()}-01-01`).length, g.target);
              const pct = Math.round((progress / g.target) * 100);
              return (
                <Card key={g.id}>
                  <View style={styles.rowBetween}>
                    <Text style={{ fontSize: 14, fontWeight: "500", flex: 1 }}>{g.label}</Text>
                    <TouchableOpacity onPress={() => { deleteGoal(g.id); setGoals(getAllGoals()); }}>
                      <Text style={{ color: RED }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {person && <Text style={{ fontSize: 12, color: "#888" }}>For: {person.name}</Text>}
                  <View style={[styles.progressBar, { marginTop: 8 }]}>
                    <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: pct >= 100 ? GREEN : BLUE }]} />
                  </View>
                  <Text style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{progress}/{g.target} ({pct}%)</Text>
                </Card>
              );
            })}
            {showNewGoal ? (
              <Card>
                <TextInput style={styles.input} placeholder="Goal label (e.g. 'Monthly calls with family')" value={newGoalForm.label} onChangeText={(v) => setNewGoalForm((f) => ({ ...f, label: v }))} />
                <TextInput style={styles.input} placeholder="Target count (e.g. 12)" value={newGoalForm.target} onChangeText={(v) => setNewGoalForm((f) => ({ ...f, target: v }))} keyboardType="numeric" />
                <View style={styles.btnRow}>
                  <Btn label="Save" onPress={() => { if (!newGoalForm.label.trim()) return; saveGoal({ label: newGoalForm.label, target: Number(newGoalForm.target) || 12, personId: null, period: "year" }); setGoals(getAllGoals()); setShowNewGoal(false); setNewGoalForm({ label: "", target: "12", personId: "" }); }} color={BLUE} fill small />
                  <Btn label="Cancel" onPress={() => setShowNewGoal(false)} color={RED} small />
                </View>
              </Card>
            ) : (
              <Btn label="+ New goal" onPress={() => setShowNewGoal(true)} color={BLUE} />
            )}
          </View>
        )}

        {/* ── Tools ─────────────────────────────────────────────────────────── */}
        {tab === "Tools" && (
          <View>
            <Card>
              <Text style={styles.cardTitle}>📤 Export</Text>
              <Btn label="Export contacts as CSV" onPress={exportCSV} color={BLUE} />
              <View style={{ height: 8 }} />
              <Btn label="Export ICS calendar" onPress={async () => {
                const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "CALSCALE:GREGORIAN"];
                const yr = new Date().getFullYear();
                profiles.forEach((p) => {
                  if (p.birthday) { const [m, d] = p.birthday.split("-"); lines.push("BEGIN:VEVENT", `DTSTART;VALUE=DATE:${yr}${m}${d}`, "RRULE:FREQ=YEARLY", `SUMMARY:🎂 ${p.name}'s Birthday`, "END:VEVENT"); }
                  if (p.anniversary) { const [m, d] = p.anniversary.split("-"); lines.push("BEGIN:VEVENT", `DTSTART;VALUE=DATE:${yr}${m}${d}`, "RRULE:FREQ=YEARLY", `SUMMARY:💍 ${p.name}'s Anniversary`, "END:VEVENT"); }
                });
                lines.push("END:VCALENDAR");
                const uri = FileSystem.documentDirectory + "appy-birthday.ics";
                await FileSystem.writeAsStringAsync(uri, lines.join("\r\n"));
                await Sharing.shareAsync(uri);
              }} color={BLUE} />
            </Card>
            <Card style={{ backgroundColor: "#FFF8E8", borderColor: GOLD }}>
              <Text style={[styles.cardTitle, { color: GOLD }]}>⚠️ AI Setup Required</Text>
              <Text style={{ fontSize: 13, color: "#666", lineHeight: 22 }}>
                To enable AI features:{"\n"}
                1. Deploy the server/ folder to Render.com{"\n"}
                2. Set ANTHROPIC_API_KEY + PROXY_SECRET env vars{"\n"}
                3. Edit PROXY_URL in src/api.js{"\n"}
                4. Edit PROXY_SECRET in src/api.js{"\n\n"}
                See README.md for step-by-step instructions.
              </Text>
            </Card>
            <Card>
              <Text style={styles.cardTitle}>ℹ️ App Info</Text>
              <Text style={{ fontSize: 13, color: "#888" }}>Version 1.0.0 · Built with Expo + React Native</Text>
            </Card>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {profiles.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setTab("People")}>
          <Text style={{ color: "#fff", fontSize: 26, lineHeight: 30 }}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { flex: 1, paddingHorizontal: 14 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 14, backgroundColor: LIGHT_BLUE, borderBottomWidth: 1, borderBottomColor: "#cce0f5" },
  appTitle: { fontSize: 22, fontWeight: "700", color: BLUE },
  screenTitle: { fontSize: 17, fontWeight: "600", color: BLUE },
  backArrow: { fontSize: 16, paddingRight: 8 },
  profileName: { fontSize: 18, fontWeight: "600" },
  card: { backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#ddd", borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  btn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: 8, borderWidth: 0.5, marginRight: 6, marginBottom: 6 },
  btnText: { fontSize: 13, fontWeight: "500" },
  input: { borderWidth: 0.5, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, marginTop: 4, backgroundColor: "#fafafa" },
  sectionLabel: { fontSize: 12, color: "#888", marginTop: 10, marginBottom: 2 },
  avatar: { backgroundColor: LIGHT_BLUE, alignItems: "center", justifyContent: "center" },
  avatarText: { color: BLUE, fontWeight: "600" },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, marginRight: 4, marginTop: 3 },
  pillText: { fontSize: 11 },
  chipBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: "#ccc", marginRight: 6, marginBottom: 6, backgroundColor: "transparent" },
  chipText: { fontSize: 12, color: "#666" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  tabBtn: { paddingHorizontal: 13, paddingVertical: 5, borderRadius: 20, borderWidth: 0.5, borderColor: "#ccc", marginRight: 4 },
  tabText: { fontSize: 12, color: "#666" },
  statsGrid: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCell: { flex: 1, borderRadius: 10, padding: 12 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 20, fontWeight: "600", marginTop: 2 },
  bodyText: { fontSize: 14, lineHeight: 20 },
  logRow: { fontSize: 13, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  aiBlock: { borderRadius: 8, padding: 12, marginTop: 10 },
  aiText: { fontSize: 14, lineHeight: 22 },
  emptyText: { textAlign: "center", color: "#aaa", fontSize: 14, paddingVertical: 30 },
  progressBar: { height: 8, backgroundColor: "#eee", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  fab: { position: "absolute", bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: BLUE, alignItems: "center", justifyContent: "center", shadowColor: BLUE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 6 },
  toast: { position: "absolute", top: 60, alignSelf: "center", backgroundColor: PURPLE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, zIndex: 200, alignItems: "center" },
  toastText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  toastSub: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
});
