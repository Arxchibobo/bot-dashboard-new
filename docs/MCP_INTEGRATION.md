# MCP Server Integration

## Overview

The bot-dashboard is now integrated with the **mcphub MCP server** to automatically fetch data from Honeycomb with a single click.

**MCP Server URL**: `http://52.12.230.109:3000/mcp`

## Architecture

```
User clicks "从 Honeycomb 更新"
    ↓
Frontend (DataActions component)
    ↓
POST /api/honeycomb/update
    ↓
MCP Client (lib/mcp-client.ts)
    ↓
mcphub MCP Server (http://52.12.230.109:3000/mcp)
    ↓
Honeycomb API (myshell-art-web dataset)
    ↓
Save to scripts/honeycomb-raw.json
    ↓
Run transform script (npm run update-data)
    ↓
Update data/bot-interactions.json
    ↓
Frontend refreshes and displays new data
```

## Components

### 1. MCP Client (`lib/mcp-client.ts`)

Handles communication with the mcphub MCP server:

- **`queryHoneycomb(querySpec)`**: Sends MCP JSON-RPC requests
- **`getDefaultQuerySpec()`**: Returns default query configuration
  - Dataset: `myshell-art-web`
  - Time range: 7 days (604800 seconds)
  - Top 100 bots by event count

### 2. API Endpoint (`app/api/honeycomb/update/route.ts`)

Backend endpoint that:

1. Calls MCP server via `queryHoneycomb()`
2. Saves raw response to `scripts/honeycomb-raw.json`
3. Runs transformation script: `npm run update-data`
4. Returns success/error response

### 3. Frontend Component (`components/data-actions.tsx`)

UI component with "从 Honeycomb 更新" button:

- Shows loading state during update
- Displays success/error messages
- Refreshes page data on success

## Usage

### Automatic Update (Recommended)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open the dashboard in your browser:
   ```
   http://localhost:3002
   ```

3. Click the **"从 Honeycomb 更新"** button

4. Wait for the update to complete (usually 5-10 seconds)

5. The page will automatically refresh with new data

### Manual Update (Fallback)

If the automatic update fails, you can still use the manual workflow:

1. Copy the instruction: "请刷新 bot-dashboard 数据"
2. Paste into Claude Code
3. Claude Code will use MCP tools to fetch data
4. Save result to `scripts/honeycomb-raw.json`
5. Run: `npm run update-data`
6. Click "重新加载数据" button

## Query Configuration

The default query fetches:

- **Dataset**: `myshell-art-web`
- **Environment**: `dev`
- **Time Range**: Last 7 days
- **Metrics**:
  - Event count (`COUNT`)
  - Unique users (`COUNT_DISTINCT(user_id)`)
- **Grouping**: By `slug_id`
- **Limit**: Top 100 bots
- **Sorting**: By event count (descending)

To modify the query, edit `getDefaultQuerySpec()` in `lib/mcp-client.ts`:

```typescript
export function getDefaultQuerySpec() {
  return {
    calculations: [
      { op: 'COUNT' },
      { op: 'COUNT_DISTINCT', column: 'user_id' }
    ],
    breakdowns: ['slug_id'],
    time_range: 604800, // Change this for different time ranges
    filters: [
      { column: 'slug_id', op: 'exists' }
    ],
    orders: [
      { op: 'COUNT', order: 'descending' }
    ],
    limit: 100 // Change this for more/fewer bots
  };
}
```

## Troubleshooting

### Error: "MCP request failed"

**Possible causes:**
- MCP server is down
- Network connectivity issues
- Server URL changed

**Solution:**
1. Check if MCP server is accessible:
   ```bash
   curl -X POST http://52.12.230.109:3000/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
   ```
2. Verify server URL in `lib/mcp-client.ts`
3. Use manual update workflow as fallback

### Error: "No valid session ID provided"

**Cause:** The MCP server requires authentication/session management.

**Solution:** This is expected for direct curl requests. The integration handles this automatically when called from the application.

### Error: "Data transformation failed"

**Cause:** The MCP response format doesn't match expected structure.

**Solution:**
1. Check `scripts/honeycomb-raw.json` format
2. Verify it contains `results` array
3. Run transformation manually: `npm run update-data`

### Button shows "更新中..." forever

**Cause:** Request timeout or server not responding.

**Solution:**
1. Check browser console for errors
2. Check server logs
3. Refresh the page
4. Use manual update workflow

## Development

### Testing the Integration

1. Start dev server: `npm run dev`
2. Open browser console (F12)
3. Click "从 Honeycomb 更新"
4. Check console logs for:
   - Request sent to `/api/honeycomb/update`
   - MCP server response
   - Transformation script output

### Adding New Query Parameters

Edit `lib/mcp-client.ts`:

```typescript
export function getCustomQuerySpec(days: number, limit: number) {
  return {
    ...getDefaultQuerySpec(),
    time_range: days * 86400, // Convert days to seconds
    limit: limit
  };
}
```

Then use in API endpoint:

```typescript
const querySpec = getCustomQuerySpec(14, 200); // 14 days, top 200
const result = await queryHoneycomb(querySpec);
```

## Security Notes

- The MCP server URL is publicly accessible
- Authentication is handled by the MCP server
- No API keys are stored in the frontend
- All sensitive operations are server-side

## Related Documentation

- [Honeycomb Integration Guide](./HONEYCOMB_INTEGRATION.md) - Manual workflow
- [Project CLAUDE.md](../CLAUDE.md) - Development guidelines
- [MCP Protocol](https://modelcontextprotocol.io/) - MCP specification

## Future Enhancements

- [ ] Add query parameter customization UI
- [ ] Support multiple time ranges (3d, 7d, 14d, 30d)
- [ ] Add data caching to reduce API calls
- [ ] Implement webhook for automatic updates
- [ ] Add query history and rollback
