import { supabase } from '../lib/supabase.js';

export class PredictionService {
  /**
   * Calculates the predicted occupancy for a specific zone for the next X minutes.
   * Utilizes historical log data to calculate a "Velocity of Fill" (Rate of Change).
   */
  static async predictOccupancy(zoneName: string, predictMinutesAhead: number = 30) {
    try {
      // 1. Get Current Live Occupancy
      const { count: currentOccupancy, error: occErr } = await supabase
        .from('parking_logs')
        .select('*', { count: 'exact', head: true })
        .eq('zone', zoneName)
        .eq('status', 'Active')
        .is('exit_time', null);

      if (occErr) throw occErr;

      // 2. We need the occupancy rate of change over the last hour.
      // To do this, we calculate how many cars entered vs exited in the last 60 minutes.
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { count: recentlyEntered } = await supabase
        .from('parking_logs')
        .select('*', { count: 'exact', head: true })
        .eq('zone', zoneName)
        .gte('entry_time', oneHourAgo);

      const { count: recentlyExited } = await supabase
        .from('parking_logs')
        .select('*', { count: 'exact', head: true })
        .eq('zone', zoneName)
        .gte('exit_time', oneHourAgo)
        .not('exit_time', 'is', null);

      // Velocity of Fill (Cars per hour)
      const enteredPerHour = recentlyEntered || 0;
      const exitedPerHour = recentlyExited || 0;
      const netVelocityPerHour = enteredPerHour - exitedPerHour;

      // 3. Historical Smoothing (Same hour, previous days average)
      // To prevent erratic predictions if there's a sudden 5-min spike, 
      // we check historical averages for this exact hour over the past 7 days.
      const currentHour = new Date().getHours();
      
      const { data: historicalLogs } = await supabase
        .from('parking_logs')
        .select('entry_time')
        .eq('zone', zoneName)
        .gt('entry_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      let historicalEntriesThisHour = 0;
      if (historicalLogs) {
          historicalLogs.forEach(log => {
              const logHour = new Date(log.entry_time).getHours();
              if (logHour === currentHour) {
                  historicalEntriesThisHour++;
              }
          });
      }
      
      // Average entries for this specific hour across the last 7 days
      const historicalAverageRate = historicalLogs ? (historicalEntriesThisHour / 7) : 0;

      // Ensure that if we have massive historical spikes, we weight them
      // Blended Rate = 70% Current Live Velocity + 30% Historical Expectation 
      const blendedVelocityPerHour = (netVelocityPerHour * 0.7) + (historicalAverageRate * 0.3);

      // Calculate future occupancy based on requested prediction timeframe
      const hoursAhead = predictMinutesAhead / 60;
      const predictedChange = Math.round(blendedVelocityPerHour * hoursAhead);
      
      const predictedOccupancy = Math.max(0, (currentOccupancy || 0) + predictedChange);

      return {
          zone: zoneName,
          currentOccupancy: currentOccupancy || 0,
          netVelocityPerHour: parseFloat(blendedVelocityPerHour.toFixed(2)),
          predictedMinutesAhead: predictMinutesAhead,
          predictedChange: predictedChange,
          predictedOccupancy: predictedOccupancy,
          trend: blendedVelocityPerHour > 2 ? 'Filling Fast' : blendedVelocityPerHour < -2 ? 'Emptying' : 'Stable'
      };

    } catch (error) {
       console.error(`Prediction Error for Zone ${zoneName}:`, error);
       throw error;
    }
  }

  /**
   * Get predictions for all zones linked to a specific camera.
   */
  static async getPredictionsForCampus(predictMinutesAhead: number = 30) {
     const { data: zones } = await supabase.from('parking_zones').select('name, capacity');
     
     if (!zones) return [];

     const predictions = [];
     for (const zone of zones) {
         const pred = await this.predictOccupancy(zone.name, predictMinutesAhead);
         
         const isFullSoon = pred.predictedOccupancy >= zone.capacity;
         
         predictions.push({
             ...pred,
             capacity: zone.capacity,
             predictedStatus: isFullSoon ? 'Will be FULL' : 'Available',
             timeUntilFullMins: pred.netVelocityPerHour > 0 
                ? Math.round(((zone.capacity - pred.currentOccupancy) / pred.netVelocityPerHour) * 60)
                : -1 // Never reaching full at current negative/stable velocity
         });
     }
     
     return predictions;
  }
}
