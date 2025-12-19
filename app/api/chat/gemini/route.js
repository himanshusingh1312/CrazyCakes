import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { connectDB } from "@/lib/dbConnect";
import { Products } from "@/lib/schema/products";
import { Subcategory } from "@/lib/schema/subcategory";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function POST(request) {
  try {
    if (!genAI) {
      return NextResponse.json(
        { error: "Gemini AI is not configured. Please add GEMINI_API_KEY to .env file." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { query, filters: bodyFilters } = body || {};

    if (!query && !bodyFilters) {
      return NextResponse.json(
        { error: "Query or filters are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Get all products with ratings for context
    const { Order } = await import("@/lib/schema/order");
    const allProducts = await Products.find({})
      .populate("subcategory")
      .sort({ createdAt: -1 });

    const productsWithRatings = await Promise.all(
      allProducts.map(async (product) => {
        const orders = await Order.find({
          product: product._id,
          rating: { $exists: true, $ne: null },
        });

        let averageRating = 0;
        let totalRatings = 0;

        if (orders.length > 0) {
          const sum = orders.reduce((acc, order) => acc + (order.rating || 0), 0);
          averageRating = sum / orders.length;
          totalRatings = orders.length;
        }

        return {
          _id: product._id.toString(),
          name: product.name,
          price: product.price,
          category: product.subcategory?.category || "",
          subcategory: product.subcategory?.name || "",
          specification: product.specification,
          tag: product.tag || "",
          averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
          totalRatings,
        };
      })
    );

    // Build filters from query using Gemini or use provided filters
    let filters = {};
    let aiExplanation = "";

    if (query && typeof query === "string" && query.trim()) {
      // Use Gemini to extract filters and understand intent
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Get more products for better context
      const allProductsForContext = productsWithRatings.length > 0 
        ? productsWithRatings 
        : [];

      const prompt = `You are a helpful cake and pastry assistant for "Crazy Cakes" bakery. Your job is to understand user queries and extract filters to find matching products from the database.

User Query: "${query}"

REAL PRODUCTS IN DATABASE (use this to understand what's available):
${allProductsForContext.length > 0 
  ? allProductsForContext.map(p => 
      `- ${p.name} (${p.category}): ₹${p.price}/kg, Rating: ${p.averageRating}★ (${p.totalRatings} reviews)`
    ).join('\n')
  : 'No products in database yet'
}

Task: Extract filters from the user's natural language query and understand their intent.

EXTRACTION RULES:
1. Category Detection:
   - If query contains "cake" or "cakes" → category: "cake"
   - If query contains "pastry" or "pastries" → category: "pastry"
   - If both mentioned, use the primary one
   - If neither mentioned, set category to null

2. Price Detection:
   - "under 400", "below 400", "less than 400", "upto 400" → maxPrice: 400
   - "above 1000", "over 1000", "more than 1000", "from 1000" → minPrice: 1000
   - "between 500 and 800", "500 to 800", "500-800" → minPrice: 500, maxPrice: 800
   - Extract numbers directly: "400" means maxPrice: 400 if context suggests "under/below"
   - Extract numbers directly: "1000" means minPrice: 1000 if context suggests "above/over"

3. Rating Detection:
   - "4 rating", "4 star", "4 stars", "4★", "4+ rating" → minRating: 4
   - "3 star", "3 stars", "3★", "3 rating" → minRating: 3
   - "5 star", "5 stars", "5★", "only 5" → minRating: 5
   - "above 4 rating", "4 and above" → minRating: 4
   - Extract number from phrases like "with 3 star", "having 4 rating"

4. Product Name/Flavor:
   - Extract flavor keywords: "chocolate", "strawberry", "vanilla", "birthday", etc.
   - Only extract if it's a specific product name or flavor, not generic words

EXAMPLES:
- "i want cake under 400" → {category: "cake", maxPrice: 400, minRating: null, nameContains: null}
- "show me the cake above 1000 and 4 rating" → {category: "cake", minPrice: 1000, minRating: 4, nameContains: null}
- "show me pastry with 3 star" → {category: "pastry", minRating: 3, minPrice: null, maxPrice: null, nameContains: null}
- "chocolate cake under 500" → {category: "cake", maxPrice: 500, nameContains: "chocolate", minRating: null}

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{
  "filters": {
    "category": "cake" or "pastry" or null,
    "nameContains": "keyword" or null,
    "minPrice": number or null,
    "maxPrice": number or null,
    "minRating": number or null
  },
  "explanation": "A friendly 1-2 sentence explanation of what products match the user's request"
}

CRITICAL: Return ONLY valid JSON, no other text, no markdown formatting.`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from response (handle markdown code blocks and extra text)
        let jsonText = text.trim();
        
        // Remove markdown code blocks
        if (jsonText.includes("```json")) {
          jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        } else if (jsonText.includes("```")) {
          jsonText = jsonText.replace(/```\n?/g, "").trim();
        }
        
        // Extract JSON object if there's extra text
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonText);
        filters = parsed.filters || {};
        aiExplanation = parsed.explanation || "";
        
        // Validate and clean filters
        if (filters.category && !["cake", "pastry"].includes(filters.category)) {
          filters.category = null;
        }
        if (filters.minPrice != null) filters.minPrice = Number(filters.minPrice);
        if (filters.maxPrice != null) filters.maxPrice = Number(filters.maxPrice);
        if (filters.minRating != null) filters.minRating = Number(filters.minRating);
        
        // Log extracted filters for debugging
        console.log("Gemini extracted filters:", filters);
      } catch (geminiError) {
        console.error("Gemini API error:", geminiError);
        // Fallback to simple text parsing
        filters = extractFiltersFromText(query);
        aiExplanation = "I found some products based on your search.";
      }
    } else if (bodyFilters) {
      // Use provided filters directly
      filters = {
        category: bodyFilters.category || null,
        nameContains: bodyFilters.nameContains || null,
        minPrice: bodyFilters.minPrice || null,
        maxPrice: bodyFilters.maxPrice || null,
        minRating: bodyFilters.minRating || null,
      };
      aiExplanation = "Here are products matching your filters:";
    }

    // Build MongoDB filter
    const productFilter = {};

    // Category filter
    if (filters.category) {
      const subs = await Subcategory.find({
        category: filters.category,
      }).select("_id");
      const subIds = subs.map((s) => s._id);
      if (subIds.length > 0) {
        productFilter.subcategory = { $in: subIds };
      }
    }

    // Name search
    if (filters.nameContains) {
      const searchTerm = filters.nameContains.trim();
      if (searchTerm.length > 0) {
        const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
        if (words.length > 0) {
          const escapedWords = words.map(word => 
            word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          );
          const regexPattern = escapedWords.join('.*?');
          productFilter.name = {
            $regex: regexPattern,
            $options: "i",
          };
        }
      }
    }

    // Price range
    if (filters.minPrice != null || filters.maxPrice != null) {
      productFilter.price = {};
      if (filters.minPrice != null) productFilter.price.$gte = filters.minPrice;
      if (filters.maxPrice != null) productFilter.price.$lte = filters.maxPrice;
    }

    // Get products matching filters
    let products = await Products.find(productFilter)
      .populate("subcategory")
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate ratings for all products
    const productsWithRatingsData = await Promise.all(
      products.map(async (product) => {
        const orders = await Order.find({
          product: product._id,
          rating: { $exists: true, $ne: null },
        });

        let averageRating = 0;
        let totalRatings = 0;

        if (orders.length > 0) {
          const sum = orders.reduce((acc, order) => acc + (order.rating || 0), 0);
          averageRating = sum / orders.length;
          totalRatings = orders.length;
        }

        return {
          ...product.toObject(),
          averageRating: averageRating > 0 ? Number(averageRating.toFixed(1)) : 0,
          totalRatings,
        };
      })
    );

    // Filter by rating if specified
    let filteredProducts = productsWithRatingsData;
    if (filters.minRating != null) {
      filteredProducts = productsWithRatingsData.filter(
        (p) => p.averageRating >= filters.minRating
      );
    }

    // Generate intelligent recommendation using Gemini
    let recommendation = "";
    if (filteredProducts.length > 0 && query) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const topProducts = filteredProducts.slice(0, 5);
        
        const recommendationPrompt = `Based on the user query "${query}" and these products:
${topProducts.map(p => 
  `- ${p.name}: ₹${p.price}/kg, ${p.averageRating}★ (${p.totalRatings} reviews), ${p.specification}`
).join('\n')}

Provide a friendly, helpful recommendation (2-3 sentences) explaining why these products are good matches. Be conversational and enthusiastic.`;

        const result = await model.generateContent(recommendationPrompt);
        const response = await result.response;
        recommendation = response.text().trim();
      } catch (error) {
        console.error("Gemini recommendation error:", error);
        recommendation = aiExplanation || "Here are some great options for you:";
      }
    } else if (filteredProducts.length === 0) {
      recommendation = "I couldn't find products matching your criteria. Try adjusting your filters or search terms.";
    } else {
      recommendation = aiExplanation || "Here are some products for you:";
    }

    return NextResponse.json(
      {
        reply: recommendation,
        products: filteredProducts,
        filters: filters,
        explanation: aiExplanation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gemini chat error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Fallback function to extract filters from text (simple parsing)
function extractFiltersFromText(text) {
  const lowerText = text.toLowerCase();
  const filters = {};

  // Category - check for cake or pastry
  if (lowerText.includes("cake") && !lowerText.includes("pastry")) {
    filters.category = "cake";
  } else if (lowerText.includes("pastry") || lowerText.includes("pastery")) {
    filters.category = "pastry";
  } else if (lowerText.includes("cake")) {
    filters.category = "cake"; // Default to cake if only cake mentioned
  }

  // Price - handle "under", "below", "less than", "upto"
  const underMatch = lowerText.match(/(under|below|less than|upto|up to)\s*(\d+)/);
  if (underMatch) {
    filters.maxPrice = parseInt(underMatch[2], 10);
  }

  // Price - handle "above", "over", "more than", "from"
  const aboveMatch = lowerText.match(/(above|over|more than|from)\s*(\d+)/);
  if (aboveMatch) {
    filters.minPrice = parseInt(aboveMatch[2], 10);
  }

  // Price - handle range "between X and Y", "X to Y", "X-Y"
  const rangeMatch = lowerText.match(/(\d+)\s*(to|-|and)\s*(\d+)/);
  if (rangeMatch && !underMatch && !aboveMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[3], 10);
    filters.minPrice = Math.min(a, b);
    filters.maxPrice = Math.max(a, b);
  }

  // Rating - handle "X star", "X stars", "X rating", "X★", "with X star"
  const ratingMatch = lowerText.match(/(\d)\s*(star|stars|rating|★)/);
  if (ratingMatch) {
    filters.minRating = parseInt(ratingMatch[1], 10);
  }

  // Rating - handle "X and above", "X+ rating"
  const ratingPlusMatch = lowerText.match(/(\d)\s*(\+|\s+and\s+above)/);
  if (ratingPlusMatch) {
    filters.minRating = parseInt(ratingPlusMatch[1], 10);
  }

  return filters;
}

