// src/Chat.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from './components/Layout';
import { botUsers as botCatalog } from './participants';
// Import all media assets as URLs for sending from the assets folder
const assetModules = import.meta.glob('./assets/*.{jpg,jpeg,png,gif,webp,mp4,webm}', { eager: true, import: 'default', query: '?url' });
const allAssets = Object.entries(assetModules).map(([path, url]) => {
  const fileName = path.split('/').pop();
  const ext = (fileName?.split('.').pop() || '').toLowerCase();
  const imageExts = new Set(['jpg','jpeg','png','gif','webp']);
  const videoExts = new Set(['mp4','webm']);
  const fileType = imageExts.has(ext) ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : (videoExts.has(ext) ? `video/${ext}` : 'application/octet-stream');
  return { path, url, fileName: fileName || 'asset', fileType };
});

let socket; // module-level so reconnects preserve instance if desired

export default function Chat({ token, username, userId, onLogout }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState([]);
  const [text, setText] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [status, setStatus] = useState('connecting');
  const [currentRoom, setCurrentRoom] = useState('general');
  const [dmTarget, setDmTarget] = useState(null); // { username, userId } or null
  const [rooms, setRooms] = useState(['general', 'fashion', 'style', 'outfits', 'trending-fashion']);
  const [unreadCounts, setUnreadCounts] = useState({}); // { roomName: number, dm:userId:number }
  const [permissionRequested, setPermissionRequested] = useState(false);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentRoomRef = useRef(currentRoom);
  const dmTargetRef = useRef(dmTarget);
  // point to chat namespace
  const endpoint = 'http://localhost:3001/chat';
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notification, setNotification] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pendingTimersRef = useRef({});
  const dmListRef = useRef(null);

  useEffect(() => {
    // connect with token passed via auth
    socket = io(endpoint, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      // Allow default transports (websocket with polling fallback) to improve connectivity in restrictive environments
    });

    socket.on('connect', () => {
      setStatus('connected');
      // Auto-join all predefined rooms so participants receive fashion topics
      rooms.forEach((r) => socket.emit('join_room', { room: r }));
      // Also ensure the currently selected room is joined (redundant-safe)
      if (!dmTargetRef.current && currentRoomRef.current) {
        socket.emit('join_room', { room: currentRoomRef.current });
      }
    });
    socket.on('disconnect', (reason) => setStatus(`disconnected: ${reason || ''}`.trim()));
    socket.on('connect_error', (err) => {
      const message = err?.message || 'connect_error';
      setStatus(`error: ${message}`);
      // If server rejected auth (e.g., after server restart token is no longer valid), force re-login
      if (message === 'unauthorized') {
        try { if (typeof onLogout === 'function') onLogout(); } catch {}
      }
    });
    socket.on('reconnect_attempt', () => setStatus('reconnecting'));
    socket.on('reconnect', () => {
      setStatus('connected');
      rooms.forEach((r) => socket.emit('join_room', { room: r }));
      if (!dmTargetRef.current && currentRoomRef.current) {
        socket.emit('join_room', { room: currentRoomRef.current });
      }
    });

    socket.on('message_history', (history) => {
      setMessages(history || []);
      scrollToBottom();
    });

    socket.on('receive_message', (msg) => {
      const inCurrentScope = isMessageInScope(msg, currentRoom, dmTarget);
      setMessages((m) => {
        if (!inCurrentScope) return m;
        // de-duplicate by id (prevents duplicate after optimistic + broadcast)
        if (m.some(x => x.id === msg.id)) return m;
        return [...m, msg];
      });
      if (inCurrentScope) {
      scrollToBottom();
        // mark as read
        socket.emit('message_read', { messageId: msg.id, room: msg.room, toUserId: msg.toUserId });
      }
      // Notifications and unread counts
      if (!inCurrentScope) {
        incrementUnread(msg);
        playSound(1, 'message');
        showBrowserNotification(msg);
      } else if (document.hidden) {
        // Even if in scope but tab hidden, still notify
        playSound(1, 'message');
        showBrowserNotification(msg);
      }
    });

    socket.on('presence_update', (list) => {
      setPresence(list);
    });

    socket.on('room_user_joined', ({ room, username: who }) => {
      addSystemMessage(`${who} joined #${room}`);
      if (room !== currentRoom) incrementUnread({ room });
      playSound(0.6, 'join');
      showBrowserNotification({ text: `${who} joined #${room}` });
      showInAppNotification(`${who} joined #${room}`, 'join');
    });

    socket.on('room_user_left', ({ room, username: who }) => {
      addSystemMessage(`${who} left #${room}`);
      playSound(0.6, 'leave');
      showBrowserNotification({ text: `${who} left #${room}` });
      showInAppNotification(`${who} left #${room}`, 'leave');
    });

    socket.on('user_typing', ({ username: who, userId: whoId, isTyping, room, toUserId }) => {
      // filter typing indicator to current scope
      const inScope = (toUserId && dmTarget && (whoId === dmTarget.userId || toUserId === dmTarget.userId))
        || (room && room === currentRoom && !dmTarget)
        || (!room && !toUserId && !dmTarget);
      if (!inScope) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) next[who] = true;
        else delete next[who];
        return next;
      });
    });

    socket.on('message_read_update', ({ messageId, readBy }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readBy } : m));
    });

    socket.on('message_reaction_update', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    });

    socket.on('older_messages', ({ messages: older, hasMore: more }) => {
      setMessages(prev => [...older, ...prev]);
      setHasMore(!!more);
    });

    return () => {
      if (socket) socket.disconnect();
    };
    // eslint-disable-next-line
  }, [token]);

  // keep refs in sync with state for reconnect handlers
  useEffect(() => { currentRoomRef.current = currentRoom; }, [currentRoom]);
  useEffect(() => { dmTargetRef.current = dmTarget; }, [dmTarget]);

  // Check DM list overflow when presence or bot catalog changes
  useEffect(() => {
    checkDMListOverflow();
  }, [presence, botCatalog]);

  // Handle window resize for overflow detection
  useEffect(() => {
    const handleResize = () => {
      setTimeout(checkDMListOverflow, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // scroll helper
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    }, 100);
  };

  // send message to room or DM
  const send = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const payload = dmTarget ? { text: trimmed, toUserId: dmTarget.userId } : { text: trimmed, room: currentRoom };
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const optimistic = {
      id: tempId,
      sender: username,
      userId,
      text: trimmed,
      room: currentRoom,
      toUserId: dmTarget?.userId,
      timestamp: new Date().toISOString(),
      readBy: [userId],
      reactions: {},
      status: 'sending',
    };
    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();
    // send with ack to replace optimistic
    socket.emit('send_message', payload, (ack) => {
      if (ack?.ok && ack.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...ack.message } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      }
      if (pendingTimersRef.current[tempId]) {
        clearTimeout(pendingTimersRef.current[tempId]);
        delete pendingTimersRef.current[tempId];
      }
    });
    // timeout fallback to mark as failed if no ack
    pendingTimersRef.current[tempId] = setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      delete pendingTimersRef.current[tempId];
    }, 7000);
    setText('');
    socket.emit('typing', { isTyping: false, room: dmTarget ? undefined : currentRoom, toUserId: dmTarget?.userId });
  };

  const retrySend = (tempId) => {
    const msg = messages.find(m => m.id === tempId);
    if (!msg || !msg.text) return;
    // reset status to sending
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sending' } : m));
    const payload = msg.toUserId ? { text: msg.text, toUserId: msg.toUserId } : { text: msg.text, room: msg.room };
    socket.emit('send_message', payload, (ack) => {
      if (ack?.ok && ack.message) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...ack.message } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      }
      if (pendingTimersRef.current[tempId]) {
        clearTimeout(pendingTimersRef.current[tempId]);
        delete pendingTimersRef.current[tempId];
      }
    });
    pendingTimersRef.current[tempId] = setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      delete pendingTimersRef.current[tempId];
    }, 7000);
  };

  // handle typing (scoped)
  useEffect(() => {
    if (!socket) return;
    const isTyping = text.length > 0;
    if (dmTarget) {
      socket.emit('typing', { isTyping, toUserId: dmTarget.userId });
    } else {
      socket.emit('typing', { isTyping, room: currentRoom });
    }
  }, [text, currentRoom, dmTarget]);

  const isMessageInScope = (msg, room, dm) => {
    if (dm) return msg.toUserId ? (msg.toUserId === dm.userId || msg.userId === dm.userId) : false;
    if (room) return msg.room ? msg.room === room : !msg.toUserId; // allow global messages if no room set
    return true;
  };

  const joinRoom = (room) => {
    setDmTarget(null);
    setCurrentRoom(room);
    setSearchResults([]);
    socket.emit('join_room', { room });
    // mark room as read
    setUnreadCounts((prev) => ({ ...prev, [room]: 0 }));
  };

  const startDm = (target) => {
    setCurrentRoom(null);
    setDmTarget(target);
    setSearchResults([]);
    // mark DM as read
    setUnreadCounts((prev) => ({ ...prev, [target.userId]: 0 }));
    // Seed a first-time conversation when opening a DM with a known bot
    const isBot = Array.isArray(botCatalog) && botCatalog.some(b => b.userId === target.userId);
    if (isBot && socket) {
      socket.emit('seed_dm', { toUserId: target.userId });
    }
  };

  // Pagination: load older messages when scrolled to top
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    const onScroll = () => {
      if (el.scrollTop <= 0 && hasMore && !isLoadingHistory) {
        const first = getFirstMessageInScope();
        if (!first) return;
        setIsLoadingHistory(true);
        const payload = dmTarget
          ? { toUserId: dmTarget.userId, before: first.timestamp, limit: 30 }
          : { room: currentRoom, before: first.timestamp, limit: 30 };
        socket.emit('load_messages', payload, (res) => {
          setIsLoadingHistory(false);
          if (!res?.ok) return;
          setMessages(prev => [...(res.messages || []), ...prev]);
          setHasMore(!!res.hasMore);
        });
      }
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [messagesRef, hasMore, isLoadingHistory, currentRoom, dmTarget]);

  const getFirstMessageInScope = () => {
    const filtered = messages.filter(m => isMessageInScope(m, currentRoom, dmTarget));
    return filtered.length > 0 ? filtered[0] : null;
  };

  // Search
  const performSearch = () => {
    const q = searchQuery.trim();
    if (!q) { setSearchResults([]); return; }
    const payload = dmTarget ? { q, toUserId: dmTarget.userId, limit: 100 } : { q, room: currentRoom, limit: 100 };
    socket.emit('search_messages', payload, (res) => {
      if (!res?.ok) return setSearchResults([]);
      setSearchResults(res.messages || []);
    });
  };

  // Helpers: notifications
  const addSystemMessage = (text) => {
    setMessages((m) => [...m, {
      id: `sys-${Date.now()}`,
      sender: 'system',
      userId: 'system',
      text,
      timestamp: new Date().toISOString(),
    }]);
  };

  const incrementUnread = (msg) => {
    setUnreadCounts((prev) => {
      const key = msg.toUserId ? msg.userId === userId ? msg.toUserId : msg.userId : (msg.room || 'global');
      const next = { ...prev };
      next[key] = (next[key] || 0) + 1;
      return next;
    });
  };

  const ensurePermission = async () => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    if (permissionRequested) return false;
    setPermissionRequested(true);
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } finally {
      setTimeout(() => setPermissionRequested(false), 1000);
    }
  };

  const showInAppNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const showBrowserNotification = async (msg) => {
    try {
      const ok = await ensurePermission();
      if (!ok) return;
      const title = msg.sender ? `New message from ${msg.sender}` : 'TrendNet';
      const body = msg.text || (msg.file ? `File: ${msg.file.fileName}` : '');
      const n = new Notification(title, { body });
      setTimeout(() => n.close(), 4000);
      
      // Also show in-app notification
      showInAppNotification(`${msg.sender}: ${msg.text || 'Sent a file'}`, 'message');
    } catch {}
  };

  const playSound = (volume = 1, type = 'message') => {
    if (!soundEnabled) return;
    
    try {
      // Different sound frequencies for different notification types
      const soundConfig = {
        message: { freq: 880, duration: 180 },
        join: { freq: 660, duration: 150 },
        leave: { freq: 440, duration: 200 },
        notification: { freq: 1100, duration: 120 },
        error: { freq: 220, duration: 300 }
      };
      
      const config = soundConfig[type] || soundConfig.message;
      
      if (audioRef.current) {
        audioRef.current.volume = volume;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // fallback to Web Audio API
          playWebAudioSound(config.freq, config.duration, volume);
        });
      } else {
        // Web Audio API beep
        playWebAudioSound(config.freq, config.duration, volume);
      }
    } catch {}
  };

  const playWebAudioSound = (frequency, duration, volume) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = frequency;
      g.gain.value = 0.02 * volume;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => { o.stop(); ctx.close(); }, duration);
    } catch {}
  };

  // Check if DM list has overflow and add visual indicator
  const checkDMListOverflow = () => {
    if (dmListRef.current) {
      const hasOverflow = dmListRef.current.scrollHeight > dmListRef.current.clientHeight;
      dmListRef.current.classList.toggle('has-overflow', hasOverflow);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();
  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : undefined;
      const payload = {
        fileName: file.name,
        fileType: file.type,
        dataUrl,
      };
      if (dmTarget) payload.toUserId = dmTarget.userId; else payload.room = currentRoom;
      socket.emit('send_file', payload);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Send an asset by URL (for images/videos in src/assets)
  const sendAsset = (assetPath, mime) => {
    if (!assetPath) return;
    const payload = {
      fileName: assetPath.split('/').pop() || 'asset',
      fileType: typeof mime === 'string' ? mime : '',
      url: assetPath,
    };
    if (dmTarget) payload.toUserId = dmTarget.userId; else payload.room = currentRoom;
    socket.emit('send_file', payload);
  };

  const react = (messageId, emoji, add = true) => {
    const payload = { messageId, emoji, add };
    if (dmTarget) payload.toUserId = dmTarget.userId; else payload.room = currentRoom;
    socket.emit('react_message', payload);
  };

  return (
    <Layout>
      {/* In-App Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="notification-close">×</button>
        </div>
      )}

      <div className="chat-container">
        {/* Side Panel */}
        <div className="side-panel">
          {/* Brand Header */}
          <div className="brand-header">
            <h1 className="brand-title">TrendNet</h1>
            <div className="status-indicator">
              <div className={`status-dot ${status.includes('connected') ? '' : status.includes('connecting') ? 'connecting' : 'disconnected'}`}></div>
              <span>{status}</span>
            </div>
            <div className="user-info">You: {username}</div>
          </div>

          {/* Rooms Section */}
          <div className="nav-section">
            <h2 className="nav-title">Rooms</h2>
            <ul className="nav-list">
              {rooms.map(r => (
                <li key={r} className="nav-item">
                  <button 
                    onClick={() => joinRoom(r)} 
                    className={`nav-button ${currentRoom === r ? 'active' : ''}`}
                  >
                    #{r}
                    {unreadCounts[r] > 0 && (
                      <span className="unread-badge">{unreadCounts[r]}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Messages Section */}
          <div className="nav-section dm-section">
            <h2 className="nav-title">Direct Messages</h2>
            <ul className="nav-list" ref={dmListRef}>
              {/* Online users */}
              {presence.filter(p => p.userId !== userId).map(p => (
                <li key={`u-${p.userId}`} className="nav-item">
                  <button 
                    onClick={() => startDm(p)} 
                    className={`nav-button ${dmTarget?.userId === p.userId ? 'active' : ''}`}
                  >
                    <div className="bot-avatar" style={{
                      background: 'linear-gradient(135deg, #f9a8d4, #ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                    @{p.username}
                    {unreadCounts[p.userId] > 0 && (
                      <span className="unread-badge">{unreadCounts[p.userId]}</span>
                    )}
                  </button>
                </li>
              ))}
              
              {/* Fashion model bots */}
              {Array.isArray(botCatalog) && botCatalog.map(bot => {
                const avatarPath = `./assets/${bot.username}.jpg`;
                const avatarUrl = assetModules[avatarPath] || null;
                
                return (
                  <li key={`b-${bot.userId}`} className="nav-item">
                    <button 
                      onClick={() => startDm(bot)} 
                      className={`nav-button ${dmTarget?.userId === bot.userId ? 'active' : ''}`}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={bot.username} className="bot-avatar" />
                      ) : (
                        <div className="bot-avatar" style={{
                          background: 'linear-gradient(135deg, #f9a8d4, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {bot.username.charAt(1).toUpperCase()}
                        </div>
                      )}
                      {bot.username}
                      {unreadCounts[bot.userId] > 0 && (
                        <span className="unread-badge">{unreadCounts[bot.userId]}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Logout Button */}
          <div style={{ padding: '20px', marginTop: 'auto' }}>
            <button 
              onClick={() => { onLogout(); if (socket) socket.disconnect(); }}
              className="action-button"
              style={{ width: '100%' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {/* Chat Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 className="chat-title">
                {dmTarget ? (
                  <>
                    {dmTarget.username.startsWith('@') ? '' : '@'}{dmTarget.username}
                    {dmTarget && (
                      <button
                        onClick={() => navigate(`/profile/${encodeURIComponent(dmTarget.username)}`)}
                        title="View profile"
                        className="action-button"
                        style={{ marginLeft: '12px', fontSize: '12px' }}
                      >
                        View Profile
                      </button>
                    )}
                  </>
                ) : (
                  `#${currentRoom || 'global'}`
                )}
              </h2>
            </div>
            
            <div className="chat-actions">
              <input
                className="search-input"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') performSearch(); }}
              />
              <button onClick={performSearch} className="action-button">Search</button>
              <button onClick={onPickFile} className="action-button">Attach</button>
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className={`action-button ${soundEnabled ? 'sound-on' : 'sound-off'}`}
                title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={onFileSelected} />
              
              {/* Assets Dropdown */}
              <div style={{position:'relative'}}>
                <details>
                  <summary className="action-button" style={{cursor:'pointer'}}>Assets</summary>
                  <div style={{
                    position:'absolute',
                    right:0,
                    top:'100%',
                    zIndex:10,
                    background:'white',
                    border:'1px solid var(--light-gray)',
                    padding:'16px',
                    maxHeight:'260px',
                    overflow:'auto',
                    width:'280px',
                    maxWidth:'calc(100vw - 40px)',
                    boxShadow:'0 4px 12px rgba(0,0,0,0.08)',
                    borderRadius:'12px',
                    marginTop:'8px'
                  }}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(80px, 1fr))',gap:'8px',maxWidth:'100%'}}>
                      {allAssets.map(a => (
                        <button 
                          key={a.path} 
                          onClick={() => sendAsset(a.url, a.fileType)} 
                          title={a.fileName} 
                          style={{
                            all:'unset',
                            cursor:'pointer',
                            borderRadius:'8px',
                            overflow:'hidden',
                            transition:'transform 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          {a.fileType.startsWith('image/') ? (
                            <img 
                              src={a.url} 
                              alt={a.fileName} 
                              style={{
                                width:'80px',
                                height:'60px',
                                objectFit:'cover',
                                border:'1px solid var(--light-gray)',
                                borderRadius:'8px'
                              }} 
                            />
                          ) : (
                            <div style={{
                              width:'80px',
                              height:'60px',
                              display:'flex',
                              alignItems:'center',
                              justifyContent:'center',
                              border:'1px solid var(--light-gray)',
                              borderRadius:'8px',
                              fontSize:'12px',
                              background:'var(--soft-gray)'
                            }}>
                              Video
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div 
            ref={messagesRef} 
            className="messages-container"
            style={{ scrollBehavior: 'smooth' }}
          >
            {isLoadingHistory && <div className="loading-indicator">Loading...</div>}
            
            {(searchResults.length > 0 ? searchResults : messages.filter(m => isMessageInScope(m, currentRoom, dmTarget))).map(m => {
              const isUser = m.userId === userId;
              const isBot = Array.isArray(botCatalog) && botCatalog.some(b => b.userId === m.userId);
              const avatarPath = isBot ? `./assets/${m.sender}.jpg` : null;
              const avatarUrl = avatarPath ? assetModules[avatarPath] : null;
              
              if (m.sender === 'system') {
                return (
                  <div key={m.id} className="system-message">
                    {m.text}
                  </div>
                );
              }
              
              return (
                <div key={m.id} className="message-group">
                  <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
                    {!isUser && (
                      <div className="message-sender">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={m.sender} className="bot-avatar" />
                        ) : (
                          <div className="bot-avatar" style={{
                            background: 'linear-gradient(135deg, #f9a8d4, #ec4899)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {m.sender.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {m.sender}
                      </div>
                    )}
                    
                    <div className="message-content">
                      {m.text && <div>{m.text}</div>}
                      {m.file && (
                        <div className="message-media">
                          {(() => {
                            const src = m.file.dataUrl || m.file.url;
                            const type = m.file.fileType || '';
                            if (!src) return null;
                            if (type.startsWith('image/')) {
                              return <img src={src} alt={m.file.fileName} />;
                            }
                            if (type.startsWith('video/')) {
                              return <video controls src={src} />;
                            }
                            return <a href={src} target="_blank" rel="noreferrer">{m.file.fileName}</a>;
                          })()}
                        </div>
                      )}
                    </div>
                    
                    <div className="message-time">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {/* Message Reactions */}
                    <div className="message-reactions">
                      <button 
                        onClick={() => react(m.id, '👍', !(m.reactions?.['👍']?.includes(userId)))}
                        className="reaction-button"
                      >
                        👍
                      </button>
                      <button 
                        onClick={() => react(m.id, '❤️', !(m.reactions?.['❤️']?.includes(userId)))}
                        className="reaction-button"
                      >
                        ❤️
                      </button>
                      <button 
                        onClick={() => react(m.id, '😂', !(m.reactions?.['😂']?.includes(userId)))}
                        className="reaction-button"
                      >
                        😂
                      </button>
                      
                      {m.reactions && Object.entries(m.reactions).some(([emoji, who]) => who.length > 0) && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {Object.entries(m.reactions).map(([emoji, who]) => 
                            who.length > 0 ? (
                              <span key={emoji} className="reaction-count">
                                {emoji} {who.length}
                              </span>
                            ) : null
                          ).filter(Boolean)}
                        </div>
                      )}
                      
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--medium-gray)' }}>
                        Read by {m.readBy ? m.readBy.length : 0}
                      </span>
                      
                      {m.status === 'sending' && (
                        <span style={{ fontSize: '11px', color: 'var(--medium-gray)' }}>Sending…</span>
                      )}
                      {m.status === 'failed' && (
                        <span style={{ fontSize: '11px', color: '#c62828' }}>
                          Failed
                          <button 
                            style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--medium-pink)' }}
                            onClick={() => retrySend(m.id)}
                          >
                            Retry
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="input-container">
            <div className="typing-indicator">
              {Object.keys(typingUsers).length > 0 && (
                <span>
                  {Object.keys(typingUsers).join(', ')} {Object.keys(typingUsers).length === 1 ? 'is' : 'are'} typing...
                </span>
              )}
            </div>

            <div className="input-group">
              <textarea
                ref={inputRef}
                className="message-input"
                placeholder="Write a message..."
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { 
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send(); 
                  }
                }}
                rows={1}
                style={{
                  resize: 'none',
                  overflow: 'hidden',
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button onClick={send} className="send-button">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Audio for notifications */}
      <audio ref={audioRef} src="data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCA//////////////////////////////////////////8AAAACcQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==" />
    </Layout>
  );
}
 
