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
 * 每个时间段为9天，从今天往回推算
 * 第一个周期：今天往前推8天到今天（9天）
 * 第二个周期：第一个周期开始日往前推9天
 *
 * @param count 生成的周期数量，默认4个
 * @returns 周时间段数组，从最近到最远
 */
export function getRecentWeekPeriods(count: number = 4): WeekPeriod[] {
  const periods: WeekPeriod[] = [];
  const today = new Date();

  // 重置时间到今天的开始（00:00:00）
  today.setHours(0, 0, 0, 0);

  // 生成最近N个周期
  for (let i = 0; i < count; i++) {
    // 当前周期的结束日期
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (i * 9)); // 每个周期往前推9天

    // 当前周期的开始日期（结束日期往前推8天，形成9天周期，包含首尾）
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 8);

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    // 生成标签
    let label: string;
    if (i === 0) {
      label = `最近9天`;
    } else if (i === 1) {
      label = `往前9天`;
    } else {
      label = `${i * 9}天前`;
    }

    periods.push({
      id: `week-${i}`,
      label: `${label} (${startStr} ~ ${endStr})`,
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
