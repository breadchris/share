import { useState, useEffect } from 'react';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Beaker, Database } from 'lucide-react';
import { DEMO_MODE, setDemoMode, isDemoMode } from '../lib/supabase';

export function DemoModeToggle() {
  const [demoEnabled, setDemoEnabled] = useState(DEMO_MODE);

  useEffect(() => {
    // Check if we have a stored preference
    const storedMode = localStorage.getItem('bread-demo-mode');
    if (storedMode !== null) {
      const isDemo = storedMode === 'true';
      setDemoEnabled(isDemo);
      setDemoMode(isDemo);
    }
  }, []);

  const handleToggle = (enabled: boolean) => {
    setDemoEnabled(enabled);
    setDemoMode(enabled);
    // Store preference
    localStorage.setItem('bread-demo-mode', String(enabled));
  };

  return (
    <Card className="mb-4 border-amber-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          {demoEnabled ? (
            <Beaker className="h-4 w-4 mr-2 text-amber-600" />
          ) : (
            <Database className="h-4 w-4 mr-2 text-amber-600" />
          )}
          API Mode
        </CardTitle>
        <CardDescription className="text-xs">
          Switch between demo data and real database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch 
            id="demo-mode" 
            checked={demoEnabled} 
            onCheckedChange={handleToggle} 
          />
          <Label htmlFor="demo-mode" className="font-serif italic text-sm">
            {demoEnabled ? 'Using demo data' : 'Using Supabase database'}
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}