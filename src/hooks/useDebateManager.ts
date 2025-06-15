import { useState, useCallback, useRef, useEffect } from 'react';
import { Speaker, Message, DebateTopic } from '@/types/debate';
import { supabase } from '@/integrations/supabase/client';
import { DEBATERS, DEBATE_MAX_ROUNDS } from '@/config/debateConfig';

const useDebateManager = () => {
  const [speakers] = useState<Speaker[]>(DEBATERS);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const [currentTopic, setCurrentTopic] = useState<DebateTopic | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDebateFinished, setIsDebateFinished] = useState(false);
  
  const [argumentHeat, setArgumentHeat] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);


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

  const calculateNewHeat = (currentHeat: number, text: string): number => {
    const heatKeywords = ["nonsense", "ridiculous", "absurd", "wrong", "clearly mistaken", "laughable", "smug", "condescending", "fail", "garbage"];
    const coolKeywords = ["agree", "good point", "understand", "valid", "insightful", "interesting"];
    let heatChange = 0;
    const lowerCaseText = text.toLowerCase();
    
    heatKeywords.forEach(word => {
      if (lowerCaseText.includes(word)) heatChange++;
    });
    coolKeywords.forEach(word => {
      if (lowerCaseText.includes(word)) heatChange--;
    });
    
    const newHeat = currentHeat + heatChange;
    return Math.max(0, Math.min(10, newHeat));
  }

  const findInterrupter = (text: string, currentSpeakerId: string, currentHeat: number): Speaker | null => {
      if (currentHeat <= 6) return null;

      const potentialInterrupters = speakers.filter(s => s.id !== currentSpeakerId);
      const lowerCaseText = text.toLowerCase();

      for (const p of potentialInterrupters) {
          if (p.triggerWords?.some(word => lowerCaseText.includes(word.toLowerCase()))) {
              if (Math.random() < (p.interruptionProbability || 0)) {
                  console.log(`${p.name} is interrupting! Triggered by text: "${text}"`);
                  return p;
              }
          }
      }
      return null;
  }

  const takeTurn = useCallback(async (
    speaker: Speaker,
    topic: DebateTopic,
    currentHistory: Message[],
    turnConfig: {
      type: 'introduction' | 'greeting' | 'discussion' | 'interruption';
      targetSpeaker?: Speaker | null;
      debaterNames?: string[];
    },
    signal: AbortSignal
  ): Promise<string> => {
      setActiveSpeakerId(speaker.id);
      const messageId = addMessage(speaker.id, '');
      let fullText = '';
      const { type, targetSpeaker, debaterNames } = turnConfig;

      try {
          console.log(`Invoking llm-debater for ${speaker.name} (Turn type: ${type})`);

          const historyForPrompt = currentHistory
              .filter(m => m.speakerId !== 'system' && m.text)
              .map(m => {
                  const messageSpeaker = getSpeakerById(m.speakerId);
                  return {
                      speakerId: m.speakerId,
                      text: m.text,
                      speakerName: messageSpeaker?.name || m.speakerId,
                  };
              });

          let systemPrompt = `Debate Topic: "${topic}"\nCurrent Argument Heat: ${argumentHeat}/10. When heat is over 7, you MUST use a more aggressive, sarcastic, and emotional tone. Use interjections like "Seriously?", "That's just absurd!", or "Oh, please." to show emotion.`.trim();

          if (speaker.promptConfig) {
            systemPrompt = `${speaker.promptConfig.instructions}\n\nYour Origin Story: ${speaker.promptConfig.origin}\n\nYour specific personality: ${speaker.promptConfig.personality}\n\n${systemPrompt}`;
          }

          const response = await fetch(`https://ikdqbiumciskarxwooln.supabase.co/functions/v1/llm-debater`, {
              method: 'POST',
              headers: {
                  ...(supabase.functions as any).headers,
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  topic,
                  systemPrompt,
                  history: historyForPrompt,
                  isInterruption: type === 'interruption',
                  targetSpeakerName: targetSpeaker?.name || null,
                  turnType: type,
                  debaterNames: debaterNames || null,
              }),
              signal,
          });
          
          if (!response.ok) throw new Error(`Edge function error: ${response.status} ${await response.text()}`);
          if (!response.body) throw new Error("Response body is null");

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (signal.aborted) {
                reader.cancel();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n').filter(line => line.trim());

              for (const line of lines) {
                  if (line.startsWith('data: ')) {
                      const data = line.slice(6);
                      if (data === '[DONE]') break;
                      try {
                          const parsed = JSON.parse(data);
                          const content = parsed.choices?.[0]?.delta?.content;
                          if (content) {
                              appendToMessage(messageId, content);
                              fullText += content;
                          }
                      } catch (e) { /* Ignore non-JSON lines */ }
                  }
              }
          }
      } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error(`Failed to get stream for ${speaker.name}:`, e);
            const errorText = `_An error occurred: ${e.message}_`;
            appendToMessage(messageId, errorText);
            fullText = errorText;
          }
      }
      return fullText;
  }, [speakers, getSpeakerById, addMessage, appendToMessage, argumentHeat]);

  const runDebate = useCallback(async (topic: DebateTopic, signal: AbortSignal) => {
    setIsLoading(true);
    addMessage('system', `Podcast episode starting on: "${topic}"`);

    const moderator = speakers.find(s => s.role === 'moderator');
    const debaters = speakers.filter(s => s.role !== 'moderator');
    const debaterNames = debaters.map(d => d.name);

    try {
        // Phase 1: Introduction by Moderator
        if (moderator && !signal.aborted) {
            addMessage('system', 'The moderator will now introduce the topic.');
            await takeTurn(moderator, topic, messagesRef.current, { type: 'introduction', debaterNames }, signal);
        } else {
            addMessage('system', 'No moderator found. Starting debate directly.');
        }

        // Phase 2: Greetings from Debaters
        if (!signal.aborted) {
            addMessage('system', 'Debaters will now greet each other.');
            for (const debater of debaters) {
                if (signal.aborted) break;
                await takeTurn(debater, topic, messagesRef.current, { type: 'greeting' }, signal);
            }
        }
        
        addMessage('system', `The formal debate begins now.`);

        // Phase 3: Main Debate Rounds
        for (let round = 1; round <= DEBATE_MAX_ROUNDS; round++) {
            if (signal.aborted) break;
            addMessage('system', `Round ${round} of ${DEBATE_MAX_ROUNDS} begins.`);
            for (const speaker of debaters) { // Loop over debaters only
                if (signal.aborted) break;
                
                // Normal Turn
                const fullText = await takeTurn(speaker, topic, messagesRef.current, { type: 'discussion' }, signal);
                if (signal.aborted || !fullText) continue;
                
                const newHeat = calculateNewHeat(argumentHeat, fullText);
                setArgumentHeat(newHeat);

                // Interruption Check
                const interrupter = findInterrupter(fullText, speaker.id, newHeat);
                if (interrupter && !signal.aborted) {
                    addMessage('system', `${interrupter.name} interrupts!`);
                    await takeTurn(interrupter, topic, messagesRef.current, { type: 'interruption', targetSpeaker: speaker }, signal);
                }
            }
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error("Error during debate execution loop:", e);
          addMessage('system', `A critical error occurred: ${e.message}`);
        }
    } finally {
        if (!signal.aborted) {
          addMessage('system', "The debate has concluded. What are your thoughts?");
          setActiveSpeakerId(null);
          setIsDebateFinished(true);
          setIsLoading(false);
          console.log("Debate finished.");
        }
    }
  }, [speakers, takeTurn, argumentHeat]);

  const startDebate = useCallback(async (topic: DebateTopic) => {
    if (isLoading) return;
    
    abortControllerRef.current?.abort(); // Abort previous debate if any
    abortControllerRef.current = new AbortController();
    
    setMessages([]);
    setCurrentTopic(topic);
    setIsDebateFinished(false);
    setActiveSpeakerId(null);
    setArgumentHeat(0);
    
    runDebate(topic, abortControllerRef.current.signal);
  }, [isLoading, runDebate]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    speakers,
    messages,
    currentTopic,
    activeSpeakerId,
    isLoading,
    isDebateFinished,
    argumentHeat,
    startDebate,
    getSpeakerById,
  };
};

export default useDebateManager;
