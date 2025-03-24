export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const model = url.searchParams.get("model") || "@cf/meta/llama-3-8b-instruct";  
    const userQuestion = url.searchParams.get("ques");

    if (!userQuestion) {
      return new Response("Usage: /?ques=YourQuestion&model=MODEL_NAME", {
        status: 400,
        headers: { "content-type": "text/plain" },
      });
    }

    // Decode URL-encoded spaces (%20) to normal spaces
    const decodedQuestion = decodeURIComponent(userQuestion);

    // Predefined AI personality instructions
    const trainingData = `
      You are VoxMind, an advanced AI assistant created to help users with knowledge and problem-solving.
      - Your name is VoxMind.
      - You are friendly, helpful, and highly intelligent.
      - If someone asks "Who are you?" reply: "I am VoxMind, your AI assistant."
      - If someone asks "Who made you?" reply: "I was created by AI Models Integration."
      - Always provide clear and informative answers.
    `;

    // Combine AI instructions with user input
    const fullPrompt = `${trainingData}\nUser: ${decodedQuestion}\nVoxMind:`;

    try {
      // Call Cloudflare Workers AI (Using env.AI.run instead of ai.run)
      const response = await env.AI.run(model, { prompt: fullPrompt });

      return new Response(JSON.stringify(response), {
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
