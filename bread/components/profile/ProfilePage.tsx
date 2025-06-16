import { useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { UserProfile } from './UserProfile';
import { BakingHistory } from './BakingHistory';
import { Button } from '../ui/button';
import { AuthModal } from '../auth/AuthModal';
import { ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
}

export function ProfilePage({ onBack }: ProfilePageProps) {
  const { user, isLoading } = useUser();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse">Loading thy profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="font-serif italic text-amber-800 text-2xl mb-4">Pray, Identify Thyself</h2>
          <p className="text-muted-foreground mb-8">
            To view thy profile, thou must first sign in or create an account.
          </p>
          <div className="inline-block">
            <AuthModal />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6 text-amber-800 hover:text-amber-900 hover:bg-amber-100/50"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to baking
      </Button>

      <div className="space-y-8">
        <UserProfile userId={user.id} />
        <BakingHistory userId={user.id} />
      </div>
    </div>
  );
}