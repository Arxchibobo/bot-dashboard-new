// lib/types.ts

/**
 * Bot 交互数据类型
 * 表示单个 Bot 的统计数据
 */
export interface BotInteraction {
  /** Bot 的唯一标识符（slug ID） */
  slug_id: string;

  /** 该 Bot 的总事件数 */
  eventCount: number;

  /** 与该 Bot 交互的独立用户数（可选，长时间范围可能不可用） */
  uniqueUsers?: number;

  /** 平均用户活跃度（事件数 / 用户数）（可选，依赖uniqueUsers） */
  avgActivity?: number;

  /** 用户 ID 列表（可选，样本数据） */
  userIds?: string[];

  /** 用户 ID 样本大小（可选，标记这是样本而非完整数据） */
  userIdsSampleSize?: number;
}

/**
 * 登录用户统计数据
 */
export interface LoginStats {
  /** 登录总次数 */
  totalLogins: number;

  /** 登录独立用户数 */
  uniqueLoginUsers: number;

  /** 新用户数（在时间范围内第一次登录） */
  newUsers: number;

  /** 老用户数（在时间范围之前已登录过） */
  returningUsers: number;
}

/**
 * 漏斗步骤数据
 */
export interface FunnelStep {
  /** 步骤名称 */
  name: string;

  /** 事件类型 */
  eventType: string;

  /** 完成该步骤的用户-日期数（绝对值） */
  userDayCount: number;

  /** 相对于上一步的转化率（百分比） */
  conversionRate: number;

  /** 相对于第一步的转化率（百分比） */
  overallConversionRate: number;
}

/**
 * 用户行为漏斗数据
 */
export interface UserFunnel {
  /** 漏斗步骤列表 */
  steps: FunnelStep[];

  /** 漏斗开始时间 */
  startTime: string;

  /** 漏斗结束时间 */
  endTime: string;

  /** 总用户-日期数（完成第一步的） */
  totalUserDays: number;
}

/**
 * 仪表盘完整数据类型
 * 包含所有统计信息和 Bot 列表
 */
export interface DashboardData {
  /** 最后更新时间（ISO 8601 格式） */
  lastUpdate: string;

  /** 所有 Bot 的总事件数 */
  totalEvents: number;

  /** 所有 Bot 的总独立用户数 */
  totalUsers: number;

  /** 登录用户统计（可选） */
  loginStats?: LoginStats;

  /** 用户行为漏斗（可选） */
  userFunnel?: UserFunnel;

  /** Bot 交互数据列表 */
  bots: BotInteraction[];
}

/**
 * API 响应类型
 * 用于 /api/refresh 端点的返回值
 */
export interface ApiResponse {
  /** 请求是否成功 */
  success: boolean;

  /** 响应消息（可选） */
  message?: string;

  /** 返回的数据（可选） */
  data?: DashboardData;
}
