#!/usr/bin/env node

/**
 * Honeycomb 数据转换脚本
 *
 * 功能：
 * 1. 读取 scripts/honeycomb-raw.json（Honeycomb 原始查询结果）
 * 2. 转换为 DashboardData 格式
 * 3. 保存到 data/bot-interactions.json
 *
 * 使用方法：
 * npm run update-data
 *
 * 输入格式（Honeycomb 查询结果）：
 * {
 *   "results": [
 *     {
 *       "slug_id": "faceswap-diy",
 *       "COUNT": 37388,
 *       "COUNT_DISTINCT(user_id)": 5417
 *     },
 *     ...
 *   ]
 * }
 *
 * 输出格式（DashboardData）：
 * {
 *   "lastUpdate": "2025-01-12T10:30:00.000Z",
 *   "totalEvents": 563853,
 *   "totalUsers": 45986,
 *   "bots": [
 *     {
 *       "slug_id": "faceswap-diy",
 *       "eventCount": 37388,
 *       "uniqueUsers": 5417,
 *       "avgActivity": 6.9
 *     },
 *     ...
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');

// 文件路径配置
const RAW_DATA_PATH = path.join(__dirname, 'honeycomb-raw.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'bot-interactions.json');

/**
 * 读取原始数据文件
 * @returns {Object} 原始数据对象
 */
function readRawData() {
  console.log('📖 读取原始数据文件...');

  // 检查文件是否存在
  if (!fs.existsSync(RAW_DATA_PATH)) {
    throw new Error(
      `找不到文件: ${RAW_DATA_PATH}\n` +
      `请先从 Honeycomb 查询数据并保存到此文件。\n` +
      `详细步骤请参考: docs/HONEYCOMB_INTEGRATION.md`
    );
  }

  try {
    const rawData = fs.readFileSync(RAW_DATA_PATH, 'utf-8');
    const data = JSON.parse(rawData);
    console.log('✅ 原始数据读取成功\n');
    return data;
  } catch (error) {
    throw new Error(
      `解析 JSON 文件失败: ${error.message}\n` +
      `请检查文件内容是否为有效的 JSON 格式。`
    );
  }
}

/**
 * 验证数据格式
 * @param {Object} data - 原始数据对象
 */
function validateData(data) {
  console.log('🔍 验证数据格式...');

  // 检查是否有 results 数组
  if (!data.results || !Array.isArray(data.results)) {
    throw new Error(
      `数据格式错误：缺少 results 数组\n` +
      `请确保保存的是完整的 Honeycomb 查询结果。`
    );
  }

  // 检查 results 是否为空
  if (data.results.length === 0) {
    throw new Error(
      `数据为空：results 数组中没有数据\n` +
      `请检查 Honeycomb 查询是否返回了数据。`
    );
  }

  console.log(`✅ 数据格式验证通过（共 ${data.results.length} 条记录）\n`);
}

/**
 * 计算平均活跃度
 * @param {number} eventCount - 事件数
 * @param {number} uniqueUsers - 独立用户数
 * @returns {number} 平均活跃度
 */
function calculateAvgActivity(eventCount, uniqueUsers) {
  if (uniqueUsers === 0) return 0;
  return Math.round((eventCount / uniqueUsers) * 10) / 10; // 保留一位小数
}

/**
 * 转换单个 Bot 数据
 * @param {Object} result - Honeycomb 查询结果中的单条记录
 * @returns {Object} 转换后的 Bot 数据
 */
function transformBotData(result) {
  // 提取字段（处理可能的字段名变化）
  const slug_id = result.slug_id || result['slug_id'];
  const eventCount = result.COUNT || result['COUNT'] || 0;
  const uniqueUsers = result['COUNT_DISTINCT(user_id)'] || result.COUNT_DISTINCT_user_id || 0;

  // 验证必需字段
  if (!slug_id) {
    console.warn('⚠️  跳过没有 slug_id 的记录:', result);
    return null;
  }

  return {
    slug_id,
    eventCount,
    uniqueUsers,
    avgActivity: calculateAvgActivity(eventCount, uniqueUsers)
  };
}

/**
 * 转换数据
 * @param {Object} rawData - 原始数据对象
 * @returns {Object} 转换后的 DashboardData 对象
 */
function transformData(rawData) {
  console.log('🔄 转换数据格式...');

  const bots = [];
  let totalEvents = 0;
  let totalUsers = 0;
  let hasTotal = false;

  // 遍历所有结果
  for (const result of rawData.results) {
    // 检查是否是总计行（没有 slug_id 的行）
    if (!result.slug_id) {
      // 这是总计行
      totalEvents = result.COUNT || result['COUNT'] || 0;
      totalUsers = result['COUNT_DISTINCT(user_id)'] || result.COUNT_DISTINCT_user_id || 0;
      hasTotal = true;
      console.log('📊 找到总计行');
      continue;
    }

    // 转换单个 Bot 数据
    const botData = transformBotData(result);
    if (botData) {
      bots.push(botData);
      // 如果没有总计行，通过累加计算
      if (!hasTotal) {
        totalEvents += botData.eventCount;
        // 注意：totalUsers 不能简单累加（会重复计数），这里只是近似值
      }
    }
  }

  // 如果没有找到总计行，给出警告
  if (!hasTotal) {
    console.warn('⚠️  未找到总计行，totalEvents 通过累加计算');
    console.warn('⚠️  totalUsers 可能不准确（无法从分组数据准确计算）');
    totalUsers = 0; // 设为 0 表示不可用
  }

  console.log(`✅ 数据转换完成（共 ${bots.length} 个 Bot）\n`);

  return {
    lastUpdate: new Date().toISOString(),
    totalEvents,
    totalUsers,
    bots
  };
}

/**
 * 保存转换后的数据
 * @param {Object} data - 转换后的数据对象
 */
function saveData(data) {
  console.log('💾 保存数据到文件...');

  try {
    // 确保目录存在
    const dir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 保存为格式化的 JSON
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 数据已保存到: ${OUTPUT_PATH}\n`);
  } catch (error) {
    throw new Error(`保存文件失败: ${error.message}`);
  }
}

/**
 * 显示统计信息
 * @param {Object} data - 转换后的数据对象
 */
function displayStats(data) {
  console.log('📈 数据统计：');
  console.log('─'.repeat(50));
  console.log(`总事件数：     ${data.totalEvents.toLocaleString()}`);
  console.log(`总独立用户数： ${data.totalUsers.toLocaleString()}`);
  console.log(`Bot 数量：     ${data.bots.length}`);
  console.log(`最后更新：     ${new Date(data.lastUpdate).toLocaleString('zh-CN')}`);
  console.log('─'.repeat(50));

  // 显示前 5 个 Bot
  if (data.bots.length > 0) {
    console.log('\n🏆 Top 5 Bot（按事件数排序）：');
    console.log('─'.repeat(50));
    data.bots
      .slice(0, 5)
      .forEach((bot, index) => {
        console.log(
          `${index + 1}. ${bot.slug_id}\n` +
          `   事件数: ${bot.eventCount.toLocaleString()}, ` +
          `独立用户: ${bot.uniqueUsers.toLocaleString()}, ` +
          `平均活跃度: ${bot.avgActivity}`
        );
      });
    console.log('─'.repeat(50));
  }
}

/**
 * 主函数
 */
function main() {
  console.log('\n🚀 开始转换 Honeycomb 数据...\n');
  console.log('═'.repeat(50));
  console.log('\n');

  try {
    // 步骤 1: 读取原始数据
    const rawData = readRawData();

    // 步骤 2: 验证数据格式
    validateData(rawData);

    // 步骤 3: 转换数据
    const transformedData = transformData(rawData);

    // 步骤 4: 保存数据
    saveData(transformedData);

    // 步骤 5: 显示统计信息
    displayStats(transformedData);

    console.log('\n✅ 数据转换完成！');
    console.log('\n💡 下一步：');
    console.log('   1. 访问 http://localhost:3000');
    console.log('   2. 点击"刷新数据"按钮或刷新浏览器页面');
    console.log('   3. 查看更新后的数据\n');

  } catch (error) {
    console.error('\n❌ 错误：', error.message, '\n');
    process.exit(1);
  }
}

// 执行主函数
main();
