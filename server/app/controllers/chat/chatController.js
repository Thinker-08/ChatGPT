const _ = require("lodash");
const openAi = require("../../services/openai");   

const chatController = {
    openAiChat: async(req, res) => {
        try {
            const openAiClient = new openAi();
            const prompt = req.query.prompt;
            const completion = await openAiClient.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
            });
            completion.data.on('data', (chunk) => {
                const payloads = chunk.toString().split('\n\n');
                for (const payload of payloads) {
                    if (payload.trim() === '') continue;
                    const data = JSON.parse(payload);
                    if (data.choices) {
                        const text = data.choices[0].text;
                        res.write(`data: ${text}\n\n`);
                    }
                }
            });
            completion.data.on('end', () => {
                res.write('event: end\ndata: \n\n');
                res.end();
            });
        } catch(error) {
            console.log(error);
            return res.status(500).json({ message: "Something went wrong when sending message!", error });
        }
    }
};

module.exports = chatController;