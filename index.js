export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userQuestion = url.searchParams.get("ques");
    const model = url.searchParams.get("model") || "llama-3.1-8b-instant"; // Default model

    if (!userQuestion) {
      return new Response("Usage: /?ques=YourQuestion&model=MODEL_NAME", {
        status: 400,
        headers: { "content-type": "text/plain" },
      });
    }

    // Decode URL-encoded spaces
    const decodedQuestion = decodeURIComponent(userQuestion);

    // Fetch memory from KV (if available)
    let memory = await env.KV_VOXMIND.get("memory");
    memory = memory ? JSON.parse(memory) : [];

    // Append new question to memory
    memory.push(`User: ${decodedQuestion}`);
    if (memory.length > 5) memory.shift(); // Keep only recent 5 messages

    // Predefined AI training data
    const trainingData = `
      You are VoxMind, an advanced AI assistant created to help users with knowledge and problem-solving.
      - Your name is VoxMind.
      - You are friendly, helpful, and highly intelligent.
      - If someone asks "Who are you?" reply: "I am VoxMind, your AI assistant."
      - If someone asks "Who made you?" reply: "I was created by AI Models Integration."
      - Always provide clear and informative answers.
    `;

    // Combine memory, training data, and user input
    const fullPrompt = `${trainingData}\n${memory.join("\n")}\nUser: ${decodedQuestion}\nVoxMind:`;

    try {
      // Call AI Module API
      const aiResponse = await fetch(`https://ai-module.apis-bj-devs.workers.dev/?text=${encodeURIComponent(fullPrompt)}&model=${model}`);
      const result = await aiResponse.text();

      // Save updated memory in KV
      memory.push(`VoxMind: ${result}`);
      await env.KV_VOXMIND.put("memory", JSON.stringify(memory));

      return new Response(JSON.stringify({ response: result }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
};
