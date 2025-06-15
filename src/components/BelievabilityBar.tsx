
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface BelievabilityBarProps {
  modifier: number;
}

const BelievabilityBar: React.FC<BelievabilityBarProps> = ({ modifier }) => {
  const widthPercentage = ((modifier + 1) / 2) * 100; // Convert -1 to 1 range to 0-100%
  const barColor = modifier > 0.3 ? 'bg-green-500' : modifier < -0.3 ? 'bg-red-500' : 'bg-yellow-500';

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden mt-1">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${widthPercentage}%` }}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Believability: {modifier.toFixed(2)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BelievabilityBar;
