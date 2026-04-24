import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import Dashboard from "./pages/Dashboard";
import ProfileSettings from "./pages/ProfileSettings";
import Earnings from "./pages/Earnings";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import TutorOnboarding from "./pages/TutorOnboarding";
import LearningHistory from "./pages/LearningHistory";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/tutors" element={<Tutors />} />
              <Route path="/tutor/:userId" element={<TutorProfile />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/subjects/:slug" element={<SubjectDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/earnings" element={<Earnings />} />
              <Route path="/onboarding/tutor" element={<TutorOnboarding />} />
              <Route path="/learning" element={<LearningHistory />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
