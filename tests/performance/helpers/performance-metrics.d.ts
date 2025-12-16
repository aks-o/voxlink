export interface MetricData {
    [key: string]: any;
}
export interface TestMetrics {
    testName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metrics: MetricData;
}
export declare class PerformanceMetrics {
    private tests;
    private reportDir;
    constructor(reportDir?: string);
    private ensureReportDirectory;
    startTest(testName: string): void;
    endTest(testName: string): void;
    recordMetric(testName: string, metrics: MetricData): void;
    getTestMetrics(testName: string): TestMetrics | undefined;
    getAllMetrics(): TestMetrics[];
    generateReport(reportName: string): string;
    private generateSummary;
    private calculatePerformanceGrade;
    private generateHTMLReport;
    measureExecutionTime<T>(fn: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
    measureMemoryUsage(): NodeJS.MemoryUsage;
    calculateThroughput(requests: number, durationMs: number): number;
    calculatePercentile(values: number[], percentile: number): number;
}
