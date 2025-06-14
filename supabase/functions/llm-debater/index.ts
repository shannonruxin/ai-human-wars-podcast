import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for fetch to work in Deno environments with some APIs

const OPENAI_API_KEY = Deno.env.get("OpenAI"); // Use the OpenAI secret
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const MODEL_IDENTIFIER = "gpt-4o-mini";

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

    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not set in environment variables.");
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

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_IDENTIFIER,
        messages: messages,
        stream: true, // Enable streaming
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[llm-debater] OpenAI API error: ${response.status} ${response.statusText}`, errorBody);
      return new Response(JSON.stringify({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}`, 
        details: errorBody 
      }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.body) {
      return new Response(JSON.stringify({ error: "No response body from OpenAI stream." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pipe the stream from OpenAI directly to the client
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
