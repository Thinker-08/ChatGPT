const { GoogleGenerativeAI } = require("@google/generative-ai");

class openAi {
  constructor(config) {
    try {
      if (openAi._instance) {
        return openAi._instance;
      }
      if (!config.apiKey) {
        throw new Error("OpenAI API Key is missing");
      }
      this.config = config;
      this.client = new GoogleGenerativeAI(config.apiKey);
      openAi._instance = this.client;
      return this.client;
    } catch (error) {
      throw new Error("Error connecting to OpenAI: " + error.message);
    }
  }
}

module.exports = openAi;
