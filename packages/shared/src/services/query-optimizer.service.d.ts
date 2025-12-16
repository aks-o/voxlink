export interface QueryMetrics {
    query: string;
    executionTime: number;
    rowsAffected: number;
    timestamp: Date;
    parameters?: any[];
}
export interface IndexSuggestion {
    table: string;
    columns: string[];
    type: 'btree' | 'hash' | 'gin' | 'gist';
    reason: string;
    estimatedImprovement: number;
}
export interface QueryOptimizationResult {
    originalQuery: string;
    optimizedQuery: string;
    estimatedImprovement: number;
    suggestions: string[];
}
export declare class QueryOptimizerService {
    private queryMetrics;
    private slowQueryThreshold;
    private maxMetricsPerQuery;
    private optimizationCache;
    private indexSuggestions;
    /**
     * Record query execution metrics with enhanced tracking
     */
    recordQueryMetrics(metrics: QueryMetrics): void;
    /**
     * Analyze slow query and generate optimization suggestions
     */
    private analyzeSlowQuery;
    /**
     * Report query metrics to performance monitor
     */
    private reportQueryMetrics;
    /**
     * Generate comprehensive index suggestions for a query
     */
    private generateIndexSuggestions;
    /**
     * Get slow queries that need optimization
     */
    getSlowQueries(limit?: number): QueryMetrics[];
    /**
     * Get average execution time for a query
     */
    getAverageExecutionTime(query: string): number;
    /**
     * Suggest database indexes based on query patterns
     */
    suggestIndexes(): IndexSuggestion[];
    /**
     * Optimize a specific query
     */
    optimizeQuery(query: string): QueryOptimizationResult;
    /**
     * Generate database migration for suggested indexes
     */
    generateIndexMigrations(suggestions: IndexSuggestion[]): string[];
    /**
     * Get query performance statistics
     */
    getQueryStats(): {
        totalQueries: number;
        slowQueries: number;
        averageExecutionTime: number;
        topSlowQueries: QueryMetrics[];
    };
    private hashQuery;
    private analyzeQueryPatterns;
    private estimateIndexImprovement;
    private suggestSpecificColumns;
    private isLargeResultQuery;
    private replaceInWithExists;
    private hasImplicitJoins;
    private suggestQuerySpecificIndexes;
}
