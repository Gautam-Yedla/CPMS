import { supabase } from '../lib/supabase.js';

interface ViolationSeverity {
    score: number;
    baseFine: number;
    description: string;
}

export class ViolationService {
    // Defines the enforcement matrix for AI-driven violations
    private static SEVERITY_MATRIX: Record<string, ViolationSeverity> = {
        OVERSTAY_MINOR: { score: 1, baseFine: 100, description: "Minor overstay (12-14 hours). Automated Warning/Fine." },
        OVERSTAY_MAJOR: { score: 2, baseFine: 250, description: "Major overstay (>14 hours). Vehicle occupying slot excessively." },
        WRONG_ZONE: { score: 3, baseFine: 500, description: "Unauthorized access: Student parked in Faculty/Reserved zone." },
        NO_PERMIT: { score: 5, baseFine: 1000, description: "Unauthorized entry: Vehicle trace detected without valid system permit." }
    };

    /**
     * Executes a full sweep of the parking logs to enforce compliance.
     * Designed to be run by a Node.js cron/interval worker.
     */
    static async scanAndEnforce() {
        console.log('[ViolationEngine] 🚓 Initializing background enforcement scan...');
        let violationsGenerated = 0;

        try {
            // 1. Fetch all ACTIVE parking sessions and user profiles
            const { data: activeLogs, error: logErr } = await supabase
                .from('parking_logs')
                .select('*')
                .eq('status', 'Active')
                .is('exit_time', null);

            if (logErr) throw logErr;
            if (!activeLogs || activeLogs.length === 0) return 0;
            
            // 1b. Fetch associated profiles explicitly to avoid schema cache link errors
            const userIds = activeLogs.map(log => log.user_id).filter(id => id != null);
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, role, permit_status')
                .in('id', userIds);

            const profileMap = new Map((profilesData || []).map(p => [p.id, p]));
            
            // 2. Fetch all recently tracked violations to prevent duplicate reporting (within 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: recentViolations } = await supabase
                .from('violations')
                .select('user_id, violation_type')
                .gt('created_at', yesterday);

            for (const log of activeLogs as any[]) {
                const profile = profileMap.get(log.user_id);
                if (!profile) continue;

                // --- RULE 1: OVERSTAY DETECTION ---
                const entryTime = new Date(log.entry_time);
                const hoursParked = Math.abs(Date.now() - entryTime.getTime()) / 36e5;

                if (hoursParked > 12) {
                    const isMajor = hoursParked > 14;
                    const type = 'Overstay';
                    const config = isMajor ? this.SEVERITY_MATRIX.OVERSTAY_MAJOR! : this.SEVERITY_MATRIX.OVERSTAY_MINOR!;
                    
                    if (!this.hasDuplicateViolation(recentViolations, log.user_id, type)) {
                        await this.issueFine(log.user_id, log.vehicle_number, type, config);
                        violationsGenerated++;
                    }
                }

                // --- RULE 2: WRONG ZONE PARKING ---
                // If a Student is parked in a Reserved/Faculty zone
                const isStudent = ['student', 'guest'].includes(profile.role?.toLowerCase());
                const inReserved = log.zone?.toLowerCase().includes('reserved');

                if (isStudent && inReserved) {
                    const type = 'Illegal Parking';
                    if (!this.hasDuplicateViolation(recentViolations, log.user_id, type)) {
                        await this.issueFine(log.user_id, log.vehicle_number, type, this.SEVERITY_MATRIX.WRONG_ZONE!);
                        violationsGenerated++;
                    }
                }

                // --- RULE 3: PROFILES WITHOUT PERMIT ---
                // Only enforced if permit system logic dictates "Revoked" or "Suspended"
                if (profile.permit_status === 'Suspended') {
                    const type = 'No Permit';
                    if (!this.hasDuplicateViolation(recentViolations, log.user_id, type)) {
                        await this.issueFine(log.user_id, log.vehicle_number, type, this.SEVERITY_MATRIX.NO_PERMIT!);
                        violationsGenerated++;
                    }
                }
            }

            console.log(`[ViolationEngine] ✅ Scan complete. Auto-generated ${violationsGenerated} new fines.`);
            return violationsGenerated;

        } catch (error: any) {
            console.error('[ViolationEngine] ❌ Critical Failure during enforcement scan:', error.message);
        }
    }

    private static hasDuplicateViolation(recentViolations: any[] | null, userId: string, type: string): boolean {
        if (!recentViolations) return false;
        return recentViolations.some(v => v.user_id === userId && v.violation_type === type);
    }

    private static async issueFine(userId: string, vehicleNumber: string, type: string, config: ViolationSeverity) {
        // Enriches the description with the Severity Score for the UI
        const fullDescription = `[Severity: ${config.score}/5] ${config.description}`;
        
        const { error } = await supabase.from('violations').insert({
            user_id: userId,
            vehicle_number: vehicleNumber,
            violation_type: type,
            status: 'Unpaid',
            amount: config.baseFine,
            description: fullDescription
        });

        if (error) {
             console.error(`=> Failed to issue fine to ${userId}:`, error.message);
        } else {
             console.log(`=> 🚨 Issued ${type} Fine (₹${config.baseFine}) to Vehicle ${vehicleNumber}`);
        }
    }
}
