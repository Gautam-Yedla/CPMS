import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export interface AnalyticsQuery {
    table: string;
    groupBy?: string;
    timeframe?: 'day' | 'week' | 'month' | 'year';
    dateField?: string;
    metrics?: ('count' | 'sum' | 'avg')[];
    metricField?: string;
    filters?: Record<string, any>;
}

export class AnalyticsService {
    /**
     * Generic data aggregation engine.
     * Performs counts and sums across tables with optional time-series grouping.
     */
    static async aggregateData(query: AnalyticsQuery, userId?: string, userRole?: string) {
        let dbQuery = supabase.from(query.table).select('*', { count: 'exact' });

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

        const { data, error, count } = await dbQuery;
        if (error) throw error;

        // Implementation of grouping/aggregation in memory for mock-like PowerBI flexibility 
        if (!query.groupBy && !query.timeframe) {
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
                    else if ((query.timeframe as any) === 'month') key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                    else key = date.getFullYear().toString();
                }
            }

            if (!result[key]) result[key] = { name: key, value: 0 };
            result[key].value += 1; // Generic count
        });

        return Object.values(result);
    }
}
