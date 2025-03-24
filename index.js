export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const userQuestion = url.searchParams.get("ques");
      const model = url.searchParams.get("model") || "llama-3.1-8b-instant";

      if (!userQuestion) {
        return new Response("Usage: /?ques=YourQuestion OR /?ques=imaginev2 YourImagePrompt", {
          status: 400,
          headers: { "content-type": "text/plain" },
        });
      }

      // ✅ Handle Image Generation Requests (New API)
      if (userQuestion.startsWith("imaginev2")) {
        const imagePrompt = userQuestion.replace("imaginev2", "").trim();

        // Call a working public Stable Diffusion API
        const apiUrl = "https://stablediffusion.fr/api/v3/text2img"; // No API key required
        const imageResponse = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: imagePrompt })
        });

        const imageResult = await imageResponse.json();

        if (imageResult.images && imageResult.images.length > 0) {
          return new Response(JSON.stringify({ image_url: imageResult.images[0] }), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: "Image generation failed." }), { status: 500 });
        }
      }

      // ✅ Handle Normal AI Responses (Text AI)
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

      // Call AI Module API
      const aiResponse = await fetch(`https://ai-module.apis-bj-devs.workers.dev/?text=${encodeURIComponent(fullPrompt)}&model=${model}`);

      if (!aiResponse.ok) {
        throw new Error(`AI API Error: ${aiResponse.statusText}`);
      }

      const result = await aiResponse.text();

      // Save updated memory in KV (only for text responses)
      memory.push(`VoxMind: ${result}`);
      await env.KV_VOXMIND.put("memory", JSON.stringify(memory));

      return new Response(JSON.stringify({ response: result }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
