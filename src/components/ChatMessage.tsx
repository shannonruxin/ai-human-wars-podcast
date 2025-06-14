
import React from 'react';
import { Message, Speaker } from '@/types/debate';
import SpeakerAvatar from './SpeakerAvatar';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: Message;
  speaker: Speaker;
  isCurrentUserSpeaking: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, speaker, isCurrentUserSpeaking }) => {
  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-150">
      <div className="pt-1">
        <SpeakerAvatar name={speaker.name} avatarSeed={speaker.avatarSeed} isSpeaking={isCurrentUserSpeaking} speakerColor={speaker.color} size="sm" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold" style={{ color: speaker.color }}>{speaker.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
