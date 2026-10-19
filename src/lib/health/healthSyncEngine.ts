/**
 * healthSyncEngine.ts — Core Engine for Apple Health, Google Health Connect,
 * and Phone Sensor Integrations.
 *
 * Provides:
 * 1. Apple Health Export XML parser
 * 2. Google Health Connect / Google Fit JSON parser
 * 3. Mobile DeviceMotion Pedometer (Web Sensor API)
 * 4. Web Bluetooth BLE Heart Rate / Pulse Oximeter reader
 * 5. Clinical Anomaly Evaluator
 * 6. Preset test profiles & State persistence
 */

import {
    HealthSource,
    HealthMetricDataPoint,
    LatestBiometricsSummary,
    ClinicalAnomaly,
    HealthIntegrationState,
    ConnectedSourceRecord,
    HealthPermissionSettings,
    WearableDataSummary,
} from '@/types/healthSync';

export const DEFAULT_PERMISSIONS: HealthPermissionSettings = {
    activity: true,
    heart: true,
    sleep: true,
    oxygen: true,
    vitals: true,
    glucose: true,
};

export function createDefaultHealthState(): HealthIntegrationState {
    const makeSource = (source: HealthSource, name: string): ConnectedSourceRecord => ({
        source,
        name,
        status: 'disconnected',
        permissions: { ...DEFAULT_PERMISSIONS },
        recordCount: 0,
    });

    return {
        sources: {
            apple_health: makeSource('apple_health', 'Apple Health (HealthKit)'),
            google_health_connect: makeSource('google_health_connect', 'Google Health Connect'),
            google_fit: makeSource('google_fit', 'Google Fit'),
            phone_sensors: makeSource('phone_sensors', 'Phone Sensors (Pedometer)'),
            bluetooth_ble: makeSource('bluetooth_ble', 'Wireless Bluetooth Sensor'),
            fitbit: makeSource('fitbit', 'Fitbit'),
            garmin: makeSource('garmin', 'Garmin Connect'),
            whoop: makeSource('whoop', 'Whoop Strap'),
            oura: makeSource('oura', 'Oura Ring'),
            manual_upload: makeSource('manual_upload', 'Manual File Export'),
        },
        latestMetrics: {},
        anomalies: [],
        recentDataPoints: [],
        autoSyncEnabled: true,
        syncIntervalMinutes: 30,
        isSyncing: false,
    };
}

// ─── CLINICAL ANOMALY DETECTOR ──────────────────────────────────────────────────

export function detectClinicalAnomalies(metrics: LatestBiometricsSummary): ClinicalAnomaly[] {
    const anomalies: ClinicalAnomaly[] = [];
    const nowIso = new Date().toISOString();

    // 1. Resting Heart Rate
    if (metrics.restingHeartRate != null) {
        if (metrics.restingHeartRate >= 85) {
            anomalies.push({
                id: 'anom_rhr_high',
                metric: 'resting_heart_rate',
                title: 'Significantly Elevated Resting Heart Rate',
                description: `Resting heart rate recorded at ${metrics.restingHeartRate} bpm.`,
                clinicalImplication: 'May indicate acute infection, fever, dehydration, elevated systemic inflammation, or sympathetic overdrive.',
                suggestedAction: 'Monitor body temperature and hydration. Arovia AI will factor this into diagnostic evaluations.',
                severity: metrics.restingHeartRate >= 105 ? 'alert' : 'warning',
                currentValue: `${metrics.restingHeartRate} bpm`,
                baselineValue: '60–75 bpm',
                detectedAt: nowIso,
            });
        } else if (metrics.restingHeartRate <= 48) {
            anomalies.push({
                id: 'anom_rhr_low',
                metric: 'resting_heart_rate',
                title: 'Resting Bradycardia Detected',
                description: `Resting heart rate recorded at ${metrics.restingHeartRate} bpm.`,
                clinicalImplication: 'Common in well-trained endurance athletes; otherwise monitor for dizziness, syncope, or medication side effects.',
                suggestedAction: 'Ensure no accompanying lightheadedness or fatigue.',
                severity: 'info',
                currentValue: `${metrics.restingHeartRate} bpm`,
                baselineValue: '60–75 bpm',
                detectedAt: nowIso,
            });
        }
    }

    // 2. Sleep Duration
    if (metrics.sleepDurationHours != null) {
        if (metrics.sleepDurationHours < 5.0) {
            anomalies.push({
                id: 'anom_sleep_severe_deficit',
                metric: 'sleep_duration_hours',
                title: 'Severe Sleep Deficit Detected',
                description: `Recorded only ${metrics.sleepDurationHours.toFixed(1)} hours of total sleep last night.`,
                clinicalImplication: 'Acute sleep deprivation elevates inflammatory cytokines, impairs glucose regulation, and amplifies headache & pain sensitivity.',
                suggestedAction: 'Prioritize recovery sleep, limit caffeine intake, and consider restorative herbal infusions like Chamomile or Ashwagandha.',
                severity: 'alert',
                currentValue: `${metrics.sleepDurationHours.toFixed(1)} hrs`,
                baselineValue: '7.0–8.5 hrs',
                detectedAt: nowIso,
            });
        } else if (metrics.sleepDurationHours < 6.2) {
            anomalies.push({
                id: 'anom_sleep_mild_deficit',
                metric: 'sleep_duration_hours',
                title: 'Suboptimal Sleep Duration',
                description: `Recorded ${metrics.sleepDurationHours.toFixed(1)} hours of sleep.`,
                clinicalImplication: 'Mild sleep debt can lower immune resistance and increase mental fatigue.',
                suggestedAction: 'Aim for a consistent circadian wind-down routine tonight.',
                severity: 'warning',
                currentValue: `${metrics.sleepDurationHours.toFixed(1)} hrs`,
                baselineValue: '7.0–8.5 hrs',
                detectedAt: nowIso,
            });
        }
    }

    // 3. Blood Oxygen (SpO2)
    if (metrics.bloodOxygenSpO2 != null) {
        if (metrics.bloodOxygenSpO2 < 92) {
            anomalies.push({
                id: 'anom_spo2_critical',
                metric: 'blood_oxygen_spo2',
                title: 'Significant Hypoxemia (Low SpO2)',
                description: `Blood oxygen saturation measured at ${metrics.bloodOxygenSpO2}%.`,
                clinicalImplication: 'Clinically low oxygen saturation requires prompt attention, particularly if accompanied by shortness of breath or chest tightness.',
                suggestedAction: 'Retake measurement at rest. If shortness of breath or chest pain is present, seek immediate medical care.',
                severity: 'alert',
                currentValue: `${metrics.bloodOxygenSpO2}%`,
                baselineValue: '95–100%',
                detectedAt: nowIso,
            });
        } else if (metrics.bloodOxygenSpO2 < 95) {
            anomalies.push({
                id: 'anom_spo2_mild',
                metric: 'blood_oxygen_spo2',
                title: 'Mild Oxygen Desaturation',
                description: `Blood oxygen saturation measured at ${metrics.bloodOxygenSpO2}%.`,
                clinicalImplication: 'Borderline reading. Can occur with shallow breathing, respiratory congestion, or sensor misplacement.',
                suggestedAction: 'Warm fingers and repeat measurement while breathing deeply.',
                severity: 'warning',
                currentValue: `${metrics.bloodOxygenSpO2}%`,
                baselineValue: '95–100%',
                detectedAt: nowIso,
            });
        }
    }

    // 4. Blood Pressure
    if (metrics.bloodPressureSystolic != null && metrics.bloodPressureDiastolic != null) {
        const sys = metrics.bloodPressureSystolic;
        const dia = metrics.bloodPressureDiastolic;
        if (sys >= 140 || dia >= 90) {
            anomalies.push({
                id: 'anom_bp_stage2',
                metric: 'blood_pressure_systolic',
                title: 'Elevated Blood Pressure (Stage 2 Range)',
                description: `Blood pressure reading: ${sys}/${dia} mmHg.`,
                clinicalImplication: 'Hypertensive threshold detected. Avoid vasoconstrictive stimulants, pseudoephedrine, and excess sodium.',
                suggestedAction: 'Rest in a quiet room for 5 minutes and repeat measurement. Consult your physician if consistently elevated.',
                severity: 'alert',
                currentValue: `${sys}/${dia} mmHg`,
                baselineValue: '< 120/80 mmHg',
                detectedAt: nowIso,
            });
        } else if (sys >= 130 || dia >= 80) {
            anomalies.push({
                id: 'anom_bp_stage1',
                metric: 'blood_pressure_systolic',
                title: 'Borderline Blood Pressure (Stage 1 Range)',
                description: `Blood pressure reading: ${sys}/${dia} mmHg.`,
                clinicalImplication: 'Mildly elevated vascular pressure. Frequently influenced by acute stress, caffeine, or poor sleep.',
                suggestedAction: 'Maintain hydration, reduce acute stress, and monitor trends across the week.',
                severity: 'warning',
                currentValue: `${sys}/${dia} mmHg`,
                baselineValue: '< 120/80 mmHg',
                detectedAt: nowIso,
            });
        }
    }

    // 5. Body Temperature
    if (metrics.bodyTemperatureC != null) {
        if (metrics.bodyTemperatureC >= 38.0) {
            anomalies.push({
                id: 'anom_temp_fever',
                metric: 'body_temperature_c',
                title: 'Febrile State (Fever) Detected',
                description: `Body temperature recorded at ${metrics.bodyTemperatureC.toFixed(1)}°C (${((metrics.bodyTemperatureC * 9) / 5 + 32).toFixed(1)}°F).`,
                clinicalImplication: 'Active systemic pyrexia indicative of immune response against viral or bacterial pathogen.',
                suggestedAction: 'Stay hydrated, get bed rest, and report any severe symptoms (stiff neck, breathing distress) immediately.',
                severity: 'alert',
                currentValue: `${metrics.bodyTemperatureC.toFixed(1)}°C`,
                baselineValue: '36.5–37.2°C',
                detectedAt: nowIso,
            });
        } else if (metrics.bodyTemperatureC >= 37.5) {
            anomalies.push({
                id: 'anom_temp_mild',
                metric: 'body_temperature_c',
                title: 'Low-Grade Pyrexia',
                description: `Body temperature recorded at ${metrics.bodyTemperatureC.toFixed(1)}°C (${((metrics.bodyTemperatureC * 9) / 5 + 32).toFixed(1)}°F).`,
                clinicalImplication: 'Subfebrile temperature elevation.',
                suggestedAction: 'Rest, drink warm fluids, and avoid heavy exertion.',
                severity: 'warning',
                currentValue: `${metrics.bodyTemperatureC.toFixed(1)}°C`,
                baselineValue: '36.5–37.2°C',
                detectedAt: nowIso,
            });
        }
    }

    // 6. Heart Rate Variability (HRV)
    if (metrics.hrvSdnnMs != null && metrics.hrvSdnnMs < 25) {
        anomalies.push({
            id: 'anom_hrv_depressed',
            metric: 'hrv_sdnn',
            title: 'Depressed Heart Rate Variability (HRV)',
            description: `SDNN HRV measured at ${metrics.hrvSdnnMs} ms.`,
            clinicalImplication: 'Reflects diminished parasympathetic recovery, elevated physical/mental fatigue, or impending illness.',
            suggestedAction: 'Incorporate calming breathwork (Pranayama), reduce intense workouts today, and sleep early.',
            severity: 'info',
            currentValue: `${metrics.hrvSdnnMs} ms`,
            baselineValue: '40–70 ms',
            detectedAt: nowIso,
        });
    }

    return anomalies;
}

// ─── APPLE HEALTH XML PARSER ───────────────────────────────────────────────────

export function parseAppleHealthXML(xmlText: string): {
    metrics: LatestBiometricsSummary;
    points: HealthMetricDataPoint[];
} {
    const points: HealthMetricDataPoint[] = [];
    const metrics: LatestBiometricsSummary = {};
    const nowIso = new Date().toISOString();

    // Regex matchers for common Apple Health records
    const recordRegex = /<Record\s+([^>]+)\/?>/gi;
    let match: RegExpExecArray | null;

    let stepSum = 0;
    let latestHr: number | null = null;
    let latestRhr: number | null = null;
    let latestSpo2: number | null = null;
    let latestSys: number | null = null;
    let latestDia: number | null = null;
    let latestHrv: number | null = null;
    let latestTemp: number | null = null;
    let sleepSecondsTotal = 0;

    while ((match = recordRegex.exec(xmlText)) !== null) {
        const attrs = match[1];

        const typeMatch = attrs.match(/type="([^"]+)"/i);
        const valueMatch = attrs.match(/value="([^"]+)"/i);
        const unitMatch = attrs.match(/unit="([^"]+)"/i);
        const dateMatch = attrs.match(/startDate="([^"]+)"/i) || attrs.match(/endDate="([^"]+)"/i);
        const sourceMatch = attrs.match(/sourceName="([^"]+)"/i);

        if (!typeMatch) continue;

        const recordType = typeMatch[1];
        const rawVal = valueMatch ? parseFloat(valueMatch[1]) : NaN;
        const time = dateMatch ? new Date(dateMatch[1]).toISOString() : nowIso;
        const sourceName = sourceMatch ? sourceMatch[1] : 'Apple Health';

        if (recordType === 'HKQuantityTypeIdentifierStepCount' && !isNaN(rawVal)) {
            stepSum += rawVal;
            points.push({
                id: `ah_step_${points.length}`,
                type: 'steps',
                value: rawVal,
                unit: 'steps',
                timestamp: time,
                source: 'apple_health',
                deviceName: sourceName,
            });
        } else if (recordType === 'HKQuantityTypeIdentifierHeartRate' && !isNaN(rawVal)) {
            latestHr = rawVal;
            points.push({
                id: `ah_hr_${points.length}`,
                type: 'heart_rate',
                value: rawVal,
                unit: 'bpm',
                timestamp: time,
                source: 'apple_health',
                deviceName: sourceName,
            });
        } else if (recordType === 'HKQuantityTypeIdentifierRestingHeartRate' && !isNaN(rawVal)) {
            latestRhr = rawVal;
            points.push({
                id: `ah_rhr_${points.length}`,
                type: 'resting_heart_rate',
                value: rawVal,
                unit: 'bpm',
                timestamp: time,
                source: 'apple_health',
                deviceName: sourceName,
            });
        } else if (recordType === 'HKQuantityTypeIdentifierOxygenSaturation' && !isNaN(rawVal)) {
            // Apple Health stores oxygen as fraction e.g. 0.98 or 98
            const pct = rawVal <= 1.0 ? Math.round(rawVal * 100) : rawVal;
            latestSpo2 = pct;
            points.push({
                id: `ah_spo2_${points.length}`,
                type: 'blood_oxygen_spo2',
                value: pct,
                unit: '%',
                timestamp: time,
                source: 'apple_health',
                deviceName: sourceName,
            });
        } else if (recordType === 'HKQuantityTypeIdentifierBloodPressureSystolic' && !isNaN(rawVal)) {
            latestSys = rawVal;
        } else if (recordType === 'HKQuantityTypeIdentifierBloodPressureDiastolic' && !isNaN(rawVal)) {
            latestDia = rawVal;
        } else if (recordType === 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN' && !isNaN(rawVal)) {
            latestHrv = rawVal;
        } else if (recordType === 'HKQuantityTypeIdentifierBodyTemperature' && !isNaN(rawVal)) {
            const isFahrenheit = unitMatch && unitMatch[1]?.toLowerCase().includes('degf');
            latestTemp = isFahrenheit ? ((rawVal - 32) * 5) / 9 : rawVal;
        } else if (recordType.includes('SleepAnalysis')) {
            // Approximate sleep duration from start & end dates if present
            const endMatch = attrs.match(/endDate="([^"]+)"/i);
            if (dateMatch && endMatch) {
                const s = new Date(dateMatch[1]).getTime();
                const e = new Date(endMatch[1]).getTime();
                if (e > s) {
                    sleepSecondsTotal += (e - s) / 1000;
                }
            }
        }
    }

    if (stepSum > 0) metrics.steps = Math.round(stepSum);
    if (latestHr != null) metrics.currentHeartRate = Math.round(latestHr);
    if (latestRhr != null) metrics.restingHeartRate = Math.round(latestRhr);
    if (latestSpo2 != null) metrics.bloodOxygenSpO2 = latestSpo2;
    if (latestSys != null) metrics.bloodPressureSystolic = Math.round(latestSys);
    if (latestDia != null) metrics.bloodPressureDiastolic = Math.round(latestDia);
    if (latestHrv != null) metrics.hrvSdnnMs = Math.round(latestHrv);
    if (latestTemp != null) metrics.bodyTemperatureC = parseFloat(latestTemp.toFixed(1));

    if (sleepSecondsTotal > 0) {
        metrics.sleepDurationHours = parseFloat((sleepSecondsTotal / 3600).toFixed(1));
        metrics.sleepScore = Math.min(100, Math.round((metrics.sleepDurationHours / 8) * 90 + 10));
    }

    metrics.lastUpdated = nowIso;
    return { metrics, points };
}

// ─── GOOGLE HEALTH CONNECT / GOOGLE FIT JSON PARSER ────────────────────────────

export function parseGoogleHealthJSON(jsonText: string): {
    metrics: LatestBiometricsSummary;
    points: HealthMetricDataPoint[];
} {
    const points: HealthMetricDataPoint[] = [];
    const metrics: LatestBiometricsSummary = {};
    const nowIso = new Date().toISOString();

    try {
        const data = JSON.parse(jsonText);

        // 1. Direct key support (telemetry export)
        if (typeof data === 'object' && data !== null) {
            if (data.steps != null) metrics.steps = Number(data.steps);
            if (data.heartRate != null) metrics.currentHeartRate = Number(data.heartRate);
            if (data.restingHeartRate != null) metrics.restingHeartRate = Number(data.restingHeartRate);
            if (data.bloodOxygen != null || data.spo2 != null) {
                metrics.bloodOxygenSpO2 = Number(data.bloodOxygen ?? data.spo2);
            }
            if (data.sleepHours != null || data.sleepDurationHours != null) {
                metrics.sleepDurationHours = Number(data.sleepHours ?? data.sleepDurationHours);
            }
            if (data.sleepScore != null) metrics.sleepScore = Number(data.sleepScore);
            if (data.bloodPressureSystolic != null) metrics.bloodPressureSystolic = Number(data.bloodPressureSystolic);
            if (data.bloodPressureDiastolic != null) metrics.bloodPressureDiastolic = Number(data.bloodPressureDiastolic);
            if (data.bodyTemperature != null) metrics.bodyTemperatureC = Number(data.bodyTemperature);
            if (data.activeCalories != null) metrics.activeCalories = Number(data.activeCalories);

            // 2. Google Health Connect Records array format
            const records = Array.isArray(data.records) ? data.records : Array.isArray(data) ? data : [];
            for (const rec of records) {
                const recType = String(rec.type || rec.dataType || rec.recordType || '');
                const time = rec.time || rec.startTime || rec.endTime || nowIso;

                if (recType.includes('Steps') && rec.count != null) {
                    const count = Number(rec.count);
                    metrics.steps = (metrics.steps || 0) + count;
                    points.push({
                        id: `gh_steps_${points.length}`,
                        type: 'steps',
                        value: count,
                        unit: 'steps',
                        timestamp: time,
                        source: 'google_health_connect',
                    });
                } else if (recType.includes('HeartRate') && (rec.beatsPerMinute != null || rec.bpm != null)) {
                    const bpm = Number(rec.beatsPerMinute ?? rec.bpm);
                    metrics.currentHeartRate = bpm;
                    points.push({
                        id: `gh_hr_${points.length}`,
                        type: 'heart_rate',
                        value: bpm,
                        unit: 'bpm',
                        timestamp: time,
                        source: 'google_health_connect',
                    });
                } else if (recType.includes('RestingHeartRate') && rec.bpm != null) {
                    metrics.restingHeartRate = Number(rec.bpm);
                } else if (recType.includes('OxygenSaturation') && (rec.percentage != null || rec.value != null)) {
                    metrics.bloodOxygenSpO2 = Number(rec.percentage ?? rec.value);
                } else if (recType.includes('SleepSession')) {
                    const durationMins = Number(rec.durationMinutes || rec.duration || 0);
                    if (durationMins > 0) {
                        metrics.sleepDurationHours = parseFloat((durationMins / 60).toFixed(1));
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error parsing Google Health Connect JSON:', e);
    }

    metrics.lastUpdated = nowIso;
    return { metrics, points };
}

// ─── BUILT-IN PHONE SENSOR PEDOMETER (Web Sensor / DeviceMotion) ───────────────

export class PhoneMotionTracker {
    private isTracking = false;
    private stepCount = 0;
    private lastMagnitude = 0;
    private lastStepTimestamp = 0;
    private threshold = 11.8; // m/s^2 acceleration peak threshold
    private onStepCallback?: (currentSteps: number) => void;

    public async start(onStep: (steps: number) => void): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        this.onStepCallback = onStep;

        // iOS 13+ requires explicit user gesture permission for DeviceMotionEvent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dme = window.DeviceMotionEvent as any;
        if (typeof dme?.requestPermission === 'function') {
            try {
                const response = await dme.requestPermission();
                if (response !== 'granted') return false;
            } catch {
                return false;
            }
        }

        window.addEventListener('devicemotion', this.handleMotion, false);
        this.isTracking = true;
        return true;
    }

    public stop() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('devicemotion', this.handleMotion, false);
        }
        this.isTracking = false;
    }

    public getSteps() {
        return this.stepCount;
    }

    public setInitialSteps(steps: number) {
        this.stepCount = steps;
    }

    private handleMotion = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

        // Euclidean acceleration norm
        const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
        const now = Date.now();

        // Peak detection with refractory period (>280 ms between steps, max ~3.5 Hz)
        if (
            magnitude > this.threshold &&
            this.lastMagnitude <= this.threshold &&
            now - this.lastStepTimestamp > 280
        ) {
            this.stepCount += 1;
            this.lastStepTimestamp = now;
            if (this.onStepCallback) {
                this.onStepCallback(this.stepCount);
            }
        }

        this.lastMagnitude = magnitude;
    };
}

// ─── WEB BLUETOOTH LE HEART RATE MONITOR ───────────────────────────────────────

export async function connectWebBluetoothHeartRate(
    onReading: (bpm: number) => void
): Promise<{ deviceName: string; disconnect: () => void } | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
    if (!nav || !nav.bluetooth) {
        throw new Error('Web Bluetooth is not supported on this browser or platform.');
    }

    try {
        const device = await nav.bluetooth.requestDevice({
            filters: [{ services: ['heart_rate'] }],
            optionalServices: ['battery_service'],
        });

        const server = await device.gatt?.connect();
        if (!server) throw new Error('Could not establish GATT connection');

        const service = await server.getPrimaryService('heart_rate');
        const characteristic = await service.getCharacteristic('heart_rate_measurement');

        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (e: Event) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const target = e.target as any;
            if (!target.value) return;
            const flags = target.value.getUint8(0);
            // If bit 0 is 1, heart rate is 16-bit, else 8-bit
            const rate16Bits = flags & 0x1;
            const bpm = rate16Bits ? target.value.getUint16(1, /*littleEndian=*/ true) : target.value.getUint8(1);
            onReading(bpm);
        });

        return {
            deviceName: device.name || 'BLE Heart Rate Sensor',
            disconnect: () => {
                if (device.gatt?.connected) {
                    device.gatt.disconnect();
                }
            },
        };
    } catch (err) {
        console.warn('Bluetooth connection error:', err);
        throw err;
    }
}

// ─── REALISTIC DEMO / PRESET PROFILES ──────────────────────────────────────────

export function getPresetHealthData(presetKey: 'apple_active' | 'pixel_febrile' | 'phone_sedentary'): {
    source: HealthSource;
    deviceModel: string;
    metrics: LatestBiometricsSummary;
    anomalies: ClinicalAnomaly[];
} {
    const nowIso = new Date().toISOString();

    if (presetKey === 'apple_active') {
        const metrics: LatestBiometricsSummary = {
            steps: 9420,
            distanceKm: 7.1,
            activeCalories: 540,
            currentHeartRate: 72,
            restingHeartRate: 62,
            hrvSdnnMs: 58,
            sleepDurationHours: 7.8,
            sleepDeepHours: 1.8,
            sleepRemHours: 2.1,
            sleepScore: 92,
            bloodOxygenSpO2: 99,
            bloodPressureSystolic: 116,
            bloodPressureDiastolic: 74,
            respiratoryRate: 14,
            bodyTemperatureC: 36.6,
            waterIntakeMl: 2200,
            lastUpdated: nowIso,
        };
        return {
            source: 'apple_health',
            deviceModel: 'Apple Watch Ultra 2 (watchOS 11.2)',
            metrics,
            anomalies: detectClinicalAnomalies(metrics),
        };
    }

    if (presetKey === 'pixel_febrile') {
        const metrics: LatestBiometricsSummary = {
            steps: 2180,
            distanceKm: 1.4,
            activeCalories: 180,
            currentHeartRate: 98,
            restingHeartRate: 88, // Elevated!
            hrvSdnnMs: 24,       // Depressed!
            sleepDurationHours: 4.4, // Severe deficit!
            sleepDeepHours: 0.5,
            sleepRemHours: 0.8,
            sleepScore: 54,
            bloodOxygenSpO2: 96,
            bloodPressureSystolic: 126,
            bloodPressureDiastolic: 82,
            respiratoryRate: 19, // Elevated breaths
            bodyTemperatureC: 38.2, // Fever!
            waterIntakeMl: 900,
            lastUpdated: nowIso,
        };
        return {
            source: 'google_health_connect',
            deviceModel: 'Google Pixel Watch 3 (Wear OS 5)',
            metrics,
            anomalies: detectClinicalAnomalies(metrics),
        };
    }

    // phone_sedentary
    const metrics: LatestBiometricsSummary = {
        steps: 1740,
        distanceKm: 1.1,
        activeCalories: 110,
        currentHeartRate: 76,
        restingHeartRate: 74,
        hrvSdnnMs: 36,
        sleepDurationHours: 5.8,
        sleepScore: 68,
        bloodOxygenSpO2: 98,
        bloodPressureSystolic: 132, // Stage 1
        bloodPressureDiastolic: 84,
        respiratoryRate: 15,
        bodyTemperatureC: 36.8,
        waterIntakeMl: 1200,
        lastUpdated: nowIso,
    };
    return {
        source: 'phone_sensors',
        deviceModel: 'Internal Smartphone Accelerometer',
        metrics,
        anomalies: detectClinicalAnomalies(metrics),
    };
}

// ─── LOCAL STORAGE & BACKEND PERSISTENCE ───────────────────────────────────────

export function getHealthStorageKey(userId?: string): string {
    return `arovia_health_sync_${userId || 'active'}`;
}

export function loadHealthState(userId?: string): HealthIntegrationState {
    if (typeof window === 'undefined') return createDefaultHealthState();
    try {
        const key = getHealthStorageKey(userId);
        const saved = localStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...createDefaultHealthState(),
                ...parsed,
                sources: {
                    ...createDefaultHealthState().sources,
                    ...(parsed.sources || {}),
                },
            };
        }
    } catch (e) {
        console.error('Failed to load health sync state:', e);
    }
    return createDefaultHealthState();
}

export function saveHealthState(state: HealthIntegrationState, userId?: string) {
    if (typeof window === 'undefined') return;
    try {
        const key = getHealthStorageKey(userId);
        localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.error('Failed to save health sync state:', e);
    }
}

/**
 * Builds the WearableDataSummary payload for user metadata & AI consultation priming.
 */
export function buildWearableSummary(state: HealthIntegrationState): WearableDataSummary {
    const connectedSources = Object.values(state.sources)
        .filter((s) => s.status === 'connected')
        .map((s) => s.name);

    return {
        hasConnectedDevice: connectedSources.length > 0,
        connectedSources,
        lastSyncedAt: state.lastGlobalSyncAt || new Date().toISOString(),
        metrics: state.latestMetrics,
        anomalies: state.anomalies,
    };
}

/**
 * Sync state to backend API endpoint `/api/health/sync`.
 */
export async function syncHealthToBackend(state: HealthIntegrationState): Promise<boolean> {
    try {
        const summary = buildWearableSummary(state);
        const res = await fetch('/api/health/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(summary),
        });
        return res.ok;
    } catch (e) {
        console.warn('Backend health sync failed:', e);
        return false;
    }
}
