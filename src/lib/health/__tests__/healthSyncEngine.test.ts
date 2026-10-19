import { describe, it, expect } from 'vitest';
import {
    detectClinicalAnomalies,
    parseAppleHealthXML,
    parseGoogleHealthJSON,
    getPresetHealthData,
    createDefaultHealthState,
    buildWearableSummary,
} from '../healthSyncEngine';

describe('healthSyncEngine', () => {
    it('creates a valid default health state', () => {
        const state = createDefaultHealthState();
        expect(state.sources.apple_health).toBeDefined();
        expect(state.sources.google_health_connect).toBeDefined();
        expect(state.sources.phone_sensors).toBeDefined();
        expect(state.sources.apple_health.status).toBe('disconnected');
    });

    it('parses realistic Apple Health XML export snippet', () => {
        const sampleXml = `
            <?xml version="1.0" encoding="UTF-8"?>
            <HealthData locale="en_US">
                <ExportDate value="2026-10-19 12:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierStepCount" sourceName="iPhone" unit="count" value="4500" startDate="2026-10-19 08:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierStepCount" sourceName="Apple Watch" unit="count" value="3500" startDate="2026-10-19 14:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierRestingHeartRate" sourceName="Apple Watch" unit="count/min" value="64" startDate="2026-10-19 07:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierOxygenSaturation" sourceName="Apple Watch" unit="%" value="0.98" startDate="2026-10-19 07:30:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierBloodPressureSystolic" sourceName="Omron" unit="mmHg" value="122" startDate="2026-10-19 09:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierBloodPressureDiastolic" sourceName="Omron" unit="mmHg" value="78" startDate="2026-10-19 09:00:00 +0530"/>
                <Record type="HKQuantityTypeIdentifierHeartRateVariabilitySDNN" sourceName="Apple Watch" unit="ms" value="48" startDate="2026-10-19 06:00:00 +0530"/>
            </HealthData>
        `;

        const { metrics, points } = parseAppleHealthXML(sampleXml);

        expect(metrics.steps).toBe(8000);
        expect(metrics.restingHeartRate).toBe(64);
        expect(metrics.bloodOxygenSpO2).toBe(98);
        expect(metrics.bloodPressureSystolic).toBe(122);
        expect(metrics.bloodPressureDiastolic).toBe(78);
        expect(metrics.hrvSdnnMs).toBe(48);
        expect(points.length).toBeGreaterThan(0);
    });

    it('parses Google Health Connect JSON export format', () => {
        const sampleJson = JSON.stringify({
            steps: 7250,
            restingHeartRate: 68,
            spo2: 97,
            sleepHours: 7.2,
            activeCalories: 410,
            bloodPressureSystolic: 120,
            bloodPressureDiastolic: 79,
        });

        const { metrics } = parseGoogleHealthJSON(sampleJson);

        expect(metrics.steps).toBe(7250);
        expect(metrics.restingHeartRate).toBe(68);
        expect(metrics.bloodOxygenSpO2).toBe(97);
        expect(metrics.sleepDurationHours).toBe(7.2);
        expect(metrics.activeCalories).toBe(410);
    });

    it('detects severe anomalies in febrile infection preset', () => {
        const febrile = getPresetHealthData('pixel_febrile');
        expect(febrile.metrics.restingHeartRate).toBe(88);
        expect(febrile.metrics.sleepDurationHours).toBe(4.4);
        expect(febrile.metrics.bodyTemperatureC).toBe(38.2);

        const anomalies = detectClinicalAnomalies(febrile.metrics);
        const anomalyIds = anomalies.map((a) => a.id);

        expect(anomalyIds).toContain('anom_rhr_high');
        expect(anomalyIds).toContain('anom_sleep_severe_deficit');
        expect(anomalyIds).toContain('anom_temp_fever');
    });

    it('builds wearable summary correctly for connected devices', () => {
        const state = createDefaultHealthState();
        state.sources.apple_health.status = 'connected';
        state.sources.phone_sensors.status = 'connected';
        state.latestMetrics = { steps: 5000, restingHeartRate: 70 };

        const summary = buildWearableSummary(state);
        expect(summary.hasConnectedDevice).toBe(true);
        expect(summary.connectedSources.length).toBe(2);
        expect(summary.metrics.steps).toBe(5000);
    });
});
