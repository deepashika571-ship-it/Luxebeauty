import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server side to protect our API Key
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("GEMINI_API_KEY is not configured or holds a placeholder value. AI features will run with elegant simulated fallbacks.");
}

// 1. AI Recommendation Endpoint
app.post("/api/ai/recommendation", async (req, res) => {
  const { skinType, skinTone, concerns, preferences } = req.body;

  if (!aiClient) {
    // Elegant simulated response if API key is not present
    return res.json({
      recommendation: `### LuxeBeauty Personal Recommendation

Thank you for sharing your profile. Based on your inputs (Dry Skin, Warm Undertone, Bright-looking finishes, Hydration-focus):

1. **Perfect Base Routine**:
   - Apply a dewy hydrating primer containing hyaluronic acid. 
   - Pair with an off-center luminous satin foundation in a golden peach undertone.
   - Set lightly with a microfine translucent radiant powder, only in your T-zone.

2. **Personalized Color Palette**:
   - **Eyes**: Rich terracotta, sunset gold, and warm copper shimmer.
   - **Cheeks**: Soft apricot, warm peach blush with mineral gold luster.
   - **Lips**: Semi-sheer coral nectar gloss or rich warm cinnamon red cream lipstick.

3. **Recommended Salon Services**:
   - **Luxe Hydrating Facial** (Rejuvenating, skin-plumping therapy)
   - **Bridal Glow Treatment** or **VIP Party Makeover** with customized airbrush finish.

*Tip: Drink plenty of water before your appointment and avoid active-exfoliation 48 hours prior.*`,
      suggestedServiceIds: ["bridal_makeup", "skin_care_facial"]
    });
  }

  try {
    const prompt = `You are LuxeBeauty's AI Skincare & Makeup Expert, speaking to a highly valued luxury VIP salon client.
Analyze the following client skincare and beauty profile:
- Skin Type: ${skinType || 'Combination'}
- Skin Tone / Undertone: ${skinTone || 'Medium Warm'}
- Primary Concerns: ${concerns || 'None specified'}
- Preferences / Style goals: ${preferences || 'Elegant and Dewy'}

Please generate a highly structured, premium-brand style beauty recommendation (Markdown formatted) including:
1. **Perfect Base Routine**: (Base, Foundation finish, and setting routine matching their skin type/tone)
2. **Personalized Color Palette**: (Eye shadow, cheek blush, and lip color suggestions matching their undertone)
3. **Recommended Salon Services**: (Suggest matching treatments from our menu: Bridal Makeup, Party Makeup, Hair Styling, Facial Treatment, Skin Care, Nail Art, Mehendi, Spa Treatment)
4. **Professional Pre-Salon Care Tip**: (A luxurious preparing tip before they walk into their LuxeBeauty appointment)

Keep the tone extremely luxurious, professional, warm, and elite. Keep it concise but detailed.`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      recommendation: response.text || "An unexpected error occurred. Please try again.",
      suggestedServiceIds: ["bridal_makeup", "skin_care_facial"]
    });
  } catch (error: any) {
    console.error("Gemini AI Recommendation Error:", error);
    res.status(500).json({ error: "Failed to generate AI recommendations: " + error.message });
  }
});

// 2. AI Chatbot Support Endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body;

  if (!aiClient) {
    // Simulated chat responses if API key is missing
    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].text.toLowerCase() : "";
    let reply = "Welcome to LuxeBeauty Concierge API. How may I elevate your style journey today?";
    
    if (lastMsg.includes("book") || lastMsg.includes("appointment")) {
      reply = "To book your luxury appointment, click on the 'Book Now' button in our services cards, or navigate to the 'Appointment Booking' page from the main luxury header. You'll be able to select your desired service, date, preferred artist, and complete the reservation securely.";
    } else if (lastMsg.includes("bridal") || lastMsg.includes("wedding")) {
      reply = "Our Signature Bridal Package is our crowning glory. It includes custom skincare prep, royal contouring, premium lash extensions, and stays flawless for 16+ hours. We currently offer a special 30% discount on first-time bridal consultations!";
    } else if (lastMsg.includes("price") || lastMsg.includes("discount") || lastMsg.includes("offer")) {
      reply = "We are currently running exclusive festival discounts! For instance, our Signature Bridal Package is trimmed from ₹9,999 to just ₹6,999, and our Glow Facial + Hair Spa combo is down to ₹1,999. Use coupon code 'LUXE20' at checkout for an additional 20% off on premium facials!";
    } else if (lastMsg.includes("locate") || lastMsg.includes("where") || lastMsg.includes("address")) {
      reply = "Our flagship LuxeBeauty Salon is located at 77 Elegant Boulevard, Royal Gardens, Mumbai (opposite Elite Galleria Mall). We also have premium branches in Bangalore and Delhi in the center of the premium shopping districts.";
    }

    return res.json({ text: reply });
  }

  try {
    // Format conversation history for Gemini
    const formattedHistory = messages.map((m: any) => {
      return `${m.sender === "user" ? "Client" : "LuxeBeauty Concierge"}: ${m.text}`;
    }).join("\n");

    const prompt = `You are "LuxeBeauty Salon Concierge", an elite, gracious, and responsive AI receptionist for a high-end, 5-star luxury beauty and makeup lounge.
Our salon provides exquisite bridal makeover, party styling, luxury facials, therapeutic hair-spa, premium mehendi, and couture nail art.
We have elite artists like Sophia Harris (Bridal Specialist), Lily Anderson (Glow Facial Guru), and Chloe Bennett (Mehendi & Airbrush Designer).
Our flagship salon is located at 77 Elegant Boulevard, Royal Gardens, Mumbai.

Here is the chat conversation flow so far:
${formattedHistory}

LuxeBeauty Concierge:`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ text: response.text || "I'm here to assist you with any questions about our luxury makeup and beauty services." });
  } catch (error: any) {
    console.error("Gemini AI Chat Error:", error);
    res.status(500).json({ error: "Failed to generate chat response: " + error.message });
  }
});

// Serve Frontend Vite or compiled Dist
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Load Vite in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LuxeBeauty Booking Fullstack Server running on http://localhost:${PORT}`);
  });
}

setupServer();
