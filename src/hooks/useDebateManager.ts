
import { useState, useCallback, useEffect, useRef } from 'react';
import { Speaker, Message, DebateTopic } from '@/types/debate';

// Define some initial speakers
const initialSpeakers: Speaker[] = [
  { id: 'claude', name: 'Claude', avatarSeed: 'claude', personality: 'Analytical & Wise', color: '#D97706' }, // Amber
  { id: 'gpt', name: 'GPT-4', avatarSeed: 'gpt', personality: 'Knowledgeable & Articulate', color: '#10B981' }, // Emerald
  { id: 'gemini', name: 'Gemini', avatarSeed: 'gemini', personality: 'Creative & Inquisitive', color: '#6366F1' }, // Indigo
  { id: 'llama', name: 'Llama', avatarSeed: 'llama', personality: 'Pragmatic & Direct', color: '#EC4899' }, // Pink
];

// Simulated LLM responses for a generic topic
const simulatedResponses: Record<string, string[]> = {
  claude: [
    "That's an interesting proposition. From my perspective, considering the vast datasets I've analyzed, the nuances are quite complex.",
    "However, one must also account for the ethical implications, which are paramount.",
    "Ultimately, while data suggests a certain trend, human unpredictability remains a significant factor.",
  ],
  gpt: [
    "Indeed. Building on that, current research highlights several key factors that support this idea.",
    "For example, studies from MIT and Stanford often point towards socio-economic drivers in such discussions.",
    "It's crucial to synthesize these academic viewpoints with real-world observations for a comprehensive understanding.",
  ],
  gemini: [
    "Oh, this is fascinating! What if we look at it from a completely different angle? Imagine the possibilities if we reframe the core assumptions!",
    "Could artistic expression or abstract thought offer new insights here? I believe so.",
    "Perhaps the 'truth' isn't a fixed point, but a spectrum of creative interpretations.",
  ],
  llama: [
    "Let's be practical. The evidence clearly points in one direction if we focus on tangible outcomes.",
    "Overcomplicating it with hypotheticals might obscure the most straightforward answer.",
    "The most logical conclusion, based on observable facts, is often the simplest one.",
  ],
};

const useDebateManager = () => {
  const [speakers] = useState<Speaker[]>(initialSpeakers);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTopic, setCurrentTopic] = useState<DebateTopic | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebateFinished, setIsDebateFinished] = useState(false);

  const responseCounters = useRef<Record<string, number>>({});
  const debateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getSpeakerById = useCallback((id: string) => speakers.find(s => s.id === id), [speakers]);

  const addMessage = (speakerId: string, text: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      speakerId,
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    setActiveSpeakerId(speakerId);
  };

  const startDebate = useCallback((topic: DebateTopic) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setMessages([]);
    setCurrentTopic(topic);
    setIsDebateFinished(false);
    responseCounters.current = speakers.reduce((acc, speaker) => ({ ...acc, [speaker.id]: 0 }), {});
    setActiveSpeakerId(null);

    // Simulate initial thought process
    addMessage('system', `Starting debate on: "${topic}"`);

    let turnIndex = 0;
    let rounds = 0;
    const maxRounds = 3; // Each speaker speaks 3 times

    if (debateIntervalRef.current) {
      clearInterval(debateIntervalRef.current);
    }

    // Simulate a slight delay before the first speaker
    setTimeout(() => {
        setIsLoading(false);
        debateIntervalRef.current = setInterval(() => {
        const currentSpeaker = speakers[turnIndex % speakers.length];
        const responseIndex = responseCounters.current[currentSpeaker.id];
        
        if (responseIndex < simulatedResponses[currentSpeaker.id]?.length) {
          const responseText = simulatedResponses[currentSpeaker.id][responseIndex];
          addMessage(currentSpeaker.id, responseText);
          responseCounters.current[currentSpeaker.id]++;
        }

        turnIndex++;
        if (turnIndex >= speakers.length * maxRounds) {
          if (debateIntervalRef.current) clearInterval(debateIntervalRef.current);
          addMessage('system', "The debate has concluded. What are your thoughts?");
          setActiveSpeakerId(null);
          setIsDebateFinished(true);
        }
      }, 3000 + Math.random() * 2000); // Vary delay between messages
    }, 1500);


  }, [speakers, isLoading]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (debateIntervalRef.current) {
        clearInterval(debateIntervalRef.current);
      }
    };
  }, []);

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
