require('dotenv').config();
const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
const Conversation = require('./Conversation');
const connectDB = require('./db');

// Connect to MongoDB
connectDB();

const bot = new Telegraf(process.env.BOT_TOKEN);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});

// Handle incoming messages
bot.start(async (ctx) => {
  await ctx.reply('Welcome! Are you looking for a health insurance plan?');
});

bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  // Save user message to MongoDB
  let conversation = await Conversation.findOne({ userId });
  if (!conversation) {
    conversation = new Conversation({ userId, messages: [] });
  }
  conversation.messages.push({ role: 'user', content: userMessage });
  await conversation.save();

  // Generate bot response
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `You are a helpful assistant. User asked: ${userMessage}`,
    max_tokens: 100,
  });

  const botReply = response.data.choices[0].text.trim();

  // Save bot response to MongoDB
  conversation.messages.push({ role: 'bot', content: botReply });
  await conversation.save();

  // Reply to user
  await ctx.reply(botReply);
});

// Start the bot
bot.launch();
console.log('Telegram bot is running');
