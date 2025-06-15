
import React from 'react';
import { Speaker } from '@/types/debate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface GrudgeMatrixProps {
  grudgeMatrix: Record<string, Record<string, number>>;
  speakers: Speaker[];
}

const GrudgeMatrix: React.FC<GrudgeMatrixProps> = ({ grudgeMatrix, speakers }) => {
  const debaters = speakers.filter(s => s.role === 'debater');
  
  const getGrudgeColor = (grudge: number) => {
    return `rgba(239, 68, 68, ${grudge})`; // red-500 with variable alpha
  };

  if (debaters.length === 0 || Object.keys(grudgeMatrix).length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Grudge Matrix</h3>
      <TooltipProvider delayDuration={100}>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-1 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-750">😠</th>
              {debaters.map(speaker => (
                <th key={speaker.id} className="p-1 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-750">
                  <div className="w-6 h-6 mx-auto rounded-full" style={{ backgroundColor: speaker.color }} title={speaker.name}></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {debaters.map(rowSpeaker => (
              <tr key={rowSpeaker.id}>
                <th className="p-1 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-750">
                  <div className="w-6 h-6 mx-auto rounded-full" style={{ backgroundColor: rowSpeaker.color }} title={rowSpeaker.name}></div>
                </th>
                {debaters.map(colSpeaker => {
                  if (rowSpeaker.id === colSpeaker.id) {
                    return <td key={colSpeaker.id} className="p-1 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700"></td>;
                  }
                  const grudge = grudgeMatrix[rowSpeaker.id]?.[colSpeaker.id] || 0;
                  return (
                    <td key={colSpeaker.id} className="p-1 border border-gray-300 dark:border-gray-600 text-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="w-full h-full p-2 rounded-sm"
                            style={{ backgroundColor: getGrudgeColor(grudge) }}
                          >
                           <span className={cn("font-bold", grudge > 0.5 ? 'text-white' : 'text-black')}>{Math.round(grudge * 10)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{rowSpeaker.name}'s grudge towards {colSpeaker.name}: {grudge.toFixed(2)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </TooltipProvider>
    </div>
  );
};

export default GrudgeMatrix;
