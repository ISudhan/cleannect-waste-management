# 🌱 Cleannect - Waste Management Marketplace

A full-stack MERN application that connects local waste collectors and buyers with households, creating a sustainable waste management ecosystem.

## 🚀 Project Overview

Cleannect is like "OLX for waste" - a platform where:
- **Households** can sell their recyclable waste
- **Waste Collectors** can find quality materials
- **Buyers** can source recycled materials directly
- **Everyone** contributes to environmental sustainability

## ✨ Features

### Core Functionality
- User authentication and profile management
- Waste listing creation and management
- Advanced search and filtering
- Real-time status tracking
- Location-based matching
- User dashboard with analytics

### User Types
- **Households**: Post waste for sale
- **Collectors**: Find and purchase waste materials
- **Buyers**: Source recycled materials

### Waste Categories
- Plastic, Paper, Metal, Glass
- Organic, Electronics, Textiles
- Custom categories and tags

## 🛠️ Tech Stack

### Frontend
- **React 18** with Hooks
- **Vite** for fast development
- **React Router** for navigation
- **Vanilla CSS** with modern features
- Responsive design

### Backend
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** authentication
- **bcryptjs** for password hashing
- **CORS** enabled

### Database
- **MongoDB** for data storage
- **Mongoose** for ODM
- Indexed search functionality

## 📁 Project Structure

```
cleannect-waste-management/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app component
│   │   └── App.css         # Global styles
│   ├── package.json
│   └── README.md
├── backend/                  # Express.js backend API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── server.js           # Main server file
│   ├── package.json
│   └── README.md
└── README.md                # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cleannect-waste-management
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file (see backend/README.md for details)
# Start MongoDB service

npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cleannect
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Waste Management
- `POST /api/waste` - Create waste listing
- `GET /api/waste` - Get all listings (with filters)
- `GET /api/waste/:id` - Get single listing
- `PUT /api/waste/:id` - Update listing
- `DELETE /api/waste/:id` - Delete listing

### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

## 🎨 UI Features

- **Modern Design**: Clean, professional interface
- **Responsive Layout**: Works on all devices
- **Green Theme**: Represents sustainability
- **Smooth Animations**: Enhanced user experience
- **Intuitive Navigation**: Easy-to-use interface

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Protected API routes

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📋 TODO

- [ ] Image upload functionality
- [ ] Real-time notifications
- [ ] Chat system between users
- [ ] Payment integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Email verification
- [ ] Password reset functionality

## 🐛 Known Issues

- Image upload not yet implemented
- Real-time features pending
- Payment system to be added

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React and Vite communities
- Express.js and MongoDB teams
- Open source contributors

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Made with ❤️ for a sustainable future**
