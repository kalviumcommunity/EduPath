import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onBack?: () => void; // optional: will fallback to history.back
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "lg";
}

const BackButton = ({ 
  onBack, 
  className = "", 
  variant = "ghost",
  size = "default"
}: BackButtonProps) => {
  const handleClick = () => {
    if (onBack) return onBack();
    // Fallback to browser history if no handler provided
    if (window?.history?.length && window.history.length > 1) {
      window.history.back();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size === "default" ? "icon" : size}
      onClick={handleClick}
      className={`rounded-full border border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur hover:bg-white dark:hover:bg-neutral-900 transition-all duration-200 ${className}`}
      aria-label="Go back"
      title="Go back"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};

export default BackButton;