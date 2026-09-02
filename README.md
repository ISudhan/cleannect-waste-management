<div align="center">

# ♻️ CleanNect — Smart Waste Management & AI Exchange

### *Full-Stack Circular Economy Marketplace, AI Waste Vision & TSP Route Optimizer*

**Connecting waste sellers and buyers with Google Gemini 3.6 AI and automated collection routing for a cleaner, greener tomorrow.**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--time-010101?style=for-the-badge&logo=socket.io)](https://socket.io)
[![Leaflet](https://img.shields.io/badge/Leaflet-OSM%20Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)

</div>

---

## 📌 Overview

**CleanNect** is a full-stack smart waste-management platform and peer-to-peer circular economy exchange. It bridges the gap between waste generators (households, businesses, recycling aggregators) and industrial recycling mills.

Beyond standard marketplace transactions, CleanNect features:
1. **Google Gemini 3.6 Flash Multimodal AI**: Real-time waste material identification, "Wealth out of Waste" upcycling blueprints, live mandi scrap rate queries, and grounded MongoDB RAG.
2. **Interactive Map Route Optimizer**: Traveling Salesperson Problem (TSP) Nearest-Neighbor & 2-Opt collection sequencing with OpenStreetMap Nominatim place search, map pinning, and live GPS driver simulation.
3. **Real-time Peer-to-Peer Messaging**: Socket.IO-powered chat between buyers and sellers with live typing indicators.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **Gemini 3.6 Flash AI Eco-Bot** | Floating real-time chatbot with word-by-word streaming animation, conversation history, and waste segregation advice |
| 📸 **Multimodal AI Waste Vision** | Upload or photograph scrap items to classify polymer/metal types, purity score, and industrial recycling pathways |
| 💡 **Wealth out of Waste (WoW) Studio** | AI-generated DIY blueprints, commercial valorization pathways, and mandi scrap market price estimates |
| 🗺️ **TSP Route Optimizer with Map Search** | Interactive place search, map fly-to, click-to-pin, and Nearest-Neighbor collection routing saving up to 35% fuel and CO₂ |
| 🛒 **P2P Waste Marketplace** | Browse, filter, and buy verified waste lots (plastic, copper, aluminum, cardboard, e-waste) |
| 💬 **Real-time Socket.IO Chat** | Bidirectional user-to-user messaging with optimistic UI and live typing indicators |
| 🤝 **Offer & Negotiation System** | Make price counter-offers, accept, reject, or negotiate orders in real time |
| 💳 **Stripe Checkout & Webhooks** | Secure end-to-end payment processing with automated status tracking |
| 📊 **Analytics & ESG Dashboard** | Real-time carbon offset tracking, scrap revenue trends, and collection metrics |
| 🔐 **Authentication & Security** | JWT tokens, Google OAuth 2.0 (Passport.js), Helmet.js, and server-side secret isolation |

---

## 🤖 AI & Route Optimization Pipeline

### 1. Gemini AI RAG & Chatbot Pipeline
```
               User Query / Attached Photo
                            │
                            ▼
               Node.js / Express Backend
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
     MongoDB Active Listings     Gemini 3.6 Flash
     (Live Scrap Context / RAG)  (CleanNect System Prompt)
                 │                     │
                 └──────────┬──────────┘
                            ▼
            Real-time Streaming Answer / WoW Studio
```

### 2. Multi-Stop Route Optimization Workflow
```
     OpenStreetMap Place Search / MongoDB Stops
                            │
                            ▼
       GPS Coordinates + Waste Quantity (kg)
                            │
                            ▼
   TSP Route Optimization Engine (Nearest-Neighbor & 2-Opt)
                            │
                            ▼
    Optimized Sequence + OSRM Road Geometry + Turn Legs
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
        Interactive Leaflet Map   Gemini Structured
        (Live Driver GPS Sim)     Human Explanation
```

---

## 🏗️ Architecture & Project Structure

```
cleannect-waste-management/
│
├── backend/                         # Node.js + Express 5 Backend
│   ├── config/                      # Database (Mongoose), Passport (OAuth)
│   ├── controllers/
│   │   ├── geminiController.js      # Gemini Chatbot & Multimodal Image API
│   │   ├── routeOptimizerController.js # TSP Algorithm & Route Logic
│   │   ├── listingController.js     # Marketplace Listings CRUD
│   │   ├── messageController.js     # User-to-User Chat Records
│   │   └── ...                      # Auth, Orders, Payments, Analytics
│   ├── middleware/                  # JWT Protect, OptionalAuth, Error Handling
│   ├── models/                      # User, Listing, Order, Message, Review
│   ├── routes/                      # API Endpoints (/api/gemini, /api/route-optimizer, etc.)
│   ├── services/
│   │   └── geminiService.js         # Google Gen AI SDK (@google/genai) + RAG
│   ├── .env                         # Server secrets (GEMINI_API_KEY, JWT, MongoDB)
│   └── server.js                    # Express + Socket.IO Server Setup
│
├── frontend/                        # React 19 + Vite 7 SPA
│   ├── public/                      # Static Assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── GeminiEcoChatWidget.jsx # Floating AI Assistant with Stream Typewriter
│   │   │   └── ...                  # Navbar, Footer, RouteProtector
│   │   ├── pages/dashboard/
│   │   │   ├── RouteOptimizerPage.jsx  # Interactive Leaflet Map, Search & GPS Sim
│   │   │   ├── WasteToWealthPage.jsx   # Multimodal Waste Vision & WoW Blueprint Studio
│   │   │   ├── ChatPage.jsx            # Real-time User-to-User Socket Chat
│   │   │   └── ...                  # Marketplace, Orders, Analytics
│   │   ├── lib/apiClient.js         # Axios Client with Bearer Interceptor
│   │   └── lib/socket.js            # Socket.IO Client
│   ├── .env                         # Public Client Config (VITE_API_BASE_URL)
│   └── vite.config.js               # Vite Configuration
│
├── docker-compose.yml               # Local Container Setup
└── README.md                        # Documentation
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** & **Vite 7**
- **TailwindCSS**
- **Leaflet & React-Leaflet** (OpenStreetMap tiles, custom SVG markers)
- **Socket.io Client** (Real-time WebSocket events)
- **Axios** (API client with Bearer token authentication)

### Backend
- **Node.js & Express 5**
- **Google Gen AI SDK (`@google/genai`)**: `gemini-3.6-flash`
- **MongoDB & Mongoose 8**
- **Socket.io**: Real-time room broadcasting
- **Passport.js**: Google OAuth 2.0
- **Stripe SDK**: Payment intents & webhook fulfillment
- **Cloudinary**: Cloud image uploads
- **Helmet & Express Rate Limit**: API protection

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** ≥ 18.x
- **MongoDB** (Local or MongoDB Atlas)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
```bash
cd backend
npm install

# Create and configure .env
cp .env.example .env
```

Ensure your `backend/.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cleannect-waste-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

Start the backend server:
```bash
npm run dev
# Server running on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
```

Start the frontend development server:
```bash
npm run dev
# App running on http://localhost:5173
```

---

## 📡 Key API Endpoints

### 🤖 Gemini AI Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/gemini/chat` | Chat with CleanNect AI (Grounded by live MongoDB listings) |
| `POST` | `/api/gemini/analyze-waste` | Multimodal image analysis for material identification & WoW blueprints |

### 🗺️ Route Optimizer Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/route-optimizer/optimize` | Run TSP Nearest-Neighbor & 2-Opt algorithm + AI explanation |
| `GET` | `/api/route-optimizer/marketplace-stops` | Retrieve active marketplace listings formatted as collection stops |
| `GET` | `/api/route-optimizer/my-orders-stops` | Retrieve user's placed orders as pickup coordinates |

### 🛒 Marketplace & Chat Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET/POST` | `/api/listings` | Search and create waste listings |
| `GET/POST` | `/api/messages/:userId` | Fetch and send user-to-user messages (Socket.IO enabled) |
| `POST` | `/api/payments/create-intent` | Initiate Stripe Checkout |

---

## 🔐 Security & Privacy
- **Strict Server-Side Isolation**: `GEMINI_API_KEY`, `JWT_SECRET`, and database credentials exist **only** on the backend and are never exposed to client bundles.
- **Prompt Injection Defense**: Database records are cleanly isolated as context data rather than instructions.
- **Payload Sanitization**: 50MB body limit with filetype filtering for high-resolution images.

---

<div align="center">

Made with 💚 for a sustainable circular economy.

**[CleanNect Platform](https://github.com/ISudhan/cleannect-waste-management)**

</div>
