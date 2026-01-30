import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Condition } from "@/lib/diagnosis/types";
import { UncertaintyEstimate } from "@/lib/diagnosis/advanced";
import { format } from "date-fns";

// Register fonts if needed, but we'll start with standard Helvetica
// Font.register({ family: 'Roboto', src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxK.woff2' });
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
        padding: 40,
        color: 'white',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitleContainer: {
        flexDirection: 'column',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#ccfbf1', // Teal-100
        opacity: 0.9,
    },
    headerDateContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '8 16',
        borderRadius: 8,
        alignItems: 'flex-end',
    },
    headerDateLabel: {
        fontSize: 10,
        color: '#ccfbf1',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    headerDateValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 40,
    },
    section: {
        marginBottom: 24,
    },
    // Patient Info Grid
    patientInfoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 24,
    },
    patientInfoItem: {
        flexDirection: 'column',
    },
    patientInfoLabel: {
        fontSize: 10,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    patientInfoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    // Diagnosis Card
    diagnosisCard: {
        backgroundColor: '#f0fdfa', // Teal-50
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: '#99f6e4', // Teal-200
        marginBottom: 32,
    },
    diagnosisLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f766e',
        backgroundColor: '#ccfbf1',
        alignSelf: 'flex-start',
        padding: '4 12',
        borderRadius: 12,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    diagnosisTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#134e4a', // Teal-900
        marginBottom: 12,
    },
    diagnosisDescription: {
        fontSize: 12,
        color: '#115e59', // Teal-800
        lineHeight: 1.5,
    },
    confidenceBadge: {
        position: 'absolute',
        top: 24,
        right: 24,
        backgroundColor: 'white',
        padding: '8 16',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#99f6e4',
        alignItems: 'center',
    },
    confidenceLabel: {
        fontSize: 8,
        color: '#0d9488',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    confidenceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0f766e',
    },
    // Symptoms & Alerts Row
    row: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 32,
    },
    column: {
        flex: 1,
    },
    columnTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        textTransform: 'uppercase',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 8,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#f1f5f9',
        padding: '6 12',
        borderRadius: 12,
        fontSize: 10,
        color: '#334155',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    alertItem: {
        flexDirection: 'row',
        backgroundColor: '#fffbeb',
        padding: 8,
        borderRadius: 4,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#fde68a',
    },
    alertText: {
        fontSize: 10,
        color: '#92400e',
        marginLeft: 4,
    },
    // Recommendations
    remedyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    remedyCard: {
        width: '48%', // Approx 2 columns
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    remedyTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    remedyDescription: {
        fontSize: 10,
        color: '#475569',
        lineHeight: 1.4,
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0f172a',
        padding: '24 40',
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
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 16,
    },
    disclaimerTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
    },
    disclaimerText: {
        fontSize: 8,
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
}

export const MedicalReportDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms,
    userName = "Patient"
}: MedicalReportPDFProps) => (
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
                            HA-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                        </Text>
                    </View>
                </View>

                {/* Diagnosis Card */}
                <View style={styles.diagnosisCard}>
                    <Text style={styles.diagnosisLabel}>Primary Diagnosis</Text>
                    <Text style={styles.diagnosisTitle}>{condition.name}</Text>
                    <Text style={styles.diagnosisDescription}>{condition.description}</Text>

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

                {/* Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.columnTitle}>Suggested Management</Text>
                    <View style={styles.remedyGrid}>
                        {condition.remedies.map((rem, i) => (
                            <View key={i} style={styles.remedyCard}>
                                <Text style={styles.remedyTitle}>{rem.name}</Text>
                                <Text style={styles.remedyDescription}>{rem.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

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
