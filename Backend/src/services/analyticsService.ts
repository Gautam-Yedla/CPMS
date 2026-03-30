import { SupabaseClient } from '@supabase/supabase-js';

export interface AnalyticsQuery {
    table: string;
    groupBy?: string;
    timeframe?: 'day' | 'week' | 'month' | 'year';
    dateField?: string;
    dateRange?: 'day' | 'week' | 'month' | 'all';
    metrics?: ('count' | 'sum' | 'avg')[];
    metricField?: string;
    filters?: Record<string, any>;
}

export class AnalyticsService {
    /**
     * Generic data aggregation engine.
     * Performs counts and sums across tables with optional time-series grouping.
     */
    static async aggregateData(supabaseClient: SupabaseClient, query: AnalyticsQuery, userId?: string, userRole?: string) {
        let dbQuery = supabaseClient.from(query.table).select('*', { count: 'exact' });

        // Apply shared filters (e.g., student only sees their own data)
        if (userId && userRole?.toLowerCase() === 'student') {
            dbQuery = dbQuery.eq('user_id', userId);
        }

        // Apply custom filters
        if (query.filters) {
            Object.entries(query.filters).forEach(([key, value]) => {
                dbQuery = dbQuery.eq(key, value);
            });
        }

        // Apply Time Filtering Boundaries
        if (query.dateRange && query.dateRange !== 'all') {
            const dateField = query.dateField || 'created_at';
            const now = new Date();
            let startDate = new Date();
            
            if (query.dateRange === 'day') {
                startDate.setHours(0, 0, 0, 0); // Start of current day
            } else if (query.dateRange === 'week') {
                startDate.setDate(now.getDate() - 7); // Rolling 7 days
            } else if (query.dateRange === 'month') {
                startDate.setDate(now.getDate() - 30); // Rolling 30 days
            }
            dbQuery = dbQuery.gte(dateField, startDate.toISOString());
        }

        const { data, error, count } = await dbQuery;
        if (error) throw error;

        // If no grouping or metrics, just return raw data and count
        if (!query.groupBy && !query.timeframe && !query.metrics?.includes('sum')) {
            return { total: count || 0, data };
        }

        const result: Record<string, any> = {};

        data?.forEach((item: any) => {
            let key = 'Default';
            if (query.groupBy) {
                key = item[query.groupBy as string] || 'Unknown';
            } else if (query.timeframe) {
                const dateField: string = query.dateField || 'created_at';
                const dateValue = item[dateField];
                if (dateValue) {
                    const date = new Date(dateValue);
                    if (query.timeframe === 'day') key = date.toISOString().split('T')[0] ?? '';
                    else if ((query.timeframe as any) === 'month') key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    else key = date.getFullYear().toString();
                }
            }

            if (!result[key]) result[key] = { name: key, value: 0, count: 0 };
            
            // Support sum metrics if needed
            if (query.metrics?.includes('sum') && query.metricField && item[query.metricField]) {
                result[key].value += Number(item[query.metricField]) || 0;
            } else {
                result[key].value += 1; // Generic count as value
            }
            
            result[key].count += 1;
        });

        // Always sort keys chronologically if doing timeframe
        if (query.timeframe) {
            return Object.values(result).sort((a: any, b: any) => a.name.localeCompare(b.name));
        }

        return Object.values(result);
    }
}
