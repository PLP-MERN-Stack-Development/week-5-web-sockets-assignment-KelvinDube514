# TrendNet - Fashion Chat Application

A modern, real-time chat application for fashion enthusiasts with AI-powered fashion bot personalities.

## Features

### 🔐 Authentication System
- **Modern Login/Register Interface**: Beautiful, themed authentication with TrendNet branding
- **Dual Mode**: Toggle between login and registration seamlessly
- **Form Validation**: Real-time validation with helpful error messages
- **Quick Demo Login**: Instant access with pre-configured fashion bot accounts
- **Secure Token-based Auth**: JWT-style tokens for session management

### 🎨 Design & Branding
- **TrendNet Logo Integration**: Prominent logo display throughout the application
- **Fashion-themed UI**: Pink and gold gradient color scheme
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern Animations**: Smooth transitions and hover effects
- **Typography**: Elegant Playfair Display and Inter font combination

### 🔔 Notification System
- **In-App Notifications**: Beautiful toast notifications with different types:
  - Success (green) - Login/registration success
  - Error (red) - Error messages
  - Message (pink) - New chat messages
  - Join (green) - User joined room
  - Leave (orange) - User left room
  - Info (blue) - General information

- **Browser Notifications**: Desktop notifications for new messages
- **Auto-dismiss**: Notifications automatically disappear after 4 seconds
- **Manual Close**: Click the × button to dismiss early

### 🔊 Sound System
- **Different Sound Types**: Unique audio feedback for different events:
  - Message sounds (880Hz) - New messages
  - Join sounds (660Hz) - User joins
  - Leave sounds (440Hz) - User leaves
  - Notification sounds (1100Hz) - General notifications
  - Error sounds (220Hz) - Error events

- **Sound Toggle**: Mute/unmute button in the chat header
- **Volume Control**: Adjustable volume levels
- **Fallback Audio**: Web Audio API fallback for browsers without audio support

### 💬 Chat Features
- **Real-time Messaging**: Instant message delivery with Socket.IO
- **Room-based Chat**: Join different fashion topic rooms
- **Direct Messages**: Private conversations with fashion bots
- **File Sharing**: Send images and videos
- **Message Reactions**: React to messages with emojis
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Track message read status
- **Search Functionality**: Search through message history

### 🤖 AI Fashion Bots
- **Personality-driven**: Each bot has unique fashion expertise
- **Auto-replies**: Intelligent responses in fashion-related conversations
- **Media Sharing**: Bots can share fashion images and videos
- **Trend Analysis**: Get insights on current fashion trends

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TrendNet
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server**
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:3001`

2. **Start the client**
   ```bash
   cd client
   npm run dev
   ```
   The client will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173` to access the application

## Usage

### Authentication
1. **Register**: Create a new account with username, email, and password
2. **Login**: Sign in with your credentials
3. **Quick Demo**: Use the quick login buttons to instantly access as a fashion bot

### Chatting
1. **Join Rooms**: Click on room names in the sidebar to join different topics
2. **Send Messages**: Type in the message input and press Enter or click Send
3. **Share Files**: Click the Attach button to share images or videos
4. **React to Messages**: Click reaction buttons on messages
5. **Search**: Use the search bar to find specific messages

### Notifications & Sound
1. **Enable Browser Notifications**: Allow notifications when prompted
2. **Toggle Sound**: Click the 🔊/🔇 button in the chat header
3. **Customize Experience**: Adjust notification preferences as needed

## Technical Details

### Frontend
- **React 19**: Latest React with hooks and modern patterns
- **Vite**: Fast build tool and development server
- **Socket.IO Client**: Real-time communication
- **CSS Custom Properties**: Theme variables for consistent styling
- **Responsive Design**: Mobile-first approach

### Backend
- **Node.js**: Server runtime
- **Express**: Web framework
- **Socket.IO**: Real-time bidirectional communication
- **In-memory Storage**: Demo data storage (can be extended to database)

### Architecture
- **WebSocket-based**: Real-time communication between client and server
- **Event-driven**: Message-based architecture for scalability
- **Modular Design**: Separated concerns between client and server
- **RESTful APIs**: Standard HTTP endpoints for authentication

## Customization

### Themes
The application uses CSS custom properties for easy theming:
```css
:root {
  --soft-pink: #fce7f3;
  --gold: #facc15;
  --ivory: #fffaf0;
  --charcoal: #333;
  --light-pink: #fdf2f8;
  --medium-pink: #f9a8d4;
  --dark-pink: #ec4899;
}
```

### Adding New Bots
1. Add bot configuration to `server/botManager.js`
2. Add bot avatar image to `client/src/assets/`
3. Update bot catalog in `client/src/participants.js`

### Sound Customization
Modify sound frequencies and durations in the `playSound` function:
```javascript
const soundConfig = {
  message: { freq: 880, duration: 180 },
  join: { freq: 660, duration: 150 },
  leave: { freq: 440, duration: 200 },
  notification: { freq: 1100, duration: 120 },
  error: { freq: 220, duration: 300 }
};
```

## Browser Support
- Chrome/Chromium (recommended)
- Firefox
- Safari (with some limitations)
- Edge

## License
This project is for educational and demonstration purposes.

## Contributing
Feel free to submit issues and enhancement requests!
