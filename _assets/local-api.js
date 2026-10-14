/* OU Escape Route — on-device (offline) server.
 * Replaces every /_api/* call with a local implementation backed by localStorage.
 * Accounts, scores, store library, Premium vault and practice rooms never leave the phone. */
(function () {
  "use strict";
  if (window.__ouerLocalApi) return;
  window.__OUER_OFFLINE = true;

  var DBK = "ouer_offline_db_v1";
  var enc = new TextEncoder();
  var now = function () { return Date.now(); };

  /* ---------- tiny utils ---------- */
  function b64(u8) { var s = ""; for (var i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function unb64(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ri(n) { return Math.floor(Math.random() * n); }
  function randomToken(len) {
    var a = new Uint8Array(len); crypto.getRandomValues(a);
    var c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789", s = "";
    for (var i = 0; i < len; i++) s += c[a[i] % c.length];
    return s;
  }
  async function hashSecret(secret, saltB64) {
    var salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
    var key = await crypto.subtle.importKey("raw", enc.encode(String(secret)), "PBKDF2", false, ["deriveBits"]);
    var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt, iterations: 60000, hash: "SHA-256" }, key, 256);
    return { hash: b64(new Uint8Array(bits)), salt: b64(salt) };
  }
  async function verifySecret(secret, rec) {
    if (!rec || !rec.hash || !rec.salt) return false;
    var h = await hashSecret(secret, rec.salt);
    return h.hash === rec.hash;
  }

  /* ---------- storage ---------- */
  var GAMES = [
    ["puzzle-quest", "Puzzle Quest", "Solve the route and escape.", "🧩"],
    ["racing-rush", "Racing Rush", "Fast arcade racing challenge.", "🏎️"],
    ["bubble-blast", "Bubble Blast", "Match colorful bubbles.", "🫧"],
    ["tower-defense", "Tower Defense", "Protect the route.", "🛡️"],
    ["space-invaders", "Space Invaders", "Classic arcade action.", "👾"],
    ["fruit-slice", "Fruit Slice", "Slice fruit and score points.", "🍉"],
    ["snake-run", "Snake Run", "Swipe to steer and grow.", "🐍"],
    ["memory-match", "Memory Match", "Find all the matching pairs.", "🃏"],
    ["whack-a-mole", "Whack-a-Mole", "Tap the moles in 30 seconds.", "🔨"],
    ["sky-hop", "Sky Hop", "Tap to hop through the gaps.", "🛸"],
    ["brick-breaker", "Brick Breaker", "Smash every brick.", "🧱"],
    ["number-merge", "Number Merge", "Merge tiles to reach 2048.", "🔢"]
  ];
  var SERVER_GAMES = GAMES.map(function (g) { return g[0]; });

  function seedApps() {
    var apps = GAMES.map(function (g, i) {
      return { id: i + 1, slug: g[0], name: g[1], description: g[2], icon: g[3], version: "1.0.0", category: "Game", launchPath: "/games/" + g[0], status: "published" };
    });
    apps.push({ id: apps.length + 1, slug: "reaction-race", name: "Reaction Race", description: "Race computer players to tap first.", icon: "⚡", version: "1.0.0", category: "Multiplayer", launchPath: "/multiplayer", status: "published" });
    return apps;
  }
  function fresh() {
    var apps = seedApps();
    return { v: 1, seq: { user: 0, room: 0, match: 0, msg: 0, app: apps.length, vacc: 0 }, users: [], session: null, progress: [], matches: [], rooms: [], apps: apps, installs: [], vacc: [], settings: { requireEmailVerification: false, emailFrom: "", publicUrl: "" } };
  }
  function load() {
    try { var d = JSON.parse(localStorage.getItem(DBK)); if (d && d.v === 1) return d; } catch (e) {}
    return fresh();
  }
  var db = load();
  function save() { try { localStorage.setItem(DBK, JSON.stringify(db)); } catch (e) {} }

  /* ---------- responses / errors ---------- */
  function json(data, status) {
    return new Response(JSON.stringify({ json: data }), { status: status || 200, headers: { "Content-Type": "application/json" } });
  }
  function Fail(status, message, code) { this.status = status; this.message = message; this.code = code; }
  function fail(status, message, code) { throw new Fail(status, message, code); }

  function parseBody(init) {
    if (!init || init.body == null) return {};
    try { var o = JSON.parse(typeof init.body === "string" ? init.body : ""); if (o && typeof o === "object" && "json" in o) return o.json == null ? {} : o.json; return o || {}; } catch (e) { return {}; }
  }

  /* ---------- users / session ---------- */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function pubUser(u) { return { id: u.id, email: u.email, displayName: u.displayName, role: u.role, emailVerified: true, verificationRequired: false }; }
  function me() { return db.session ? (db.users.find(function (u) { return u.id === db.session.userId; }) || null) : null; }
  function need() { var u = me(); if (!u) fail(401, "You need to sign in.", "UNAUTHENTICATED"); return u; }
  function nameTaken(name, exceptId) {
    var l = String(name).trim().toLowerCase();
    return db.users.some(function (u) { return u.id !== exceptId && u.displayName.toLowerCase() === l; });
  }
  function checkName(v) {
    var s = String(v == null ? "" : v).trim();
    if (!s) fail(400, "Name is required.", "VALIDATION");
    if (s.length > 40) fail(400, "Name must be 40 characters or fewer.", "VALIDATION");
    return s;
  }
  var tries = {}; // simple brute-force guard: key -> {n, until}
  function guard(key) {
    var t = tries[key];
    if (t && t.until && t.until > now()) fail(429, "Too many attempts. Try again in " + Math.ceil((t.until - now()) / 1000) + " seconds.", "RATE_LIMITED");
  }
  function miss(key) {
    var t = tries[key] || (tries[key] = { n: 0, until: 0 });
    if (t.until && t.until <= now()) { t.n = 0; t.until = 0; }
    t.n++; if (t.n >= 5) { t.until = now() + 60000; t.n = 0; }
  }
  function okTry(key) { delete tries[key]; }

  /* ---------- routes ---------- */
  var routes = {};

  routes["auth/session"] = async function () {
    var u = me(); if (!u) fail(401, "Not authenticated", "UNAUTHENTICATED");
    return { user: pubUser(u) };
  };
  routes["auth/register_with_password"] = async function (c) {
    var b = c.body, email = String(b.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) fail(400, "Email is required", "VALIDATION");
    if (String(b.password || "").length < 8) fail(400, "Password must be at least 8 characters", "VALIDATION");
    var name = checkName(b.displayName);
    if (db.users.some(function (u) { return u.email === email; })) fail(409, "An account with that email already exists on this device.", "EMAIL_TAKEN");
    if (nameTaken(name)) fail(409, "That username is already taken.", "NAME_TAKEN");
    var h = await hashSecret(b.password);
    var u = { id: ++db.seq.user, email: email, displayName: name, role: db.users.length === 0 ? "admin" : "user", pass: h, vault: null, reset: null, createdAt: new Date().toISOString() };
    db.users.push(u); db.session = { userId: u.id }; save();
    return { user: pubUser(u) };
  };
  routes["auth/login_with_password"] = async function (c) {
    var b = c.body, idt = String(b.identifier || b.email || b.username || "").trim().toLowerCase();
    if (!idt || !b.password) fail(400, "Enter your details to sign in.", "VALIDATION");
    var key = "login:" + idt; guard(key);
    var u = db.users.find(function (x) { return x.email === idt; }) || db.users.find(function (x) { return x.displayName.toLowerCase() === idt; });
    var good = u ? await verifySecret(b.password, u.pass) : false;
    if (!good) { miss(key); fail(401, "Invalid email/username or password.", "INVALID_CREDENTIALS"); }
    okTry(key); db.session = { userId: u.id }; save();
    return { user: pubUser(u) };
  };
  routes["auth/login_with_pin"] = async function (c) {
    var pin = String(c.body.pin || ""); if (!/^\d{4,12}$/.test(pin)) fail(400, "Enter your 4–12 digit PIN.", "VALIDATION");
    guard("pinlogin");
    var found = null;
    for (var i = 0; i < db.users.length; i++) { var u = db.users[i]; if (u.vault && await verifySecret(pin, u.vault)) { found = u; break; } }
    if (!found) { miss("pinlogin"); fail(401, "That PIN was not recognized. Set a PIN in Settings after signing in with your password.", "INVALID_PIN"); }
    okTry("pinlogin"); db.session = { userId: found.id }; save();
    return { user: pubUser(found) };
  };
  routes["auth/logout"] = async function () { db.session = null; save(); return { success: true }; };
  routes["auth/forgot_password"] = async function (c) {
    var email = String(c.body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) fail(400, "Enter a valid email address.", "VALIDATION");
    var u = db.users.find(function (x) { return x.email === email; });
    if (!u) fail(404, "No account with that email exists on this device.", "NOT_FOUND");
    var code = String(10000000 + ri(90000000));
    u.reset = { code: code, expires: now() + 15 * 60000 }; save();
    return { message: "Offline mode — no email is sent. Your reset code is " + code + " (valid for 15 minutes). Enter it on the next screen." };
  };
  routes["auth/reset_password"] = async function (c) {
    var tok = String(c.body.token || "").trim(), pw = String(c.body.password || "");
    if (tok.length < 8) fail(400, "Enter the reset code from your email.", "VALIDATION");
    if (pw.length < 8) fail(400, "Password must be at least 8 characters.", "VALIDATION");
    var u = db.users.find(function (x) { return x.reset && x.reset.code === tok && x.reset.expires > now(); });
    if (!u) fail(400, "That reset code is invalid or has expired.", "INVALID_TOKEN");
    u.pass = await hashSecret(pw); u.reset = null; save();
    return { success: true };
  };
  routes["auth/change_password"] = async function (c) {
    var u = need();
    if (!(await verifySecret(c.body.currentPassword || "", u.pass))) fail(400, "Your current password is incorrect.", "INVALID_CREDENTIALS");
    if (String(c.body.newPassword || "").length < 8) fail(400, "New password must be at least 8 characters.", "VALIDATION");
    u.pass = await hashSecret(c.body.newPassword); save();
    return { success: true };
  };
  routes["auth/verify_email"] = async function () { need(); return { success: true, alreadyVerified: true }; };
  routes["auth/resend_verification"] = async function () { need(); return { alreadyVerified: true, emailed: false }; };

  /* ----- profile / progress / leaderboard ----- */
  routes["profile/update"] = async function (c) {
    var u = need(), name = checkName(c.body.displayName);
    if (nameTaken(name, u.id)) fail(409, "That username is already taken.", "NAME_TAKEN");
    u.displayName = name; save();
    return { user: pubUser(u) };
  };
  function myMatches(uid) { return db.matches.filter(function (m) { return m.userId === uid; }); }
  routes["profile/stats"] = async function () {
    var u = need(), ms = myMatches(u.id);
    return {
      memberSince: u.createdAt,
      multiplayer: { wins: ms.filter(function (m) { return m.rank === 1; }).length, played: ms.length, bestScore: ms.reduce(function (a, m) { return Math.max(a, m.score); }, 0) },
      solo: db.progress.filter(function (p) { return p.userId === u.id; }).map(function (p) { return { game: p.game, bestScore: p.bestScore, plays: p.plays }; })
    };
  };
  routes["progress/submit"] = async function (c) {
    var u = need(), game = String(c.body.game || ""), score = Math.round(Number(c.body.score));
    if (SERVER_GAMES.indexOf(game) < 0) fail(400, "Unknown game.", "VALIDATION");
    if (!(score >= 0) || score > 1000000) fail(400, "Invalid score.", "VALIDATION");
    var p = db.progress.find(function (x) { return x.userId === u.id && x.game === game; });
    var isNewBest = !p || score > p.bestScore;
    if (!p) { p = { userId: u.id, game: game, bestScore: 0, plays: 0 }; db.progress.push(p); }
    p.plays++; if (score > p.bestScore) p.bestScore = score;
    save();
    return { isNewBest: isNewBest, bestScore: p.bestScore };
  };
  routes["leaderboard"] = async function (c) {
    need();
    var game = String(c.query.game || ""), best = {};
    if (game === "reaction-race") db.matches.forEach(function (m) { best[m.userId] = Math.max(best[m.userId] || 0, m.score); });
    else db.progress.forEach(function (p) { if (p.game === game) best[p.userId] = p.bestScore; });
    var rows = Object.keys(best).map(function (id) { var u = db.users.find(function (x) { return x.id === Number(id); }); return u ? { userId: u.id, displayName: u.displayName, score: best[id] } : null; }).filter(Boolean);
    rows.sort(function (a, b) { return b.score - a.score || a.userId - b.userId; });
    return { rows: rows.slice(0, 50).map(function (r, i) { return { rank: i + 1, userId: r.userId, displayName: r.displayName, score: r.score }; }) };
  };
  routes["matches"] = async function () {
    var u = need();
    return { matches: myMatches(u.id).slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 100).map(function (m) { return { id: m.id, game: m.game, rank: m.rank, players: m.players, roomCode: m.roomCode, finishedAt: m.finishedAt, score: m.score }; }) };
  };

  /* ----- store ----- */
  function appView(a, uid) { return { id: a.id, slug: a.slug, name: a.name, description: a.description, icon: a.icon, version: a.version, category: a.category, launchPath: a.launchPath || null, status: a.status, installed: db.installs.some(function (i) { return i.userId === uid && i.appId === a.id; }) }; }
  routes["store/apps"] = async function () {
    var u = need();
    return { apps: db.apps.filter(function (a) { return a.status === "published"; }).map(function (a) { return appView(a, u.id); }) };
  };
  routes["store/install"] = async function (c) {
    var u = need(), id = Number(c.body.appId);
    var a = db.apps.find(function (x) { return x.id === id && x.status === "published"; });
    if (!a) fail(404, "That app is not available.", "NOT_FOUND");
    var has = db.installs.some(function (i) { return i.userId === u.id && i.appId === id; });
    if (c.body.install && !has) db.installs.push({ userId: u.id, appId: id });
    if (!c.body.install && has) db.installs = db.installs.filter(function (i) { return !(i.userId === u.id && i.appId === id); });
    save();
    return { success: true };
  };

  /* ----- premium vault ----- */
  var vaultTokens = {}; // memory only: cleared whenever the app reloads/locks
  function vaultAuth(c, u) {
    var t = c.headers.get("x-vault-token"), rec = t && vaultTokens[t];
    if (!rec || rec.userId !== u.id || rec.expires < now()) fail(423, "Your premium account is locked. Enter your PIN to unlock it.", "VAULT_LOCKED");
    rec.expires = now() + 15 * 60000;
  }
  routes["vault/status"] = async function () { var u = need(); return { hasPin: !!u.vault }; };
  routes["vault/set_pin"] = async function (c) {
    var u = need(), pin = String(c.body.pin || "");
    if (!/^\d{4,12}$/.test(pin)) fail(400, "PIN must be 4–12 digits.", "VALIDATION");
    if (u.vault) {
      guard("setpin:" + u.id);
      if (!(await verifySecret(String(c.body.currentPin || ""), u.vault))) { miss("setpin:" + u.id); fail(400, "Your current PIN is incorrect.", "INVALID_PIN"); }
      okTry("setpin:" + u.id);
    }
    for (var i = 0; i < db.users.length; i++) { var o = db.users[i]; if (o.id !== u.id && o.vault && await verifySecret(pin, o.vault)) fail(409, "That PIN is already used by another account on this device. Choose a different PIN.", "PIN_TAKEN"); }
    u.vault = await hashSecret(pin); save();
    return { success: true };
  };
  routes["vault/unlock"] = async function (c) {
    var u = need(), pin = String(c.body.pin || "");
    if (!u.vault) fail(400, "Create a PIN in Settings first.", "NO_PIN");
    var key = "unlock:" + u.id; guard(key);
    if (!(await verifySecret(pin, u.vault))) { miss(key); fail(401, "Incorrect PIN.", "INVALID_PIN"); }
    okTry(key);
    var tok = randomToken(32); vaultTokens[tok] = { userId: u.id, expires: now() + 15 * 60000 };
    return { vaultToken: tok };
  };
  routes["vault/accounts"] = async function (c) {
    var u = need(); vaultAuth(c, u);
    return { accounts: db.vacc.filter(function (a) { return a.userId === u.id; }).map(function (a) { return { id: a.id, platform: a.platform, displayName: a.displayName, accountRef: a.accountRef }; }) };
  };
  routes["vault/account_add"] = async function (c) {
    var u = need(); vaultAuth(c, u);
    var b = c.body, platform = String(b.platform || ""), dn = String(b.displayName || "").trim(), ref = String(b.accountRef || "").trim();
    if (["Facebook", "Instagram", "Twitter/X", "TikTok", "YouTube", "Snapchat"].indexOf(platform) < 0) fail(400, "Choose a supported platform.", "VALIDATION");
    if (!dn || dn.length > 80) fail(400, "Enter a display name.", "VALIDATION");
    if (!ref || ref.length > 200) fail(400, "Enter an account identifier.", "VALIDATION");
    if (db.vacc.filter(function (a) { return a.userId === u.id; }).length >= 50) fail(400, "You can save up to 50 accounts.", "LIMIT");
    db.vacc.push({ id: ++db.seq.vacc, userId: u.id, platform: platform, displayName: dn, accountRef: ref }); save();
    return { success: true };
  };
  routes["vault/account_remove"] = async function (c) {
    var u = need(); vaultAuth(c, u);
    var id = Number(c.body.id);
    db.vacc = db.vacc.filter(function (a) { return !(a.id === id && a.userId === u.id); }); save();
    return { success: true };
  };

  /* ----- admin ----- */
  function admin() { var u = need(); if (u.role !== "admin") fail(403, "Administrator access required.", "FORBIDDEN"); return u; }
  routes["admin/overview"] = async function () {
    admin();
    return {
      stats: { users: db.users.length, matches: db.matches.length, activeRooms: db.rooms.filter(function (r) { return r.isPublic && r.status === "waiting"; }).length, installs: db.installs.length },
      settings: db.settings,
      users: db.users.map(function (u) { return { id: u.id, email: u.email, displayName: u.displayName, role: u.role, emailVerified: true }; }),
      apps: db.apps.map(function (a) { return { id: a.id, slug: a.slug, name: a.name, description: a.description, icon: a.icon, version: a.version, category: a.category, launchPath: a.launchPath || null, status: a.status }; })
    };
  };
  routes["admin/set_role"] = async function (c) {
    var a = admin(), id = Number(c.body.userId), role = c.body.role;
    if (role !== "user" && role !== "admin") fail(400, "Invalid role.", "VALIDATION");
    var u = db.users.find(function (x) { return x.id === id; }); if (!u) fail(404, "User not found.", "NOT_FOUND");
    if (u.id === a.id && role !== "admin") fail(400, "You can't remove your own admin role.", "VALIDATION");
    u.role = role; save(); return { success: true };
  };
  routes["admin/settings"] = async function (c) {
    admin(); var b = c.body;
    var pub = String(b.publicUrl || "").trim();
    if (pub && !/^https:\/\/[^\s/]+$/i.test(pub)) fail(400, "Public URL must look like https://your-app.floot.app (no trailing path).", "VALIDATION");
    db.settings = { requireEmailVerification: !!b.requireEmailVerification, emailFrom: String(b.emailFrom || "").trim().slice(0, 200), publicUrl: pub }; save();
    return db.settings;
  };
  routes["admin/store_save"] = async function (c) {
    admin(); var b = c.body, slug = String(b.slug || "").trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(slug)) fail(400, "Slug: 2–80 letters, numbers or dashes.", "VALIDATION");
    var name = String(b.name || "").trim(); if (!name || name.length > 100) fail(400, "Name is required.", "VALIDATION");
    if (["draft", "published", "unpublished"].indexOf(b.status) < 0) fail(400, "Invalid status.", "VALIDATION");
    var other = db.apps.find(function (a) { return a.slug === slug && a.id !== b.id; }); if (other) fail(409, "That slug is already used.", "VALIDATION");
    var rec = { slug: slug, name: name, description: String(b.description || "").slice(0, 500), icon: String(b.icon || "🎮").slice(0, 8), version: String(b.version || "1.0.0").slice(0, 30), category: String(b.category || "Game").slice(0, 40), launchPath: b.launchPath ? String(b.launchPath).slice(0, 200) : null, status: b.status };
    var cur = b.id ? db.apps.find(function (a) { return a.id === Number(b.id); }) : null;
    if (cur) Object.assign(cur, rec); else { rec.id = ++db.seq.app; db.apps.push(rec); }
    save(); return { success: true };
  };
  routes["admin/store_delete"] = async function (c) {
    admin(); var id = Number(c.body.id);
    db.apps = db.apps.filter(function (a) { return a.id !== id; }); db.installs = db.installs.filter(function (i) { return i.appId !== id; }); save();
    return { success: true };
  };

  /* ----- Reaction Race practice rooms (computer opponents) ----- */
  var BOTS = ["Nova", "Pixel", "Turbo", "Blitz", "Echo", "Comet"];
  var CODE_CH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function newCode() { for (var k = 0; k < 50; k++) { var s = ""; for (var i = 0; i < 5; i++) s += CODE_CH[ri(CODE_CH.length)]; if (!db.rooms.some(function (r) { return r.code === s; })) return s; } return randomToken(6); }
  function roomOf(uid) { return db.rooms.find(function (r) { return r.players.some(function (p) { return p.userId === uid; }); }) || null; }
  function addBot(room) {
    var used = room.players.filter(function (p) { return p.isBot; }).map(function (p) { return p.displayName; });
    var name = BOTS.filter(function (n) { return used.indexOf(n) < 0; })[0] || ("Bot " + (room.players.length + 1));
    room.botSeq = (room.botSeq || 0) + 1;
    room.players.push({ userId: -room.botSeq, displayName: name, isHost: false, isBot: true, ready: true, finished: false, falseStart: false, dnf: false, reactionMs: null, botDelay: 0, botFalse: false });
  }
  function newRoom(u, isPublic, bots) {
    var room = { code: newCode(), hostId: u.id, isPublic: !!isPublic, maxPlayers: 4, status: "waiting", rev: 1, round: 0, goAt: null, deadline: null, results: null, messages: [], botSeq: 0, createdAt: now(),
      players: [{ userId: u.id, displayName: u.displayName, isHost: true, isBot: false, ready: true, finished: false, falseStart: false, dnf: false, reactionMs: null }] };
    for (var i = 0; i < bots; i++) addBot(room);
    db.rooms.push(room);
    if (db.rooms.length > 40) db.rooms = db.rooms.filter(function (r) { return now() - r.createdAt < 86400000; }).slice(-40);
    return room;
  }
  function pView(room, p) {
    var t = now(), done = p.finished, rms = p.reactionMs;
    if (p.isBot && room.status === "running") { done = !p.botFalse ? t >= room.goAt + p.botDelay : t >= room.goAt - 150; rms = done && !p.botFalse ? p.botDelay : null; }
    return { userId: p.userId, displayName: p.displayName, isHost: p.isHost, ready: p.ready, finished: room.status === "waiting" ? false : done, falseStart: p.falseStart, reactionMs: rms };
  }
  function view(room) {
    return { code: room.code, status: room.status, rev: room.rev, serverNow: now(), hostId: room.hostId, isPublic: room.isPublic, maxPlayers: room.maxPlayers, round: room.round, goAt: room.goAt, deadline: room.deadline, players: room.players.map(function (p) { return pView(room, p); }), results: room.status === "finished" ? room.results : null };
  }
  function finalize(room) {
    var t = now();
    room.players.forEach(function (p) {
      if (p.isBot) { p.finished = true; p.falseStart = !!p.botFalse; p.reactionMs = p.botFalse ? null : p.botDelay; p.dnf = false; }
      else if (!p.finished) { p.finished = true; p.dnf = true; p.falseStart = false; p.reactionMs = null; }
    });
    var res = room.players.map(function (p) {
      var bad = p.falseStart || p.dnf || p.reactionMs == null;
      return { userId: p.userId, displayName: p.displayName, falseStart: !!p.falseStart, dnf: !!p.dnf, reactionMs: p.reactionMs, score: bad ? 0 : Math.max(0, 1000 - p.reactionMs) };
    });
    res.sort(function (a, b) { return b.score - a.score || (a.reactionMs == null ? 1e9 : a.reactionMs) - (b.reactionMs == null ? 1e9 : b.reactionMs); });
    res.forEach(function (r, i) { r.rank = i + 1; });
    room.results = res; room.status = "finished"; room.rev++;
    res.forEach(function (r) {
      if (r.userId > 0) db.matches.push({ id: ++db.seq.match, userId: r.userId, game: "reaction-race", roomCode: room.code, rank: r.rank, players: res.length, score: r.score, finishedAt: new Date(t).toISOString() });
    });
  }
  function getRoom(code, u, mustBeMember) {
    code = String(code || "").trim().toUpperCase();
    var room = db.rooms.find(function (r) { return r.code === code; });
    if (!room || (mustBeMember && !room.players.some(function (p) { return p.userId === u.id; }))) fail(404, "Room not found.", "ROOM_NOT_FOUND");
    return room;
  }
  function joinRoom(room, u) {
    if (room.players.some(function (p) { return p.userId === u.id; })) return;
    if (room.status !== "waiting") fail(400, "That match has already started.", "ROOM_STARTED");
    if (room.players.length >= room.maxPlayers) {
      var bot = room.players.filter(function (p) { return p.isBot; })[0];
      if (!bot) fail(400, "That room is full.", "ROOM_FULL");
      room.players.splice(room.players.indexOf(bot), 1);
    }
    room.players.push({ userId: u.id, displayName: u.displayName, isHost: false, isBot: false, ready: false, finished: false, falseStart: false, dnf: false, reactionMs: null });
    room.rev++;
  }
  routes["rooms/list"] = async function () {
    var u = need(), mine = roomOf(u.id);
    return {
      currentRoom: mine ? mine.code : null,
      rooms: db.rooms.filter(function (r) { return r.isPublic && r.status === "waiting" && !r.players.some(function (p) { return p.userId === u.id; }); }).slice(-20).map(function (r) {
        var h = r.players.find(function (p) { return p.isHost; }); return { code: r.code, hostName: h ? h.displayName : "Host", players: r.players.length, maxPlayers: r.maxPlayers };
      })
    };
  };
  routes["rooms/create"] = async function (c) {
    var u = need(); if (roomOf(u.id)) fail(400, "You are already in a room. Leave it first.", "ALREADY_IN_ROOM");
    var room = newRoom(u, c.body.isPublic !== false, 2); save();
    return { room: view(room) };
  };
  routes["rooms/join"] = async function (c) {
    var u = need(), room = getRoom(c.body.code, u, false);
    var mine = roomOf(u.id); if (mine && mine.code !== room.code) fail(400, "You are already in another room. Leave it first.", "ALREADY_IN_ROOM");
    joinRoom(room, u); save();
    return { room: view(room) };
  };
  routes["rooms/quick_match"] = async function () {
    var u = need(), mine = roomOf(u.id); if (mine) return { room: view(mine) };
    var room = db.rooms.filter(function (r) { return r.isPublic && r.status === "waiting" && r.players.length < r.maxPlayers; })[0];
    if (room) joinRoom(room, u); else room = newRoom(u, true, 3);
    save(); return { room: view(room) };
  };
  routes["rooms/state"] = async function (c) {
    var u = need(), room = getRoom(c.query.code, u, true);
    return { room: view(room), messages: room.messages.slice(-100) };
  };
  routes["rooms/chat"] = async function (c) {
    var u = need(), room = getRoom(c.body.code, u, true), text = String(c.body.text || "").trim();
    if (!text) fail(400, "Type a message first.", "VALIDATION");
    if (text.length > 500) fail(400, "Messages can be up to 500 characters.", "VALIDATION");
    var msg = { id: ++db.seq.msg, userId: u.id, displayName: u.displayName, text: text, createdAt: now() };
    room.messages.push(msg); room.messages = room.messages.slice(-100); save();
    return { message: msg };
  };
  routes["rooms/action"] = async function (c) {
    var u = need(), room = getRoom(c.body.code, u, true), act = c.body.action, me_ = room.players.find(function (p) { return p.userId === u.id; }), host = room.hostId === u.id;
    var t = now();
    if (act === "ready" || act === "unready") {
      if (room.status !== "waiting") fail(400, "The match already started.", "BAD_STATE");
      me_.ready = act === "ready"; room.rev++;
    } else if (act === "start") {
      if (!host) fail(403, "Only the host can start.", "FORBIDDEN");
      if (room.status !== "waiting") fail(400, "The match already started.", "BAD_STATE");
      if (!room.players.every(function (p) { return p.isHost || p.ready; })) fail(400, "Waiting for everyone to press Ready.", "BAD_STATE");
      room.status = "running"; room.round++; room.results = null; room.goAt = t + Math.round(rnd(1800, 4200)); room.deadline = room.goAt + 3000;
      room.players.forEach(function (p) {
        p.finished = false; p.falseStart = false; p.dnf = false; p.reactionMs = null;
        if (p.isBot) { p.botFalse = Math.random() < 0.06; p.botDelay = Math.round(rnd(230, 560)); }
      });
      room.rev++;
    } else if (act === "tap") {
      if (room.status !== "running") fail(400, "There is no round in progress.", "BAD_STATE");
      if (!me_.finished) {
        if (t < room.goAt) { me_.falseStart = true; me_.reactionMs = null; } else { me_.reactionMs = t - room.goAt; }
        me_.finished = true; room.rev++;
        if (room.players.filter(function (p) { return !p.isBot; }).every(function (p) { return p.finished; })) finalize(room);
      }
    } else if (act === "resolve") {
      if (room.status === "running" && t >= room.deadline) finalize(room);
    } else if (act === "again") {
      if (!host) fail(403, "Only the host can start another round.", "FORBIDDEN");
      if (room.status !== "finished") fail(400, "The round isn't finished yet.", "BAD_STATE");
      room.status = "waiting"; room.results = null; room.goAt = null; room.deadline = null;
      room.players.forEach(function (p) { p.ready = p.isBot || p.isHost; p.finished = false; p.falseStart = false; p.dnf = false; p.reactionMs = null; });
      room.rev++;
    } else if (act === "kick") {
      if (!host) fail(403, "Only the host can remove players.", "FORBIDDEN");
      if (room.status === "running") fail(400, "You can't remove players during a round.", "BAD_STATE");
      var tid = Number(c.body.targetUserId), tp = room.players.find(function (p) { return p.userId === tid; });
      if (!tp || tp.isHost) fail(400, "That player can't be removed.", "BAD_STATE");
      room.players.splice(room.players.indexOf(tp), 1); room.rev++;
    } else if (act === "leave") {
      room.players = room.players.filter(function (p) { return p.userId !== u.id; });
      if (!room.players.some(function (p) { return !p.isBot; })) db.rooms = db.rooms.filter(function (r) { return r !== room; });
      else { if (host) { var nh = room.players.filter(function (p) { return !p.isBot; })[0]; nh.isHost = true; room.hostId = nh.userId; } room.rev++; if (room.status === "running" && room.players.filter(function (p) { return !p.isBot; }).every(function (p) { return p.finished; })) finalize(room); }
      save(); return { success: true };
    } else fail(400, "Unknown action.", "VALIDATION");
    save();
    return { room: view(room) };
  };

  routes["ping"] = async function () { return { ok: true }; };
  routes["_realtime/token"] = async function () { fail(404, "Live updates are not used in offline mode.", "OFFLINE"); };
  routes["_realtime/send"] = async function () { return { success: true }; };
  routes["_realtime/lastseen"] = async function () { return { lastSeen: {} }; };

  /* ---------- entry ---------- */
  window.__ouerLocalApi = async function (url, init) {
    try {
      var u = new URL(typeof url === "string" ? url : String(url), "https://localhost/");
      var path = u.pathname.replace(/^\/_api\//, "").replace(/\/+$/, "");
      var h = routes[path];
      if (!h) return json({ error: "Not found", code: "NOT_FOUND" }, 404);
      var q = {}; u.searchParams.forEach(function (v, k) { q[k] = v; });
      var out = await h({ body: parseBody(init), query: q, headers: new Headers((init && init.headers) || {}), method: ((init && init.method) || "GET").toUpperCase() });
      return json(out);
    } catch (e) {
      if (e instanceof Fail) return json({ error: e.message, code: e.code }, e.status);
      try { console.error("[offline api]", e); } catch (_) {}
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  };
  window.__ouerLocalApi.__reset = function () { db = fresh(); save(); };
})();
