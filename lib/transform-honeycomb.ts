import { BotInteraction, DashboardData } from './types';

/**
 * 将 Honeycomb 原始数据转换为 DashboardData 格式
 * 处理 Honeycomb 按时间分片返回的数据，聚合相同 slug_id 的记录
 *
 * @param results - Honeycomb 查询返回的 results 数组（可能包含时间分片数据）
 * @returns 转换后的 DashboardData 对象
 */
export function transformHoneycombData(results: any[]): DashboardData {
  // 使用 Map 来聚合相同 slug_id 的数据
  const botMap = new Map<string, { eventCount: number; maxUniqueUsers: number | undefined }>();
  let totalEvents = 0;
  let totalUsers = 0;
  let hasTotal = false;
  let hasUniqueUserData = false;

  console.log(`🔄 Processing ${results.length} Honeycomb records...`);

  // 检查第一条记录是否包含 unique user 数据
  if (results.length > 0) {
    const firstResult = results[0];
    hasUniqueUserData = 'COUNT_DISTINCT(user_id)' in firstResult || 'COUNT_DISTINCT_user_id' in firstResult;
    if (!hasUniqueUserData) {
      console.log('⚡ No unique user data in results (performance mode)');
    }
  }

  // 遍历所有结果
  results.forEach((result) => {
    // 检查是否是总计行（没有 slug_id 的行）
    if (!result.slug_id) {
      totalEvents = result.COUNT || result['COUNT'] || 0;
      totalUsers = result['COUNT_DISTINCT(user_id)'] || result.COUNT_DISTINCT_user_id || 0;
      hasTotal = true;
      console.log('📊 Found total row');
      return;
    }

    const slugId = result.slug_id;
    const eventCount = result.COUNT || result['COUNT'] || 0;
    const uniqueUsers = hasUniqueUserData
      ? (result['COUNT_DISTINCT(user_id)'] || result.COUNT_DISTINCT_user_id || 0)
      : undefined;

    // 聚合相同 slug_id 的数据
    if (!botMap.has(slugId)) {
      botMap.set(slugId, {
        eventCount: 0,
        maxUniqueUsers: uniqueUsers !== undefined ? 0 : undefined
      });
    }

    const bot = botMap.get(slugId)!;
    // eventCount 和 uniqueUsers 都取最大值（Honeycomb 返回的是累积值）
    bot.eventCount = Math.max(bot.eventCount, eventCount);
    if (uniqueUsers !== undefined && bot.maxUniqueUsers !== undefined) {
      bot.maxUniqueUsers = Math.max(bot.maxUniqueUsers, uniqueUsers);
    }
  });

  // 转换 Map 为数组
  const bots: BotInteraction[] = Array.from(botMap.entries()).map(([slugId, data]) => {
    const bot: BotInteraction = {
      slug_id: slugId,
      eventCount: data.eventCount
    };

    // 只有在有 uniqueUsers 数据时才添加这些字段
    if (data.maxUniqueUsers !== undefined && data.maxUniqueUsers > 0) {
      bot.uniqueUsers = data.maxUniqueUsers;
      bot.avgActivity = Math.round((data.eventCount / data.maxUniqueUsers) * 10) / 10;
    }

    return bot;
  });

  // 按事件数排序（降序）
  bots.sort((a, b) => b.eventCount - a.eventCount);

  // 如果没有找到总计行，通过聚合后的数据计算
  if (!hasTotal) {
    console.warn('⚠️  No total row found, calculating from aggregated data');
    totalEvents = bots.reduce((sum, bot) => sum + bot.eventCount, 0);
    // totalUsers 不能简单累加（会重复计数），只有在有数据时才计算
    if (hasUniqueUserData) {
      totalUsers = bots.reduce((sum, bot) => sum + (bot.uniqueUsers || 0), 0);
    }
  }

  console.log(`✅ Aggregated ${results.length} records into ${bots.length} unique bots`);
  console.log(`📊 Total: ${totalEvents.toLocaleString()} events, ${totalUsers.toLocaleString()} users`);

  return {
    lastUpdate: new Date().toISOString(),
    totalEvents,
    totalUsers,
    bots
  };
}
