/**
 * 周时间段工具函数
 * 用于生成固定的周时间段（周五到下周日，9天一个周期）
 * 例如：2024-11-14（周五）到 2024-11-22（下周日），共9天
 */

export interface WeekPeriod {
  id: string;
  label: string;
  startDate: string; // YYYY-MM-DD（周五）
  endDate: string;   // YYYY-MM-DD（下周日）
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取指定日期所在周的周日
 */
function getSundayOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(date);
  sunday.setDate(date.getDate() + diff);
  return sunday;
}

/**
 * 生成最近的N个周时间段
 * 每个时间段从周五到下周日（9天）
 * 例如：11.14（周五）到 11.22（下周日）
 *
 * @param count 生成的周期数量，默认4个
 * @returns 周时间段数组，从最近到最远
 */
export function getRecentWeekPeriods(count: number = 4): WeekPeriod[] {
  const periods: WeekPeriod[] = [];
  const today = new Date();

  // 找到最近的已完成周期的结束日期（周日）
  let referenceSunday = getSundayOfWeek(today);

  // 如果今天是周一到周四，说明本周期还没结束，使用上周日
  const dayOfWeek = today.getDay();
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    referenceSunday.setDate(referenceSunday.getDate() - 7);
  }
  // 如果今天是周日，就用今天
  // 如果今天是周五或周六，说明本周期正在进行，也使用上周日
  else if (dayOfWeek === 5 || dayOfWeek === 6) {
    referenceSunday.setDate(referenceSunday.getDate() - 7);
  }

  // 生成最近N个周期
  for (let i = 0; i < count; i++) {
    // 当前周期的结束日期（周日）
    const endSunday = new Date(referenceSunday);
    endSunday.setDate(referenceSunday.getDate() - (i * 9)); // 每个周期间隔9天

    // 当前周期的开始日期（周五，周日往前推8天得到9天周期）
    const startFriday = new Date(endSunday);
    startFriday.setDate(endSunday.getDate() - 8); // 周日往前8天，形成9天周期（含首尾）

    const startStr = formatDate(startFriday);
    const endStr = formatDate(endSunday);

    // 生成标签
    let label: string;
    if (i === 0) {
      label = `本周期 (${startStr} 至 ${endStr})`;
    } else if (i === 1) {
      label = `上周期 (${startStr} 至 ${endStr})`;
    } else {
      label = `${i}周期前 (${startStr} 至 ${endStr})`;
    }

    periods.push({
      id: `week-${i}`,
      label,
      startDate: startStr,
      endDate: endStr
    });
  }

  return periods;
}

/**
 * 获取特定周期的日期范围
 * @param weekOffset 周期偏移量，0=本周期，1=上周期，以此类推
 * @returns 该周期的起止日期
 */
export function getWeekPeriodByOffset(weekOffset: number): { startDate: string; endDate: string } {
  const periods = getRecentWeekPeriods(weekOffset + 1);
  return {
    startDate: periods[weekOffset].startDate,
    endDate: periods[weekOffset].endDate
  };
}
