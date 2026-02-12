#!/usr/bin/env node

/**
 * OSRS High Alchemy Profit Finder
 * Fetches current Grand Exchange prices and calculates profitable High Alchemy items
 */

// TypeScript interfaces for API responses
interface ItemMapping {
  id: number;
  name: string;
  examine: string;
  members: boolean;
  highalch: number | null;
  lowalch: number | null;
  value: number;
  limit: number | null;
}

interface PriceData {
  high: number | null;
  highTime: number | null;
  low: number | null;
  lowTime: number | null;
}

interface LatestPricesResponse {
  data: Record<string, PriceData>;
}

interface AlchemyItem {
  id: number;
  name: string;
  members: boolean;
  highAlchValue: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  buyLimit: number | null;
  batchProfit: number;
  priceTimestamp: number | null;
}

const BASE_URL = "https://prices.runescape.wiki/api/v1/osrs";

// Helper to format numbers with commas
function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

// Helper to format price with K/M/B suffix
function formatPrice(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

// Helper to format time since last trade
function formatTimeAgo(timestamp: number | null): string {
  if (!timestamp) return "Unknown";
  
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const diff = now - timestamp; // Difference in seconds
  
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Helper to get freshness indicator
function getFreshnessIndicator(timestamp: number | null): string {
  if (!timestamp) return "❓ Unknown";
  
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  const minutes = diff / 60;
  
  if (minutes < 10) return "✅ Fresh";
  if (minutes < 30) return "⚠️ Stale";
  return "❌ Old";
}

// Fetch item mapping data
async function fetchItemMapping(): Promise<ItemMapping[]> {
  const response = await fetch(`${BASE_URL}/mapping`);
  if (!response.ok) {
    throw new Error(`Failed to fetch item mapping: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<ItemMapping[]>;
}

// Fetch latest prices
async function fetchLatestPrices(): Promise<Record<string, PriceData>> {
  const response = await fetch(`${BASE_URL}/latest`);
  if (!response.ok) {
    throw new Error(`Failed to fetch latest prices: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as LatestPricesResponse;
  return data.data;
}

// Calculate High Alchemy profits
function calculateProfits(
  items: ItemMapping[],
  prices: Record<string, PriceData>
): AlchemyItem[] {
  const NATURE_RUNE_PRICE = prices["561"]?.high || 100; // Item ID 561 is Nature rune
  
  const profitableItems: AlchemyItem[] = [];

  for (const item of items) {
    // Skip items without high alch value
    if (!item.highalch || item.highalch <= 0) continue;

    const priceData = prices[item.id.toString()];
    if (!priceData) continue;

    // Use high price (what buyers offer) for cost calculation
    // This is what you'd pay when placing a buy offer and waiting
    const buyPrice = priceData.high;
    const sellPrice = priceData.low;
    
    if (!buyPrice) continue;

    // Calculate profit: High Alch Value - GE Buy Price - Nature Rune Cost
    const profit = item.highalch - buyPrice - NATURE_RUNE_PRICE;

    // Only include profitable items
    if (profit > 0) {
      // Calculate batch profit: profit per item × buy limit (respecting GE 4-hour limit)
      // If no buy limit, estimate 1000 for calculation purposes
      const effectiveLimit = item.limit || 1000;
      const batchProfit = profit * effectiveLimit;

      profitableItems.push({
        id: item.id,
        name: item.name,
        members: item.members,
        highAlchValue: item.highalch,
        buyPrice,
        sellPrice: sellPrice || buyPrice,
        profit,
        buyLimit: item.limit,
        batchProfit,
        priceTimestamp: priceData.highTime,
      });
    }
  }

  // Sort by profit (highest first)
  return profitableItems.sort((a, b) => b.profit - a.profit);
}

// Display results in a formatted table
function displayResults(items: AlchemyItem[]): void {
  console.log("\n" + "=".repeat(100));
  console.log("                    OSRS HIGH ALCHEMY PROFIT TRACKER");
  console.log("=".repeat(100));
  console.log(`Found ${items.length} profitable items (sorted by profit per item)\n`);

  // Take top 50
  const topItems = items.slice(0, 50);

  // Create table data
  const tableData = topItems.map((item, index) => ({
    "#": index + 1,
    "Item": item.name.length > 25 ? item.name.substring(0, 22) + "..." : item.name,
    "Members": item.members ? "Yes" : "No",
    "Buy Price": formatPrice(item.buyPrice),
    "High Alch": formatPrice(item.highAlchValue),
    "Profit": formatPrice(item.profit),
    "Buy Limit": item.buyLimit ? formatNumber(item.buyLimit) : "∞",
    "Batch Profit": formatPrice(item.batchProfit),
    "Price Freshness": `${getFreshnessIndicator(item.priceTimestamp)} (${formatTimeAgo(item.priceTimestamp)})`,
  }));

  console.table(tableData);

  // Summary
  console.log("\n" + "=".repeat(100));
  console.log("SUMMARY:");
  console.log(`- Total profitable items: ${items.length}`);
  console.log(`- Top item: ${topItems[0]?.name || "N/A"} (${formatPrice(topItems[0]?.profit || 0)} profit each)`);
  console.log(`- Best batch: ${topItems[0]?.name || "N/A"} (${formatPrice(topItems[0]?.batchProfit || 0)} per 4h cycle)`);
  console.log(`- Nature rune cost: ${formatPrice(100)} gp (estimated)`);
  console.log("\nPrice Freshness Legend:");
  console.log("  ✅ Fresh - Price updated within last 10 minutes");
  console.log("  ⚠️ Stale - Price updated 10-30 minutes ago");
  console.log("  ❌ Old - Price updated more than 30 minutes ago");
  console.log("=".repeat(100) + "\n");
}

// Main execution
async function main(): Promise<void> {
  const startTime = Date.now();
  
  console.log("🔄 Fetching OSRS market data...");
  
  try {
    // Fetch data in parallel
    const [items, prices] = await Promise.all([
      fetchItemMapping(),
      fetchLatestPrices(),
    ]);

    console.log(`✅ Loaded ${items.length} items and ${Object.keys(prices).length} price entries`);
    console.log("🧮 Calculating High Alchemy profits...");

    const profitableItems = calculateProfits(items, prices);

    if (profitableItems.length === 0) {
      console.log("\n❌ No profitable High Alchemy items found at current prices.");
      console.log("   Try again later when market prices change.\n");
      return;
    }

    displayResults(profitableItems);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️  Completed in ${duration} seconds\n`);

  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : "Unknown error");
    process.exit(1);
  }
}

// Run the script
main();
