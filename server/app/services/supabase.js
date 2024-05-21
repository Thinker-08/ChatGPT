const { createClient } = require("@supabase/supabase-js");

class supabase {
  constructor(config) {
    try {
      if (supabase._instance) {
        return supabase._instance;
      }
      if (!config.SUPABASE_URL || !config.SUPABASE_KEY) {
        throw new Error("Missing SUPABASE_URL or SUPABASE_KEY");
      }
      this.config = config;
      this.client = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
      supabase._instance = this.client;
      return this.client;
    } catch (error) {
      console.error("Error connecting to Supabase:", error);
    }
  }
}

module.exports = supabase;
