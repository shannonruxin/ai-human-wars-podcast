
import React from 'react';
import { Speaker } from '@/types/debate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AudienceMeterProps {
  audienceMeter: Record<string, number>;
  speakers: Speaker[];
}

const AudienceMeter: React.FC<AudienceMeterProps> = ({ audienceMeter, speakers }) => {
  const debaters = speakers.filter(s => s.role === 'debater');

  if (Object.keys(audienceMeter).length === 0) return null;

  return (
    <div className="w-full px-4 pt-2">
      <h3 className="text-sm font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">Audience Favor</h3>
      <TooltipProvider delayDuration={100}>
        <div className="flex w-full h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          {debaters.map(speaker => (
            <Tooltip key={speaker.id}>
              <TooltipTrigger asChild>
                <div
                  className="h-full transition-all duration-500 ease-in-out"
                  style={{ width: `${audienceMeter[speaker.id] || 0}%`, backgroundColor: speaker.color }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{speaker.name}: {`${(audienceMeter[speaker.id] || 0).toFixed(1)}%`}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};

export default AudienceMeter;
