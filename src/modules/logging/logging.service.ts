import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import { join } from 'path';

/**
 * Custom logging service untuk tracking metrik skripsi
 * Menggunakan Winston dengan structured logging dan daily rotation
 */
@Injectable()
export class LoggingService implements NestLoggerService {
  private logger: winston.Logger;
  private metricsLogger: winston.Logger;

  constructor() {
    // Format untuk logs aplikasi umum
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    // Transport untuk aplikasi logs
    const appTransport = new DailyRotateFile({
      filename: join('logs', 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    });

    // Transport untuk error logs
    const errorTransport = new DailyRotateFile({
      filename: join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    });

    // Transport untuk metrics logs (untuk analisis skripsi)
    const metricsTransport = new DailyRotateFile({
      filename: join('logs', 'metrics-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '90d', // Keep metrics longer
      format: logFormat,
    });

    // Console transport untuk development
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `[${timestamp}] ${level} ${context ? `[${context}]` : ''}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        }),
      ),
    });

    // Main logger untuk aplikasi
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports: [appTransport, errorTransport, consoleTransport],
    });

    // Dedicated logger untuk metrics
    this.metricsLogger = winston.createLogger({
      level: 'info',
      transports: [metricsTransport, consoleTransport],
    });
  }

  /**
   * Log level: info
   */
  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  /**
   * Log level: error
   */
  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { context, trace, ...meta });
  }

  /**
   * Log level: warn
   */
  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  /**
   * Log level: debug
   */
  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  /**
   * Log level: verbose
   */
  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  // ==================== METRIK UNTUK HIPOTESIS 1 ====================
  /**
   * Log metrik pencarian dan pencocokan proyek
   * Untuk mengukur: waktu pencarian, relevance score, Jaccard similarity
   */
  logProjectMatchingMetrics(data: {
    userId: string;
    userSkills: string[];
    userInterests: string[];
    searchQuery?: string;
    searchStartTime: number;
    searchEndTime: number;
    totalProjects: number;
    matchedProjects: Array<{
      projectId: string;
      projectName: string;
      jaccardScore: number;
      matchedSkills: string[];
      matchedCategories: string[];
    }>;
    topMatchScore?: number;
    avgMatchScore?: number;
  }) {
    const searchDurationMs = data.searchEndTime - data.searchStartTime;
    const searchDurationMinutes = searchDurationMs / (1000 * 60);

    this.metricsLogger.info('PROJECT_MATCHING', {
      metricType: 'project_matching',
      timestamp: new Date().toISOString(),
      userId: data.userId,
      userSkills: data.userSkills,
      userInterests: data.userInterests,
      searchQuery: data.searchQuery,
      searchDurationMs,
      searchDurationMinutes: parseFloat(searchDurationMinutes.toFixed(2)),
      totalProjectsScanned: data.totalProjects,
      matchedProjectsCount: data.matchedProjects.length,
      matchedProjects: data.matchedProjects,
      topMatchScore: data.topMatchScore,
      avgMatchScore: data.avgMatchScore,
      // Metrik untuk hipotesis: apakah < 5 menit?
      meetsTimeGoal: searchDurationMinutes < 5,
      // Metrik untuk hipotesis: apakah relevance > 70%?
      meetsRelevanceGoal: data.topMatchScore && data.topMatchScore >= 0.7,
    });
  }

  /**
   * Log Jaccard similarity calculation detail
   */
  logJaccardCalculation(data: {
    projectId: string;
    projectName: string;
    projectSkills: string[];
    projectCategories: string[];
    userSkills: string[];
    userInterests: string[];
    skillsSimilarity: number;
    categoriesSimilarity: number;
    overallScore: number;
    calculationTimeMs: number;
  }) {
    this.metricsLogger.info('JACCARD_SIMILARITY', {
      metricType: 'jaccard_similarity',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // ==================== METRIK UNTUK HIPOTESIS 2 ====================
  /**
   * Log interaksi mentorship
   */
  logMentorshipInteraction(data: {
    mentorId: string;
    menteeId: string;
    projectId: string;
    interactionType: 'request' | 'accept' | 'reject' | 'message' | 'feedback';
    mentorStatus?: string;
    responseTimeMinutes?: number;
    metadata?: any;
  }) {
    this.metricsLogger.info('MENTORSHIP_INTERACTION', {
      metricType: 'mentorship_interaction',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log milestone tracking activity
   */
  logMilestoneActivity(data: {
    projectId: string;
    milestoneId: string;
    userId: string;
    action: 'create' | 'update' | 'complete' | 'delete';
    milestoneStatus: string;
    progressPercentage?: number;
    daysToComplete?: number;
    metadata?: any;
  }) {
    this.metricsLogger.info('MILESTONE_ACTIVITY', {
      metricType: 'milestone_activity',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log forum/discussion interaction
   */
  logForumInteraction(data: {
    userId: string;
    projectId?: string;
    taskId?: string;
    interactionType: 'comment' | 'reply' | 'message' | 'discussion';
    contentLength?: number;
    responseTimeMinutes?: number;
    metadata?: any;
  }) {
    this.metricsLogger.info('FORUM_INTERACTION', {
      metricType: 'forum_interaction',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log user retention metrics
   * Track aktivitas user untuk mengukur retensi 50% setelah 4 minggu
   */
  logUserRetention(data: {
    userId: string;
    userRole: string;
    accountAge: number; // in days
    lastActiveDate: Date;
    daysSinceLastActive: number;
    totalContributions: number;
    weeklyActiveStatus: boolean;
    projectsJoined: number;
    projectsCompleted: number;
    tasksCompleted: number;
    forumInteractions: number;
    mentorshipSessions: number;
  }) {
    this.metricsLogger.info('USER_RETENTION', {
      metricType: 'user_retention',
      timestamp: new Date().toISOString(),
      ...data,
      // Metrik untuk hipotesis: user aktif setelah 4 minggu?
      retainedAfter4Weeks: data.accountAge >= 28 && data.weeklyActiveStatus,
    });
  }

  // ==================== METRIK UNTUK HIPOTESIS 3 ====================
  /**
   * Log user contribution activity
   */
  logUserContribution(data: {
    userId: string;
    projectId: string;
    contributionType: 'task_complete' | 'code_commit' | 'review' | 'documentation' | 'design';
    taskId?: string;
    complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
    timeSpentMinutes?: number;
    qualityScore?: number;
    metadata?: any;
  }) {
    this.metricsLogger.info('USER_CONTRIBUTION', {
      metricType: 'user_contribution',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log user skill progression (pre/post testing)
   */
  logSkillProgression(data: {
    userId: string;
    skillId: string;
    skillName: string;
    preTestScore?: number;
    postTestScore?: number;
    selfReportedLevel: 'beginner' | 'intermediate' | 'advanced';
    projectsCompleted: number;
    hoursSpent: number;
    improvementPercentage?: number;
    testDate: Date;
  }) {
    this.metricsLogger.info('SKILL_PROGRESSION', {
      metricType: 'skill_progression',
      timestamp: new Date().toISOString(),
      ...data,
      // Metrik untuk hipotesis: improvement >= 25%?
      meetsImprovementGoal: data.improvementPercentage && data.improvementPercentage >= 25,
    });
  }

  /**
   * Log user survey responses (pre/post testing)
   */
  logSurveyResponse(data: {
    userId: string;
    surveyType: 'pre_test' | 'post_test' | 'satisfaction' | 'feedback';
    responses: Record<string, any>;
    skillsAssessed?: string[];
    overallSatisfactionScore?: number; // 1-10
    platformUsageDays?: number;
    metadata?: any;
  }) {
    this.metricsLogger.info('SURVEY_RESPONSE', {
      metricType: 'survey_response',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log portfolio building metrics
   */
  logPortfolioMetrics(data: {
    userId: string;
    totalProjects: number;
    completedProjects: number;
    verifiedProjects: number;
    totalContributions: number;
    skillsAcquired: string[];
    badgesEarned: number;
    testimonialsReceived: number;
    portfolioScore?: number;
    profileCompleteness?: number;
  }) {
    this.metricsLogger.info('PORTFOLIO_METRICS', {
      metricType: 'portfolio_metrics',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // ==================== METRIK PERFORMANCE & API ====================
  /**
   * Log API request/response metrics
   */
  logApiRequest(data: {
    method: string;
    url: string;
    userId?: string;
    statusCode: number;
    responseTimeMs: number;
    requestSize?: number;
    responseSize?: number;
    userAgent?: string;
    errorMessage?: string;
  }) {
    this.metricsLogger.info('API_REQUEST', {
      metricType: 'api_request',
      timestamp: new Date().toISOString(),
      ...data,
      // Flag slow requests (> 1000ms)
      isSlowRequest: data.responseTimeMs > 1000,
    });
  }

  /**
   * Log database query performance
   */
  logDatabaseQuery(data: {
    queryType: string;
    table: string;
    operation: 'select' | 'insert' | 'update' | 'delete';
    executionTimeMs: number;
    rowsAffected?: number;
    isOptimized?: boolean;
  }) {
    this.metricsLogger.info('DATABASE_QUERY', {
      metricType: 'database_query',
      timestamp: new Date().toISOString(),
      ...data,
      // Flag slow queries (> 500ms)
      isSlowQuery: data.executionTimeMs > 500,
    });
  }

  /**
   * Log business events
   */
  logBusinessEvent(data: {
    eventType: string;
    userId?: string;
    projectId?: string;
    organizationId?: string;
    eventData: any;
    impact?: 'high' | 'medium' | 'low';
  }) {
    this.metricsLogger.info('BUSINESS_EVENT', {
      metricType: 'business_event',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log aggregated daily metrics
   */
  logDailyAggregates(data: {
    date: string;
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalProjects: number;
    activeProjects: number;
    newProjects: number;
    totalContributions: number;
    totalForumInteractions: number;
    totalMentorshipSessions: number;
    avgProjectMatchingTime: number;
    avgResponseTime: number;
    errorRate: number;
  }) {
    this.metricsLogger.info('DAILY_AGGREGATES', {
      metricType: 'daily_aggregates',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}
