// lib/mcp-client.ts
/**
 * MCP Client for connecting to mcphub server
 * Server URL: http://52.12.230.109:3000/mcp
 */

const MCP_SERVER_URL = 'http://52.12.230.109:3000/mcp';

interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string | null;
}

/**
 * 解析 ASCII 表格格式的 Honeycomb 响应
 * 将 Markdown 表格转换为 JSON 结构
 */
function parseAsciiResponse(asciiText: string): {
  results: Array<{ [key: string]: any }>;
  query_url?: string;
  query_pk?: string;
} {
  const lines = asciiText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const results: Array<{ [key: string]: any }> = [];
  let headers: string[] = [];
  let inResultsSection = false;
  let query_url: string | undefined;
  let query_pk: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测 Results 部分开始
    if (line === '# Results') {
      inResultsSection = true;
      continue;
    }

    // 检测其他部分开始(结束 Results 部分)
    if (line.startsWith('#') && line !== '# Results') {
      inResultsSection = false;
      continue;
    }

    // 提取元数据
    if (line.includes('query_url:')) {
      const match = line.match(/query_url:\s*"([^"]+)"/);
      if (match) query_url = match[1];
      continue;
    }

    if (line.includes('query_run_pk:')) {
      const match = line.match(/query_run_pk:\s*(\S+)/);
      if (match) query_pk = match[1];
      continue;
    }

    // 处理 Results 表格
    if (inResultsSection && line.startsWith('|')) {
      const cells = line
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);

      // 跳过分隔符行 (包含 --- 的行)
      if (cells.length > 0 && cells[0].includes('---')) {
        continue;
      }

      // 第一行是表头
      if (headers.length === 0) {
        headers = cells;
        continue;
      }

      // 数据行
      if (cells.length > 0) {
        const row: { [key: string]: any } = {};

        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const value = cells[j];

          // 尝试转换为数字
          if (value && !isNaN(Number(value))) {
            row[header] = Number(value);
          } else {
            row[header] = value || null;
          }
        }

        results.push(row);
      }
    }
  }

  console.log(`✅ ASCII 解析完成: ${results.length} 行数据`);

  return {
    results,
    query_url,
    query_pk
  };
}

/**
 * Query Honeycomb via MCP server
 * 🔥 注意：移除了 output_format 参数，因为 MCP 服务器不支持
 * 服务器会返回 ASCII 表格格式，我们需要手动解析
 */
export async function queryHoneycomb(querySpec: any): Promise<any> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'honeycomb-run_query',
      arguments: {
        environment_slug: 'dev',
        dataset_slug: 'myshell-art-web',
        query_spec: querySpec,
        // 🔥 移除 output_format: 'json' - MCP 服务器不支持此参数
        disable_total_by_aggregate: false
      }
    },
    id: Date.now()
  };

  console.log('📤 发送 MCP 请求...');

  const response = await fetch(MCP_SERVER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
  }

  const result: MCPResponse = await response.json();

  if (result.error) {
    throw new Error(`MCP error: ${result.error.message}`);
  }

  console.log('📥 收到 MCP 响应');

  // 检查响应格式：MCP 返回的 result 可能包含 content 数组
  let responseData = result.result;

  // 如果 result 有 content 字段（MCP 标准格式）
  if (responseData && Array.isArray(responseData.content)) {
    // 找到 text 类型的内容
    const textContent = responseData.content.find((item: any) => item.type === 'text');
    if (textContent && textContent.text) {
      const responseText = textContent.text;

      // 检测响应格式：ASCII 表格 vs JSON
      if (responseText.trim().startsWith('#')) {
        // ASCII 表格格式 - 使用自定义解析器
        console.log('📄 检测到 ASCII 格式响应，开始解析...');
        const parsed = parseAsciiResponse(responseText);

        return {
          results: parsed.results,
          query_url: parsed.query_url,
          query_pk: parsed.query_pk
        };
      } else {
        // JSON 格式 - 直接解析
        console.log('📄 检测到 JSON 格式响应');
        try {
          const jsonParsed = JSON.parse(responseText);
          return {
            results: jsonParsed.results || [],
            query_url: jsonParsed.query_url,
            query_pk: jsonParsed.query_pk
          };
        } catch (e) {
          console.error('❌ JSON 解析失败:', e);
          throw new Error(`Failed to parse JSON response: ${e}`);
        }
      }
    }
  }

  // 兜底：直接返回原始结果
  console.warn('⚠️ 未识别的响应格式，返回原始数据');
  return responseData;
}

/**
 * Default query specification for bot interactions
 * Gets top 100 bots by event count in the last 7 days
 */
export function getDefaultQuerySpec() {
  return {
    calculations: [
      { op: 'COUNT' },
      { op: 'COUNT_DISTINCT', column: 'user_id' }
    ],
    breakdowns: ['slug_id'],
    time_range: 604800, // 7 days in seconds
    filters: [
      { column: 'slug_id', op: 'exists' }
    ],
    orders: [
      { op: 'COUNT', order: 'descending' }
    ],
    limit: 100
  };
}
