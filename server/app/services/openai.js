const OpenAI = require("openai");

class openAi {
  constructor(config) {
    try {
      if (openAi._instance) {
        return openAi._instance;
      }
      if (!config.organization || !config.project || !config.apiKey) {
        throw new Error("OpenAI API Key is missing");
      }
      this.config = config;
      this.client = new OpenAI({
        organization: config.organization,
        project: config.project,
        apiKey: config.apiKey,
      });
      openAi._instance = this.client;
      return this.client;
    } catch (error) {
      throw new Error("Error connecting to OpenAI: " + error.message);
    }
  }
}

module.exports = openAi;
