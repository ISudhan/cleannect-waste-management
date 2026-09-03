require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

console.log('1. API Key:', apiKey ? 'FOUND' : 'MISSING');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY missing');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey
});

async function test() {
  try {
    console.log('2. Sending request to Gemini...');

    const interaction = await ai.interactions.create(
      {
        model: 'gemini-3.6-flash',
        input: 'Say hello from CleanNect in one short sentence.'
      },
      {
        timeout: 30000
      }
    );

    console.log('3. Gemini request completed');
    console.log('4. Response:');
    console.log(interaction.output_text);

  } catch (error) {
    console.error('❌ Gemini Error:');
    console.error(error);
  }
}

test();