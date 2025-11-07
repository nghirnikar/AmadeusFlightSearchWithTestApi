export default {
  async fetch(request, env, ctx) {
    // serve static files from your repo root
    return env.ASSETS.fetch(request);
  },
};
