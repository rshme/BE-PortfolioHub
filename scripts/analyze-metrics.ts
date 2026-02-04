import { MetricsAnalyzer } from '../src/modules/logging/metrics-analyzer.util';

/**
 * Script untuk menganalisis metrics logs dan generate laporan skripsi
 * 
 * Usage:
 * npm run analyze-metrics -- --start=2026-01-01 --end=2026-02-04
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Default: 30 days ago
  let endDate = new Date(); // Default: today

  for (const arg of args) {
    if (arg.startsWith('--start=')) {
      startDate = new Date(arg.split('=')[1]);
    } else if (arg.startsWith('--end=')) {
      endDate = new Date(arg.split('=')[1]);
    }
  }

  console.log('Analyzing metrics from', startDate.toLocaleDateString(), 'to', endDate.toLocaleDateString());
  console.log('\n');

  const analyzer = new MetricsAnalyzer();

  try {
    const report = await analyzer.generateThesisReport(startDate, endDate);
    console.log(report);

    // Optionally save to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'thesis-report.txt');
    fs.writeFileSync(reportPath, report);
    console.log(`\nReport saved to: ${reportPath}`);
  } catch (error) {
    console.error('Error analyzing metrics:', error);
    process.exit(1);
  }
}

main();
