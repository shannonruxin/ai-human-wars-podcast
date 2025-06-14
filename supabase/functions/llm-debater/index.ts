
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts"; // Required for fetch to work in Deno environments with some APIs

const OPENROUTER_API_KEY = Deno.env.get("OpenRouter"); // Matches the secret name you've set
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// NOTE: The user specified "QWEN3 235B A22B".
// Using "qwen/qwen2-72b-instruct" as a placeholder.
// User can update this if they have a more specific model ID for OpenRouter.
const MODEL_IDENTIFIER = "qwen/qwen2-72b-instruct";

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
    const { topic, systemPrompt } = await req.json();

    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API key is not set in environment variables.");
    }
    if (!topic || !systemPrompt) {
      return new Response(JSON.stringify({ error: "Missing topic or systemPrompt in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[llm-debater] Received request for topic: "${topic}" with system prompt: "${systemPrompt}"`);

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // OpenRouter specific headers if needed, e.g., for routing or site identification
        // "HTTP-Referer": "YOUR_SITE_URL", // Replace with your actual site URL
        // "X-Title": "YOUR_SITE_NAME", // Replace with your actual site name
      },
      body: JSON.stringify({
        model: MODEL_IDENTIFIER,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Debate topic: ${topic}\n\nPlease provide your opening statement or response.` },
        ],
        // Optional parameters:
        // temperature: 0.7,
        // max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[llm-debater] OpenRouter API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log("[llm-debater] Received response from OpenRouter:", data);

    const llmResponse = data.choices?.[0]?.message?.content?.trim();

    if (!llmResponse) {
        console.error("[llm-debater] No content in OpenRouter response choice.");
        throw new Error("Failed to get a valid response from the LLM.");
    }

    return new Response(JSON.stringify({ response: llmResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[llm-debater] Error in Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
