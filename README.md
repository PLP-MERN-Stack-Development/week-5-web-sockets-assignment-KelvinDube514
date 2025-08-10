# TrendNet - Fashion-Focused Real-Time Chat Application

![TrendNet Logo](TrendNet\client\src\assets\TrendNet2.png)

TrendNet is a modern, real-time chat application specifically designed for fashion enthusiasts, influencers, and style communities. Built with React, Socket.IO, and Node.js, it provides a dynamic platform for fashion discussions, trend sharing, and community engagement.

## 🌟 Features

### Core Chat Functionality
- **Real-time messaging** with Socket.IO for instant communication
- **Multiple chat rooms** dedicated to fashion topics:
  - `general` - General fashion discussions
  - `fashion` - Latest fashion trends
  - `style` - Personal styling tips
  - `outfits` - Outfit inspiration and sharing
  - `trending-fashion` - Hot topics and viral trends
- **Direct messaging** between users
- **Message history** with scroll-to-load functionality
- **Typing indicators** to show when users are composing messages
- **Read receipts** to track message delivery status

### Media Sharing
- **Image and video sharing** with drag-and-drop support
- **Rich media previews** for fashion content
- **File upload capabilities** for sharing outfit photos and style inspiration
- **Optimized media handling** with proper MIME type detection

### User Experience
- **User authentication** with JWT tokens
- **User presence indicators** showing who's online
- **Real-time notifications** with browser notifications and sound alerts
- **Message reactions** with emoji support
- **Search functionality** to find specific messages or content
- **Responsive design** that works on desktop and mobile devices

### AI-Powered Fashion Bots
- **18 AI fashion influencers** with unique personalities and expertise
- **Automated fashion discussions** across different topics
- **Bot interactions** that respond to user messages and DMs
- **Fashion trend insights** and style recommendations
- **Engaging conversations** that keep the community active

### Advanced Features
- **Message persistence** with in-memory storage (demo mode)
- **Connection management** with automatic reconnection
- **Error handling** and graceful degradation
- **Performance optimization** with efficient message handling
- **Cross-platform compatibility** with modern browsers

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm, yarn, or pnpm package manager
- Modern web browser with WebSocket support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd week-5-web-sockets-assignment-KelvinDube514
   ```

2. **Install server dependencies**
   ```bash
   cd TrendNet/server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the server** (from `TrendNet/server` directory)
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3001`

2. **Start the client** (from `TrendNet/client` directory)
   ```bash
   npm run dev
   ```
   The client will start on `http://localhost:5173`

3. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Enter a username to start chatting
   - Join different fashion rooms and interact with AI fashion bots

## 🏗️ Project Structure

```
TrendNet/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   │   └── TrendNet.png   # Application logo
│   ├── src/
│   │   ├── assets/        # Fashion media assets (images, videos)
│   │   ├── components/    # React components
│   │   │   ├── Aurora.jsx # UI component
│   │   │   └── Layout.jsx # Main layout component
│   │   ├── App.jsx        # Main application component
│   │   ├── Chat.jsx       # Chat interface component
│   │   ├── Login.jsx      # Authentication component
│   │   ├── Profile.jsx    # User profile component
│   │   ├── participants.js # Bot user definitions
│   │   └── main.jsx       # Application entry point
│   ├── package.json       # Client dependencies
│   └── vite.config.js     # Vite configuration
├── server/                # Node.js backend server
│   ├── server.js          # Main server file with Socket.IO setup
│   ├── botManager.js      # AI fashion bot management
│   └── package.json       # Server dependencies
└── README.md              # Project documentation
```

## 🛠️ Technology Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **Socket.IO Client** - Real-time communication
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing
- **JWT** - JSON Web Tokens for authentication

### Key Libraries
- **socket.io-client** - Client-side Socket.IO implementation
- **react-router-dom** - React routing
- **jwt-decode** - JWT token decoding
- **ogl** - WebGL graphics library for advanced UI effects

## 🎨 Fashion Bot Personalities

The application features 18 AI-powered fashion influencers, each with unique personalities:

- **@Addison_Jane** - Modern minimalist style expert
- **@Aisha_Cairo** - Middle Eastern fashion and cultural fusion
- **@Bella_Boho** - Bohemian and free-spirited fashion
- **@Breezy_Bea** - Summer and beach fashion specialist
- **@Brooklyn_May** - Urban street style and NYC fashion
- **@Carmen_Rio** - Latin American fashion and vibrant styles
- **@Chloe_Chic** - Classic and sophisticated fashion
- **@Evelyn_May** - Vintage and retro fashion enthusiast
- **@Foxy_Fiona** - Bold and daring fashion choices
- **@Glam_Gigi** - Glamorous and red carpet fashion
- **@Grace_Glimpse** - Elegant and refined style
- **@Isabella_Madrid** - European fashion and sophistication
- **@Lily_Luxe** - Luxury and high-end fashion
- **@Luna_Belle** - Ethereal and dreamy fashion
- **@Lush_Lina** - Sustainable and eco-friendly fashion
- **@LuxeLane_Official** - Official fashion brand account
- **@Miyabi_K** - Japanese and Asian fashion trends
- **@Pixie_Pat** - Whimsical and creative fashion

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the server directory:
```env
PORT=3001
NODE_ENV=development
```

### Socket.IO Configuration
- **Namespace**: `/chat` for all chat functionality
- **Authentication**: JWT token-based authentication
- **Transports**: WebSocket with polling fallback
- **CORS**: Configured for development and production

## 📱 Usage

### Joining the Chat
1. Enter a username on the login screen
2. Choose from predefined fashion chat rooms
3. Start chatting with other users and AI fashion bots

### Sharing Content
- **Text messages**: Type and send instantly
- **Media files**: Drag and drop images/videos or use the file picker
- **Reactions**: Click the reaction button on messages to add emojis

### Navigation
- **Room switching**: Click on different room names to switch conversations
- **Direct messages**: Click on user names to start private conversations
- **Search**: Use the search bar to find specific messages or content

## 🚀 Deployment

### Development
- Both client and server run in development mode with hot reloading
- Server runs on port 3001, client on port 5173
- Real-time updates and debugging enabled

### Production
- Build the client: `npm run build` in the client directory
- Serve static files from the server
- Configure environment variables for production
- Set up proper CORS and security headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of a WebSocket assignment and is intended for educational purposes.

## 🙏 Acknowledgments

- Socket.IO team for the excellent real-time communication library
- React team for the powerful frontend framework
- Fashion community for inspiration and feedback
- All contributors and testers

---

**TrendNet** - Where fashion meets technology in real-time conversations! 👗✨ 