import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import PrivateWatch from "./pages/PrivateWatch";
import WatchRoom from "./pages/WatchRoom";
import Rooms from "./pages/Rooms";
import Library from "./pages/Library";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import SoloPlayer from "./pages/SoloPlayer"; // Import file mới

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/watch/:id" element={<PrivateWatch />} />
          {/*<Route path="/room/:roomId" element={<WatchRoom />} />*/}
          {/* Route cho Xem Chung (Giữ nguyên) */}
          <Route path="/room/:id" element={<WatchRoom />} />

          {/* Route MỚI cho Xem Một Mình */}
          <Route path="/watch/movie/:movieId" element={<SoloPlayer />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
