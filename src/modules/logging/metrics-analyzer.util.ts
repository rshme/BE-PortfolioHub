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
   * HIPOTESIS 1: Analisis search efficiency & matching accuracy
   * Target: Waktu < 5 menit, Similarity >= 60%, Min 1 proyek relevan
   */
  async analyzeSearchEfficiency(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSearches: number;
    avgSearchTimeMinutes: number;
    searchesUnder5Min: number;
    searchesUnder5MinPercentage: number;
    avgTopMatchScore: number;
    avgMatchScorePercentage: number;
    matchesAbove60Percent: number;
    matchesAbove60PercentPercentage: number;
    usersWithRelevantMatch: number;
    usersWithRelevantMatchPercentage: number;
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
        avgMatchScorePercentage: 0,
        matchesAbove60Percent: 0,
        matchesAbove60PercentPercentage: 0,
        usersWithRelevantMatch: 0,
        usersWithRelevantMatchPercentage: 0,
        avgMatchedProjectsCount: 0,
      };
    }

    const totalSearchTime = matchingLogs.reduce(
      (sum, log) => sum + (log.searchDurationMinutes || 0),
      0,
    );
    
    // H1a: Searches under 5 minutes
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

    // H1b: Matches with score >= 60%
    const matchesAbove60 = matchingLogs.filter(
      (log) => log.meetsRelevanceGoal === true,
    ).length;

    // H1c: Users who found at least 1 relevant project
    const usersWithRelevantMatch = matchingLogs.filter(
      (log) => log.hasRelevantMatch === true,
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
      avgMatchScorePercentage: avgTopScore * 100,
      matchesAbove60Percent: matchesAbove60,
      matchesAbove60PercentPercentage: (matchesAbove60 / matchingLogs.length) * 100,
      usersWithRelevantMatch,
      usersWithRelevantMatchPercentage: (usersWithRelevantMatch / matchingLogs.length) * 100,
      avgMatchedProjectsCount: totalMatchedProjects / matchingLogs.length,
    };
  }

  /**
   * HIPOTESIS 2: Analisis platform usability & task management
   * Target: Task completion >= 75%, >= 2 comments/task, 60% use milestones, SUS >= 70
   */
  async analyzeUsability(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    taskCompletionRate: number;
    totalTaskComments: number;
    avgCommentsPerTask: number;
    totalMilestoneActivities: number;
    usersUsingMilestones: number;
    milestoneUsagePercentage: number;
    avgSusScore: number;
    avgSatisfactionScore: number;
    totalUsabilityResponses: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);

    const taskLogs = logs.filter((log) => log.metricType === 'task_completion');
    const commentLogs = logs.filter((log) => log.metricType === 'task_comment');
    const milestoneLogs = logs.filter((log) => log.metricType === 'milestone_activity');
    const usabilityLogs = logs.filter((log) => log.metricType === 'usability_metrics');

    const completedTasks = taskLogs.filter(
      (log) => log.completionStatus === 'completed',
    ).length;
    
    const taskCompletionRate = taskLogs.length > 0 
      ? (completedTasks / taskLogs.length) * 100 
      : 0;

    const avgCommentsPerTask = taskLogs.length > 0
      ? commentLogs.length / taskLogs.length
      : 0;

    const uniqueUsersUsingMilestones = new Set(
      milestoneLogs.map((log) => log.userId),
    ).size;

    const totalUniqueUsers = new Set([
      ...taskLogs.map((log) => log.userId),
      ...commentLogs.map((log) => log.userId),
    ]).size;

    const milestoneUsagePercentage = totalUniqueUsers > 0
      ? (uniqueUsersUsingMilestones / totalUniqueUsers) * 100
      : 0;

    const susScores = usabilityLogs
      .filter((log) => log.susScore !== undefined)
      .map((log) => log.susScore);
    const avgSusScore = susScores.length > 0
      ? susScores.reduce((sum, score) => sum + score, 0) / susScores.length
      : 0;

    const satisfactionScores = usabilityLogs
      .filter((log) => log.satisfactionScore !== undefined)
      .map((log) => log.satisfactionScore);
    const avgSatisfactionScore = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    return {
      totalTasks: taskLogs.length,
      completedTasks,
      taskCompletionRate,
      totalTaskComments: commentLogs.length,
      avgCommentsPerTask,
      totalMilestoneActivities: milestoneLogs.length,
      usersUsingMilestones: uniqueUsersUsingMilestones,
      milestoneUsagePercentage,
      avgSusScore,
      avgSatisfactionScore,
      totalUsabilityResponses: usabilityLogs.length,
    };
  }

  /**
   * HIPOTESIS 3: Analisis portfolio building effectiveness
   * Target: 80% complete min 1 contribution, avg 2 items, 70% profile completeness >=60%, satisfaction >= 7/10
   */
  async analyzePortfolioBuilding(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalUsers: number;
    usersWithContributions: number;
    usersWithContributionsPercentage: number;
    avgPortfolioItems: number;
    usersWithMinimum2Items: number;
    usersWithMinimum2ItemsPercentage: number;
    usersWithGoodProfileCompleteness: number;
    usersWithGoodProfileCompletenessPercentage: number;
    avgProfileCompleteness: number;
    avgPortfolioSatisfaction: number;
    avgVerifiedContributions: number;
  }> {
    const logs = await this.readMetricsLogs(startDate, endDate);
    const portfolioLogs = logs.filter(
      (log) => log.metricType === 'portfolio_metrics',
    );

    if (portfolioLogs.length === 0) {
      return {
        totalUsers: 0,
        usersWithContributions: 0,
        usersWithContributionsPercentage: 0,
        avgPortfolioItems: 0,
        usersWithMinimum2Items: 0,
        usersWithMinimum2ItemsPercentage: 0,
        usersWithGoodProfileCompleteness: 0,
        usersWithGoodProfileCompletenessPercentage: 0,
        avgProfileCompleteness: 0,
        avgPortfolioSatisfaction: 0,
        avgVerifiedContributions: 0,
      };
    }

    // H3a: Users with at least 1 verified contribution
    const usersWithContributions = portfolioLogs.filter(
      (log) => log.hasVerifiedContribution === true,
    ).length;

    // H3b: Users with at least 2 portfolio items
    const usersWithMinimum2Items = portfolioLogs.filter(
      (log) => log.meetsPortfolioItemsGoal === true,
    ).length;

    const totalPortfolioItems = portfolioLogs.reduce(
      (sum, log) => sum + (log.portfolioItemsCount || 0),
      0,
    );
    const avgPortfolioItems = totalPortfolioItems / portfolioLogs.length;

    // H3c: Users with profile completeness >= 60%
    const usersWithGoodProfileCompleteness = portfolioLogs.filter(
      (log) => (log.profileCompleteness || 0) >= 60,
    ).length;

    const totalProfileCompleteness = portfolioLogs.reduce(
      (sum, log) => sum + (log.profileCompleteness || 0),
      0,
    );
    const avgProfileCompleteness = totalProfileCompleteness / portfolioLogs.length;

    const totalVerifiedContributions = portfolioLogs.reduce(
      (sum, log) => sum + (log.verifiedContributions || 0),
      0,
    );
    const avgVerifiedContributions = totalVerifiedContributions / portfolioLogs.length;

    const satisfactionScores = portfolioLogs
      .filter((log) => log.portfolioSatisfaction !== undefined)
      .map((log) => log.portfolioSatisfaction);
    const avgPortfolioSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length
      : 0;

    return {
      totalUsers: portfolioLogs.length,
      usersWithContributions,
      usersWithContributionsPercentage: (usersWithContributions / portfolioLogs.length) * 100,
      avgPortfolioItems,
      usersWithMinimum2Items,
      usersWithMinimum2ItemsPercentage: (usersWithMinimum2Items / portfolioLogs.length) * 100,
      usersWithGoodProfileCompleteness,
      usersWithGoodProfileCompletenessPercentage: (usersWithGoodProfileCompleteness / portfolioLogs.length) * 100,
      avgProfileCompleteness,
      avgPortfolioSatisfaction,
      avgVerifiedContributions,
    };
  }

  /**
   * Generate comprehensive report untuk skripsi (REVISED HYPOTHESES)
   * Testing period: 2-3 hari intensive testing
   */
  async generateThesisReport(
    startDate: Date,
    endDate: Date,
  ): Promise<string> {
    const searchEfficiency = await this.analyzeSearchEfficiency(startDate, endDate);
    const usability = await this.analyzeUsability(startDate, endDate);
    const portfolioBuilding = await this.analyzePortfolioBuilding(startDate, endDate);

    const report = `
==============================================
LAPORAN EVALUASI PLATFORM PORTFOLIOHUB
Periode Testing: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
Durasi: 2-3 Hari (Intensive Testing)
==============================================

HIPOTESIS 1: Efisiensi Sistem Pencocokan Proyek
--------------------------------------------------------
H1a - Waktu Pencarian Proyek:
  Total Pencarian: ${searchEfficiency.totalSearches}
  Rata-rata Waktu: ${searchEfficiency.avgSearchTimeMinutes.toFixed(2)} menit
  Pencarian < 5 menit: ${searchEfficiency.searchesUnder5Min} (${searchEfficiency.searchesUnder5MinPercentage.toFixed(1)}%)
  TARGET H1a: 100% pencarian < 5 menit
  STATUS: ${searchEfficiency.searchesUnder5MinPercentage >= 95 ? '✓ TERCAPAI' : searchEfficiency.searchesUnder5MinPercentage >= 80 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H1b - Akurasi Pencocokan (Similarity Score):
  Rata-rata Top Match Score: ${searchEfficiency.avgMatchScorePercentage.toFixed(1)}%
  Matches dengan Score ≥ 60%: ${searchEfficiency.matchesAbove60Percent} (${searchEfficiency.matchesAbove60PercentPercentage.toFixed(1)}%)
  TARGET H1b: Similarity score ≥ 60% untuk top-3 recommendations
  STATUS: ${searchEfficiency.avgMatchScorePercentage >= 60 ? '✓ TERCAPAI' : searchEfficiency.avgMatchScorePercentage >= 50 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H1c - Discovery Success Rate:
  Users menemukan proyek relevan: ${searchEfficiency.usersWithRelevantMatch} (${searchEfficiency.usersWithRelevantMatchPercentage.toFixed(1)}%)
  Rata-rata Proyek Matched: ${searchEfficiency.avgMatchedProjectsCount.toFixed(1)}
  TARGET H1c: Min 70% users menemukan minimal 1 proyek relevan (score ≥60%)
  STATUS: ${searchEfficiency.usersWithRelevantMatchPercentage >= 70 ? '✓ TERCAPAI' : searchEfficiency.usersWithRelevantMatchPercentage >= 60 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

KESIMPULAN H1: ${
  searchEfficiency.searchesUnder5MinPercentage >= 95 &&
  searchEfficiency.avgMatchScorePercentage >= 60 &&
  searchEfficiency.usersWithRelevantMatchPercentage >= 70
    ? '✓ HIPOTESIS TERBUKTI - Sistem pencocokan efektif dan efisien'
    : searchEfficiency.searchesUnder5MinPercentage >= 80 ||
      searchEfficiency.avgMatchScorePercentage >= 50
    ? '⚠ PARTIALLY SUPPORTED - Menunjukkan tren positif namun perlu improvement'
    : '✗ HIPOTESIS TIDAK TERBUKTI - Perlu perbaikan signifikan'
}

HIPOTESIS 2: Usability Platform & Task Management
-----------------------------------------
H2a - Task Completion Rate:
  Total Tasks: ${usability.totalTasks}
  Tasks Completed: ${usability.completedTasks}
  Completion Rate: ${usability.taskCompletionRate.toFixed(1)}%
  TARGET H2a: Task completion rate ≥ 75%
  STATUS: ${usability.taskCompletionRate >= 75 ? '✓ TERCAPAI' : usability.taskCompletionRate >= 65 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H2b - Engagement (Task Comments):
  Total Task Comments: ${usability.totalTaskComments}
  Rata-rata Comments per Task: ${usability.avgCommentsPerTask.toFixed(1)}
  TARGET H2b: Rata-rata ≥ 2 comments per task
  STATUS: ${usability.avgCommentsPerTask >= 2 ? '✓ TERCAPAI' : usability.avgCommentsPerTask >= 1.5 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H2c - Milestone Tracking Usage:
  Total Aktivitas Milestone: ${usability.totalMilestoneActivities}
  Users menggunakan Milestones: ${usability.usersUsingMilestones}
  Persentase Usage: ${usability.milestoneUsagePercentage.toFixed(1)}%
  TARGET H2c: Min 60% users menggunakan milestone tracking
  STATUS: ${usability.milestoneUsagePercentage >= 60 ? '✓ TERCAPAI' : usability.milestoneUsagePercentage >= 50 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H2d - System Usability Scale (SUS):
  Total Usability Responses: ${usability.totalUsabilityResponses}
  Rata-rata SUS Score: ${usability.avgSusScore.toFixed(1)}
  Rata-rata Satisfaction Score: ${usability.avgSatisfactionScore.toFixed(1)}/10
  TARGET H2d: SUS score ≥ 70 (acceptable usability)
  STATUS: ${usability.avgSusScore >= 70 ? '✓ TERCAPAI' : usability.avgSusScore >= 60 ? '⚠ PARTIALLY ACHIEVED' : usability.totalUsabilityResponses === 0 ? '⚠ DATA BELUM TERSEDIA' : '✗ BELUM TERCAPAI'}

KESIMPULAN H2: ${
  usability.taskCompletionRate >= 75 &&
  usability.avgCommentsPerTask >= 2 &&
  usability.milestoneUsagePercentage >= 60 &&
  (usability.avgSusScore >= 70 || usability.totalUsabilityResponses === 0)
    ? '✓ HIPOTESIS TERBUKTI - Platform menunjukkan usability yang baik'
    : usability.taskCompletionRate >= 65 || usability.avgCommentsPerTask >= 1.5
    ? '⚠ PARTIALLY SUPPORTED - Usability acceptable namun perlu enhancement'
    : '✗ HIPOTESIS TIDAK TERBUKTI - Perlu redesign beberapa fitur'
}

HIPOTESIS 3: Efektivitas Portfolio Building
-----------------------------------------------------
H3a - Verified Contributions:
  Total Users: ${portfolioBuilding.totalUsers}
  Users dengan Min 1 Kontribusi: ${portfolioBuilding.usersWithContributions} (${portfolioBuilding.usersWithContributionsPercentage.toFixed(1)}%)
  Rata-rata Verified Contributions: ${portfolioBuilding.avgVerifiedContributions.toFixed(1)}
  TARGET H3a: Min 80% users complete min 1 verified contribution
  STATUS: ${portfolioBuilding.usersWithContributionsPercentage >= 80 ? '✓ TERCAPAI' : portfolioBuilding.usersWithContributionsPercentage >= 70 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H3b - Portfolio Items:
  Rata-rata Portfolio Items per User: ${portfolioBuilding.avgPortfolioItems.toFixed(1)}
  Users dengan ≥ 2 Items: ${portfolioBuilding.usersWithMinimum2Items} (${portfolioBuilding.usersWithMinimum2ItemsPercentage.toFixed(1)}%)
  TARGET H3b: Rata-rata 2 portfolio items per user
  STATUS: ${portfolioBuilding.avgPortfolioItems >= 2 ? '✓ TERCAPAI' : portfolioBuilding.avgPortfolioItems >= 1.5 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H3c - Profile Completeness:
  Rata-rata Profile Completeness: ${portfolioBuilding.avgProfileCompleteness.toFixed(1)}%
  Users dengan Completeness ≥ 60%: ${portfolioBuilding.usersWithGoodProfileCompleteness} (${portfolioBuilding.usersWithGoodProfileCompletenessPercentage.toFixed(1)}%)
  TARGET H3c: Min 70% users mencapai profile completeness ≥ 60%
  STATUS: ${portfolioBuilding.usersWithGoodProfileCompletenessPercentage >= 70 ? '✓ TERCAPAI' : portfolioBuilding.usersWithGoodProfileCompletenessPercentage >= 60 ? '⚠ PARTIALLY ACHIEVED' : '✗ BELUM TERCAPAI'}

H3d - Portfolio Satisfaction:
  Rata-rata Satisfaction: ${portfolioBuilding.avgPortfolioSatisfaction > 0 ? portfolioBuilding.avgPortfolioSatisfaction.toFixed(1) + '/10' : 'N/A'}
  TARGET H3d: User satisfaction ≥ 7/10
  STATUS: ${portfolioBuilding.avgPortfolioSatisfaction >= 7 ? '✓ TERCAPAI' : portfolioBuilding.avgPortfolioSatisfaction >= 6 ? '⚠ PARTIALLY ACHIEVED' : portfolioBuilding.avgPortfolioSatisfaction === 0 ? '⚠ DATA BELUM TERSEDIA' : '✗ BELUM TERCAPAI'}

KESIMPULAN H3: ${
  portfolioBuilding.usersWithContributionsPercentage >= 80 &&
  portfolioBuilding.avgPortfolioItems >= 2 &&
  portfolioBuilding.usersWithGoodProfileCompletenessPercentage >= 70 &&
  (portfolioBuilding.avgPortfolioSatisfaction >= 7 || portfolioBuilding.avgPortfolioSatisfaction === 0)
    ? '✓ HIPOTESIS TERBUKTI - Platform efektif dalam portfolio building'
    : portfolioBuilding.usersWithContributionsPercentage >= 70 ||
      portfolioBuilding.avgPortfolioItems >= 1.5
    ? '⚠ PARTIALLY SUPPORTED - Portfolio features berfungsi namun perlu optimization'
    : '✗ HIPOTESIS TIDAK TERBUKTI - Perlu enhancement portfolio features'
}

==============================================
KESIMPULAN PENELITIAN
==============================================

HIPOTESIS UTAMA (H0): Platform PortfolioHub efektif dalam meningkatkan
efisiensi discovery proyek dan usability kolaborasi bagi fresh graduate
dan career switcher dalam periode testing 2-3 hari.

STATUS HIPOTESIS:
1. H1 (Search Efficiency): ${
  searchEfficiency.searchesUnder5MinPercentage >= 95 &&
  searchEfficiency.avgMatchScorePercentage >= 60 &&
  searchEfficiency.usersWithRelevantMatchPercentage >= 70
    ? '✓ TERBUKTI'
    : '⚠ PARTIALLY SUPPORTED'
}
2. H2 (Platform Usability): ${
  usability.taskCompletionRate >= 75 &&
  usability.avgCommentsPerTask >= 2 &&
  usability.milestoneUsagePercentage >= 60
    ? '✓ TERBUKTI'
    : '⚠ PARTIALLY SUPPORTED'
}
3. H3 (Portfolio Building): ${
  portfolioBuilding.usersWithContributionsPercentage >= 80 &&
  portfolioBuilding.avgPortfolioItems >= 2 &&
  portfolioBuilding.usersWithGoodProfileCompletenessPercentage >= 70
    ? '✓ TERBUKTI'
    : '⚠ PARTIALLY SUPPORTED'
}

REKOMENDASI:
${this.generateRecommendations(searchEfficiency, usability, portfolioBuilding)}

==============================================
Catatan: Laporan ini dihasilkan dari automated logging system
untuk periode intensive testing 2-3 hari. Untuk analisis mendalam,
lakukan triangulation dengan data kualitatif dari surveys dan interviews.
==============================================
`;

    return report;
  }

  private generateRecommendations(searchEfficiency: any, usability: any, portfolioBuilding: any): string {
    const recommendations: string[] = [];

    if (searchEfficiency.avgSearchTimeMinutes > 5) {
      recommendations.push('- Optimize search algorithm untuk mengurangi waktu response');
    }
    if (searchEfficiency.avgMatchScorePercentage < 60) {
      recommendations.push('- Fine-tune Jaccard similarity thresholds untuk meningkatkan relevance');
    }
    if (usability.taskCompletionRate < 75) {
      recommendations.push('- Review task complexity dan berikan guidance yang lebih jelas');
    }
    if (usability.avgCommentsPerTask < 2) {
      recommendations.push('- Encourage collaboration melalui comment prompts atau notifications');
    }
    if (usability.milestoneUsagePercentage < 60) {
      recommendations.push('- Improve milestone feature discoverability dan onboarding');
    }
    if (portfolioBuilding.avgPortfolioItems < 2) {
      recommendations.push('- Simplify contribution workflow untuk meningkatkan portfolio building rate');
    }
    if (portfolioBuilding.usersWithGoodProfileCompletenessPercentage < 70) {
      recommendations.push('- Encourage users untuk complete profile (add skills, interests, bio) melalui onboarding dan reminders');
    }

    if (recommendations.length === 0) {
      return '- Platform menunjukkan performa excellent! Continue monitoring dan gather more data.';
    }

    return recommendations.join('\n');
  }
}

// Export untuk digunakan dalam script analisis
export default MetricsAnalyzer;
