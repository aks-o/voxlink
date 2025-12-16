"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizerService = void 0;
const logger_1 = require("../monitoring/logger");
const performance_monitor_service_1 = require("./performance-monitor.service");
class QueryOptimizerService {
    constructor() {
        this.queryMetrics = new Map();
        this.slowQueryThreshold = 1000; // 1 second
        this.maxMetricsPerQuery = 100;
        this.optimizationCache = new Map();
        this.indexSuggestions = new Map();
    }
    /**
     * Record query execution metrics with enhanced tracking
     */
    recordQueryMetrics(metrics) {
        const queryHash = this.hashQuery(metrics.query);
        if (!this.queryMetrics.has(queryHash)) {
            this.queryMetrics.set(queryHash, []);
        }
        const queryMetricsList = this.queryMetrics.get(queryHash);
        queryMetricsList.push(metrics);
        // Keep only the most recent metrics
        if (queryMetricsList.length > this.maxMetricsPerQuery) {
            queryMetricsList.shift();
        }
        // Log slow queries with more details
        if (metrics.executionTime > this.slowQueryThreshold) {
            logger_1.logger.warn('Slow query detected', {
                query: metrics.query,
                executionTime: metrics.executionTime,
                rowsAffected: metrics.rowsAffected,
                parameters: metrics.parameters,
                queryHash,
            });
            // Trigger automatic optimization analysis
            this.analyzeSlowQuery(metrics);
        }
        // Report metrics to performance monitor
        this.reportQueryMetrics(metrics);
    }
    /**
     * Analyze slow query and generate optimization suggestions
     */
    analyzeSlowQuery(metrics) {
        const queryHash = this.hashQuery(metrics.query);
        // Skip if we already have optimization for this query
        if (this.optimizationCache.has(queryHash)) {
            return;
        }
        const optimization = this.optimizeQuery(metrics.query);
        this.optimizationCache.set(queryHash, optimization);
        // Generate index suggestions
        const indexSuggestions = this.generateIndexSuggestions(metrics.query);
        if (indexSuggestions.length > 0) {
            this.indexSuggestions.set(queryHash, indexSuggestions);
        }
    }
    /**
     * Report query metrics to performance monitor
     */
    reportQueryMetrics(metrics) {
        // Report to performance monitoring system
        if (typeof performance_monitor_service_1.performanceMonitor !== 'undefined') {
            performance_monitor_service_1.performanceMonitor.recordMetric('database.query_time', metrics.executionTime, 'ms');
            performance_monitor_service_1.performanceMonitor.recordMetric('database.rows_affected', metrics.rowsAffected, 'count');
            if (metrics.executionTime > this.slowQueryThreshold) {
                performance_monitor_service_1.performanceMonitor.recordMetric('database.slow_queries', 1, 'count');
            }
        }
    }
    /**
     * Generate comprehensive index suggestions for a query
     */
    generateIndexSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        // Extract table names
        const tableMatches = lowerQuery.match(/from\s+(\w+)|join\s+(\w+)/g);
        const tables = new Set();
        if (tableMatches) {
            tableMatches.forEach(match => {
                const table = match.replace(/from\s+|join\s+/g, '').trim();
                tables.add(table);
            });
        }
        // Analyze WHERE clauses
        const wherePattern = /where\s+.*?(?=\s+order\s+by|\s+group\s+by|\s+having|\s+limit|$)/gi;
        const whereMatch = lowerQuery.match(wherePattern);
        if (whereMatch) {
            const whereClause = whereMatch[0];
            const columnPattern = /(\w+)\s*[=<>!]/g;
            let columnMatch;
            while ((columnMatch = columnPattern.exec(whereClause)) !== null) {
                const column = columnMatch[1];
                if (column !== 'where' && column !== 'and' && column !== 'or') {
                    suggestions.push({
                        table: Array.from(tables)[0] || 'unknown_table',
                        columns: [column],
                        type: 'btree',
                        reason: `WHERE clause filtering on ${column}`,
                        estimatedImprovement: 40,
                    });
                }
            }
        }
        // Analyze ORDER BY clauses
        const orderByPattern = /order\s+by\s+([\w,\s]+)/gi;
        const orderByMatch = lowerQuery.match(orderByPattern);
        if (orderByMatch) {
            const orderByClause = orderByMatch[0];
            const columns = orderByClause
                .replace(/order\s+by\s+/gi, '')
                .split(',')
                .map(col => col.trim().replace(/\s+(asc|desc)$/gi, ''));
            suggestions.push({
                table: Array.from(tables)[0] || 'unknown_table',
                columns,
                type: 'btree',
                reason: `ORDER BY clause on ${columns.join(', ')}`,
                estimatedImprovement: 30,
            });
        }
        // Analyze JOIN conditions
        const joinPattern = /join\s+(\w+)\s+.*?on\s+(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/gi;
        let joinMatch;
        while ((joinMatch = joinPattern.exec(lowerQuery)) !== null) {
            const [, joinTable, leftTable, leftColumn, rightTable, rightColumn] = joinMatch;
            suggestions.push({
                table: leftTable,
                columns: [leftColumn],
                type: 'btree',
                reason: `JOIN condition on ${leftTable}.${leftColumn}`,
                estimatedImprovement: 50,
            });
            suggestions.push({
                table: rightTable,
                columns: [rightColumn],
                type: 'btree',
                reason: `JOIN condition on ${rightTable}.${rightColumn}`,
                estimatedImprovement: 50,
            });
        }
        // Analyze GROUP BY clauses
        const groupByPattern = /group\s+by\s+([\w,\s]+)/gi;
        const groupByMatch = lowerQuery.match(groupByPattern);
        if (groupByMatch) {
            const groupByClause = groupByMatch[0];
            const columns = groupByClause
                .replace(/group\s+by\s+/gi, '')
                .split(',')
                .map(col => col.trim());
            suggestions.push({
                table: Array.from(tables)[0] || 'unknown_table',
                columns,
                type: 'btree',
                reason: `GROUP BY clause on ${columns.join(', ')}`,
                estimatedImprovement: 35,
            });
        }
        // Remove duplicates and sort by estimated improvement
        const uniqueSuggestions = suggestions.filter((suggestion, index, self) => index === self.findIndex(s => s.table === suggestion.table &&
            JSON.stringify(s.columns) === JSON.stringify(suggestion.columns)));
        return uniqueSuggestions.sort((a, b) => b.estimatedImprovement - a.estimatedImprovement);
    }
    /**
     * Get slow queries that need optimization
     */
    getSlowQueries(limit = 10) {
        const allMetrics = [];
        for (const metrics of this.queryMetrics.values()) {
            allMetrics.push(...metrics);
        }
        return allMetrics
            .filter(m => m.executionTime > this.slowQueryThreshold)
            .sort((a, b) => b.executionTime - a.executionTime)
            .slice(0, limit);
    }
    /**
     * Get average execution time for a query
     */
    getAverageExecutionTime(query) {
        const queryHash = this.hashQuery(query);
        const metrics = this.queryMetrics.get(queryHash);
        if (!metrics || metrics.length === 0) {
            return 0;
        }
        const totalTime = metrics.reduce((sum, m) => sum + m.executionTime, 0);
        return totalTime / metrics.length;
    }
    /**
     * Suggest database indexes based on query patterns
     */
    suggestIndexes() {
        const suggestions = [];
        const queryPatterns = this.analyzeQueryPatterns();
        for (const pattern of queryPatterns) {
            if (pattern.type === 'WHERE_CLAUSE') {
                suggestions.push({
                    table: pattern.table,
                    columns: pattern.columns,
                    type: 'btree',
                    reason: `Frequent WHERE clause on ${pattern.columns.join(', ')}`,
                    estimatedImprovement: this.estimateIndexImprovement(pattern),
                });
            }
            if (pattern.type === 'ORDER_BY') {
                suggestions.push({
                    table: pattern.table,
                    columns: pattern.columns,
                    type: 'btree',
                    reason: `Frequent ORDER BY on ${pattern.columns.join(', ')}`,
                    estimatedImprovement: this.estimateIndexImprovement(pattern),
                });
            }
            if (pattern.type === 'JOIN') {
                suggestions.push({
                    table: pattern.table,
                    columns: pattern.columns,
                    type: 'btree',
                    reason: `Frequent JOIN on ${pattern.columns.join(', ')}`,
                    estimatedImprovement: this.estimateIndexImprovement(pattern),
                });
            }
            if (pattern.type === 'FULL_TEXT_SEARCH') {
                suggestions.push({
                    table: pattern.table,
                    columns: pattern.columns,
                    type: 'gin',
                    reason: `Full-text search on ${pattern.columns.join(', ')}`,
                    estimatedImprovement: this.estimateIndexImprovement(pattern),
                });
            }
        }
        return suggestions
            .sort((a, b) => b.estimatedImprovement - a.estimatedImprovement)
            .slice(0, 10); // Top 10 suggestions
    }
    /**
     * Optimize a specific query
     */
    optimizeQuery(query) {
        const suggestions = [];
        let optimizedQuery = query;
        let estimatedImprovement = 0;
        // Remove unnecessary SELECT *
        if (query.includes('SELECT *')) {
            suggestions.push('Replace SELECT * with specific column names');
            optimizedQuery = this.suggestSpecificColumns(optimizedQuery);
            estimatedImprovement += 10;
        }
        // Suggest LIMIT for large result sets
        if (!query.toUpperCase().includes('LIMIT') && this.isLargeResultQuery(query)) {
            suggestions.push('Add LIMIT clause to prevent large result sets');
            estimatedImprovement += 15;
        }
        // Suggest EXISTS instead of IN for subqueries
        if (query.toUpperCase().includes(' IN (SELECT')) {
            suggestions.push('Consider using EXISTS instead of IN with subqueries');
            optimizedQuery = this.replaceInWithExists(optimizedQuery);
            estimatedImprovement += 20;
        }
        // Suggest proper JOIN syntax
        if (this.hasImplicitJoins(query)) {
            suggestions.push('Use explicit JOIN syntax instead of implicit joins');
            estimatedImprovement += 25;
        }
        // Suggest index usage
        const indexSuggestions = this.suggestQuerySpecificIndexes(query);
        if (indexSuggestions.length > 0) {
            suggestions.push(`Consider adding indexes: ${indexSuggestions.join(', ')}`);
            estimatedImprovement += 30;
        }
        return {
            originalQuery: query,
            optimizedQuery,
            estimatedImprovement,
            suggestions,
        };
    }
    /**
     * Generate database migration for suggested indexes
     */
    generateIndexMigrations(suggestions) {
        const migrations = [];
        for (const suggestion of suggestions) {
            const indexName = `idx_${suggestion.table}_${suggestion.columns.join('_')}`;
            const columnsStr = suggestion.columns.join(', ');
            let createIndexSQL;
            switch (suggestion.type) {
                case 'gin':
                    createIndexSQL = `CREATE INDEX CONCURRENTLY ${indexName} ON ${suggestion.table} USING GIN (${columnsStr});`;
                    break;
                case 'hash':
                    createIndexSQL = `CREATE INDEX CONCURRENTLY ${indexName} ON ${suggestion.table} USING HASH (${columnsStr});`;
                    break;
                case 'gist':
                    createIndexSQL = `CREATE INDEX CONCURRENTLY ${indexName} ON ${suggestion.table} USING GIST (${columnsStr});`;
                    break;
                default:
                    createIndexSQL = `CREATE INDEX CONCURRENTLY ${indexName} ON ${suggestion.table} (${columnsStr});`;
            }
            migrations.push(createIndexSQL);
        }
        return migrations;
    }
    /**
     * Get query performance statistics
     */
    getQueryStats() {
        let totalQueries = 0;
        let slowQueries = 0;
        let totalExecutionTime = 0;
        for (const metrics of this.queryMetrics.values()) {
            totalQueries += metrics.length;
            totalExecutionTime += metrics.reduce((sum, m) => sum + m.executionTime, 0);
            slowQueries += metrics.filter(m => m.executionTime > this.slowQueryThreshold).length;
        }
        return {
            totalQueries,
            slowQueries,
            averageExecutionTime: totalQueries > 0 ? totalExecutionTime / totalQueries : 0,
            topSlowQueries: this.getSlowQueries(5),
        };
    }
    hashQuery(query) {
        // Simple hash function for query normalization
        return query
            .replace(/\s+/g, ' ')
            .replace(/\$\d+/g, '?') // Replace parameterized queries
            .replace(/\d+/g, 'N') // Replace numbers
            .replace(/'[^']*'/g, "'S'") // Replace strings
            .trim()
            .toLowerCase();
    }
    analyzeQueryPatterns() {
        const patterns = [];
        // This is a simplified pattern analysis
        // In a real implementation, you'd use a proper SQL parser
        for (const [queryHash, metrics] of this.queryMetrics.entries()) {
            const sampleQuery = metrics[0].query.toLowerCase();
            // Analyze WHERE clauses
            const whereMatch = sampleQuery.match(/where\s+(\w+)\.(\w+)/g);
            if (whereMatch) {
                patterns.push({
                    type: 'WHERE_CLAUSE',
                    table: 'extracted_table', // Would extract actual table name
                    columns: ['extracted_column'], // Would extract actual columns
                    frequency: metrics.length,
                });
            }
            // Analyze ORDER BY clauses
            const orderByMatch = sampleQuery.match(/order\s+by\s+(\w+)/g);
            if (orderByMatch) {
                patterns.push({
                    type: 'ORDER_BY',
                    table: 'extracted_table',
                    columns: ['extracted_column'],
                    frequency: metrics.length,
                });
            }
            // Analyze JOINs
            const joinMatch = sampleQuery.match(/join\s+(\w+)\s+on\s+(\w+)\.(\w+)/g);
            if (joinMatch) {
                patterns.push({
                    type: 'JOIN',
                    table: 'extracted_table',
                    columns: ['extracted_column'],
                    frequency: metrics.length,
                });
            }
            // Analyze full-text search
            const fullTextMatch = sampleQuery.match(/ilike|like|contains/g);
            if (fullTextMatch) {
                patterns.push({
                    type: 'FULL_TEXT_SEARCH',
                    table: 'extracted_table',
                    columns: ['extracted_column'],
                    frequency: metrics.length,
                });
            }
        }
        return patterns;
    }
    estimateIndexImprovement(pattern) {
        // Simple estimation based on frequency and query type
        const baseImprovement = pattern.frequency * 10;
        switch (pattern.type) {
            case 'WHERE_CLAUSE':
                return baseImprovement * 1.5;
            case 'ORDER_BY':
                return baseImprovement * 1.2;
            case 'JOIN':
                return baseImprovement * 2.0;
            case 'FULL_TEXT_SEARCH':
                return baseImprovement * 3.0;
            default:
                return baseImprovement;
        }
    }
    suggestSpecificColumns(query) {
        // This would analyze the query and suggest specific columns
        // For now, just add a comment
        return `-- TODO: Replace SELECT * with specific columns\n${query}`;
    }
    isLargeResultQuery(query) {
        // Simple heuristic to detect queries that might return large result sets
        const lowerQuery = query.toLowerCase();
        return !lowerQuery.includes('limit') &&
            !lowerQuery.includes('count(') &&
            (lowerQuery.includes('select') && !lowerQuery.includes('where'));
    }
    replaceInWithExists(query) {
        // Simple replacement of IN with EXISTS
        return query.replace(/\s+IN\s*\(\s*SELECT\s+/gi, ' EXISTS (SELECT 1 FROM ');
    }
    hasImplicitJoins(query) {
        const lowerQuery = query.toLowerCase();
        return lowerQuery.includes('from') &&
            lowerQuery.includes(',') &&
            lowerQuery.includes('where') &&
            !lowerQuery.includes('join');
    }
    suggestQuerySpecificIndexes(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();
        // Look for WHERE clauses
        const wherePattern = /where\s+(\w+)\s*=/gi;
        const whereMatches = lowerQuery.match(wherePattern);
        if (whereMatches) {
            suggestions.push('WHERE clause columns');
        }
        // Look for ORDER BY clauses
        const orderByPattern = /order\s+by\s+(\w+)/gi;
        const orderByMatches = lowerQuery.match(orderByPattern);
        if (orderByMatches) {
            suggestions.push('ORDER BY columns');
        }
        // Look for JOIN conditions
        const joinPattern = /join\s+\w+\s+on\s+(\w+)/gi;
        const joinMatches = lowerQuery.match(joinPattern);
        if (joinMatches) {
            suggestions.push('JOIN condition columns');
        }
        return suggestions;
    }
}
exports.QueryOptimizerService = QueryOptimizerService;
