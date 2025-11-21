# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js dashboard application for visualizing bot interaction data from Honeycomb. The app displays statistics, charts, and detailed tables of bot interactions, with support for filtering, searching, and exporting data.

**Key Features:**
- Server-side rendering for initial data load
- Client-side interactivity for filtering, sorting, and pagination
- Data updates via Claude Code + MCP tools integration
- Export functionality (JSON, CSV, Excel)
- Interactive charts with click-to-filter behavior

## Development Commands

### Running the Application
```bash
# Development mode (hot reload, port 3002)
npm run dev

# Production mode (requires build first)
npm run build
npm start

# Linting
npm lint
```

### Data Management
```bash
# Transform Honeycomb raw data to dashboard format
npm run update-data
# This reads scripts/honeycomb-raw.json and writes to data/bot-interactions.json
```

**Alternative Launch Methods:**
- Windows: Double-click `start-dev.bat` (dev) or `start-prod.bat` (production)
- Unix/Mac: Run `./start.sh` (dev) or `./start-prod.sh` (production)

### Port Configuration
- Default: `3002` (configured in package.json scripts)
- Change in `package.json`: modify `-p 3002` in dev/start scripts

## Architecture

### Component Hierarchy & Data Flow

```
app/page.tsx (Server Component)
├── getDashboardData() → reads data/bot-interactions.json
├── StatsCards (displays totals)
└── DashboardWrapper (Client Component, manages chart-to-table interactions)
    ├── ChartsSection (visualizations with click handlers)
    └── DashboardClient (Client Component, manages filtered data state)
        ├── DataActions (refresh, update, export buttons)
        └── BotTable (Client Component, filtering/sorting/pagination)
            ├── PresetFilters (quick filter buttons)
            ├── AdvancedFilter (range sliders)
            └── UserIdsList (expandable user details)
```

**Key Architecture Patterns:**

1. **Server/Client Split**: Initial data fetch is server-side (app/page.tsx), interactive features are client-side ('use client' components)

2. **State Management**:
   - `DashboardWrapper` manages chart-to-table interaction via `triggerFilter` state
   - `DashboardClient` maintains `filteredData` state shared between table and export
   - `BotTable` owns search, sort, pagination, and filter state

3. **Data Flow**:
   - Charts → DashboardWrapper → DashboardClient → BotTable (filter triggers)
   - BotTable → DashboardClient → DataActions (filtered data for export)

### Data Sources & Updates

**Primary Data File**: `data/bot-interactions.json`
- Format: DashboardData interface (see lib/types.ts)
- Contains: lastUpdate, totalEvents, totalUsers, bots array

**Update Workflow** (via Claude Code):
1. User clicks "从 Honeycomb 更新" button → instruction copied to clipboard
2. User pastes instruction into Claude Code
3. Claude Code uses MCP tool `mcp__mcphub__honeycomb-run_query`
4. Query parameters (defined in docs/HONEYCOMB_INTEGRATION.md):
   - Dataset: `myshell-art-web`
   - Time range: 7 days (604800 seconds)
   - Calculations: COUNT, COUNT_DISTINCT(user_id)
   - Breakdowns: slug_id
5. Claude Code saves result to `scripts/honeycomb-raw.json`
6. Claude Code runs `npm run update-data` to transform data
7. User clicks "重新加载数据" to refresh UI

**Important**: The `fetch-honeycomb-mcp.js` script contains a hardcoded API key - DO NOT commit changes to this file with real credentials.

### Type System

**Core Types** (lib/types.ts):
```typescript
BotInteraction {
  slug_id: string
  eventCount: number
  uniqueUsers: number
  avgActivity: number
  userIds?: string[]          // Sample of user IDs
  userIdsSampleSize?: number  // Indicates this is a sample
}

DashboardData {
  lastUpdate: string  // ISO 8601
  totalEvents: number
  totalUsers: number
  bots: BotInteraction[]
}
```

### Filtering System

**Filter Architecture** (lib/filter-utils.ts):
- `FilterRanges`: Min/max ranges for eventCount, uniqueUsers, avgActivity
- `PresetFilter`: Named filters ('hot', 'high-activity', 'emerging', 'popular', 'all')
- `getDataRanges()`: Calculates actual data boundaries
- `getPresetFilter()`: Converts preset names to FilterRanges
- `applyFilter()`: Filters BotInteraction[] by ranges

**Filter Definitions**:
- **hot**: eventCount >= 1000
- **high-activity**: avgActivity >= 8
- **emerging**: uniqueUsers <= 100 AND avgActivity >= 7
- **popular**: uniqueUsers >= 500

**Filter Application Order** (in BotTable):
1. Range filters (from PresetFilters or AdvancedFilter)
2. Search term (slug_id contains)
3. Sorting
4. Pagination

## Working with Data Updates

### When user asks to refresh bot-dashboard data:

1. **Use the Honeycomb MCP tool** with these exact parameters:
```javascript
{
  "environment_slug": "dev",
  "dataset_slug": "myshell-art-web",
  "query_spec": {
    "calculations": [
      {"op": "COUNT"},
      {"op": "COUNT_DISTINCT", "column": "user_id"}
    ],
    "breakdowns": ["slug_id"],
    "time_range": 604800,  // 7 days in seconds
    "filters": [
      {"column": "slug_id", "op": "exists"}
    ],
    "orders": [
      {"op": "COUNT", "order": "descending"}
    ],
    "limit": 100
  },
  "output_format": "json",
  "disable_total_by_aggregate": false  // Important: includes total row
}
```

2. **Save the result** to `scripts/honeycomb-raw.json`
   - Must include the full response with "results" array
   - The last item in results array (without slug_id) is the total row

3. **Run the transformation script**:
```bash
npm run update-data
```

4. **Verify the update**:
   - Check `data/bot-interactions.json` was updated
   - Confirm lastUpdate timestamp is recent
   - Verify bot count and totals look reasonable

### Common Data Issues

- **Missing total row**: Ensure `disable_total_by_aggregate: false` in query
- **Invalid JSON**: Validate scripts/honeycomb-raw.json before transformation
- **Empty results**: Check time_range and filters in query spec
- **Duplicate slug_ids**: Query should naturally deduplicate, but check if multiple entries exist

## UI Component Patterns

### shadcn/ui Integration
- Components in `components/ui/` are from shadcn/ui library
- Use `cn()` utility (from lib/utils.ts) for conditional Tailwind classes
- Follow existing component patterns when adding new UI elements

### Client Component Requirements
- Add `'use client'` directive to components using:
  - React hooks (useState, useEffect, etc.)
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (navigator, window, etc.)
  - next/navigation (useRouter, usePathname, etc.)

### Toast Notifications
- Use `react-hot-toast` library
- Import Toaster component and toast functions
- Example: `toast.success('操作成功')`

## Styling Guidelines

- **Framework**: Tailwind CSS v3.4
- **Theme**: Defined in tailwind.config.ts
- **Responsive**: Use responsive prefixes (sm:, md:, lg:)
- **Colors**: Primary is blue (blue-600, blue-700), use gray scale for neutrals
- **Spacing**: Follow 4px grid (space-4, p-6, etc.)

## Testing Changes

1. **After modifying filtering logic**: Test all preset filters (hot, high-activity, emerging, popular)
2. **After data structure changes**: Verify lib/types.ts matches data/bot-interactions.json structure
3. **After chart modifications**: Test click-to-filter behavior works correctly
4. **After export changes**: Test all export formats (JSON, CSV, Excel) with filtered data

## Common Pitfalls

1. **Mixing Server/Client Components**: Remember server components can't use hooks or event handlers
2. **Filter State Synchronization**: When adding new filters, update both PresetFilters and AdvancedFilter
3. **Data Transformation**: The transform script expects specific Honeycomb field names (COUNT, COUNT_DISTINCT(user_id))
4. **Port Conflicts**: Port 3002 might be occupied; scripts auto-kill existing processes
5. **API Key Security**: Never commit real API keys (especially in scripts/fetch-honeycomb-mcp.js)

## File Locations

- **Data**: `data/bot-interactions.json` (dashboard data), `scripts/honeycomb-raw.json` (query result)
- **Types**: `lib/types.ts` (all TypeScript interfaces)
- **Utilities**: `lib/filter-utils.ts`, `lib/export-utils.ts`, `lib/utils.ts`
- **Scripts**: `scripts/transform-honeycomb-data.js` (data transformation)
- **API Routes**: `app/api/refresh/route.ts` (data reload endpoint)
- **Main Page**: `app/page.tsx` (entry point)
- **Charts**: `components/charts/*.tsx`
- **Filters**: `components/filters/*.tsx`
