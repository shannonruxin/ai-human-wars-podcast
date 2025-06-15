
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for fetch to work in Deno environments with some APIs

const OPENROUTER_API_KEY = Deno.env.get("OpenRouter"); // Matches the secret name you've set
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_IDENTIFIER = "meta-llama/llama-3.1-70b-instruct"; // Using the specified model

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, systemPrompt, history, isInterruption, targetSpeakerName, turnType, debaterNames } = await req.json();

    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key is not set in environment variables.");
    }
    if (!topic || !systemPrompt) {
      return new Response(JSON.stringify({ error: "Missing topic or systemPrompt in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[llm-debater] Received request for topic: "${topic}"`);
    if(isInterruption) console.log(`[llm-debater] This is an INTERJECTION targeting ${targetSpeakerName}`);
    else console.log(`[llm-debater] Turn Type: ${turnType}`);


    let userContent = '';

    switch (turnType) {
        case 'introduction':
            userContent = `You are the Moderator. Your task is to introduce the debate.
- Topic: "${topic}"
- Debaters: ${debaterNames.join(', ')}
Please provide a compelling opening statement to kick off the podcast episode. Welcome the guests and set the stage.`;
            break;
        case 'greeting':
            const lastSpeakerNameGreeting = history && history.length > 0 ? history[history.length - 1].speakerName : 'The Moderator';
            userContent = `That was ${lastSpeakerNameGreeting}. It's your turn to speak. Please offer a brief greeting to the moderator and your fellow debaters. Keep it short and professional, perhaps with a hint of your personality.`;
            break;
        case 'interruption':
            userContent = `You are interrupting ${targetSpeakerName}. Their last statement has triggered you. You MUST make a short, sharp, angry retort directly addressing their last point. Keep it brief and impactful. Do not give a full monologue. What is your retort?`;
            break;
        case 'debate':
        default:
            const lastSpeakerNameDebate = history && history.length > 0 ? history[history.length - 1].speakerName : null;
            userContent = lastSpeakerNameDebate
              ? `That was the statement from ${lastSpeakerNameDebate}. Now it is your turn. You MUST start by directly addressing their argument before making your own points. Refute, deconstruct, or build upon what they just said. What is your response?`
              : `You are the first speaker in this debate on "${topic}". Please provide your opening arguments. It is your turn to speak now.`;
            break;
    }

    // Construct messages with history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: { speakerId: string; text: string; speakerName?: string }) => ({
        // Use 'assistant' role for all debaters, distinguishing them by name
        role: msg.speakerId === 'system' ? 'system' : 'assistant',
        name: msg.speakerName?.replace(/\s+/g, '_'), // OpenAI requires name to be a string of a-z, A-Z, 0-9, and underscores
        content: msg.text,
      })),
      { role: "user", content: userContent },
    ];

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev", // Recommended by OpenRouter
        "X-Title": "LLM Debate Show", // Recommended by OpenRouter
      },
      body: JSON.stringify({
        model: MODEL_IDENTIFIER,
        messages: messages,
        stream: true, // Enable streaming
        provider: {
          only: ["deepinfra"],
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[llm-debater] OpenRouter API error: ${response.status} ${response.statusText}`, errorBody);
      return new Response(JSON.stringify({ 
        error: `OpenRouter API error: ${response.status} ${response.statusText}`, 
        details: errorBody 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.body) {
      return new Response(JSON.stringify({ error: "No response body from OpenRouter stream." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pipe the stream from OpenRouter directly to the client
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream; charset=utf-8' },
    });

  } catch (error) {
    console.error("[llm-debater] Error in Edge Function:", error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
