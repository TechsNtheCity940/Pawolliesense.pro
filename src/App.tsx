
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Services from "./pages/Services";
import About from "./pages/About";
import Faq from "./pages/Faq";
import Testimonials from "./pages/Testimonials";
import Story from "./pages/Story";
import Memorial from "./pages/Memorial";
import MemorialPost from "./pages/MemorialPost";
import Pawmarks from "./pages/Pawmarks";
import PawmarkProfile from "./pages/PawmarkProfile";
import Community from "./pages/Community";
import CommunityPost from "./pages/CommunityPost";
import Keepsakes from "./pages/Keepsakes";
import PhotoBooth from "./pages/PhotoBooth";
import Intake from "./pages/Intake";
import ThankYou from "./pages/ThankYou";
import Admin from "./pages/Admin";
import AdminPawmarksNew from "./pages/AdminPawmarksNew";
import AdminWagBook from "./pages/AdminWagBook";
import AdminTestServices from "./pages/AdminTestServices";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/story" element={<Story />} />
            <Route path="/memorial" element={<Memorial />} />
            <Route path="/memorial/new" element={<MemorialPost />} />
            <Route path="/pawmarks" element={<Pawmarks />} />
            <Route path="/pawmarks/:id" element={<PawmarkProfile />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/new" element={<CommunityPost />} />
            <Route path="/keepsakes" element={<Keepsakes />} />
            <Route path="/photobooth" element={<PhotoBooth />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/pawmarks/new" element={<AdminPawmarksNew />} />
            <Route path="/admin/wagbook" element={<AdminWagBook />} />
            <Route path="/admin/test-services" element={<AdminTestServices />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
