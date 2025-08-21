import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Use JS AuthContext (contains demo fallback logic)
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Import all pages
import Index from "./pages/Index";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import PreferenceForm from "./pages/PreferenceForm";
import Dashboard from "./pages/Dashboard";
import UniversityDetails from "./pages/UniversityDetails";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Shortlist from "./pages/Shortlist";

const queryClient = new QueryClient();

// Main app component with routing
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const { isAuthenticated, loading, user, postSignup, clearPostSignup } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, loading, currentPage, userId: user?.id });
  }, [isAuthenticated, loading, currentPage, user]);

  // Redirect to login if not authenticated for protected routes
  // Also redirect to dashboard if already authenticated and trying to access auth pages
  useEffect(() => {
    if (loading) return;
    const protectedPages = ['preferences', 'dashboard', 'university-details', 'profile'];
    const authPages = ['login', 'signup'];

    // Allow remaining on signup immediately after registration so manual navigation works
  if (currentPage === 'signup') return; // allow signup to control next navigation

    // If just signed up, force preferences once
    if (postSignup) {
      if (currentPage !== 'preferences') {
        console.log('[Routing] postSignup flag detected, routing to preferences');
        setPreviousPage(currentPage);
        setCurrentPage('preferences');
      }
      clearPostSignup();
      return;
    }

    if (!isAuthenticated && protectedPages.includes(currentPage)) {
      if (currentPage !== 'login') {
        console.log('Redirecting to login - not authenticated for protected page');
        setCurrentPage('login');
      }
      return;
    }
    if (isAuthenticated && authPages.includes(currentPage)) {
      if (currentPage !== 'dashboard') {
        console.log('Redirecting from auth page to dashboard - already authenticated');
        setCurrentPage('dashboard');
      }
    }
  }, [isAuthenticated, loading, currentPage, postSignup, clearPostSignup]);
  
  // Separate effect for landing page redirects (less aggressive)
  useEffect(() => {
    if (!loading && isAuthenticated && currentPage === 'landing') {
      console.log('Redirecting from landing to dashboard - already authenticated');
      setCurrentPage('dashboard');
    }
  }, [currentPage, isAuthenticated, loading]);

  const navigate = (page) => {
    console.log(`Navigation requested to: ${page}`); // Debug logging
    
    // Special case for signup -> preferences always allowed
    if (page === 'preferences' && currentPage === 'signup') {
      console.log('Navigating from signup to preferences');
      setPreviousPage(currentPage);
      setCurrentPage('preferences');
      return;
    }
    
    // Check if we need to redirect based on auth status
    const protectedPages = ['preferences', 'dashboard', 'university-details', 'profile'];
    const authPages = ['login', 'signup'];
    
    if (!isAuthenticated && protectedPages.includes(page)) {
      console.log('Redirecting to login - not authenticated for protected page');
      setPreviousPage(currentPage);
      setCurrentPage('login');
      return;
    }
    
    if (isAuthenticated && authPages.includes(page)) {
      console.log('Redirecting to dashboard - already authenticated');
      setPreviousPage(currentPage);
      setCurrentPage('dashboard');
      return;
    }
    
    // Normal navigation
    setPreviousPage(currentPage);
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    switch (currentPage) {
      case 'landing':
        return <Index navigate={navigate} />;
      case 'signup':
        return <Signup navigate={navigate} />;
      case 'login':
        return <Login navigate={navigate} />;
      case 'preferences': {
        // Allow immediate access if coming directly from signup before auth flag settles
        if (isAuthenticated || previousPage === 'signup' || postSignup) {
          return <PreferenceForm navigate={navigate} />;
        }
        return <Login navigate={navigate} />;
      }
      case 'dashboard':
        return isAuthenticated ? (
          <Dashboard navigate={navigate} setSelectedUniversity={setSelectedUniversity} />
        ) : (
          <Login navigate={navigate} />
        );
      case 'university-details':
        return isAuthenticated ? (
          <UniversityDetails navigate={navigate} selectedUniversity={selectedUniversity} />
        ) : (
          <Login navigate={navigate} />
        );
      case 'profile':
        return isAuthenticated ? <Profile navigate={navigate} /> : <Login navigate={navigate} />;
      case 'shortlist':
        return isAuthenticated ? <Shortlist navigate={navigate} /> : <Login navigate={navigate} />;
      case 'chat':
        return isAuthenticated ? <Chat navigate={navigate} selectedUniversity={selectedUniversity} /> : <Login navigate={navigate} />;
      default:
        return <NotFound navigate={navigate} />;
    }
  };

  return (
    <>
      {renderCurrentPage()}
      <Sonner position="top-right" />
    </>
  );
};

// Root component with providers
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
