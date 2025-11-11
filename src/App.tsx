/**
 * ROOT APPLICATION COMPONENT
 * 
 * Business Purpose:
 * - Main application container that configures the HalalChecker app structure
 * - Sets up routing for different pages (Home, Results, About, Report)
 * - Provides global functionality like notifications and tooltips
 * 
 * Technical Details:
 * - QueryClient: Manages server state and API caching for product data
 * - BrowserRouter: Enables client-side routing without page reloads
 * - Toaster/Sonner: Provides toast notifications for user feedback
 * - TooltipProvider: Enables tooltips throughout the app
 * 
 * Routes:
 * - / : Home page with barcode scanner and search
 * - /results/:barcode : Shows halal verification results for a product
 * - /report/:barcode : Allows users to report issues with product data
 * - /about : Information about HalalChecker and how it works
 * - * : 404 page for invalid routes
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Results from "./pages/Results";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Initialize React Query client for server state management
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* Dual toast notification systems for different use cases */}
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Main search and scan page */}
          <Route path="/" element={<Home />} />
          
          {/* Product verification results page */}
          <Route path="/results/:barcode" element={<Results />} />
          
          {/* About HalalChecker information */}
          <Route path="/about" element={<About />} />
          
          {/* 404 fallback for invalid routes */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
