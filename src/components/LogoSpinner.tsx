/**
 * LOGO LOADING SPINNER COMPONENT
 * 
 * Business Purpose:
 * - Branded loading animation for AI analysis and data fetching
 * - Enhances user experience with visual feedback during processing
 * - Maintains brand consistency across loading states
 * 
 * Technical Details:
 * - Animated logo with pulsing and rotation effects
 * - Customizable size and message
 * - Uses CSS animations for smooth performance
 */

import logo from "@/assets/halalcheckerlogo.png";

interface LogoSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LogoSpinner({ message = "Loading...", size = "md" }: LogoSpinnerProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-20 w-20",
    lg: "h-32 w-32"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="relative">
        {/* Animated rotating ring */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full border-4 border-primary/20 border-t-primary animate-spin`} />
        
        {/* Pulsing logo */}
        <div className={`${sizeClasses[size]} flex items-center justify-center animate-pulse`}>
          <img 
            src={logo} 
            alt="HalalChecker" 
            className="h-full w-full object-contain p-2"
          />
        </div>
      </div>
      
      {message && (
        <p className={`${textSizeClasses[size]} font-medium text-muted-foreground animate-fade-in`}>
          {message}
        </p>
      )}
    </div>
  );
}