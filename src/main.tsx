/**
 * MAIN APPLICATION ENTRY POINT
 * 
 * Business Purpose:
 * - Initializes the HalalChecker web application
 * - Mounts the React app to the HTML DOM
 * 
 * Technical Details:
 * - Uses React 18's createRoot API for concurrent rendering
 * - Imports global CSS styles (design system)
 * - Targets the 'root' div element in index.html
 */

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize and render the React application
createRoot(document.getElementById("root")!).render(<App />);
