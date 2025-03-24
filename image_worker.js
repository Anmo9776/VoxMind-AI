export default {
  async fetch(request) {
    const url = new URL(request.url);
    const userPrompt = url.searchParams.get("ques");

    if (!userPrompt || !userPrompt.startsWith("imaginev2")) {
      return new Response("Invalid request. Use: /?ques=imaginev2 Your Prompt", { status: 400 });
    }

    const imagePrompt = userPrompt.replace("imaginev2", "").trim();

    // Call the image generation API (Stable Diffusion API)
    const apiUrl = "https://stablediffusionapi.com/api/v3/text2img";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: imagePrompt })
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
  }
};
