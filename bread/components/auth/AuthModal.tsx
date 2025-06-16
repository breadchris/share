import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "../ui/dialog";
import { Button } from "../ui/button";
import { SignIn } from "./SignIn";
import { SignUp } from "./SignUp";
import { BookOpen } from "lucide-react";

export function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"signin" | "signup">("signin");
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to signin view when dialog closes
      setTimeout(() => setView("signin"), 300);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-amber-200 hover:bg-amber-50 text-amber-800"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Sign In
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif italic text-center">
            {view === "signin" ? "Welcome Back, Noble Baker" : "Join Our Baking Community"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {view === "signin" 
              ? "Sign in to track thy bread journey and share thy creations." 
              : "Create an account to begin thy bread adventure."}
          </DialogDescription>
        </DialogHeader>
        
        {view === "signin" ? (
          <SignIn onSwitchToSignUp={() => setView("signup")} onSuccess={() => setIsOpen(false)} />
        ) : (
          <SignUp onSwitchToSignIn={() => setView("signin")} onSuccess={() => setIsOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}