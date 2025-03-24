export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let text = url.searchParams.get("text") || "Hello!";
    let model = url.searchParams.get("model") || "@cf/google/gemma-2b-it"; // Default model

    // Fetch memory if available
    let memory = await env.KV_VOXMIND.get("chat_memory") || "No previous data.";

    let aiUrl = `https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/ai/run/${model}`;
    
    let aiResponse = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: memory + "\nUser: " + text })
    });

    let data = await aiResponse.json();

    // Store response in memory
    await env.KV_VOXMIND.put("chat_memory", memory + "\nAI: " + data.result);

    return new Response(JSON.stringify({ success: true, response: data.result }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
