# Cleannect Frontend

Frontend application for Cleannect - Waste Management Marketplace

## Features

- **Modern UI/UX**: Clean, responsive design with smooth animations
- **User Authentication**: Login, registration, and profile management
- **Waste Listings**: Browse, search, and filter waste items
- **Dashboard**: User statistics and recent activities
- **Create Listings**: Post new waste items for sale
- **Profile Management**: Edit user information and preferences
- **Responsive Design**: Works on all devices

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Vanilla CSS** - Custom styling with modern CSS features
- **Fetch API** - HTTP requests to backend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.jsx     # Navigation component
├── pages/              # Page components
│   ├── Home.jsx       # Landing page
│   ├── Login.jsx      # User login
│   ├── Register.jsx   # User registration
│   ├── Dashboard.jsx  # User dashboard
│   ├── WasteListings.jsx # Browse waste items
│   ├── CreateListing.jsx # Create new listing
│   └── Profile.jsx    # User profile management
├── App.jsx            # Main app component with routing
├── App.css            # Global styles
└── main.jsx          # App entry point
```

## Pages

### Home
- Hero section with call-to-action
- Features overview
- How it works guide
- Waste categories
- User testimonials

### Authentication
- **Login**: Email/password authentication
- **Register**: User registration with validation
- Form validation and error handling
- JWT token management

### Dashboard
- User statistics (listings, earnings, deals)
- Recent waste listings
- Quick actions
- Account information

### Waste Listings
- Browse all waste items
- Advanced search and filtering
- Category-based organization
- Pagination support
- Status indicators

### Create Listing
- Comprehensive waste item form
- Category selection
- Price and quantity input
- Location details
- Image upload support (planned)

### Profile
- View and edit user information
- Address management
- Account security options
- Profile picture (planned)

## Styling

- **Modern CSS**: Flexbox, Grid, CSS variables
- **Responsive Design**: Mobile-first approach
- **Color Scheme**: Green theme representing sustainability
- **Animations**: Smooth transitions and hover effects
- **Typography**: Clean, readable fonts

## API Integration

- RESTful API calls to backend
- JWT authentication
- Error handling and loading states
- Form validation

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Code Style

- Functional components with hooks
- Consistent naming conventions
- Error boundaries and loading states
- Responsive design patterns

## Future Enhancements

- Image upload functionality
- Real-time notifications
- Chat system between users
- Payment integration
- Advanced analytics
- Mobile app (React Native)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Ensure responsive design
4. Test on multiple devices
5. Update documentation as needed
