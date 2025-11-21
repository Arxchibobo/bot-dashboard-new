// 生成示例数据（用于演示）
// 实际生产环境中应使用真实的 Honeycomb API

const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🔄 生成示例 Bot 交互数据...');
  console.log('   （注意：这是演示数据，生产环境请使用真实的 Honeycomb API）');
  console.log('');

  // 生成示例数据
  const sampleBots = [
    { slug_id: 'faceswap-diy', eventCount: 21500, uniqueUsers: 3100 },
    { slug_id: 'linkedin-profile-maker', eventCount: 7200, uniqueUsers: 1020 },
    { slug_id: 'thumbnail-generator', eventCount: 5800, uniqueUsers: 840 },
    { slug_id: 'arcane-filter', eventCount: 1850, uniqueUsers: 250 },
    { slug_id: 'bald-filter', eventCount: 920, uniqueUsers: 175 },
    { slug_id: 'labubu-maker', eventCount: 860, uniqueUsers: 180 },
    { slug_id: 'linkedin-photo-generator', eventCount: 800, uniqueUsers: 190 },
    { slug_id: 'baby-face-maker', eventCount: 660, uniqueUsers: 125 },
    { slug_id: 'old-photo-restoration', eventCount: 490, uniqueUsers: 55 },
    { slug_id: 'career-photo-generator', eventCount: 350, uniqueUsers: 88 }
  ];

  // 添加平均活跃度
  const bots = sampleBots.map(bot => ({
    ...bot,
    avgActivity: parseFloat((bot.eventCount / bot.uniqueUsers).toFixed(1))
  }));

  // 计算总计
  const totalEvents = bots.reduce((sum, bot) => sum + bot.eventCount, 0);
  const totalUsers = bots.reduce((sum, bot) => sum + bot.uniqueUsers, 0);

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
  console.log('✅ 示例数据生成成功！');
  console.log('');
  console.log('📊 数据摘要:');
  console.log(`   - Bot 数量: ${bots.length}`);
  console.log(`   - 总事件数: ${totalEvents.toLocaleString()}`);
  console.log(`   - 独立用户数: ${totalUsers.toLocaleString()}`);
  console.log(`   - 更新时间: ${new Date(dashboardData.lastUpdate).toLocaleString('zh-CN')}`);
  console.log('');
  console.log(`💾 数据已保存到: ${filePath}`);
  console.log('');
  console.log('⚠️  注意：这是演示数据！');
  console.log('   生产环境请使用真实的 Honeycomb API Key 和查询。');
}

main().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});
