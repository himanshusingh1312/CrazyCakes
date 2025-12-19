import { NextResponse } from "next/server";
import { connectDB } from "@/lib/dbConnect";
import { Products } from "@/lib/schema/products";
import { Subcategory } from "@/lib/schema/subcategory";

// We will import Order lazily inside the handler to avoid circular deps

// Helper: simple, local text parser to extract filters from user message
// NOTE: This is rule-based, so it has limitations compared to an LLM.
function getFiltersFromMessage(message) {
  const text = String(message || "").toLowerCase();

  // Category
  let category = null;
  if (text.includes("cake")) category = "cake";
  if (text.includes("pastry") || text.includes("pastery")) category = "pastry";

  // Price range
  let minPrice = null;
  let maxPrice = null;

  // between / range: 400 to 1000, 400-1000, 400 and 1000
  const rangeMatch =
    text.match(/(\d+)\s*(to|-|and)\s*(\d+)/) ||
    text.match(/between\s+(\d+)\s*(and|to|-)\s*(\d+)/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[3], 10);
    minPrice = Math.min(a, b);
    maxPrice = Math.max(a, b);
  }

  // under / below / less than X
  const underMatch = text.match(
    /(under|below|less than|under rs|underrupees)\s*(\d+)/
  );
  if (underMatch) {
    maxPrice = parseInt(underMatch[2], 10);
  }

  // above / greater than / more than X
  const aboveMatch = text.match(
    /(above|greater than|more than|over)\s*(\d+)/
  );
  if (aboveMatch) {
    minPrice = parseInt(aboveMatch[2], 10);
  }

  // Rating
  let minRating = null;
  let maxRating = null;

  // "only 4 star", "4 star pastry"
  const exactRatingMatch = text.match(/only\s*(\d)\s*star/);
  if (exactRatingMatch) {
    const r = parseInt(exactRatingMatch[1], 10);
    minRating = r;
    maxRating = r;
  } else {
    const ratingMatch = text.match(/(\d)\s*star/);
    if (ratingMatch) {
      const r = parseInt(ratingMatch[1], 10);
      if (text.includes("above") || text.includes("+")) {
        minRating = r;
      } else {
        minRating = r;
        maxRating = r;
      }
    }
  }

  // Name / flavour: previous word before "cake" or "pastry" (e.g. "strawberry cake")
  let nameContains = null;
  const tokens = text.split(/\s+/);
  const cakeIndex = tokens.indexOf("cake");
  const pastryIndex =
    tokens.indexOf("pastry") === -1
      ? tokens.indexOf("pastery")
      : tokens.indexOf("pastry");

  const targetIndex =
    cakeIndex !== -1
      ? cakeIndex
      : pastryIndex !== -1
      ? pastryIndex
      : -1;

  if (targetIndex > 0) {
    const flavour = tokens[targetIndex - 1];
    // Ignore numeric words like "400", "500"
    if (!/^\d+$/.test(flavour)) {
      nameContains = flavour;
    }
  }

  return {
    category,
    nameContains,
    minPrice,
    maxPrice,
    minRating,
    maxRating,
    limit: 10,
  };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, filters: bodyFilters } = body || {};

    if (
      (!message || typeof message !== "string") &&
      (!bodyFilters || typeof bodyFilters !== "object")
    ) {
      return NextResponse.json(
        { error: "Message or filters are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // 1) Build filters: use explicit filters from frontend if provided,
    // otherwise fall back to local text parsing.
    const filters = bodyFilters
      ? {
          category: bodyFilters.category ?? null,
          nameContains: bodyFilters.nameContains ?? null,
          minPrice:
            typeof bodyFilters.minPrice === "number"
              ? bodyFilters.minPrice
              : null,
          maxPrice:
            typeof bodyFilters.maxPrice === "number"
              ? bodyFilters.maxPrice
              : null,
          minRating:
            typeof bodyFilters.minRating === "number"
              ? bodyFilters.minRating
              : null,
          maxRating:
            typeof bodyFilters.maxRating === "number"
              ? bodyFilters.maxRating
              : null,
          limit:
            typeof bodyFilters.limit === "number"
              ? bodyFilters.limit
              : 10,
        }
      : getFiltersFromMessage(message);

    // 2) Build Mongo filter from LLM filters
    const productFilter = {};
    const filterConditions = [];

    // Category -> map to subcategory ids
    if (filters.category) {
      const subs = await Subcategory.find({
        category: filters.category,
      }).select("_id");

      const subIds = subs.map((s) => s._id);
      if (subIds.length === 0) {
        return NextResponse.json(
          {
            reply:
              "I couldn't find any subcategories for that category yet. Please try another request.",
            products: [],
          },
          { status: 200 }
        );
      }

      filterConditions.push({ subcategory: { $in: subIds } });
    }

    // Name search - flexible search (case-insensitive, handles spaces/gaps, partial match)
    if (filters.nameContains) {
      const searchTerm = filters.nameContains.trim();
      
      if (searchTerm.length > 0) {
        // Split by spaces to handle multi-word searches
        const words = searchTerm.split(/\s+/).filter(word => word.length > 0);
        
        if (words.length > 0) {
          // Escape special regex characters for each word
          const escapedWords = words.map(word => 
            word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          );
          
          // Create patterns for better matching:
          // 1. Exact phrase match (with spaces) - "Premium cakes"
          // 2. All words in sequence with flexible spacing - "Premium.*?cakes"
          // 3. For single word, allow partial match anywhere
          
          const nameConditions = [];
          
          // Exact phrase match (most specific) - matches "Premium cakes" exactly
          const exactPattern = escapedWords.join('\\s+');
          nameConditions.push({ name: { $regex: exactPattern, $options: "i" } });
          
          // Sequence match (all words in order) - matches "Premium chocolate cakes"
          const sequencePattern = escapedWords.join('.*?');
          nameConditions.push({ name: { $regex: sequencePattern, $options: "i" } });
          
          // If only one word, also allow it to appear anywhere
          if (words.length === 1) {
            nameConditions.push({ name: { $regex: escapedWords[0], $options: "i" } });
          }
          
          // Add name search as $or condition (any of these patterns can match)
          if (nameConditions.length > 0) {
            filterConditions.push({ $or: nameConditions });
          }
          
          console.log("Searching for product name:", searchTerm);
          console.log("Name search patterns:", { exactPattern, sequencePattern });
        }
      }
    }
    
    // Build final filter - combine all conditions with $and
    if (filterConditions.length > 0) {
      if (filterConditions.length === 1) {
        // Only one condition, use it directly
        Object.assign(productFilter, filterConditions[0]);
      } else {
        // Multiple conditions, combine with $and
        productFilter.$and = filterConditions;
      }
    }

    // Price range
    if (filters.minPrice != null || filters.maxPrice != null) {
      productFilter.price = {};
      if (filters.minPrice != null) productFilter.price.$gte = filters.minPrice;
      if (filters.maxPrice != null) productFilter.price.$lte = filters.maxPrice;
    }

    const limit = Math.min(Math.max(filters.limit || 10, 1), 30);

    console.log("Product filter:", JSON.stringify(productFilter, null, 2));

    let products = await Products.find(productFilter)
      .populate("subcategory")
      .sort({ createdAt: -1 })
      .limit(limit);

    console.log(`Found ${products.length} products matching filters`);

    // 3) Rating-based filtering (optional)
    if (filters.minRating != null || filters.maxRating != null) {
      const { Order } = await import("@/lib/schema/order");

      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const orders = await Order.find({
            product: product._id,
            rating: { $exists: true, $ne: null },
          });

          let averageRating = 0;
          let totalRatings = 0;

          if (orders.length > 0) {
            const sum = orders.reduce(
              (acc, order) => acc + (order.rating || 0),
              0
            );
            averageRating = sum / orders.length;
            totalRatings = orders.length;
          }

          return {
            product,
            averageRating:
              averageRating > 0
                ? Number(averageRating.toFixed(1))
                : 0,
            totalRatings,
          };
        })
      );

      products = productsWithRatings
        .filter(({ averageRating }) => {
          if (filters.minRating != null && averageRating < filters.minRating) {
            return false;
          }
          if (filters.maxRating != null && averageRating > filters.maxRating) {
            return false;
          }
          return true;
        })
        .map(({ product, averageRating, totalRatings }) => ({
          ...product.toObject(),
          averageRating,
          totalRatings,
        }));
    } else {
      // still attach ratings for better chat display
      const { Order } = await import("@/lib/schema/order");
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const orders = await Order.find({
            product: product._id,
            rating: { $exists: true, $ne: null },
          });

          let averageRating = 0;
          let totalRatings = 0;

          if (orders.length > 0) {
            const sum = orders.reduce(
              (acc, order) => acc + (order.rating || 0),
              0
            );
            averageRating = sum / orders.length;
            totalRatings = orders.length;
          }

          return {
            ...product.toObject(),
            averageRating:
              averageRating > 0
                ? Number(averageRating.toFixed(1))
                : 0,
            totalRatings,
          };
        })
      );

      products = productsWithRatings;
    }

    // 4) Build a simple natural-language reply
    let reply;

    if (!products || products.length === 0) {
      // No products found - return simple message, no fallback
      const parts = [];
      
      if (filters.category) {
        parts.push(filters.category);
      }
      
      if (filters.minPrice != null || filters.maxPrice != null) {
        if (filters.minPrice && filters.maxPrice) {
          parts.push(`between ₹${filters.minPrice} and ₹${filters.maxPrice}`);
        } else if (filters.maxPrice) {
          parts.push(`under ₹${filters.maxPrice}`);
        } else if (filters.minPrice) {
          parts.push(`above ₹${filters.minPrice}`);
        }
      }
      
      if (filters.minRating != null) {
        if (filters.minRating === filters.maxRating) {
          parts.push(`${filters.minRating} star`);
        } else {
          parts.push(`${filters.minRating} star and above`);
        }
      }
      
      const categoryText = filters.category || "products";
      const criteriaText = parts.length > 1 
        ? parts.slice(1).join(" with ") 
        : parts.length === 1 && parts[0] !== filters.category
        ? parts[0]
        : "";
      
      reply = criteriaText
        ? `No ${categoryText} found ${criteriaText}. Please try different filters.`
        : `No ${categoryText} found matching your criteria. Please try different filters.`;
      
      return NextResponse.json(
        {
          reply,
          products: [],
        },
        { status: 200 }
      );
    } else {
      const firstNames = products.slice(0, 3).map((p) => p.name);
      reply = `Here ${
        products.length === 1 ? "is" : "are"
      } ${products.length} option${
        products.length === 1 ? "" : "s"
      } I found for you: ${firstNames.join(", ")}.`;
    }

    return NextResponse.json(
      {
        reply,
        products,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat assistant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


