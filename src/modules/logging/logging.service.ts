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

  // ==================== METRIK UNTUK HIPOTESIS 1: Search Efficiency ====================
  /**
   * Log metrik pencarian dan pencocokan proyek
   * Target: Waktu < 5 menit, Similarity score >= 60%, Min 1 proyek relevan
   * Dapat diukur dalam first session (2-3 hari testing)
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
      // H1a: Waktu pencarian < 5 menit
      meetsTimeGoal: searchDurationMinutes < 5,
      // H1b: Similarity score >= 60% untuk top recommendations
      meetsRelevanceGoal: data.topMatchScore && data.topMatchScore >= 0.6,
      // H1c: User menemukan minimal 1 proyek relevan (score >= 60%)
      hasRelevantMatch: data.matchedProjects.some(p => p.jaccardScore >= 0.6),
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

  // ==================== METRIK UNTUK HIPOTESIS 2: Platform Usability ====================
  /**
   * Log task completion untuk mengukur completion rate
   * Target H2a: Task completion rate >= 75%
   */
  logTaskCompletion(data: {
    userId: string;
    taskId: string;
    projectId: string;
    taskTitle: string;
    completionStatus: 'completed' | 'abandoned' | 'in_progress';
    timeSpentMinutes: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  }) {
    this.metricsLogger.info('TASK_COMPLETION', {
      metricType: 'task_completion',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log task comments untuk mengukur engagement
   * Target H2b: >= 2 comments per task
   */
  logTaskComment(data: {
    userId: string;
    taskId: string;
    projectId: string;
    commentLength: number;
    isReply: boolean;
    commentType: 'question' | 'update' | 'help' | 'feedback';
  }) {
    this.metricsLogger.info('TASK_COMMENT', {
      metricType: 'task_comment',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log interaksi mentorship (optional feature)
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
   * Log platform usability metrics (SUS score, satisfaction)
   * Target H2d: SUS score >= 70
   */
  logUsabilityMetrics(data: {
    userId: string;
    susScore?: number; // System Usability Scale (0-100)
    satisfactionScore?: number; // 1-10 scale
    easeOfUse?: number; // 1-10 scale
    learnability?: number; // 1-10 scale
    efficiency?: number; // 1-10 scale
    taskSuccessRate?: number; // percentage
    errorCount?: number;
    helpRequestCount?: number;
    feedbackComments?: string;
  }) {
    this.metricsLogger.info('USABILITY_METRICS', {
      metricType: 'usability_metrics',
      timestamp: new Date().toISOString(),
      ...data,
      // H2d: SUS score >= 70 (acceptable usability)
      meetsUsabilityGoal: data.susScore && data.susScore >= 70,
    });
  }

  /**
   * Log session activity untuk tracking engagement dalam testing period
   */
  logSessionActivity(data: {
    userId: string;
    sessionDuration: number; // minutes
    pagesVisited: number;
    featuresUsed: string[];
    tasksAttempted: number;
    tasksCompleted: number;
    errorEncountered: boolean;
    needsHelp: boolean;
  }) {
    this.metricsLogger.info('SESSION_ACTIVITY', {
      metricType: 'session_activity',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  // ==================== METRIK UNTUK HIPOTESIS 3: Portfolio Building Effectiveness ====================
  /**
   * Log user contribution activity
   * Target H3a: 80% users complete minimal 1 verified contribution
   * Target H3b: Rata-rata 2 portfolio items per user dalam 2-3 hari
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
   * Log testimonial activity untuk portfolio credibility
   * Target H3c: 60% users give/receive testimonials
   */
  logTestimonialActivity(data: {
    userId: string;
    testimonialId: string;
    activityType: 'given' | 'received';
    projectId: string;
    rating?: number;
    relationshipType?: string;
  }) {
    this.metricsLogger.info('TESTIMONIAL_ACTIVITY', {
      metricType: 'testimonial_activity',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log user survey responses (baseline, post-test, usability)
   */
  logSurveyResponse(data: {
    userId: string;
    surveyType: 'baseline' | 'post_test' | 'usability' | 'satisfaction';
    responses: Record<string, any>;
    susScore?: number; // System Usability Scale
    satisfactionScore?: number; // 1-10
    recommendationLikelihood?: number; // NPS: 0-10
    perceivedUsefulness?: number; // 1-10
    perceivedEaseOfUse?: number; // 1-10
    testingDuration?: number; // hours
    metadata?: any;
  }) {
    this.metricsLogger.info('SURVEY_RESPONSE', {
      metricType: 'survey_response',
      timestamp: new Date().toISOString(),
      ...data,
    });
  }

  /**
   * Log portfolio building metrics (snapshot during testing)
   * Measures immediate effectiveness of portfolio features
   */
  logPortfolioMetrics(data: {
    userId: string;
    portfolioItemsCount: number; // completed tasks/contributions
    verifiedContributions: number;
    testimonialsReceived: number;
    testimonialsGiven: number;
    badgesEarned: number;
    profileCompleteness: number; // percentage
    portfolioSatisfaction?: number; // 1-10 scale
  }) {
    this.metricsLogger.info('PORTFOLIO_METRICS', {
      metricType: 'portfolio_metrics',
      timestamp: new Date().toISOString(),
      ...data,
      // H3a: At least 1 verified contribution
      hasVerifiedContribution: data.verifiedContributions >= 1,
      // H3b: Average 2 portfolio items
      meetsPortfolioItemsGoal: data.portfolioItemsCount >= 2,
      // H3c: Has testimonial activity
      hasTestimonialActivity: (data.testimonialsGiven + data.testimonialsReceived) > 0,
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
