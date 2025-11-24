// app/api/honeycomb/update/route.ts
import { NextResponse } from 'next/server';
import { queryHoneycomb, getDefaultQuerySpec } from '@/lib/mcp-client';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * POST /api/honeycomb/update
 * Fetch latest data from Honeycomb via MCP and save to honeycomb-raw.json
 */
export async function POST() {
  try {
    console.log('🔄 Fetching data from Honeycomb via MCP...');

    // Query Honeycomb via MCP
    const querySpec = getDefaultQuerySpec();
    const result = await queryHoneycomb(querySpec);

    // Save raw result to scripts/honeycomb-raw.json
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const rawDataPath = path.join(scriptsDir, 'honeycomb-raw.json');

    await fs.writeFile(
      rawDataPath,
      JSON.stringify(result, null, 2),
      'utf-8'
    );

    console.log('✅ Raw data saved to scripts/honeycomb-raw.json');

    // Transform the data
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);

    console.log('🔄 Transforming data...');
    await execPromise('npm run update-data');

    console.log('✅ Data transformation complete');

    return NextResponse.json({
      success: true,
      message: 'Data updated successfully from Honeycomb',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error updating from Honeycomb:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/honeycomb/update
 * Returns API usage information
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to update data from Honeycomb',
    endpoint: '/api/honeycomb/update',
    method: 'POST',
    description: 'Fetches latest bot interaction data from Honeycomb via MCP server'
  });
}
