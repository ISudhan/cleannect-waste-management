const { getGeminiAnswer } = require('../services/geminiService');

/**
 * POST /api/gemini/chat
 * POST /api/chat
 */
async function chatWithEcoBot(req, res) {
  try {
    const {
      message,
      userMessage,
      history = [],
      imageBase64,
      mimeType,
    } = req.body;

    const textPrompt = message || userMessage || '';

    if (!textPrompt && !imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Message or image is required',
      });
    }

    // Pass safe conversation history along with user prompt
    const answer = await getGeminiAnswer(
      textPrompt,
      imageBase64 || null,
      mimeType || 'image/jpeg',
      history
    );

    return res.status(200).json({
      success: true,
      answer,
      data: {
        reply: answer,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        model: 'gemini-3.6-flash',
      },
    });
  } catch (error) {
    console.error('Gemini chatbot error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to generate AI response',
      message: error.message,
    });
  }
}

/**
 * POST /api/gemini/analyze-waste
 * Multimodal waste image inspection & valorization
 */
async function analyzeWaste(req, res) {
  try {
    let imageBase64 = null;
    let mimeType = 'image/jpeg';
    const notes = req.body.notes || '';

    if (req.file) {
      imageBase64 = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (req.body.imageBase64) {
      const rawBase64 = req.body.imageBase64;
      if (rawBase64.includes(';base64,')) {
        const parts = rawBase64.split(';base64,');
        mimeType = parts[0].replace('data:', '') || 'image/jpeg';
        imageBase64 = parts[1];
      } else {
        imageBase64 = rawBase64;
        mimeType = req.body.mimeType || 'image/jpeg';
      }
    }

    const prompt = `You are CleanNect's Expert AI Waste Material Specialist.
Analyze this waste item/photo with notes: "${notes}".
Identify the material, classify its category (plastic/metal/paper/electronic/glass/organic), determine recyclability, suggest creative DIY upcycling blueprints ("Wealth out of Waste"), estimate market scrap rates in Indian Mandis (INR ₹/kg), and provide safety handling precautions.`;

    const answer = await getGeminiAnswer(prompt, imageBase64, mimeType);

    // Formulate structured metadata for dashboard integration
    const notesLower = (notes + ' ' + answer).toLowerCase();
    let category = 'plastic';
    let title = 'Recyclable Polymer Scrap';
    let scrapMin = 28;
    let scrapMax = 38;

    if (notesLower.includes('copper')) {
      category = 'metal';
      title = 'Bright Copper Wire Scrap';
      scrapMin = 780;
      scrapMax = 840;
    } else if (notesLower.includes('aluminum') || notesLower.includes('metal')) {
      category = 'metal';
      title = 'Aluminum Profiles & UBC Scrap';
      scrapMin = 180;
      scrapMax = 220;
    } else if (notesLower.includes('electronic') || notesLower.includes('circuit') || notesLower.includes('pcb')) {
      category = 'electronic';
      title = 'Circuit Boards & Component Scrap';
      scrapMin = 350;
      scrapMax = 650;
    } else if (notesLower.includes('paper') || notesLower.includes('cardboard')) {
      category = 'paper';
      title = 'Corrugated Packaging Cartons';
      scrapMin = 12;
      scrapMax = 18;
    }

    return res.status(200).json({
      success: true,
      answer,
      data: {
        analysis: answer,
        materialIdentification: {
          primaryMaterial: title,
          category,
          purityConfidence: 94,
          physicalCondition: 'Ready for Collection & Processing',
          recyclabilityScore: '9.4/10',
        },
        diyUpcycling: [
          {
            title: 'Circular Valorization Blueprint',
            difficulty: 'Easy',
            timeRequired: '25 mins',
            steps: [
              'Clean and segregate from contaminants or mixed polymers.',
              'Bundle or box securely to retain material integrity.',
              'List on CleanNect Marketplace or schedule driver pickup.',
            ],
            utilityValue: 'Replaces virgin raw materials and creates secondary income.',
          },
        ],
        scrapValuation: {
          estimatedPricePerUnit: {
            min: scrapMin,
            max: scrapMax,
            currency: 'INR',
            unit: 'kg',
          },
          marketDemand: 'High',
          topIndustrialBuyers: ['CleanNect Authorized Recycling Mills'],
        },
        safetyAndPrep: [
          'Store in dry shaded area prior to driver collection.',
          'Keep segregated by grade to maximize mandi payout.',
        ],
        quickListing: {
          title,
          description: `Sorted batch of ${category} scrap analyzed and verified by CleanNect Gemini AI.`,
          category,
          suggestedPrice: scrapMax,
          unit: 'kg',
        },
        sender: 'bot',
        timestamp: new Date().toISOString(),
        model: 'gemini-3.6-flash',
      },
    });
  } catch (error) {
    console.error('Waste analysis error:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to analyze waste image',
      message: error.message,
    });
  }
}

module.exports = {
  chatWithEcoBot,
  analyzeWaste,
};