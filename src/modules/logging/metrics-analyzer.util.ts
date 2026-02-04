import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

/**
 * Utility untuk membaca dan menganalisis metrics logs
 * Membantu dalam proses evaluasi hipotesis skripsi
 */
export class MetricsAnalyzer {
  private logsPath: string;

  constructor(logsPath: string = 'logs') {
    this.logsPath = logsPath;
  }

  /**
   * Baca semua metrics logs dalam rentang waktu tertentu
   */
  async readMetricsLogs(
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    const metricsLogs: any[] = [];
    const logsDir = path.join(process.cwd(), this.logsPath);

    if (!fs.existsSync(logsDir)) {
      console.warn('Logs directory not found');
      return metricsLogs;
    }

    const files = fs
      .readdirSync(logsDir)
      .filter((file) => file.startsWith('metrics-') && file.endsWith('.log'));

    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const fileStream = fs.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        try {
          const logEntry = JSON.parse(line);
          const logDate = new Date(logEntry.timestamp);

          if (logDate >= startDate && logDate <= endDate) {
            metricsLogs.push(logEntry);
          }
        } catch (error) {
          // Skip invalid JSON lines
        }
      }
    }

    return metricsLogs;
  }

  /**
   * HIPOTESIS 1: Analisis project matching metrics
   * Target: Waktu pencarian < 5 menit, Relevance score >= 70%
   */
  async analyzeProjectMatching(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSearches: number;
    avgSearchTimeMinutes: number;
    searchesUnder5Min: number;
    searchesUnder5MinPercentage: number;
    avgTopMatchScore: number;
    matchesAbove70Percent: number;
    matchesAbove70PercentPercentage: number;
    avgMatchedProjectsCount: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);
    const matchingLogs = logs.filter(
      (log) => log.metricType === 'project_matching',
    );

    if (matchingLogs.length === 0) {
      return {
        totalSearches: 0,
        avgSearchTimeMinutes: 0,
        searchesUnder5Min: 0,
        searchesUnder5MinPercentage: 0,
        avgTopMatchScore: 0,
        matchesAbove70Percent: 0,
        matchesAbove70PercentPercentage: 0,
        avgMatchedProjectsCount: 0,
      };
    }

    const totalSearchTime = matchingLogs.reduce(
      (sum, log) => sum + (log.searchDurationMinutes || 0),
      0,
    );
    const searchesUnder5Min = matchingLogs.filter(
      (log) => log.meetsTimeGoal === true,
    ).length;

    const topScores = matchingLogs
      .filter((log) => log.topMatchScore !== undefined)
      .map((log) => log.topMatchScore);
    const avgTopScore =
      topScores.length > 0
        ? topScores.reduce((sum, score) => sum + score, 0) / topScores.length
        : 0;

    const matchesAbove70 = matchingLogs.filter(
      (log) => log.meetsRelevanceGoal === true,
    ).length;

    const totalMatchedProjects = matchingLogs.reduce(
      (sum, log) => sum + (log.matchedProjectsCount || 0),
      0,
    );

    return {
      totalSearches: matchingLogs.length,
      avgSearchTimeMinutes: totalSearchTime / matchingLogs.length,
      searchesUnder5Min,
      searchesUnder5MinPercentage: (searchesUnder5Min / matchingLogs.length) * 100,
      avgTopMatchScore: avgTopScore,
      matchesAbove70Percent: matchesAbove70,
      matchesAbove70PercentPercentage: (matchesAbove70 / matchingLogs.length) * 100,
      avgMatchedProjectsCount: totalMatchedProjects / matchingLogs.length,
    };
  }

  /**
   * HIPOTESIS 2: Analisis collaboration metrics
   * Target: Interaksi forum +60%, Retensi >50% setelah 4 minggu
   */
  async analyzeCollaboration(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalForumInteractions: number;
    totalMilestoneActivities: number;
    totalMentorshipInteractions: number;
    uniqueActiveUsers: number;
    avgMilestoneCompletionDays: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);

    const forumLogs = logs.filter(
      (log) => log.metricType === 'forum_interaction',
    );
    const milestoneLogs = logs.filter(
      (log) => log.metricType === 'milestone_activity',
    );
    const mentorshipLogs = logs.filter(
      (log) => log.metricType === 'mentorship_interaction',
    );

    const uniqueUsers = new Set([
      ...forumLogs.map((log) => log.userId),
      ...milestoneLogs.map((log) => log.userId),
      ...mentorshipLogs.map((log) => log.menteeId),
    ]);

    const completedMilestones = milestoneLogs.filter(
      (log) => log.action === 'complete' && log.daysToComplete,
    );
    const avgCompletionDays =
      completedMilestones.length > 0
        ? completedMilestones.reduce((sum, log) => sum + log.daysToComplete, 0) /
          completedMilestones.length
        : 0;

    return {
      totalForumInteractions: forumLogs.length,
      totalMilestoneActivities: milestoneLogs.length,
      totalMentorshipInteractions: mentorshipLogs.length,
      uniqueActiveUsers: uniqueUsers.size,
      avgMilestoneCompletionDays: avgCompletionDays,
    };
  }

  /**
   * HIPOTESIS 2: Analisis user retention
   * Target: Retensi >50% setelah 4 minggu
   */
  async analyzeRetention(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalUsers: number;
    retainedAfter4Weeks: number;
    retentionRate: number;
    avgDaysSinceLastActive: number;
    weeklyActiveUsers: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);
    const retentionLogs = logs.filter(
      (log) => log.metricType === 'user_retention',
    );

    if (retentionLogs.length === 0) {
      return {
        totalUsers: 0,
        retainedAfter4Weeks: 0,
        retentionRate: 0,
        avgDaysSinceLastActive: 0,
        weeklyActiveUsers: 0,
      };
    }

    const retainedUsers = retentionLogs.filter(
      (log) => log.retainedAfter4Weeks === true,
    ).length;

    const weeklyActive = retentionLogs.filter(
      (log) => log.weeklyActiveStatus === true,
    ).length;

    const totalDaysSinceActive = retentionLogs.reduce(
      (sum, log) => sum + (log.daysSinceLastActive || 0),
      0,
    );

    return {
      totalUsers: retentionLogs.length,
      retainedAfter4Weeks: retainedUsers,
      retentionRate: (retainedUsers / retentionLogs.length) * 100,
      avgDaysSinceLastActive: totalDaysSinceActive / retentionLogs.length,
      weeklyActiveUsers: weeklyActive,
    };
  }

  /**
   * HIPOTESIS 3: Analisis skill progression
   * Target: Improvement score >= 25%
   */
  async analyzeSkillProgression(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalAssessments: number;
    avgImprovementPercentage: number;
    assessmentsAbove25Percent: number;
    assessmentsAbove25PercentPercentage: number;
    avgHoursSpent: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);
    const skillLogs = logs.filter(
      (log) => log.metricType === 'skill_progression',
    );

    if (skillLogs.length === 0) {
      return {
        totalAssessments: 0,
        avgImprovementPercentage: 0,
        assessmentsAbove25Percent: 0,
        assessmentsAbove25PercentPercentage: 0,
        avgHoursSpent: 0,
      };
    }

    const logsWithImprovement = skillLogs.filter(
      (log) => log.improvementPercentage !== undefined,
    );
    const totalImprovement = logsWithImprovement.reduce(
      (sum, log) => sum + log.improvementPercentage,
      0,
    );
    const avgImprovement =
      logsWithImprovement.length > 0
        ? totalImprovement / logsWithImprovement.length
        : 0;

    const above25 = skillLogs.filter(
      (log) => log.meetsImprovementGoal === true,
    ).length;

    const totalHours = skillLogs.reduce(
      (sum, log) => sum + (log.hoursSpent || 0),
      0,
    );

    return {
      totalAssessments: skillLogs.length,
      avgImprovementPercentage: avgImprovement,
      assessmentsAbove25Percent: above25,
      assessmentsAbove25PercentPercentage: (above25 / skillLogs.length) * 100,
      avgHoursSpent: totalHours / skillLogs.length,
    };
  }

  /**
   * Analisis portfolio metrics
   */
  async analyzePortfolio(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalUsers: number;
    avgProjectsPerUser: number;
    avgCompletedProjectsPerUser: number;
    avgContributionsPerUser: number;
    avgBadgesPerUser: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);
    const portfolioLogs = logs.filter(
      (log) => log.metricType === 'portfolio_metrics',
    );

    if (portfolioLogs.length === 0) {
      return {
        totalUsers: 0,
        avgProjectsPerUser: 0,
        avgCompletedProjectsPerUser: 0,
        avgContributionsPerUser: 0,
        avgBadgesPerUser: 0,
      };
    }

    const totals = portfolioLogs.reduce(
      (acc, log) => ({
        projects: acc.projects + (log.totalProjects || 0),
        completed: acc.completed + (log.completedProjects || 0),
        contributions: acc.contributions + (log.totalContributions || 0),
        badges: acc.badges + (log.badgesEarned || 0),
      }),
      { projects: 0, completed: 0, contributions: 0, badges: 0 },
    );

    return {
      totalUsers: portfolioLogs.length,
      avgProjectsPerUser: totals.projects / portfolioLogs.length,
      avgCompletedProjectsPerUser: totals.completed / portfolioLogs.length,
      avgContributionsPerUser: totals.contributions / portfolioLogs.length,
      avgBadgesPerUser: totals.badges / portfolioLogs.length,
    };
  }

  /**
   * Generate comprehensive report untuk skripsi
   */
  async generateThesisReport(
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const projectMatching = await this.analyzeProjectMatching(startDate, endDate);
    const collaboration = await this.analyzeCollaboration(startDate, endDate);
    const retention = await this.analyzeRetention(startDate, endDate);
    const skillProgression = await this.analyzeSkillProgression(startDate, endDate);
    const portfolio = await this.analyzePortfolio(startDate, endDate);

    const report = `
==============================================
LAPORAN METRIK PLATFORM PORTFOLIOHUB
Periode: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
==============================================

HIPOTESIS 1: Project Matching dengan Jaccard Similarity
--------------------------------------------------------
Total Pencarian: ${projectMatching.totalSearches}
Rata-rata Waktu Pencarian: ${projectMatching.avgSearchTimeMinutes.toFixed(2)} menit
Pencarian < 5 menit: ${projectMatching.searchesUnder5Min} (${projectMatching.searchesUnder5MinPercentage.toFixed(1)}%)
TARGET: 100% pencarian < 5 menit
STATUS: ${projectMatching.searchesUnder5MinPercentage >= 90 ? '✓ TERCAPAI' : '✗ BELUM TERCAPAI'}

Rata-rata Top Match Score: ${(projectMatching.avgTopMatchScore * 100).toFixed(1)}%
Matches > 70%: ${projectMatching.matchesAbove70Percent} (${projectMatching.matchesAbove70PercentPercentage.toFixed(1)}%)
TARGET: Relevansi >= 70%
STATUS: ${projectMatching.avgTopMatchScore >= 0.7 ? '✓ TERCAPAI' : '✗ BELUM TERCAPAI'}

Rata-rata Proyek Matched: ${projectMatching.avgMatchedProjectsCount.toFixed(1)}

HIPOTESIS 2: Mentorship & Collaboration
-----------------------------------------
Total Interaksi Forum: ${collaboration.totalForumInteractions}
Total Aktivitas Milestone: ${collaboration.totalMilestoneActivities}
Total Sesi Mentorship: ${collaboration.totalMentorshipInteractions}
User Aktif Unik: ${collaboration.uniqueActiveUsers}
Rata-rata Hari Penyelesaian Milestone: ${collaboration.avgMilestoneCompletionDays.toFixed(1)}

User Retention Analysis:
Total Users Tracked: ${retention.totalUsers}
Retained After 4 Weeks: ${retention.retainedAfter4Weeks} (${retention.retentionRate.toFixed(1)}%)
TARGET: Retensi > 50% setelah 4 minggu
STATUS: ${retention.retentionRate >= 50 ? '✓ TERCAPAI' : '✗ BELUM TERCAPAI'}

Weekly Active Users: ${retention.weeklyActiveUsers}
Rata-rata Days Since Last Active: ${retention.avgDaysSinceLastActive.toFixed(1)} hari

HIPOTESIS 3: Skill Progression & Portfolio Building
-----------------------------------------------------
Total Assessments: ${skillProgression.totalAssessments}
Rata-rata Improvement: ${skillProgression.avgImprovementPercentage.toFixed(1)}%
Assessments > 25% Improvement: ${skillProgression.assessmentsAbove25Percent} (${skillProgression.assessmentsAbove25PercentPercentage.toFixed(1)}%)
TARGET: Minimal 25% improvement
STATUS: ${skillProgression.avgImprovementPercentage >= 25 ? '✓ TERCAPAI' : '✗ BELUM TERCAPAI'}

Rata-rata Hours Spent: ${skillProgression.avgHoursSpent.toFixed(1)} jam

Portfolio Metrics:
Total Users dengan Portfolio: ${portfolio.totalUsers}
Rata-rata Projects per User: ${portfolio.avgProjectsPerUser.toFixed(1)}
Rata-rata Completed Projects: ${portfolio.avgCompletedProjectsPerUser.toFixed(1)}
Rata-rata Contributions: ${portfolio.avgContributionsPerUser.toFixed(1)}
Rata-rata Badges Earned: ${portfolio.avgBadgesPerUser.toFixed(1)}

==============================================
KESIMPULAN
==============================================
Hipotesis 1 (Project Matching): ${projectMatching.searchesUnder5MinPercentage >= 90 && projectMatching.avgTopMatchScore >= 0.7 ? '✓ TERBUKTI' : '✗ PERLU PERBAIKAN'}
Hipotesis 2 (Retention): ${retention.retentionRate >= 50 ? '✓ TERBUKTI' : '✗ PERLU PERBAIKAN'}
Hipotesis 3 (Skill Progression): ${skillProgression.avgImprovementPercentage >= 25 ? '✓ TERBUKTI' : '✗ PERLU PERBAIKAN'}

==============================================
`;

    return report;
  }
}

// Export untuk digunakan dalam script analisis
export default MetricsAnalyzer;
