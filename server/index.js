const express = require('express');
const env = require('dotenv').config();
const cors = require('cors');
const app = express();
const router = express.Router();
const supabase = require('./app/services/supabase');
const openAi = require('./app/services/openai');

const port = process.env.PORT || 8080;

app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(router);

require('./app/routes')(router);

app.get('/health', (req, res) => {
  res.send('The app is running!');
});

const connectToSupabase = async () => {
  try {
    const supabaseClient = new supabase({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY
    });
    console.log('Connected to Supabase');
  } catch (error) {
    console.error('Error connecting to Supabase:', error);
  }
};

const connectToOpenAi = async () => {
  try {
    const openAiClient = new openAi({
      organization: process.env.OPENAI_ORGANIZATION,
      project: process.env.OPENAI_PROJECT,
      apiKey: process.env.API_KEY
    });
    console.log('Connected to OpenAI');
  } catch (error) {
    console.error('Error connecting to OpenAI:', error);
  }
};
app.listen(port, async() => {
    await connectToSupabase();
    await connectToOpenAi();
    console.log(`Server is running on port ${port}`);
});
