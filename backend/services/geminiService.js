const { GoogleGenAI } = require('@google/genai');
const Listing = require('../models/Listing');

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

let ai = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn(
      'Failed to initialize GoogleGenAI client:',
      err.message
    );
  }
}

/**
 * CleanNect AI System Prompt
 */
const CLEANNECT_SYSTEM_PROMPT = `
You are the AI assistant for CleanNect, a smart waste-management
and collection platform.

Your responsibilities:

1. WASTE MANAGEMENT
- Answer questions about waste collection.
- Explain waste segregation.
- Explain recycling and disposal.
- Help with pickup schedules.
- Help with complaints and CleanNect services.
- Give simple, accurate and practical answers.
- Never invent CleanNect database information.

2. CLEANNECT DATABASE
- When real CleanNect database information is provided,
  use that information.
- Never fabricate listings, prices, locations, quantities,
  schedules, vehicles, drivers or collection records.
- If information is unavailable, clearly say it is unavailable.

3. WASTE IDENTIFICATION
When the user provides an image:
- Identify the visible waste/material.
- Explain the likely material category.
- Explain whether it is recyclable.
- Give safe disposal or recycling guidance.
- Suggest how CleanNect could handle it.

4. ROUTE OPTIMIZATION
Help explain waste collection route optimization.

Consider:
- Collection points
- GPS coordinates
- Waste quantity
- Vehicle capacity
- Starting location
- Depot
- Road distance
- Estimated travel time
- Number of vehicles
- Capacity constraints

IMPORTANT:
Do not invent GPS distances or road travel times.
If actual routing data is not provided, clearly say
that the distance/time is an estimate.

When route information is available, format it as:

Route:
Vehicle: <vehicle ID>
Start: <starting location>

Stops:
1. <collection point> — <reason/priority>
2. <collection point> — <reason/priority>

End: <depot>

Total estimated distance: <value> km
Total estimated time: <value> minutes
Estimated collected waste: <value> kg
Vehicle capacity: <value> kg
Capacity utilization: <percentage>%

Optimization reason:
<brief explanation>

5. MULTIPLE VEHICLES
- Do not exceed vehicle capacity.
- Balance workloads.
- Avoid unnecessary route overlap.
- Group nearby collection points where possible.
- Prioritize urgent/high-volume collection points.

6. CHATBOT STYLE
- Be concise.
- Be practical.
- Use clear English.
- Use headings and bullet points when useful.
- Do not expose API keys or database credentials.
`;


/**
 * Fetch live CleanNect marketplace data
 */
async function getMongoContext() {
  try {
    const activeListings = await Listing.find({
      status: 'available',
      quantity: { $gt: 0 }
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        'title category quantity unit price location.city location.state'
      )
      .lean();

    if (!activeListings || activeListings.length === 0) {
      return '';
    }

    return `
[LIVE CLEANNECT DATABASE RECORDS]

${activeListings
        .map(
          (listing, index) => `
${index + 1}.
Title: ${listing.title}
Category: ${listing.category}
Quantity: ${listing.quantity} ${listing.unit}
Price: ₹${listing.price}/${listing.unit}
Location: ${listing.location?.city || 'Unknown'
            }, ${listing.location?.state || 'India'
            }
`
        )
        .join('\n')}
`;

  } catch (error) {
    console.warn(
      'Could not fetch MongoDB context:',
      error.message
    );

    return '';
  }
}


/**
 * Get answer from Gemini
 *
 * Supports:
 * - Normal text chat
 * - Image + text
 * - MongoDB context
 */
async function getGeminiAnswer(
  message,
  imageBase64 = null,
  mimeType = 'image/jpeg',
  history = []
) {
  /*
   * Make sure API key exists
   */
  if (!ai) {
    const currentKey =
      (process.env.GEMINI_API_KEY || '').trim();

    if (!currentKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured in backend/.env'
      );
    }

    ai = new GoogleGenAI({
      apiKey: currentKey
    });
  }


  /*
   * Get live MongoDB information
   */
  const mongoContext = await getMongoContext();

  /*
   * Format safe conversation history
   */
  let conversationHistoryText = '';
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6);
    conversationHistoryText = `
[CONVERSATION HISTORY]
${recent
  .map((h) => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.text || ''}`)
  .join('\n')}
`;
  }

  /*
   * Build final prompt
   */
  const finalPrompt = `
${CLEANNECT_SYSTEM_PROMPT}

${mongoContext}
${conversationHistoryText}
USER QUESTION:
${message || 'Please inspect this waste material.'}

ANSWER:
`;


  /*
   * Build Gemini input
   */
  let input;


  if (imageBase64) {

    input = [
      {
        type: 'image',
        mime_type: mimeType || 'image/jpeg',
        data: imageBase64
      },
      {
        type: 'text',
        text: finalPrompt
      }
    ];

  } else {

    input = finalPrompt;

  }


  /*
   * Call Gemini
   *
   * IMPORTANT:
   * Use Interactions API.
   */
  console.log('[Gemini] Sending request...');

  const interaction = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    input
  });


  /*
   * Get generated answer
   */
  const answer = interaction.output_text;


  if (!answer || !answer.trim()) {
    throw new Error(
      'Gemini returned an empty response'
    );
  }


  console.log('[Gemini] Response received');


  return answer.trim();
}


module.exports = {
  getGeminiAnswer,
  CLEANNECT_SYSTEM_PROMPT
};