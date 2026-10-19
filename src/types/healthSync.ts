/**
 * healthSync.ts — Types and Interfaces for Health & Wearable Integrations
 * Supporting Apple Health (HealthKit), Google Health Connect / Google Fit,
 * and built-in Phone Sensors / Bluetooth LE devices.
 */

export type HealthSource =
    | 'apple_health'
    | 'google_health_connect'
    | 'google_fit'
    | 'phone_sensors'
    | 'bluetooth_ble'
    | 'fitbit'
    | 'garmin'
    | 'whoop'
    | 'oura'
    | 'manual_upload';

export type ConnectionStatus =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'syncing'
    | 'error'
    | 'permission_required';

export type HealthMetricType =
    | 'steps'
    | 'distance_km'
    | 'active_calories'
    | 'heart_rate'
    | 'resting_heart_rate'
    | 'hrv_sdnn'
    | 'sleep_duration_hours'
    | 'sleep_deep_hours'
    | 'sleep_rem_hours'
    | 'sleep_light_hours'
    | 'sleep_score'
    | 'blood_oxygen_spo2'
    | 'blood_pressure_systolic'
    | 'blood_pressure_diastolic'
    | 'respiratory_rate'
    | 'body_temperature_c'
    | 'blood_glucose_mgdl'
    | 'water_intake_ml';

export interface HealthMetricDataPoint {
    id: string;
    type: HealthMetricType;
    value: number;
    unit: string;
    timestamp: string; // ISO 8601
    source: HealthSource;
    deviceName?: string;
    confidence?: number;
    metadata?: Record<string, unknown>;
}

export interface LatestBiometricsSummary {
    steps?: number;
    distanceKm?: number;
    activeCalories?: number;
    currentHeartRate?: number;
    restingHeartRate?: number;
    hrvSdnnMs?: number;
    sleepDurationHours?: number;
    sleepDeepHours?: number;
    sleepRemHours?: number;
    sleepScore?: number;
    bloodOxygenSpO2?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    respiratoryRate?: number;
    bodyTemperatureC?: number;
    bloodGlucoseMgDl?: number;
    waterIntakeMl?: number;
    lastUpdated?: string;
}

export type AnomalySeverity = 'info' | 'warning' | 'alert';

export interface ClinicalAnomaly {
    id: string;
    metric: HealthMetricType;
    title: string;
    description: string;
    clinicalImplication: string;
    suggestedAction: string;
    severity: AnomalySeverity;
    currentValue: string;
    baselineValue: string;
    detectedAt: string;
}

export interface HealthPermissionSettings {
    activity: boolean;       // Steps, active calories, workouts
    heart: boolean;          // Heart rate, resting HR, HRV
    sleep: boolean;          // Sleep stages, duration, sleep score
    oxygen: boolean;         // SpO2 saturation, respiratory rate
    vitals: boolean;         // Blood pressure, body temperature
    glucose: boolean;        // Blood glucose measurements
}

export interface ConnectedSourceRecord {
    source: HealthSource;
    name: string;
    status: ConnectionStatus;
    deviceModel?: string;
    batteryLevel?: number;
    lastSyncedAt?: string;
    permissions: HealthPermissionSettings;
    recordCount: number;
    errorMessage?: string;
}

export interface HealthIntegrationState {
    sources: Record<HealthSource, ConnectedSourceRecord>;
    latestMetrics: LatestBiometricsSummary;
    anomalies: ClinicalAnomaly[];
    recentDataPoints: HealthMetricDataPoint[];
    autoSyncEnabled: boolean;
    syncIntervalMinutes: number;
    isSyncing: boolean;
    lastGlobalSyncAt?: string;
}

/**
 * Summary shape stored in Supabase `user_metadata.wearable_data`
 * and consumed by AI consultation prompt.
 */
export interface WearableDataSummary {
    hasConnectedDevice: boolean;
    connectedSources: string[];
    lastSyncedAt: string;
    metrics: LatestBiometricsSummary;
    anomalies: ClinicalAnomaly[];
}
