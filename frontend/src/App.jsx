import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './pages/public/LandingPage';
import ListingDetailPage from './pages/public/ListingDetailPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import ProfilePage from './pages/dashboard/ProfilePage';
import MyListingsPage from './pages/dashboard/MyListingsPage';
import ListingFormPage from './pages/dashboard/ListingFormPage';
import OrdersPage from './pages/dashboard/OrdersPage';
import OrderDetailPage from './pages/dashboard/OrderDetailPage';
import MessagesPage from './pages/dashboard/MessagesPage';
import ChatPage from './pages/dashboard/ChatPage';
import PaymentPage from './pages/dashboard/PaymentPage';
import OffersPage from './pages/dashboard/OffersPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import WishlistPage from './pages/dashboard/WishlistPage';
import ProtectedRoute from './routes/ProtectedRoute';

function App() {
  console.log("API BASE:", import.meta.env.VITE_API_BASE_URL);
  return (
    <BrowserRouter>
      <Routes>
        {/* Public layout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        </Route>

        {/* Dashboard layout (protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="listings" element={<MyListingsPage />} />
          <Route path="listings/new" element={<ListingFormPage mode="create" />} />
          <Route path="listings/:id/edit" element={<ListingFormPage mode="edit" />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:userId" element={<ChatPage />} />
          <Route path="payments/:orderId" element={<PaymentPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
