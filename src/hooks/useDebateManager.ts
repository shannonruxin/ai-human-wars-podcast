import { useState, useCallback, useRef } from 'react';
import { Speaker, Message, DebateTopic } from '@/types/debate';
import { supabase } from '@/integrations/supabase/client';

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
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const [currentTopic, setCurrentTopic] = useState<DebateTopic | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Used for overall debate state + individual turns
  const [isDebateFinished, setIsDebateFinished] = useState(false);

  const getSpeakerById = useCallback((s: string) => speakers.find(p => p.id === s), [speakers]);

  const addMessage = useCallback((speakerId: string, text: string): string => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      speakerId,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const appendToMessage = useCallback((messageId: string, chunk: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, text: msg.text + chunk } : msg
      )
    );
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
          
          const messageId = addMessage(speaker.id, '');

          try {
            console.log(`Invoking llm-debater for ${speaker.name}`);

            const history = messagesRef.current
              .filter(m => m.speakerId !== 'system' && m.text) // Don't include system messages or empty ones
              .map(m => {
                const messageSpeaker = getSpeakerById(m.speakerId);
                return {
                  speakerId: m.speakerId,
                  text: m.text,
                  speakerName: messageSpeaker?.name || m.speakerId,
                };
              });
            
            const functionUrl = `https://ikdqbiumciskarxwooln.supabase.co/functions/v1/llm-debater`;

            const response = await fetch(functionUrl, {
              method: 'POST',
              headers: {
                ...(supabase.functions as any).headers,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                topic: topic,
                systemPrompt: speaker.personality,
                history,
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Edge function error: ${response.status} ${errorText}`);
            }

            if (!response.body) {
              throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              let lineEnd = buffer.indexOf('\n');

              while (lineEnd !== -1) {
                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);

                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') break;
                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      appendToMessage(messageId, content);
                    }
                  } catch (e) {
                     // Ignore parsing errors for non-JSON lines
                  }
                }
                lineEnd = buffer.indexOf('\n');
              }
            }

          } catch (e: any) {
            console.error(`Failed to get stream for ${speaker.name}:`, e);
            appendToMessage(messageId, `_An error occurred while getting the response: ${e.message}_`);
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

  }, [speakers, isLoading, addMessage, getSpeakerById, appendToMessage]); // Ensure all dependencies are listed

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
