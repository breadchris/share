import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { signIn, signInWithGoogle } from "../../lib/supabase";
import { toast } from "sonner";
import { Separator } from "../ui/separator";
import { Mail } from "lucide-react";

interface SignInProps {
  onSwitchToSignUp: () => void;
  onSuccess: () => void;
}

export function SignIn({ onSwitchToSignUp, onSuccess }: SignInProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message || "Failed to sign in");
      }
      
      if (data.user) {
        toast.success("Welcome back!");
        onSuccess();
      }
    } catch (error) {
      console.error("Sign in error:", error);
      
      // Show a friendly message to the user
      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          toast.error("Could not connect to the authentication service. Please try again later.");
        } else {
          toast.error(error.message || "Failed to sign in. Please check your credentials.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    
    try {
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        throw new Error(error.message || "Failed to sign in with Google");
      }
      
      // For OAuth, the redirect will handle the success state
      // We'll show a loading message and the user will be redirected
      toast.info("Redirecting to Google...");
      
    } catch (error) {
      console.error("Google sign in error:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("popup")) {
          toast.error("Please allow popups and try again");
        } else {
          toast.error(error.message || "Failed to sign in with Google");
        }
      } else {
        toast.error("An unexpected error occurred with Google sign in");
      }
      setIsGoogleLoading(false);
    }
  };
  
  return (
    <div className="space-y-4 mt-4">
      {/* Google Sign In Button */}
      <Button 
        type="button"
        variant="outline"
        className="w-full border-soft-brown/30 hover:bg-warm-beige/50 text-soft-brown relative"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isLoading}
      >
        <svg 
          className="absolute left-4 h-4 w-4" 
          viewBox="0 0 24 24"
        >
          <path 
            fill="#4285F4" 
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path 
            fill="#34A853" 
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path 
            fill="#FBBC05" 
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path 
            fill="#EA4335" 
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isGoogleLoading ? "Connecting..." : "Continue with Google"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-cozy"
            disabled={isLoading || isGoogleLoading}
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Button 
              type="button" 
              variant="link" 
              className="text-xs text-deep-olive font-normal p-0 h-auto"
              onClick={() => toast.info("Password reset functionality coming soon")}
            >
              Forgot password?
            </Button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-cozy"
            disabled={isLoading || isGoogleLoading}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full btn-primary"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-secondary">
          New to our baking journey?{" "}
          <Button 
            type="button" 
            variant="link" 
            onClick={onSwitchToSignUp}
            className="p-0 h-auto text-deep-olive font-medium"
            disabled={isLoading || isGoogleLoading}
          >
            Create an account
          </Button>
        </p>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-secondary">
            Demo Mode Available
          </span>
        </div>
      </div>
      
      <Button 
        type="button" 
        variant="outline" 
        className="w-full border-dusty-rose/30 hover:bg-dusty-rose/10 text-dusty-rose"
        onClick={() => {
          toast.success("Signed in as demo user");
          onSuccess();
        }}
        disabled={isLoading || isGoogleLoading}
      >
        <Mail className="mr-2 h-4 w-4" />
        Continue as Guest
      </Button>
    </div>
  );
}