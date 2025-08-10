// Build participants dynamically from assets using Vite's glob import
// Includes only JPG avatars that start with '@'
const avatars = import.meta.glob('./assets/@*.jpg', { eager: true, query: '?url', import: 'default' });

const participants = Object.entries(avatars)
  .map(([path, url]) => {
    const file = path.split('/').pop();
    const base = file.replace(/\.jpg$/i, '');
    // username is the file base (e.g., @Addison_Jane)
    return { username: base, avatar: url };
  })
  // sort alphabetically by username for stable display
  .sort((a, b) => a.username.localeCompare(b.username));

// Mirror of server bot users to enable client-side DM initiation
// Keep in sync with `TrendNet/server/server.js` botUsers and `TrendNet/server/botManager.js` fashionBots
export const botUsers = [
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

export default participants;


