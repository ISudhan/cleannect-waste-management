# 🚀 Cleannect Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Start MongoDB
```bash
# On Linux/macOS
sudo systemctl start mongod

# Or manually
mongod --dbpath /path/to/your/data/directory
```

### 3. Start Both Services
```bash
npm start
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Manual Setup

### Backend Setup
```bash
cd backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/cleannect
JWT_SECRET=your_secret_key_here
NODE_ENV=development" > .env

npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cleannect
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

## Available Scripts

- `npm start` - Start both frontend and backend
- `npm run frontend` - Start only frontend
- `npm run backend` - Start only backend
- `npm run build` - Build frontend for production
- `npm run install-all` - Install all dependencies

## Testing the Application

1. Open http://localhost:5173 in your browser
2. Click "Sign Up" to create a new account
3. Choose your user type (household, collector, or buyer)
4. Fill in your details and create account
5. Explore the dashboard and features

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :5000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod
```

### Node Version Issues
```bash
# Check Node.js version
node --version

# Should be >= 16.0.0
# Use nvm to install/switch versions
nvm install 18
nvm use 18
```

## Project Structure

```
cleannect-waste-management/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── App.jsx         # Main app
│   │   └── App.css         # Styles
│   └── package.json
├── backend/                  # Express API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── server.js           # Server
│   └── package.json
├── start.sh                 # Startup script
├── package.json             # Root package.json
└── README.md               # Project overview
```

## Features Implemented

✅ User authentication (login/register)
✅ User dashboard with statistics
✅ Waste listing creation and management
✅ Browse and search waste listings
✅ User profile management
✅ Responsive design
✅ JWT authentication
✅ MongoDB integration
✅ Form validation
✅ Error handling

## Next Steps

- [ ] Add image upload functionality
- [ ] Implement real-time notifications
- [ ] Add chat system
- [ ] Payment integration
- [ ] Email verification
- [ ] Advanced search filters

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify MongoDB is running
3. Check port availability
4. Ensure all dependencies are installed
5. Create an issue in the repository

---

**Happy coding! 🌱♻️**
