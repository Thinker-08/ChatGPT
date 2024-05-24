const _ = require("lodash");
const openAi = require("../../services/openai");
const supabase = require("../../services/supabase");
const chatController = {
  newChat: async (req, res) => {
    try {
      const accessToken = _.get(req, "body.accessToken", null);
      if (!accessToken) {
        return res
          .status(400)
          .json({ message: "User ID is missing in the request body" });
      }
      const userId = _.get(accessToken, "id");
      if (!userId) {
        return res.status(400).json({ message: "UserId us missing" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const totalChats = await supabaseClient
        .from("chats")
        .select("*", "id(count)");
      const newChatId = totalChats.data.length === 0 ? 1 : totalChats.data[totalChats.data.length-1]?.id + 1;
      console.log(newChatId);
      const { error } = await supabaseClient.from("chats").insert({
        user_id: userId,
        id: newChatId,
      });
      if (error) {
        throw new Error(error?.message);
      }
      res.json({ message: "Chat started!", newChatId });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },

  openAiChat: async (req, res) => {
    try {
      const chatId = _.get(req, "query.chatId", null);
      const prompt = _.get(req, "query.prompt", null);
      if (!chatId) {
        return res
          .status(400)
          .json({ message: "Chat ID is missing in the request body" });
      }
      if (!prompt) {
        return res
          .status(400)
          .json({ message: "Prompt is missing in the request body" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const openAiClient = new openAi({ apiKey: process.env.API_KEY });
      const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .eq("chat_id", chatId);
      if (error) {
        throw new Error(error.message);
      }
      const history = data
        ?.map((message) => [
          { role: "user", parts: [{ text: message.prompt }] },
          { role: "model", parts: [{ text: message.response }] },
        ])
        .flat(Infinity);
      const model = openAiClient.getGenerativeModel({
        model: "gemini-1.0-pro-latest",
      });
      const chat = model.startChat({
        history,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
      let text = "";
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
      const result = await chat.sendMessageStream(prompt);
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        console.log("Sending chunk:", chunkText);
        const lines = chunkText.split("\n");
        lines.forEach((line) => {
          text += `${line}\n`;
          res.write(`data: ${line}\n`);
        });
        res.write("\n");
      }
      console.log("Sending DONE");
      res.write(`data: [DONE]\n\n`);
      res.end();
      const response = await supabaseClient.from("messages").insert({
        chat_id: chatId,
        prompt,
        response: text,
      });
      if (response.error) {
        console.log(error);
        throw new Error("Error while saving record");
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },

  init: async (req, res) => {
    const chatId = _.get(req, "body.chatId", null);
    const prompt = _.get(req, "body.prompt", null);

    if (!chatId) {
      return res
        .status(400)
        .json({ message: "Chat ID is missing in the request body" });
    }

    if (!prompt) {
      return res
        .status(400)
        .json({ message: "Prompt is missing in the request body" });
    }
    const sseUrl = `/openAiChat?chatId=${encodeURIComponent(
      chatId
    )}&prompt=${encodeURIComponent(prompt)}`;
    res.json({ sseUrl });
  },

  fetchChatHistory: async (req, res) => {
    try {
      const accessToken = _.get(req, "body.accessToken", null);
      if (!accessToken) {
        return res
          .status(400)
          .json({ message: "User ID is missing in the request body" });
      }
      const userId = _.get(accessToken, "id");
      if (!userId) {
        return res.status(400).json({ message: "UserId us missing" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const { data, error } = await supabaseClient
        .from("chats")
        .select("*")
        .eq("user_id", userId)
        .order("id", { ascending: false });
      if (error) {
        throw new Error(error.message);
      }
      const chatHistoryIds = data?.map((chat) => chat.id);
      const response = await supabaseClient
        .from("messages")
        .select("*")
        .in("chat_id", chatHistoryIds);
      if (response.error) {
        throw new Error(response.error.message);
      }
      const eventResponse = response.data;
      const grouped = eventResponse.reduce((acc, record) => {
        if (!acc[record.chat_id]) {
          acc[record.chat_id] = [];
        }
        acc[record.chat_id].push(record);
        return acc;
      }, {});
      const earliestRecords = Object.values(grouped).map((group) => {
        return group.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )[0];
      });
      const sortedRecords = earliestRecords.sort(
        (a, b) => b.chat_id - a.chat_id
      );
      console.log(sortedRecords)
      res.json({ message: "Chat started!", data: sortedRecords });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },

  deleteChat: async (req, res) => {
    try {
      const accessToken = _.get(req, "body.accessToken", null);
      if (!accessToken) {
        return res
          .status(400)
          .json({ message: "User ID is missing in the request body" });
      }
      const userId = _.get(accessToken, "id");
      if (!userId) {
        return res.status(400).json({ message: "UserId us missing" });
      }
      const chatId = _.get(req, "body.chatId", null);
      if (!chatId) {
        return res
          .status(400)
          .json({ message: "Chat ID is missing in the request body" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const { data, error } = await supabaseClient
        .from("chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
      const response = await supabaseClient
        .from("messages")
        .delete()
        .eq("chat_id", chatId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      res.json({ message: "Chat deleted!", data });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },

  fetchChats: async (req, res) => {
    try {
      const accessToken = _.get(req, "body.accessToken", null);
      if (!accessToken) {
        return res
          .status(400)
          .json({ message: "User ID is missing in the request body" });
      }
      const userId = _.get(accessToken, "id");
      if (!userId) {
        return res.status(400).json({ message: "UserId us missing" });
      }
      const chatId = _.get(req, "body.chatId", null);
      if (!chatId) {
        return res
          .status(400)
          .json({ message: "Chat ID is missing in the request body" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) {
        console.log(error.message);
        throw new Error(error.message);
      }
      return res.json({ message: "Chat started!", data });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },

  deleteAllChats: async (req, res) => {
    try {
      const accessToken = _.get(req, "body.accessToken", null);
      if (!accessToken) {
        return res
          .status(400)
          .json({ message: "User ID is missing in the request body" });
      }
      const userId = _.get(accessToken, "id");
      if (!userId) {
        return res.status(400).json({ message: "UserId us missing" });
      }
      const supabaseClient = new supabase({ SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_KEY: process.env.SUPABASE_KEY });
      const { data, error } = await supabaseClient.from("chats").select("*").eq("user_id", userId);
      if (error) {
        throw new Error(error.message);
      }
      const chatIds = data?.map((chat) => chat.id);
      if (!chatIds) {
        return res.status(400).json({ message: "No chats found!" });
      }
      const response = await supabaseClient
        .from("chats")
        .delete()
        .eq("user_id", userId);
      if (response?.error) {
        throw new Error(error.message);
      }
      const deletedChats = await supabaseClient
        .from("messages")
        .delete()
        .in("chat_id", chatIds );
      if (deletedChats?.error) {
        throw new Error(error.message);
      }
      return res.json({ message: "Chat deleted!", data });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ message: "Something went wrong when sending message!", error });
    }
  },
};

module.exports = chatController;
