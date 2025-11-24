/**
 * 测试脚本：验证优化后的数据查询
 *
 * 运行方式：node scripts/test-query.js
 */

const testCases = [
  {
    name: '小范围查询 (7天)',
    startDate: '2025-11-15',
    endDate: '2025-11-21',
    expectedBehavior: '直接查询，不分批',
    expectedTime: '~30秒'
  },
  {
    name: '中等范围查询 (14天)',
    startDate: '2025-11-08',
    endDate: '2025-11-21',
    expectedBehavior: '分批查询 (5个3天批次)',
    expectedTime: '~2.5分钟'
  },
  {
    name: '大范围查询 (37天)',
    startDate: '2025-10-15',
    endDate: '2025-11-21',
    expectedBehavior: '分批查询 (13个3天批次)',
    expectedTime: '~6.5分钟'
  }
];

async function testQuery(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试: ${testCase.name}`);
  console.log(`时间范围: ${testCase.startDate} 到 ${testCase.endDate}`);
  console.log(`预期行为: ${testCase.expectedBehavior}`);
  console.log(`预期时间: ${testCase.expectedTime}`);
  console.log(`${'='.repeat(60)}\n`);

  const startTime = Date.now();

  try {
    const response = await fetch(
      `http://localhost:3002/api/data?startDate=${testCase.startDate}&endDate=${testCase.endDate}`
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!response.ok) {
      console.error(`❌ 请求失败: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log(`\n✅ 查询完成 (耗时: ${elapsed}秒)`);
    console.log(`\n结果统计:`);
    console.log(`  - Bot 数量: ${data.data.bots.length}`);
    console.log(`  - 总事件数: ${data.data.totalEvents}`);
    console.log(`  - 总用户数: ${data.data.totalUsers}`);

    if (data.data.loginStats) {
      console.log(`\n登录统计:`);
      console.log(`  - 总登录次数: ${data.data.loginStats.totalLogins}`);
      console.log(`  - 唯一用户: ${data.data.loginStats.uniqueLoginUsers}`);
      console.log(`  - 新用户: ${data.data.loginStats.newUsers}`);
      console.log(`  - 老用户: ${data.data.loginStats.returningUsers}`);
    } else {
      console.log(`\n⚠️ 登录统计不可用`);
    }

    if (data.data.userFunnel) {
      console.log(`\n用户行为漏斗:`);
      data.data.userFunnel.steps.forEach(step => {
        console.log(`  - ${step.name}: ${step.userDayCount} (转化率: ${step.conversionRate}%)`);
      });
    } else {
      console.log(`\n⚠️ 用户漏斗不可用`);
    }

    if (data.data.errorInfo) {
      console.log(`\n⚠️ 查询警告:`);
      console.log(`  - 类型: ${data.data.errorInfo.type}`);
      console.log(`  - 信息: ${data.data.errorInfo.message}`);
      console.log(`  - 建议: ${data.data.errorInfo.suggestion}`);
    }

    if (data.botDataFailed) {
      console.log(`\n❌ Bot 数据查询失败`);
    }

    console.log(`\n✅ 测试通过\n`);

  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`\n❌ 测试失败 (耗时: ${elapsed}秒)`);
    console.error(`错误: ${error.message}\n`);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║      Bot Dashboard - 数据查询优化测试套件              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // 检查服务器是否运行
  try {
    await fetch('http://localhost:3002');
    console.log('✅ 服务器正在运行: http://localhost:3002\n');
  } catch (error) {
    console.error('❌ 服务器未运行，请先启动服务器: npm run dev\n');
    process.exit(1);
  }

  // 运行所有测试
  for (const testCase of testCases) {
    await testQuery(testCase);
    // 测试间隔 5 秒
    if (testCases.indexOf(testCase) < testCases.length - 1) {
      console.log('⏳ 等待 5 秒后继续下一个测试...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    所有测试完成                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

// 运行测试
runAllTests().catch(error => {
  console.error('测试套件失败:', error);
  process.exit(1);
});
