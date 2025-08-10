import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import participantsCatalog from './participants';

// Import all media for participants that start with '@'
// We will filter by the specific handle later
const allMedia = import.meta.glob('./assets/@*.{jpg,jpeg,png,gif,mp4,webm,ogg,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function collectMediaForHandle(handle) {
  const entries = Object.entries(allMedia).map(([path, url]) => {
    const file = path.split('/').pop() || '';
    const ext = (file.split('.').pop() || '').toLowerCase();
    const base = file.replace(/\.(jpg|jpeg|png|gif|mp4|webm|ogg|mp3)$/i, '');
    return { path, url, file, base, ext };
  });
  return entries.filter((m) => m.base === handle);
}

export default function Profile() {
  const params = useParams();
  const navigate = useNavigate();
  const rawHandle = decodeURIComponent(params.handle || '').trim();
  const handle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;

  const participant = useMemo(
    () => participantsCatalog.find((p) => p.username.toLowerCase() === handle.toLowerCase()),
    [handle]
  );

  const media = useMemo(
    () => collectMediaForHandle(participant ? participant.username : handle),
    [participant, handle]
  );

  return (
    <Layout>
      <div style={{ padding: 16 }}>
        <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
          ← Back
        </button>
        {!participant ? (
          <div>
            <h2>Profile not found</h2>
            <p>No participant named <strong>{handle}</strong> was found.</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <img
                src={participant.avatar}
                alt={participant.username}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
              />
              <div>
                <h2 style={{ margin: 0 }}>{participant.username}</h2>
                <div style={{ fontSize: 13, color: '#666' }}>Fashion Profile</div>
              </div>
            </div>

            <div style={{ margin: '12px 0 8px' }}>
              <h3 style={{ margin: 0 }}>Status</h3>
              <small style={{ color: '#666' }}>Images, videos, and audio from the media library</small>
            </div>

            {media.length === 0 ? (
              <div style={{ color: '#777' }}>No status posts available.</div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  alignItems: 'start',
                }}
              >
                {media.map((m) => {
                  const isVideo = ['mp4', 'webm', 'ogg'].includes(m.ext);
                  const isAudio = ['mp3'].includes(m.ext);
                  return (
                    <div key={m.path} style={{ background: '#11111122', borderRadius: 10, padding: 8 }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{m.file}</div>
                      {isVideo ? (
                        <video
                          controls
                          src={m.url}
                          style={{ width: '100%', borderRadius: 8, background: '#000' }}
                        />
                      ) : isAudio ? (
                        <audio controls src={m.url} style={{ width: '100%' }} />
                      ) : (
                        <img
                          src={m.url}
                          alt={m.file}
                          style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 8 }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}


