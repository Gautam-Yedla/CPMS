import type { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService.js';

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const { table, groupBy, timeframe, dateField, filters } = req.query;
        const user = (req as any).user;

        if (!table) {
            return res.status(400).json({ error: 'Table parameter is required' });
        }

        const stats = await AnalyticsService.aggregateData({
            table: table as string,
            groupBy: groupBy as string,
            timeframe: timeframe as any,
            dateField: (dateField as string) || 'created_at',
            filters: filters ? JSON.parse(filters as string) : undefined
        }, user.id, user.role);

        res.json(stats);
    } catch (err: any) {
        console.error('Analytics Error:', err);
        res.status(500).json({ error: 'Failed to generate analytics data' });
    }
};
