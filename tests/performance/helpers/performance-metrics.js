"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMetrics = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PerformanceMetrics {
    constructor(reportDir = 'coverage/performance-reports') {
        this.tests = new Map();
        this.reportDir = reportDir;
        this.ensureReportDirectory();
    }
    ensureReportDirectory() {
        if (!fs_1.default.existsSync(this.reportDir)) {
            fs_1.default.mkdirSync(this.reportDir, { recursive: true });
        }
    }
    startTest(testName) {
        this.tests.set(testName, {
            testName,
            startTime: Date.now(),
            metrics: {},
        });
    }
    endTest(testName) {
        const test = this.tests.get(testName);
        if (test) {
            test.endTime = Date.now();
            test.duration = test.endTime - test.startTime;
        }
    }
    recordMetric(testName, metrics) {
        const test = this.tests.get(testName);
        if (test) {
            test.metrics = { ...test.metrics, ...metrics };
            // Auto-end test if not already ended
            if (!test.endTime) {
                this.endTest(testName);
            }
        }
    }
    getTestMetrics(testName) {
        return this.tests.get(testName);
    }
    getAllMetrics() {
        return Array.from(this.tests.values());
    }
    generateReport(reportName) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path_1.default.join(this.reportDir, `${reportName}-${timestamp}.json`);
        const report = {
            reportName,
            timestamp: new Date().toISOString(),
            summary: this.generateSummary(),
            tests: this.getAllMetrics(),
        };
        fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        // Also generate HTML report
        this.generateHTMLReport(report, reportName, timestamp);
        console.log(`📊 Performance report generated: ${reportPath}`);
        return reportPath;
    }
    generateSummary() {
        const tests = this.getAllMetrics();
        const totalTests = tests.length;
        const totalDuration = tests.reduce((sum, test) => sum + (test.duration || 0), 0);
        const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;
        // Calculate performance statistics
        const responseTimeMetrics = tests
            .map(test => test.metrics.averageResponseTime)
            .filter(time => typeof time === 'number');
        const averageResponseTime = responseTimeMetrics.length > 0
            ? responseTimeMetrics.reduce((sum, time) => sum + time, 0) / responseTimeMetrics.length
            : 0;
        const maxResponseTime = responseTimeMetrics.length > 0
            ? Math.max(...responseTimeMetrics)
            : 0;
        const minResponseTime = responseTimeMetrics.length > 0
            ? Math.min(...responseTimeMetrics)
            : 0;
        return {
            totalTests,
            totalDuration,
            averageDuration,
            averageResponseTime,
            maxResponseTime,
            minResponseTime,
            performanceGrade: this.calculatePerformanceGrade(averageResponseTime, maxResponseTime),
        };
    }
    calculatePerformanceGrade(avgResponseTime, maxResponseTime) {
        if (avgResponseTime < 100 && maxResponseTime < 500)
            return 'A';
        if (avgResponseTime < 300 && maxResponseTime < 1000)
            return 'B';
        if (avgResponseTime < 500 && maxResponseTime < 2000)
            return 'C';
        if (avgResponseTime < 1000 && maxResponseTime < 5000)
            return 'D';
        return 'F';
    }
    generateHTMLReport(report, reportName, timestamp) {
        const htmlPath = path_1.default.join(this.reportDir, `${reportName}-${timestamp}.html`);
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Report - ${reportName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { font-size: 14px; color: #666; margin-top: 5px; }
        .grade { font-size: 36px; font-weight: bold; }
        .grade-A { color: #28a745; }
        .grade-B { color: #17a2b8; }
        .grade-C { color: #ffc107; }
        .grade-D { color: #fd7e14; }
        .grade-F { color: #dc3545; }
        .test-results { margin-top: 30px; }
        .test-item { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 6px; }
        .test-name { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
        .test-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .test-metric { font-size: 14px; }
        .test-metric strong { color: #007bff; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Performance Test Report</h1>
            <h2>${reportName}</h2>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${report.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(report.summary.averageResponseTime)}ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(report.summary.maxResponseTime)}ms</div>
                <div class="metric-label">Max Response Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value grade grade-${report.summary.performanceGrade}">${report.summary.performanceGrade}</div>
                <div class="metric-label">Performance Grade</div>
            </div>
        </div>
        
        <div class="test-results">
            <h3>Test Results</h3>
            ${report.tests.map((test) => `
                <div class="test-item">
                    <div class="test-name">${test.testName}</div>
                    <div class="test-metrics">
                        <div class="test-metric">Duration: <strong>${test.duration || 0}ms</strong></div>
                        ${Object.entries(test.metrics).map(([key, value]) => `
                            <div class="test-metric">${key}: <strong>${typeof value === 'number' ? Math.round(value) : value}</strong></div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
        fs_1.default.writeFileSync(htmlPath, html);
        console.log(`📊 HTML Performance report generated: ${htmlPath}`);
    }
    // Utility methods for common performance measurements
    measureExecutionTime(fn) {
        return new Promise(async (resolve) => {
            const startTime = Date.now();
            const result = await fn();
            const duration = Date.now() - startTime;
            resolve({ result, duration });
        });
    }
    measureMemoryUsage() {
        return process.memoryUsage();
    }
    calculateThroughput(requests, durationMs) {
        return (requests / durationMs) * 1000; // requests per second
    }
    calculatePercentile(values, percentile) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }
}
exports.PerformanceMetrics = PerformanceMetrics;
