import React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User, ChevronDown, UserCircle, History, BookOpen, LogOut } from "lucide-react";
import { signOut } from "../../lib/supabase";
import { useUser } from "../../contexts/UserContext";
import { toast } from "sonner";

interface UserMenuProps {
  onProfileClick?: () => void;
  onHistoryClick?: () => void;
  onMyRecipesClick?: () => void;
}

export function UserMenu({ onProfileClick, onHistoryClick, onMyRecipesClick }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, setUser } = useUser();
  
  if (!user) return null;
  
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      setUser(null);
      toast.success("Successfully signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user.email) return "U";
    const parts = user.email.split('@')[0].split(/[._-]/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };
  
  const username = user.email?.split('@')[0] || 'User';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="border-amber-300 text-amber-800 hover:bg-amber-50 pl-2 pr-3 h-10 flex items-center gap-2"
        >
          <Avatar className="h-7 w-7 border border-amber-200">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-amber-100 text-amber-800 text-xs font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <span className="font-serif italic">{username}</span>
          <ChevronDown className={`h-4 w-4 text-amber-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-2 border-amber-200 shadow-md bg-white" sideOffset={8}>
        <div className="p-2 mb-1 flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-amber-200">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-medium">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <p className="font-serif italic text-amber-800 text-sm">{username}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        
        <DropdownMenuSeparator className="bg-amber-200/50 my-2" />
        
        <DropdownMenuLabel className="font-serif italic text-amber-800 px-2.5">
          Thy Bread Chronicles
        </DropdownMenuLabel>
        
        <div className="px-1.5 py-1.5">
          <DropdownMenuItem 
            onClick={() => {
              setOpen(false);
              onProfileClick?.();
            }} 
            className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-amber-100/80"
          >
            <UserCircle className="mr-2.5 h-4 w-4 text-amber-700" />
            <span className="text-amber-900">Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              setOpen(false);
              onHistoryClick?.();
            }} 
            className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-amber-100/80"
          >
            <History className="mr-2.5 h-4 w-4 text-amber-700" />
            <span className="text-amber-900">Baking History</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => {
              setOpen(false);
              onMyRecipesClick?.();
            }} 
            className="cursor-pointer rounded-md px-2.5 py-2 hover:bg-amber-100/80"
          >
            <BookOpen className="mr-2.5 h-4 w-4 text-amber-700" />
            <span className="text-amber-900">My Recipes</span>
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="bg-amber-200/50 my-1.5" />
        
        <div className="px-1.5 py-1.5">
          <DropdownMenuItem 
            onClick={() => {
              setOpen(false);
              handleSignOut();
            }} 
            disabled={isLoggingOut} 
            className={`cursor-pointer rounded-md px-2.5 py-2 ${
              isLoggingOut 
                ? 'opacity-60 cursor-not-allowed' 
                : 'hover:bg-red-50 text-red-700 hover:text-red-800'
            }`}
          >
            <LogOut className="mr-2.5 h-4 w-4" />
            <span>{isLoggingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}