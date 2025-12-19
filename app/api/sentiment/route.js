import { NextResponse } from "next/server";

// Simple sentiment analysis using keyword matching
// This is a basic implementation - for production, consider using a proper NLP library or API

const positiveWords = [
  "excellent", "amazing", "wonderful", "fantastic", "great", "good", "love", "loved",
  "perfect", "delicious", "tasty", "awesome", "outstanding", "brilliant", "superb",
  "satisfied", "happy", "pleased", "delighted", "impressed", "beautiful", "fresh",
  "quality", "best", "recommend", "highly", "exceeded", "surpassed", "exceeded expectations",
  "thank you", "thanks", "appreciate", "grateful", "perfect", "flawless", "amazing taste",
  "soft", "moist", "creamy", "sweet", "yummy", "scrumptious", "delectable", "mouthwatering"
];

const negativeWords = [
  "bad", "terrible", "awful", "horrible", "disappointed", "disappointing", "poor",
  "worst", "hate", "hated", "disgusting", "inedible", "stale", "dry", "burnt",
  "overcooked", "undercooked", "tasteless", "bland", "soggy", "hard", "not good",
  "waste", "money", "regret", "complaint", "issue", "problem", "wrong", "incorrect",
  "late", "delayed", "damaged", "broken", "spoiled", "rotten", "moldy", "expired"
];

const neutralWords = [
  "okay", "ok", "fine", "average", "normal", "regular", "standard", "decent"
];

// Calculate sentiment score
export function analyzeSentiment(text) {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return {
      score: 0,
      label: "neutral",
      confidence: 0
    };
  }

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;

  // Count positive words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      positiveScore += matches.length;
    }
  });

  // Count negative words
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      negativeScore += matches.length;
    }
  });

  // Count neutral words
  neutralWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      neutralScore += matches.length;
    }
  });

  // Check for negation (e.g., "not good", "not happy")
  const negationWords = ["not", "no", "never", "none", "n't", "cannot", "can't", "won't", "don't", "didn't"];
  negationWords.forEach(negation => {
    const regex = new RegExp(`\\b${negation}\\s+\\w+`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      // Flip the sentiment if negation is found
      positiveScore -= 0.5;
      negativeScore += 0.5;
    }
  });

  // Calculate total score
  const totalWords = words.length;
  const positiveRatio = positiveScore / Math.max(totalWords, 1);
  const negativeRatio = negativeScore / Math.max(totalWords, 1);
  const neutralRatio = neutralScore / Math.max(totalWords, 1);

  // Calculate sentiment score (-1 to 1)
  let score = (positiveScore - negativeScore) / Math.max(totalWords, 1);
  
  // Normalize score to -1 to 1 range
  score = Math.max(-1, Math.min(1, score * 2));

  // Determine label
  let label = "neutral";
  if (score > 0.1) {
    label = "positive";
  } else if (score < -0.1) {
    label = "negative";
  }

  // Calculate confidence (0 to 1)
  const confidence = Math.min(1, Math.abs(score) + (positiveScore + negativeScore) / Math.max(totalWords, 1));

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
    label,
    confidence: Math.round(confidence * 100) / 100,
    positiveCount: positiveScore,
    negativeCount: negativeScore,
    neutralCount: neutralScore
  };
}

// API endpoint for sentiment analysis
export async function POST(request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const sentiment = analyzeSentiment(text);

    return NextResponse.json(
      { sentiment },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

