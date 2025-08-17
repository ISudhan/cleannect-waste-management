# Cleannect Backend

Backend API for Cleannect - Waste Management Marketplace

## Features

- User authentication (JWT-based)
- User management (household, collector, buyer)
- Waste listing management
- Search and filtering
- RESTful API design

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cleannect
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

3. Start MongoDB service

4. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Waste Management
- `POST /api/waste` - Create waste listing
- `GET /api/waste` - Get all waste listings (with filters)
- `GET /api/waste/:id` - Get single waste listing
- `PUT /api/waste/:id` - Update waste listing
- `DELETE /api/waste/:id` - Delete waste listing
- `GET /api/waste/user/listings` - Get user's listings

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account
- `GET /api/users/type/:userType` - Get users by type

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
