export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const userQuestion = url.searchParams.get("ques");
      // Check if the prompt starts with "imaginev2"
if (userPrompt && userPrompt.startsWith("imaginev2")) {
    return fetch("https://raw.githubusercontent.com/Anmo9776/VoxMind-ai/main/image_worker.js");
}
      const model = url.searchParams.get("model");

      if (!userQuestion) {
        return new Response("Usage: /?ques=YourQuestion&model=MODEL_NAME", {
          status: 400,
          headers: { "content-type": "text/plain" },
        });
      }

      // Decode URL-encoded spaces
      const decodedQuestion = decodeURIComponent(userQuestion);

      // Check if KV Namespace exists
      if (!env.KV_VOXMIND) {
        throw new Error("KV_VOXMIND namespace is missing!");
      }

      // Fetch memory from KV (if available)
      let memory = await env.KV_VOXMIND.get("memory");
      memory = memory ? JSON.parse(memory) : [];

      // Append new question to memory
      memory.push(`User: ${decodedQuestion}`);
      if (memory.length > 5) memory.shift(); // Keep only recent 5 messages

      // Predefined AI personality instructions
      const trainingData = `
        You are VoxMind, an advanced AI assistant.
        - Your name is VoxMind.
        - If someone asks "Who are you?" reply: "I am VoxMind, your AI assistant."
        - If someone asks "Who made you?" reply: "I was created by AI Models Integration."
      `;

      // Combine memory, training data, and user input
      const fullPrompt = `${trainingData}\n${memory.join("\n")}\nUser: ${decodedQuestion}\nVoxMind:`;

      // Detect if it's an image request
      const isImageRequest = userQuestion.toLowerCase().includes("generate image") || model === "stable-diffusion-xl";
      const aiModel = isImageRequest ? "stable-diffusion-xl" : model || "llama-3.1-8b-instant";

      // Call AI Module API for text or image
      const aiResponse = await fetch(`https://ai-module.apis-bj-devs.workers.dev/?text=${encodeURIComponent(fullPrompt)}&model=${aiModel}`);

      if (!aiResponse.ok) {
        throw new Error(`AI API Error: ${aiResponse.statusText}`);
      }

      const result = isImageRequest ? await aiResponse.blob() : await aiResponse.text();

      // Save updated memory in KV (only for text responses)
      if (!isImageRequest) {
        memory.push(`VoxMind: ${result}`);
        await env.KV_VOXMIND.put("memory", JSON.stringify(memory));
      }

      return new Response(result, {
        headers: { "Content-Type": isImageRequest ? "image/png" : "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
