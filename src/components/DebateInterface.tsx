
import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import TopicInput from './TopicInput';
import SpeakerAvatar from './SpeakerAvatar';
import useDebateManager from '@/hooks/useDebateManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Flame } from 'lucide-react';

const DebateInterface: React.FC = () => {
  const {
    speakers,
    messages,
    currentTopic,
    activeSpeakerId,
    isLoading,
    isDebateFinished,
    argumentHeat,
    startDebate,
    getSpeakerById,
  } = useDebateManager();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-xl font-semibold text-center flex items-center justify-center">
          <Bot className="w-6 h-6 mr-2 text-indigo-500" /> LLM Debate Show
        </h1>
        {currentTopic && (
          <div className="max-w-md mx-auto mt-2">
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">Topic: "{currentTopic}"</p>
            <div className="flex items-center gap-2 mt-2">
              <Flame className="w-4 h-4 text-red-500" />
              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${argumentHeat * 10}%` }}></div>
              </div>
              <span className="text-xs font-mono text-red-500">{argumentHeat}/10</span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Speakers Panel (Sidebar) */}
        <aside className="w-full md:w-1/4 lg:w-1/5 p-4 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Speakers</h2>
          <div className="space-y-4">
            {speakers.map((speaker) => (
              <div key={speaker.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <SpeakerAvatar
                  name={speaker.name}
                  avatarSeed={speaker.avatarSeed}
                  isSpeaking={activeSpeakerId === speaker.id}
                  speakerColor={speaker.color}
                  size="md"
                />
                 <span className="font-semibold" style={{ color: speaker.color }}>{speaker.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Bot size={48} className="mb-4" />
                <p className="text-lg">Enter a topic below to start the debate!</p>
              </div>
            )}
            {messages.map((msg) => {
              // Handle system messages differently or filter them out if not needed for display
              if (msg.speakerId === 'system') {
                return (
                  <div key={msg.id} className="my-2 p-2 text-center text-xs text-gray-500 dark:text-gray-400 italic bg-gray-200 dark:bg-gray-750 rounded-md">
                    {msg.text}
                  </div>
                );
              }
              const speaker = getSpeakerById(msg.speakerId);
              if (!speaker) return null;
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  speaker={speaker}
                  isCurrentUserSpeaking={activeSpeakerId === msg.speakerId && !isDebateFinished}
                />
              );
            })}
             {isDebateFinished && messages.length > 0 && (
              <div className="text-center mt-4 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
                <p className="font-semibold text-green-700 dark:text-green-300">Debate Concluded!</p>
                <p className="text-sm text-green-600 dark:text-green-400">What are your final thoughts on the topic: "{currentTopic}"?</p>
              </div>
            )}
          </ScrollArea>
          <TopicInput onStartDebate={startDebate} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
};

export default DebateInterface;
