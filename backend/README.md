# CleanNect Waste Management Backend

A Node.js/Express/MongoDB backend API for connecting waste sellers and buyers (like OLX for waste).

## Features

- User authentication (JWT)
- User management (sellers and buyers)
- Listing management (CRUD operations with image uploads)
- Search and filtering for listings
- Order management
- Payment integration (Stripe)
- Real-time messaging (Socket.io)
- Image upload (Cloudinary)

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time messaging
- Stripe for payments
- Cloudinary for image storage
- Multer for file uploads

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Stripe account (for payments)
- Cloudinary account (optional, for image storage)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cleannect-waste-management
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Users
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/change-password` - Change password (Protected)

### Listings
- `GET /api/listings` - Get all listings (with search, filters, pagination)
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create listing (Protected, Seller only)
- `PUT /api/listings/:id` - Update listing (Protected, Owner only)
- `DELETE /api/listings/:id` - Delete listing (Protected, Owner only)
- `GET /api/listings/seller/my-listings` - Get seller's listings (Protected)

### Orders
- `POST /api/orders` - Create order (Protected, Buyer only)
- `GET /api/orders` - Get user's orders (Protected)
- `GET /api/orders/:id` - Get order details (Protected)
- `PUT /api/orders/:id/status` - Update order status (Protected)

### Payments
- `POST /api/payments/create` - Create payment intent (Protected)
- `POST /api/payments/verify` - Verify payment webhook (Public, Stripe webhook)
- `GET /api/payments/:orderId` - Get payment status (Protected)

### Messages
- `GET /api/messages` - Get conversations (Protected)
- `GET /api/messages/:userId` - Get messages with specific user (Protected)
- `POST /api/messages` - Send message (Protected)
- `PUT /api/messages/:id/read` - Mark message as read (Protected)

## Socket.io Events

### Client → Server
- `connection` - Connect with JWT token in `auth.token`
- `typing` - Send typing indicator `{ receiverId, isTyping }`

### Server → Client
- `newMessage` - New message received
- `userTyping` - User typing indicator `{ userId, isTyping }`

## Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── cloudinary.js        # Cloudinary configuration
├── models/
│   ├── User.js              # User model
│   ├── Listing.js           # Listing model
│   ├── Order.js             # Order model
│   ├── Payment.js           # Payment model
│   └── Message.js           # Message model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User routes
│   ├── listings.js          # Listing routes
│   ├── orders.js            # Order routes
│   ├── payments.js          # Payment routes
│   └── messages.js          # Message routes
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── listingController.js
│   ├── orderController.js
│   ├── paymentController.js
│   └── messageController.js
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── errorHandler.js      # Error handling middleware
│   ├── upload.js            # File upload middleware
│   └── validator.js         # Input validation middleware
├── server.js                # Entry point
└── package.json
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Notes

- Image uploads use Cloudinary by default, but will fall back to memory storage if Cloudinary is not configured
- Stripe webhook endpoint requires raw body parsing (handled in server.js)
- Socket.io authentication uses JWT token passed in handshake.auth.token
- All timestamps are automatically managed by Mongoose

## License

ISC

