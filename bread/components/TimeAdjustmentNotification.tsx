
import { useState, useEffect } from "react";
import { AlertCircle, X } from "lucide-react";

interface TimeAdjustmentNotificationProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TimeAdjustmentNotification({ 
  isVisible, 
  onClose 
}: TimeAdjustmentNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        setIsAnimating(false);
        setTimeout(() => onClose(), 300); // Wait for fade out animation
      }, 5000);
      
      return () => clearTimeout(timeout);
    } else {
      setIsAnimating(false);
    }
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 bg-amber-50 border border-amber-300 rounded-lg shadow-lg p-4 z-[100] transition-all duration-300 animate-slide-in ${
        isAnimating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800">Schedule Updated</h3>
          <p className="mt-1 text-xs text-amber-700">
            Future step times have been adjusted based on your progress. Your baking schedule has been updated accordingly.
          </p>
        </div>
        <button 
          onClick={() => {
            setIsAnimating(false);
            setTimeout(() => onClose(), 300); // Wait for fade out animation
          }}
          className="flex-shrink-0 text-amber-500 hover:text-amber-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
