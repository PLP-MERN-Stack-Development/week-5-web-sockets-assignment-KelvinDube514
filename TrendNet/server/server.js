// TrendNet advanced chat server
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import botManagerModule from './botManager.js';
import { fashionBots } from './botManager.js';

dotenv.config();

const { initBots } = botManagerModule || {};

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*'},
});

// In-memory stores (demo only)
const tokensToUsers = new Map(); // token -> { userId, username }
const onlineUsers = new Map(); // userId -> { username, sockets: Set<socketId> }
const messages = []; // array of message objects

// Demo bot users mapping to support DM detection in bot manager
const botUsers = [
  { username: '@Addison_Jane', userId: 'bot-addison_jane' },
  { username: '@Aisha_Cairo', userId: 'bot-aisha_cairo' },
  { username: '@Bella_Boho', userId: 'bot-bella_boho' },
  { username: '@Breezy_Bea', userId: 'bot-breezy_bea' },
  { username: '@Brooklyn_May', userId: 'bot-brooklyn_may' },
  { username: '@Carmen_Rio', userId: 'bot-carmen_rio' },
  { username: '@Chloe_Chic', userId: 'bot-chloe_chic' },
  { username: '@Evelyn_May', userId: 'bot-evelyn_may' },
  { username: '@Foxy_Fiona', userId: 'bot-foxy_fiona' },
  { username: '@Glam_Gigi', userId: 'bot-glam_gigi' },
  { username: '@Grace_Glimpse', userId: 'bot-grace_glimpse' },
  { username: '@Isabella_Madrid', userId: 'bot-isabella_madrid' },
  { username: '@Lily_Luxe', userId: 'bot-lily_luxe' },
  { username: '@Luna_Belle', userId: 'bot-luna_belle' },
  { username: '@Lush_Lina', userId: 'bot-lush_lina' },
  { username: '@LuxeLane_Official', userId: 'bot-luxelane_official' },
  { username: '@Miyabi_K', userId: 'bot-miyabi_k' },
];

// Helpers
function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = 'msg') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistMessage(base) {
  const message = {
    id: makeId('m'),
    sender: base.sender,
    userId: base.userId,
    text: base.text,
    file: base.file,
    room: base.room,
    toUserId: base.toUserId,
    timestamp: base.timestamp || nowIso(),
    readBy: Array.isArray(base.readBy) ? base.readBy.slice() : [],
    reactions: base.reactions || {},
  };
  messages.push(message);
  return message;
}

function appendAndEmitMessage(base) {
  const persisted = persistMessage({ ...base, timestamp: nowIso() });
  if (persisted.toUserId) {
    // DM: emit to both participants
    chat.to(userRoom(persisted.toUserId)).emit('receive_message', persisted);
    chat.to(userRoom(persisted.userId)).emit('receive_message', persisted);
  } else if (persisted.room) {
    chat.to(String(persisted.room)).emit('receive_message', persisted);
  } else {
    chat.emit('receive_message', persisted);
  }
  return persisted;
}

// Seed initial fashion conversations across rooms (only once per process)
function seedInitialConversations() {
  try {
    if (messages.length > 0) return; // already have history; skip

    const byUsername = new Map((fashionBots || []).map((b) => [b.username, b]));
    const say = (username, room, text) => {
      const persona = byUsername.get(username);
      if (!persona) return;
      appendAndEmitMessage({
        sender: persona.username,
        userId: persona.userId,
        text,
        room,
        toUserId: undefined,
        readBy: [],
        reactions: {},
      });
    };

    // #general
    say('@Addison_Jane', 'general', 'Welcome to TrendNet! What trends are you loving this week?');
    say('@Brooklyn_May', 'general', 'Streetwear with tailored layers is having a moment. Oversized blazer + sneakers = chef\'s kiss.');
    say('@Evelyn_May', 'general', 'Timeless silhouettes with modern accents will never fail you. Pearls with denim? Yes please.');
    say('@Foxy_Fiona', 'general', 'Bold red is the color of the week. Lip, heel, or trench—pick your statement.');

    // #fashion
    say('@Glam_Gigi', 'fashion', 'Metallics at daytime are IN. Style a liquid-sheen skirt with a crisp tee for balance.');
    say('@Aisha_Cairo', 'fashion', 'Monochrome looks feel effortless. Try caramel-on-caramel with gold jewelry.');
    say('@Carmen_Rio', 'fashion', 'Vibrant rhythm in fashion: ruffles, movement, and a pop of coral. Dance through the day.');
    say('@Grace_Glimpse', 'fashion', 'Soft chiffon layers create dreamy dimension without bulk—floaty, ethereal, wearable.');

    // #style
    say('@Chloe_Chic', 'style', 'Style tip: build from clean lines. A tailored trouser anchors almost any outfit.');
    say('@Lily_Luxe', 'style', 'Refine with luxe essentials: cashmere crew, structured tote, sleek loafers.');
    say('@Isabella_Madrid', 'style', 'European street style: sharp sunglasses, leather belt, and confident stride.');
    say('@Luna_Belle', 'style', 'Romantic detail of the day: lace trim peeking beneath a chunky knit.');

    // #outfits
    say('@Bella_Boho', 'outfits', 'OOTD: crochet vest, satin slip, western boots. Eclectic, airy, fun.');
    say('@Breezy_Bea', 'outfits', 'Picnic look: linen shorts, baby tee, bucket hat, woven tote—breeze approved.');
    say('@Addison_Jane', 'outfits', 'Desk-to-dinner: column dress + leather jacket + sculptural earrings.');
    say('@Brooklyn_May', 'outfits', 'Night out: cargo maxi, asymmetrical top, platform sneakers—city-ready.');

    // #trending-fashion
    say('@Glam_Gigi', 'trending-fashion', '🔥 Y2K is BACK and bigger than ever! Low-rise jeans, crop tops, and chunky highlights are dominating the runway.');
    say('@Miyabi_K', 'trending-fashion', '✨ Japanese street style is going viral! Oversized silhouettes, layering, and the "clean girl" aesthetic are everywhere.');
    say('@Foxy_Fiona', 'trending-fashion', '💅 "Barbiecore" is the hottest trend right now! Pink everything - from head to toe. Who else is obsessed?');
    say('@Carmen_Rio', 'trending-fashion', '🌺 Tropical prints and vibrant colors are taking over! Think palm leaves, hibiscus, and sunset gradients.');
    say('@Luna_Belle', 'trending-fashion', '🌟 Cottagecore meets modern minimalism! Soft florals, vintage-inspired pieces, and sustainable fashion are trending hard.');
    say('@Brooklyn_May', 'trending-fashion', '⚡ Athleisure 2.0 is here! Think luxury activewear, elevated loungewear, and streetwear with a sophisticated twist.');
    say('@Addison_Jane', 'trending-fashion', '🎯 Micro-trends alert! "Quiet luxury" is everywhere - think understated elegance, neutral tones, and investment pieces.');
    say('@Isabella_Madrid', 'trending-fashion', '🇪🇸 European fashion is influencing global trends! Think tailored blazers, structured bags, and sophisticated minimalism.');
    say('@Lily_Luxe', 'trending-fashion', '💎 "Old Money" aesthetic is trending! Classic silhouettes, quality fabrics, and timeless elegance are back in a big way.');
  } catch {
    // ignore seeding errors
  }
}

function userRoom(userId) {
  return `u:${userId}`;
}

function emitPresence() {
  const list = Array.from(onlineUsers.entries()).map(([userId, info]) => ({ userId, username: info.username.replace(/^@/, '') }));
  chat.emit('presence_update', list);
}

// In-memory user store (demo only)
const users = new Map(); // username -> { userId, email, password }

// Register endpoint
app.post('/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const formattedUsername = username.startsWith('@') ? username : `@${username}`;
  
  if (users.has(formattedUsername)) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const token = `tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  
  users.set(formattedUsername, { userId, email, password });
  tokensToUsers.set(token, { userId, username: formattedUsername });
  
  res.json({ token, username: formattedUsername, userId });
});

// Login endpoint (username-only auth for demo, or full auth for registered users)
app.post('/login', (req, res) => {
  const raw = String(req.body?.username || '').trim();
  if (!raw) return res.status(400).json({ error: 'username required' });
  
  const username = raw.startsWith('@') ? raw : `@${raw}`;
  
  // Check if user exists in registered users
  const user = users.get(username);
  if (user) {
    // For registered users, check password if provided
    const password = String(req.body?.password || '');
    if (password && password !== user.password) {
      return res.status(400).json({ error: 'Invalid password' });
    }
  }
  
  const userId = user ? user.userId : `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const token = `tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  tokensToUsers.set(token, { userId, username });
  
  res.json({ token, username, userId });
});

// Chat namespace
const chat = io.of('/chat');

// Integrate bot manager (auto-replies in fashion rooms and DM to bots)
if (typeof initBots === 'function') {
  initBots(chat, { appendAndEmitMessage, botUsers });
}

// Seed initial conversations once the namespace exists
seedInitialConversations();

chat.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers['x-auth-token'];
  const user = tokensToUsers.get(String(token || ''));
  if (!user) return next(new Error('unauthorized'));
  socket.data.user = user; // attach to socket
  next();
});

chat.on('connection', (socket) => {
  const { userId, username } = socket.data.user;
  // track socket in a per-user room to ease DM emission
  socket.join(userRoom(userId));

  // Presence tracking
  let entry = onlineUsers.get(userId);
  if (!entry) {
    entry = { username, sockets: new Set() };
    onlineUsers.set(userId, entry);
  }
  entry.sockets.add(socket.id);
  emitPresence();

  // Initial history (empty or last N of general)
  const initial = messages.slice(-50);
  socket.emit('message_history', initial);

  // Join room
  socket.on('join_room', ({ room } = {}) => {
    const roomName = String(room || '').trim();
    if (!roomName) return;
    socket.join(roomName);
    chat.to(roomName).emit('room_user_joined', { room: roomName, username });
  });

  // Send message (room or DM). Ack with saved message
  socket.on('send_message', (payload = {}, ack) => {
    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) return typeof ack === 'function' && ack({ ok: false, error: 'empty' });
    const toUserId = payload.toUserId ? String(payload.toUserId) : undefined;
    const room = !toUserId && payload.room ? String(payload.room) : undefined;

    const saved = appendAndEmitMessage({
      sender: username,
      userId,
      text,
      room,
      toUserId,
      readBy: [userId],
      reactions: {},
    });
    if (typeof ack === 'function') ack({ ok: true, message: saved });
  });

  // Send file
  socket.on('send_file', (payload = {}, ack) => {
    const hasName = typeof payload?.fileName === 'string' && payload.fileName.trim().length > 0;
    if (!hasName) return typeof ack === 'function' && ack({ ok: false, error: 'no_file' });

    const file = {
      fileName: String(payload.fileName),
      fileType: String(payload.fileType || ''),
      dataUrl: typeof payload.dataUrl === 'string' ? payload.dataUrl : undefined,
      url: typeof payload.url === 'string' ? payload.url : undefined,
    };
    if (!file.dataUrl && !file.url) {
      return typeof ack === 'function' && ack({ ok: false, error: 'no_file_data' });
    }
    const toUserId = payload.toUserId ? String(payload.toUserId) : undefined;
    const room = !toUserId && payload.room ? String(payload.room) : undefined;
    const saved = appendAndEmitMessage({
      sender: username,
      userId,
      file,
      room,
      toUserId,
      readBy: [userId],
      reactions: {},
    });
    if (typeof ack === 'function') ack({ ok: true, message: saved });
  });

  // Typing indicator
  socket.on('typing', ({ isTyping, room, toUserId } = {}) => {
    const payload = { username: username.replace(/^@/, ''), userId, isTyping: !!isTyping };
    if (toUserId) {
      payload.toUserId = String(toUserId);
      chat.to(userRoom(String(toUserId))).emit('user_typing', payload);
    } else if (room) {
      payload.room = String(room);
      socket.to(String(room)).emit('user_typing', payload);
    } else {
      socket.broadcast.emit('user_typing', payload);
    }
  });

  // Read receipts
  socket.on('message_read', ({ messageId } = {}) => {
    const id = String(messageId || '');
    const msg = messages.find(m => m.id === id);
    if (!msg) return;
    if (!Array.isArray(msg.readBy)) msg.readBy = [];
    if (!msg.readBy.includes(userId)) msg.readBy.push(userId);
    const update = { messageId: msg.id, readBy: msg.readBy };
    if (msg.toUserId) {
      chat.to(userRoom(msg.toUserId)).emit('message_read_update', update);
      chat.to(userRoom(msg.userId)).emit('message_read_update', update);
    } else if (msg.room) {
      chat.to(String(msg.room)).emit('message_read_update', update);
    } else {
      chat.emit('message_read_update', update);
    }
  });

  // Reactions
  socket.on('react_message', ({ messageId, emoji, add = true } = {}) => {
    const id = String(messageId || '');
    const msg = messages.find(m => m.id === id);
    if (!msg || !emoji) return;
    if (!msg.reactions) msg.reactions = {};
    const arr = msg.reactions[emoji] || [];
    const idx = arr.indexOf(userId);
    if (add && idx === -1) arr.push(userId);
    if (!add && idx !== -1) arr.splice(idx, 1);
    msg.reactions[emoji] = arr;
    const update = { messageId: msg.id, reactions: msg.reactions };
    if (msg.toUserId) {
      chat.to(userRoom(msg.toUserId)).emit('message_reaction_update', update);
      chat.to(userRoom(msg.userId)).emit('message_reaction_update', update);
    } else if (msg.room) {
      chat.to(String(msg.room)).emit('message_reaction_update', update);
    } else {
      chat.emit('message_reaction_update', update);
    }
  });

  // Seed a simple first-time DM conversation with a bot model
  socket.on('seed_dm', ({ toUserId } = {}, ack) => {
    try {
      const bot = botUsers.find((b) => String(b.userId) === String(toUserId));
      if (!bot) return typeof ack === 'function' && ack({ ok: false, error: 'not_a_bot' });

      // Check if there are already any messages in this DM scope
      const existing = messages.some(
        (m) => (m.toUserId === String(toUserId) && m.userId === userId) || (m.userId === String(toUserId) && m.toUserId === userId)
      );
      if (existing) return typeof ack === 'function' && ack({ ok: true, alreadySeeded: true });

      // Try to get the bot persona style if available
      const persona = Array.isArray(fashionBots)
        ? fashionBots.find((p) => p.userId === bot.userId)
        : undefined;

      const intro = `Hi there! I'm ${bot.username.replace(/^@/, '')}${persona?.style ? ` — ${persona.style}` : ''}.`;
      const line2 = 'I love chatting about fashion trends, personal style, and outfit ideas.';
      const line3 = 'What look are you going for today? Streetwear, minimalist chic, or something bold?';

      [intro, line2, line3].forEach((text) => {
        appendAndEmitMessage({
          sender: bot.username,
          userId: bot.userId,
          text,
          toUserId: userId,
          room: undefined,
          readBy: [],
          reactions: {},
        });
      });

      if (typeof ack === 'function') ack({ ok: true, seeded: true });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: 'seed_failed' });
    }
  });

  // Pagination
  socket.on('load_messages', ({ room, toUserId, before, limit = 30 } = {}, ack) => {
    let scoped = messages.filter((m) => {
      if (toUserId) return (m.toUserId === String(toUserId) && (m.userId === userId || m.toUserId === userId)) || (m.userId === String(toUserId) && m.toUserId === userId);
      if (room) return m.room === String(room);
      return !m.room && !m.toUserId;
    });
    if (before) {
      const t = Date.parse(before);
      if (!Number.isNaN(t)) scoped = scoped.filter(m => Date.parse(m.timestamp) < t);
    }
    scoped.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const slice = scoped.slice(-limit);
    const hasMore = scoped.length > slice.length;
    if (typeof ack === 'function') ack({ ok: true, messages: slice, hasMore });
    else socket.emit('older_messages', { messages: slice, hasMore });
  });

  // Search
  socket.on('search_messages', ({ q, room, toUserId, limit = 100 } = {}, ack) => {
    const query = String(q || '').toLowerCase();
    if (!query) return typeof ack === 'function' && ack({ ok: true, messages: [] });
    let scoped = messages.filter((m) => {
      if (toUserId) return (m.toUserId === String(toUserId) && (m.userId === userId || m.toUserId === userId)) || (m.userId === String(toUserId) && m.toUserId === userId);
      if (room) return m.room === String(room);
      return !m.room && !m.toUserId;
    });
    scoped = scoped.filter((m) => (m.text || '').toLowerCase().includes(query));
    scoped.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
    const result = scoped.slice(-limit);
    if (typeof ack === 'function') ack({ ok: true, messages: result });
  });

  socket.on('disconnect', () => {
    const entryNow = onlineUsers.get(userId);
    if (entryNow) {
      entryNow.sockets.delete(socket.id);
      if (entryNow.sockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }
    emitPresence();
    // Notify rooms this socket was in
    const rooms = Array.from(socket.rooms || []);
    rooms.forEach((r) => {
      if (r && !r.startsWith('u:')) chat.to(r).emit('room_user_left', { room: r, username });
    });
  });
});

const PORT = Number(process.env.PORT || 3001);
httpServer.listen(PORT, () => {
  console.log(`TrendNet chat server listening on http://localhost:${PORT}`);
});