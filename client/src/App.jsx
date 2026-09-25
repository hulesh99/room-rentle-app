import { useEffect, useRef, lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { bootstrapAuth } from '@/redux/slices/authSlice';
import { useSocket } from '@/hooks/useSocket';
import { useFirebase } from '@/hooks/useFirebase';
import Navbar from '@/components/common/Navbar';
import Footer from '@/components/common/Footer';
import Loader from '@/components/common/Loader';
import MobileNav from '@/components/common/MobileNav';
import NotificationDrawer from '@/components/notification/NotificationDrawer';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/common/ProtectedRoute';

const CallLayer = lazy(() => import('@/components/call/CallLayer'));
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import Home from '@/pages/Shared/Home';
import Profile from '@/pages/Shared/Profile';
import RoomDetail from '@/pages/Shared/RoomDetail';
import OwnerDashboard from '@/pages/Owner/OwnerDashboard';
import PostRoom from '@/pages/Owner/PostRoom';
import EditRoom from '@/pages/Owner/EditRoom';
import Requests from '@/pages/Owner/Requests';
import RenterDashboard from '@/pages/Renter/RenterDashboard';
import BrowseRooms from '@/pages/Renter/BrowseRooms';
import MyRequests from '@/pages/Renter/MyRequests';
import ChatPage from '@/pages/Shared/ChatPage';
import Wishlist from '@/pages/Renter/Wishlist';
import NotFound from '@/pages/NotFound';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SocketBridge = () => {
  useSocket();
  return null;
};

const FirebaseBridge = () => {
  useFirebase();
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/rooms" element={<BrowseRooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['OWNER']} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/post-room" element={<PostRoom />} />
            <Route path="/owner/rooms/:id/edit" element={<EditRoom />} />
            <Route path="/owner/requests" element={<Requests />} />
          </Route>

          <Route element={<ProtectedRoute roles={['RENTER']} />}>
            <Route path="/renter/dashboard" element={<RenterDashboard />} />
            <Route path="/renter/requests" element={<MyRequests />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => {
  const dispatch = useDispatch();
  const initialized = useSelector((state) => state.auth.initialized);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      dispatch(bootstrapAuth());
    }
  }, [dispatch]);

  if (!initialized) {
    return <Loader className="min-h-screen" label="Loading RoomRental..." />;
  }

  return (
    <div className="flex min-h-screen flex-col pb-[68px] md:pb-0">
      <ScrollToTop />
      <SocketBridge />
      <FirebaseBridge />
      <Suspense fallback={null}>
        <CallLayer />
      </Suspense>
      <Navbar />
      <main className="flex-1">
        <AnimatedRoutes />
      </main>
      <Footer />
      <NotificationDrawer />
      <MobileNav />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          style: {
            borderRadius: '12px',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            fontSize: '14px',
            boxShadow: '0 8px 30px -6px hsl(var(--border))',
          },
          success: { iconTheme: { primary: 'hsl(var(--primary))', secondary: 'hsl(var(--primary-foreground))' } },
        }}
      />
    </div>
  );
};

export default App;
