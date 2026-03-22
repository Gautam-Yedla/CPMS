import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

export enum NotificationChannel {
    WEB = 'WEB',
    EMAIL = 'EMAIL',
    PUSH = 'PUSH'
}

export interface NotificationPayload {
    title: string;
    description: string;
    type: 'permit' | 'security' | 'system' | 'general';
    data?: any;
}

export class NotificationService {
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER || 'placeholder@example.com',
            pass: process.env.SMTP_PASS || 'password'
        }
    });

    /**
     * Generic Multi-channel Dispatcher
     */
    static async notify(userId: string, payload: NotificationPayload, channels: NotificationChannel[] = [NotificationChannel.WEB]) {
        try {
            const results = await Promise.allSettled(channels.map(async (channel) => {
                switch (channel) {
                    case NotificationChannel.WEB:
                        return this.sendWebNotification(userId, payload);
                    case NotificationChannel.EMAIL:
                        return this.sendEmailNotification(userId, payload);
                    case NotificationChannel.PUSH:
                        return this.sendPushNotification(userId, payload);
                    default:
                        throw new Error(`Unsupported channel: ${channel}`);
                }
            }));

            return results;
        } catch (error) {
            console.error('Notification Dispatch Error:', error);
            throw error;
        }
    }

    private static async sendWebNotification(userId: string, payload: NotificationPayload) {
        const { error } = await supabase.from('notifications').insert({
            user_id: userId,
            title: payload.title,
            description: payload.description,
            type: payload.type,
            is_read: false
        });
        if (error) throw error;
    }

    private static async sendEmailNotification(userId: string, payload: NotificationPayload) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        const { data: userAuth } = await supabase.auth.admin.getUserById(userId);
        
        const email = userAuth?.user?.email;
        if (!email) return;

        await this.transporter.sendMail({
            from: '"CPMS Support" <support@cpms.com>',
            to: email,
            subject: `[CPMS Notification] ${payload.title}`,
            text: payload.description,
            html: `<h3>Hello ${profile?.full_name || 'User'},</h3><p>${payload.description}</p>`
        });
    }

    private static async sendPushNotification(userId: string, payload: NotificationPayload) {
        // Placeholder for FCM integration
        console.log(`Push notification sent to user ${userId}: ${payload.title}`);
        return Promise.resolve();
    }
}
