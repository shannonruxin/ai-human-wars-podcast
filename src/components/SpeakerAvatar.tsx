
import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpeakerAvatarProps {
  name: string;
  avatarSeed: string; // For now, just used for alt text, could generate placeholder
  isSpeaking?: boolean;
  speakerColor: string;
  size?: 'sm' | 'md' | 'lg';
}

const SpeakerAvatar: React.FC<SpeakerAvatarProps> = ({ name, isSpeaking, speakerColor, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        className={cn(
          'rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 overflow-hidden transition-all duration-300 ease-in-out',
          sizeClasses[size],
          isSpeaking ? `ring-4` : 'ring-0 ring-transparent'
        )}
        style={{ borderColor: isSpeaking ? speakerColor : 'transparent' }}
      >
        {/* Placeholder Icon - can be replaced with actual images or more sophisticated placeholders */}
        <User className={cn('text-gray-500 dark:text-gray-400', {
          'w-4 h-4': size === 'sm',
          'w-6 h-6': size === 'md',
          'w-8 h-8': size === 'lg',
        })} />
      </div>
      <span className={cn("text-xs text-center truncate w-16", isSpeaking ? 'font-semibold' : 'font-normal')} style={{color: isSpeaking ? speakerColor : 'inherit'}}>
        {name}
      </span>
    </div>
  );
};

export default SpeakerAvatar;
