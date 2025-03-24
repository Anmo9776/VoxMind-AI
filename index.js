export default {
  async fetch(request) {
    return new Response("Hello from VoxMind AI!", {
      headers: { "content-type": "text/plain" },
    });
  },
};
