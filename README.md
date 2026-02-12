# OSRS High Alchemy Profit Tool

A terminal-based tool to find the most profitable items for High Alchemy in Old School RuneScape.

## Features

- **Real-time prices**: Fetches live Grand Exchange data from the OSRS Wiki API
- **Profit calculation**: Calculates profit after Nature rune costs
- **Top 50 items**: Shows the most profitable alchemy items
- **Complete info**: Displays item name, buy price, alch value, profit, buy limits, and profit per hour
- **Members & F2P**: Includes both members and free-to-play items
- **Fast execution**: Runs once and exits (no waiting around)

## Installation

### Prerequisites
- Node.js (v18 or higher)

### Setup

1. **Navigate to the project directory:**
   ```bash
   cd osrs-high-alch-tool
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Usage

### Option 1: Run with ts-node (Recommended)
```bash
npm start
```

Or directly:
```bash
npx ts-node index.ts
```

### Option 2: Compile and run
```bash
npm run build
npm run run:js
```

## How It Works

The tool calculates profit using this formula:
```
Profit = High Alch Value - GE Buy Price - Nature Rune Cost
```

**Assumptions:**
- Nature runes cost is fetched from the current GE price
- You can buy items at the listed high price
- Alchemy is cast every 3 seconds (1,200 casts/hour)

## Sample Output

```
====================================================================================================
                    OSRS HIGH ALCHEMY PROFIT TRACKER
====================================================================================================
Found 127 profitable items (sorted by profit per item)

┌─────────┬──────────────────────┬─────────┬───────────┬───────────┬────────┬───────────┬─────────────┐
│ (index) │ Item                 │ Members │ Buy Price │ High Alch │ Profit │ Buy Limit │ Profit/Hr   │
├─────────┼──────────────────────┼─────────┼───────────┼───────────┼────────┼───────────┼─────────────┤
│ 0       │ 'Dragon bones'       │ 'Yes'   │ '2.3K'    │ '3.5K'    │ '1.1K' │ '3,000'   │ '1.3M'      │
│ 1       │ 'Rune platebody'     │ 'Yes'   │ '38.2K'   │ '39.0K'   │ '780'  │ '125'     │ '936K'      │
│ ...     │ ...                  │ ...     │ ...       │ ...       │ ...    │ ...       │ ...         │
└─────────┴──────────────────────┴─────────┴───────────┴───────────┴────────┴───────────┴─────────────┘

====================================================================================================
SUMMARY:
- Total profitable items: 127
- Top item: Dragon bones (1.1K profit each)
- Best profit/hour: Dragon bones (1.3M/hour)
- Nature rune cost: ~100 gp
====================================================================================================
```

## API Data Source

This tool uses the [OSRS Wiki Real-time Prices API](https://prices.runescape.wiki/), which partners with RuneLite to provide accurate Grand Exchange pricing data.

## Notes

- Prices are fetched in real-time and may change rapidly
- Always verify prices on the GE before making large purchases
- Some items have buy limits (shown in the table)
- Market conditions can change the profitability of items quickly

## License

MIT
