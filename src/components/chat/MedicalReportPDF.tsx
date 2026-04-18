import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Condition, ReasoningTraceEntry } from "@/lib/diagnosis/types";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { format } from "date-fns";

// For now, using standard built-in fonts for reliability

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        padding: 0,
    },
    header: {
        backgroundColor: '#0f766e', // Teal-700
        padding: 30,
        color: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitleContainer: {
        flexDirection: 'column',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#ccfbf1', // Teal-100
        opacity: 0.9,
    },
    headerDateContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '6 12',
        borderRadius: 8,
        alignItems: 'flex-end',
    },
    headerDateLabel: {
        fontSize: 8,
        color: '#ccfbf1',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    headerDateValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 30,
    },
    section: {
        marginBottom: 20,
    },
    // Patient Info Grid
    patientInfoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 16,
    },
    patientInfoItem: {
        flexDirection: 'column',
    },
    patientInfoLabel: {
        fontSize: 8,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    patientInfoValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    // Diagnosis Card
    diagnosisCard: {
        backgroundColor: '#f0fdfa', // Teal-50
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#99f6e4', // Teal-200
        marginBottom: 20,
    },
    diagnosisLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#0f766e',
        backgroundColor: '#ccfbf1',
        alignSelf: 'flex-start',
        padding: '4 8',
        borderRadius: 8,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    diagnosisTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#134e4a', // Teal-900
        marginBottom: 8,
    },
    diagnosisDescription: {
        fontSize: 10,
        color: '#115e59', // Teal-800
        lineHeight: 1.4,
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 10,
    },
    badge: {
        padding: '4 8',
        borderRadius: 4,
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    badgeSevere: { backgroundColor: '#fecaca', color: '#991b1b' },
    badgeModerate: { backgroundColor: '#fef08a', color: '#854d0e' },
    badgeMild: { backgroundColor: '#bbf7d0', color: '#166534' },
    badgeDefault: { backgroundColor: '#e2e8f0', color: '#334155' },
    
    confidenceBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'white',
        padding: '6 12',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#99f6e4',
        alignItems: 'center',
    },
    confidenceLabel: {
        fontSize: 6,
        color: '#0d9488',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    confidenceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f766e',
    },
    // Rows and Columns
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    column: {
        flex: 1,
    },
    columnTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 6,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    tag: {
        backgroundColor: '#f1f5f9',
        padding: '4 8',
        borderRadius: 8,
        fontSize: 8,
        color: '#334155',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    alertItem: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        padding: 6,
        borderRadius: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    alertText: {
        fontSize: 8,
        color: '#92400e',
        marginLeft: 4,
    },
    warningItem: {
        flexDirection: 'row',
        backgroundColor: '#fef2f2',
        padding: 6,
        borderRadius: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    warningBullet: {
        fontSize: 8,
        color: '#991b1b',
        marginRight: 4,
    },
    warningText: {
        fontSize: 8,
        color: '#991b1b',
        marginLeft: 4,
        flex: 1,
    },
    // Rules and Trace
    ruleItem: {
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
        borderLeftWidth: 2,
        borderLeftColor: '#94a3b8',
    },
    ruleText: { fontSize: 8, color: '#475569' },
    ruleTextBold: { fontWeight: 'bold', color: '#0f172a' },
    
    traceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 4,
        alignItems: 'center',
    },
    traceFactor: { fontSize: 8, color: '#334155', flex: 1 },
    traceImpactBadge: { padding: '2 4', borderRadius: 2, fontSize: 6, fontWeight: 'bold' },
    traceImpactHigh: { backgroundColor: '#d1fae5', color: '#065f46' },
    traceImpactLow: { backgroundColor: '#fee2e2', color: '#991b1b' },
    
    // Recommendations
    remedyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    remedyCard: {
        width: '48%', // Approx 2 columns
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
    },
    remedyTypeLabel: {
        fontSize: 6,
        textTransform: 'uppercase',
        color: '#64748b',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    remedyTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    remedyDescription: {
        fontSize: 8,
        color: '#475569',
        lineHeight: 1.4,
        marginBottom: 4,
    },
    remedyMethod: {
        fontSize: 8,
        color: '#64748b',
        fontStyle: 'italic',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        padding: '16 30',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#94a3b8',
    },
    disclaimer: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12,
    },
    disclaimerTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
    },
    disclaimerText: {
        fontSize: 6,
        color: '#64748b',
        lineHeight: 1.4,
    }
});

interface MedicalReportPDFProps {
    condition: Condition;
    confidence: number;
    uncertainty?: UncertaintyEstimate;
    alerts: string[];
    symptoms: string[];
    userName?: string;
    reportId?: string;
    clinicalRules?: RuleResult[];
    reasoningTrace?: ReasoningTraceEntry[];
}

// Helper to determine severity color
const getSeverityStyle = (severity?: string) => {
    if (!severity) return styles.badgeDefault;
    const s = severity.toLowerCase();
    if (s.includes('severe') || s.includes('critical')) return styles.badgeSevere;
    if (s.includes('moderate')) return styles.badgeModerate;
    if (s.includes('mild') || s.includes('benign')) return styles.badgeMild;
    return styles.badgeDefault;
};

export const MedicalReportDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms,
    userName = "Patient",
    reportId = "HA-REPORT",
    clinicalRules = [],
    reasoningTrace = []
}: MedicalReportPDFProps) => {
    
    // Consolidate remedy types into a flat list with types
    const allRemedies = [
        ...(condition.home_remedies || []).map(r => ({ ...r, type: 'Home Remedy' })),
        ...(condition.indianHomeRemedies || []).map(r => ({ ...r, type: 'Indian Home Remedy' })),
        ...(condition.ayurvedic_remedies || []).map(r => ({ ...r, type: 'Ayurvedic' })),
        ...(condition.homeopathic_remedies || []).map(r => ({ ...r, type: 'Homeopathic' })),
        ...(condition.remedies || []).map(r => ({ ...r, type: 'General' })),
    ].slice(0, 8); // Limit to top 8 to fit nicely on page

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Healio.AI</Text>
                        <Text style={styles.headerSubtitle}>Medical Assessment Report</Text>
                    </View>
                    <View style={styles.headerDateContainer}>
                        <Text style={styles.headerDateLabel}>Report Date</Text>
                        <Text style={styles.headerDateValue}>{format(new Date(), "MMM d, yyyy")}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Patient Info */}
                    <View style={styles.patientInfoGrid}>
                        <View style={styles.patientInfoItem}>
                            <Text style={styles.patientInfoLabel}>Patient Name</Text>
                            <Text style={styles.patientInfoValue}>{userName}</Text>
                        </View>
                        <View style={styles.patientInfoItem}>
                            <Text style={styles.patientInfoLabel}>Report ID</Text>
                            <Text style={[styles.patientInfoValue, { fontFamily: 'Courier' }]}>
                                {reportId}
                            </Text>
                        </View>
                    </View>

                    {/* Diagnosis Card */}
                    <View style={styles.diagnosisCard}>
                        <Text style={styles.diagnosisLabel}>Primary Diagnosis</Text>
                        <Text style={styles.diagnosisTitle}>{condition.name}</Text>
                        <Text style={styles.diagnosisDescription}>{condition.description}</Text>
                        
                        <View style={styles.badgeContainer}>
                            {condition.severity && (
                                <Text style={[styles.badge, getSeverityStyle(condition.severity)]}>
                                    Severity: {condition.severity}
                                </Text>
                            )}
                            {condition.prevalence && (
                                <Text style={[styles.badge, styles.badgeDefault]}>
                                    Prevalence: {condition.prevalence.replace('_', ' ')}
                                </Text>
                            )}
                        </View>

                        <View style={styles.confidenceBadge}>
                            <Text style={styles.confidenceLabel}>Confidence</Text>
                            <Text style={styles.confidenceValue}>
                                {uncertainty ? uncertainty.pointEstimate.toFixed(0) : confidence}%
                            </Text>
                        </View>
                    </View>

                    {/* Symptoms & Alerts */}
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.columnTitle}>Reported Symptoms</Text>
                            <View style={styles.tagContainer}>
                                {symptoms.map((s, i) => (
                                    <Text key={i} style={styles.tag}>{s}</Text>
                                ))}
                            </View>
                        </View>
                        <View style={styles.column}>
                            <Text style={[styles.columnTitle, { color: '#b45309' }]}>Clinical Alerts</Text>
                            {alerts.length > 0 ? (
                                alerts.map((alert, i) => (
                                    <View key={i} style={styles.alertItem}>
                                        <Text style={styles.alertText}>• {alert}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.alertText, { color: '#64748b', fontStyle: 'italic' }]}>
                                    No specific red flags identified.
                                </Text>
                            )}
                        </View>
                    </View>
                    
                    {/* Reasoning & Rules */}
                    {(clinicalRules.length > 0 || reasoningTrace.length > 0) && (
                        <View style={styles.row}>
                            {clinicalRules.length > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>Clinical Rules Applied</Text>
                                    {clinicalRules.slice(0, 4).map((rule, idx) => (
                                        <View key={idx} style={styles.ruleItem}>
                                            <Text style={styles.ruleText}>
                                                <Text style={styles.ruleTextBold}>{rule.rule}: </Text>
                                                {rule.interpretation}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {reasoningTrace.length > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>Diagnostic Reasoning</Text>
                                    {reasoningTrace
                                        .filter(t => Math.abs(t.impact) > 0.5)
                                        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                                        .slice(0, 6)
                                        .map((trace, idx) => (
                                            <View key={idx} style={styles.traceItem}>
                                                <Text style={styles.traceFactor}>{trace.factor}</Text>
                                                <Text style={[styles.traceImpactBadge, trace.impact > 0 ? styles.traceImpactHigh : styles.traceImpactLow]}>
                                                    {trace.impact > 0 ? "+" : ""}{trace.impact > 2 ? "Strong" : "Contributing"}
                                                </Text>
                                            </View>
                                        ))
                                    }
                                </View>
                            )}
                        </View>
                    )}

                    {/* Extended Recommendations */}
                    {allRemedies.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.columnTitle}>Suggested Management & Remedies</Text>
                            <View style={styles.remedyGrid}>
                                {allRemedies.map((rem: any, i) => (
                                    <View key={i} style={styles.remedyCard}>
                                        <Text style={styles.remedyTypeLabel}>{rem.type}</Text>
                                        <Text style={styles.remedyTitle}>{rem.name || rem.remedy}</Text>
                                        <Text style={styles.remedyDescription}>{rem.description || rem.indication}</Text>
                                        {(rem.method || rem.dosage || rem.preparation) && (
                                            <Text style={styles.remedyMethod}>Usage: {rem.method || rem.dosage || rem.preparation}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    
                    {/* Exercises & Precautions */}
                    {((condition.exercises?.length ?? 0) > 0 || (condition.warnings?.length ?? 0) > 0) && (
                        <View style={styles.row}>
                            {(condition.exercises?.length ?? 0) > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>Recommended Exercises</Text>
                                    {condition.exercises?.map((ex, i) => (
                                        <View key={i} style={styles.ruleItem}>
                                            <Text style={styles.ruleTextBold}>{ex.name} {ex.duration ? `(${ex.duration})` : ''}</Text>
                                            <Text style={styles.ruleText}>{ex.description}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {(condition.warnings?.length ?? 0) > 0 && (
                                <View style={styles.column}>
                                    <Text style={[styles.columnTitle, { color: '#991b1b' }]}>Precautions & Warnings</Text>
                                    {condition.warnings?.map((w, i) => (
                                        <View key={i} style={styles.warningItem}>
                                            <Text style={styles.warningBullet}>•</Text>
                                            <Text style={styles.warningText}>{w}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Disclaimer */}
                    <View style={styles.disclaimer}>
                        <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
                        <Text style={styles.disclaimerText}>
                            This report is generated by an artificial intelligence system (Healio.AI) and is intended for informational purposes only.
                            It does not constitute a medical diagnosis, treatment, or professional medical advice.
                            Always seek the advice of a physician or other qualified health provider with any questions you may have regarding a medical condition.
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>© {new Date().getFullYear()} Healio.AI. All rights reserved.</Text>
                    <Text style={styles.footerText}>AI-Assisted Assessment • HIPAA Compliant</Text>
                </View>
            </Page>
        </Document>
    );
};
