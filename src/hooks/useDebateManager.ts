
import { useState, useCallback, useEffect } from 'react';
import { Speaker, Message, DebateTopic } from '@/types/debate';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

// Define initial speakers with personalities (system prompts)
const initialSpeakers: Speaker[] = [
  { id: 'claude', name: 'Claude', avatarSeed: 'claude', personality: 'You are Claude, an analytical and wise AI. Focus on the complexities and ethical implications. Provide nuanced arguments.', color: '#D97706' },
  { id: 'gpt', name: 'GPT-4', avatarSeed: 'gpt', personality: 'You are GPT-4, a knowledgeable and articulate AI. Support your points with research and academic viewpoints. Aim for comprehensive understanding.', color: '#10B981' },
  { id: 'gemini', name: 'Gemini', avatarSeed: 'gemini', personality: 'You are Gemini, a creative and inquisitive AI. Explore different angles and abstract thoughts. Reframe assumptions and consider a spectrum of interpretations.', color: '#6366F1' },
  { id: 'llama', name: 'Llama', avatarSeed: 'llama', personality: 'You are Llama, a pragmatic and direct AI. Focus on tangible outcomes and observable facts. Provide straightforward and logical conclusions.', color: '#EC4899' },
];

// Simulated LLM responses and responseCounters are no longer needed

const useDebateManager = () => {
  const [speakers] = useState<Speaker[]>(initialSpeakers);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopic, setCurrentTopic] = useState<DebateTopic | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Used for overall debate state + individual turns
  const [isDebateFinished, setIsDebateFinished] = useState(false);

  // debateIntervalRef and responseCounters are no longer needed

  const getSpeakerById = useCallback((id: string) => speakers.find(s => s.id === id), [speakers]);

  const addMessage = useCallback((speakerId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      speakerId,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    // Active speaker is managed more directly in startDebate now
  }, []);

  const startDebate = useCallback(async (topic: DebateTopic) => {
    if (isLoading) return; // Prevent multiple debates starting
    
    console.log("Starting debate with topic:", topic);
    setMessages([]); // Clear previous messages
    setCurrentTopic(topic);
    setIsDebateFinished(false);
    setActiveSpeakerId(null);
    setIsLoading(true); // Set loading for the entire debate process

    addMessage('system', `Starting debate on: "${topic}"`);

    const maxRounds = 3; // Each speaker speaks this many times

    try {
      for (let round = 0; round < maxRounds; round++) {
        console.log(`Starting round ${round + 1}`);
        for (const speaker of speakers) {
          console.log(`Speaker ${speaker.name}'s turn.`);
          setActiveSpeakerId(speaker.id);
          // Optional: Add a "Thinking..." message for the current speaker
          // addMessage(speaker.id, `${speaker.name} is thinking...`);

          try {
            console.log(`Invoking llm-debater for ${speaker.name} with system prompt: ${speaker.personality}`);
            const { data, error: functionError } = await supabase.functions.invoke('llm-debater', {
              body: {
                topic: topic,
                systemPrompt: speaker.personality, // Use personality as the system prompt
              },
            });

            if (functionError) {
              console.error(`Error invoking llm-debater function for ${speaker.name}:`, functionError);
              addMessage('system', `Error getting response from ${speaker.name}: ${functionError.message}. Check Edge Function logs.`);
              continue; // Skip to next speaker or handle error more gracefully
            }

            if (data && data.response) {
              console.log(`Response from ${speaker.name}:`, data.response);
              addMessage(speaker.id, data.response);
            } else {
              console.warn(`${speaker.name} did not provide a valid response. Data:`, data);
              addMessage('system', `${speaker.name} did not provide a response.`);
            }
          } catch (e: any) {
            console.error(`Failed to call llm-debater function for ${speaker.name}:`, e);
            addMessage('system', `System error while getting response from ${speaker.name}: ${e.message}.`);
          }
        }
      }
    } catch (e: any) {
        console.error("Error during debate execution loop:", e);
        addMessage('system', `A critical error occurred during the debate: ${e.message}`);
    } finally {
        addMessage('system', "The debate has concluded. What are your thoughts?");
        setActiveSpeakerId(null);
        setIsDebateFinished(true);
        setIsLoading(false); // Debate finished, clear loading state
        console.log("Debate finished.");
    }

  }, [speakers, isLoading, addMessage, getSpeakerById]); // Ensure all dependencies are listed

  // useEffect for cleanup is no longer needed as setInterval is removed

  return {
    speakers,
    messages,
    currentTopic,
    activeSpeakerId,
    isLoading,
    isDebateFinished,
    startDebate,
    getSpeakerById,
  };
};

export default useDebateManager;
