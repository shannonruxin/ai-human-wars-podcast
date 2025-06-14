import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for fetch to work in Deno environments with some APIs

const OPENROUTER_API_KEY = Deno.env.get("OpenRouter"); // Matches the secret name you've set
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const MODEL_IDENTIFIER = "meta-llama/llama-3.1-8b-instruct"; // Using a capable model for the debate

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
    const { topic, systemPrompt, history } = await req.json();

    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key is not set in environment variables.");
    }
    if (!topic || !systemPrompt) {
      return new Response(JSON.stringify({ error: "Missing topic or systemPrompt in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[llm-debater] Received stream request for topic: "${topic}"`);

    // Construct messages with history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: { speakerId: string; text: string; speakerName?: string }) => ({
        // Use 'assistant' role for all debaters, distinguishing them by name
        role: msg.speakerId === 'system' ? 'system' : 'assistant',
        name: msg.speakerName?.replace(/\s+/g, '_'), // OpenAI requires name to be a string of a-z, A-Z, 0-9, and underscores
        content: msg.text,
      })),
      { role: "user", content: `Continue the debate on topic: ${topic}. It is now your turn to speak. Provide your response.` },
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
          only: ["chutes"],
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
