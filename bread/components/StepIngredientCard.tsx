import { useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, Scale } from 'lucide-react';

interface StepIngredientCardProps {
  name: string;
  amount: string;
  unit?: string;
  isOptional?: boolean;
}

export function StepIngredientCard({
  name,
  amount,
  unit,
  isOptional = false
}: StepIngredientCardProps) {
  const [isUsed, setIsUsed] = useState(false);

  const toggleUsed = () => {
    setIsUsed(!isUsed);
  };

  return (
    <Card 
      className={`
        p-3 flex justify-between items-center cursor-pointer transition-colors
        ${isUsed ? 'bg-green-50 border-green-100' : 'bg-card hover:bg-amber-50/50'}
      `}
      onClick={toggleUsed}
    >
      <div className="flex items-center flex-1">
        <div className={`
          w-5 h-5 rounded-full border flex items-center justify-center mr-2
          ${isUsed ? 'border-green-500 bg-green-100' : 'border-amber-300'}
        `}>
          {isUsed && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <span className={`font-medium ${isUsed ? 'line-through text-muted-foreground' : ''}`}>
          {name}
        </span>
      </div>
      
      <div className="flex items-center">
        <Badge 
          variant="outline" 
          className={`
            flex items-center px-3 py-1
            ${isUsed 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
            }
          `}
        >
          <Scale className="h-3 w-3 mr-1" />
          <span className="font-medium">{amount}</span>
          {unit && <span className="ml-1">{unit}</span>}
        </Badge>
        
        {isOptional && (
          <Badge variant="outline" className="ml-2 text-muted-foreground border-muted">
            optional
          </Badge>
        )}
      </div>
    </Card>
  );
}