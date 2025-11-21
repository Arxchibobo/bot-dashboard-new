// 使用 MCP 方式获取 Honeycomb 数据的临时脚本
// 这个脚本不需要 .env.local，因为我们直接在代码中提供配置

const fs = require('fs').promises;
const path = require('path');

// Honeycomb 配置（从之前的会话中获得）
const HONEYCOMB_CONFIG = {
  apiKey: 'hcaik_01jgjn1r8sdwkp7h7gjmqzj0thhz4zbdxqjgsgqf1sqv2haq0rr7y1xrcw',
  team: 'shane',
  environment: 'dev',
  dataset: 'myshell-art-web'
};

const HONEYCOMB_API_BASE = 'https://api.honeycomb.io/1';

// 查询 Honeycomb API
async function queryHoneycomb(querySpec) {
  const url = `${HONEYCOMB_API_BASE}/queries/${HONEYCOMB_CONFIG.dataset}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Honeycomb-Team': HONEYCOMB_CONFIG.apiKey,
      'X-Honeycomb-Environment': HONEYCOMB_CONFIG.environment,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...querySpec,
      disable_series: true,
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Honeycomb API 请求失败 (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// 主函数
async function main() {
  try {
    console.log('🔄 正在从 Honeycomb 获取最新数据...');
    console.log('   数据集:', HONEYCOMB_CONFIG.dataset);
    console.log('   时间范围: 过去 3 天');
    console.log('');

    // 查询1：获取 Top 50 Bot（按事件数排序）
    console.log('📊 查询 Top 50 Bot...');
    const botsData = await queryHoneycomb({
      calculations: [
        { op: 'COUNT' },
        { op: 'COUNT_DISTINCT', column: 'user_id' }
      ],
      breakdowns: ['slug_id'],
      time_range: 259200, // 3天（秒）
      filters: [
        { column: 'slug_id', op: 'exists' }
      ],
      orders: [
        { op: 'COUNT', order: 'descending' }
      ],
      limit: 50
    });

    // 查询2：获取总计数据
    console.log('📊 查询总计数据...');
    const totalsData = await queryHoneycomb({
      calculations: [
        { op: 'COUNT' },
        { op: 'COUNT_DISTINCT', column: 'user_id' }
      ],
      time_range: 259200,
      filters: [
        { column: 'slug_id', op: 'exists' }
      ]
    });

    // 转换数据格式
    const bots = botsData.data.results
      .filter(item => item.slug_id)
      .map(item => ({
        slug_id: item.slug_id,
        eventCount: item.COUNT || 0,
        uniqueUsers: item['COUNT_DISTINCT(user_id)'] || 0,
        avgActivity: item.COUNT && item['COUNT_DISTINCT(user_id)']
          ? parseFloat((item.COUNT / item['COUNT_DISTINCT(user_id)']).toFixed(1))
          : 0
      }));

    const totalEvents = totalsData.data.results[0]?.COUNT || 0;
    const totalUsers = totalsData.data.results[0]?.['COUNT_DISTINCT(user_id)'] || 0;

    const dashboardData = {
      lastUpdate: new Date().toISOString(),
      totalEvents,
      totalUsers,
      bots
    };

    // 写入文件
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    const filePath = path.join(dataDir, 'bot-interactions.json');
    await fs.writeFile(filePath, JSON.stringify(dashboardData, null, 2), 'utf-8');

    // 显示成功信息
    console.log('');
    console.log('✅ 数据更新成功！');
    console.log('');
    console.log('📊 数据摘要:');
    console.log(`   - Bot 数量: ${bots.length}`);
    console.log(`   - 总事件数: ${totalEvents.toLocaleString()}`);
    console.log(`   - 独立用户数: ${totalUsers.toLocaleString()}`);
    console.log(`   - 更新时间: ${new Date(dashboardData.lastUpdate).toLocaleString('zh-CN')}`);
    console.log('');
    console.log(`💾 数据已保存到: ${filePath}`);

  } catch (error) {
    console.error('');
    console.error('❌ 数据更新失败');
    console.error('');
    if (error instanceof Error) {
      console.error(`错误信息: ${error.message}`);
    } else {
      console.error('未知错误:', error);
    }
    console.error('');
    process.exit(1);
  }
}

main();
