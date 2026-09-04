import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Condition, ReasoningTraceEntry } from "@/lib/diagnosis/types";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { format } from "date-fns";

// ─── Font Setup ───────────────────────────────────────────────────────────────
Font.register({
    family: 'Noto Sans',
    fonts: [
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
            fontWeight: 'normal',
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
            fontWeight: 'bold',
        },
    ],
});

const TYPE = {
    caption: 8,
    label: 9,
    body: 10,
    subhead: 12,
    heading: 14,
    title: 18,
};

// ─── Clean High-Contrast Lab Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        fontFamily: 'Noto Sans',
        padding: '28 32 44 32',
    },

    // ── Per-page Footer ───────────────────────────────────────────────────────
    pageFooter: {
        position: 'absolute',
        bottom: 16,
        left: 32,
        right: 32,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 4,
    },
    footerText: {
        fontSize: TYPE.caption,
        color: '#444444',
    },

    // ── Letterhead Header ─────────────────────────────────────────────────────
    letterhead: {
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        paddingBottom: 8,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    brandTitle: {
        fontSize: TYPE.title,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    brandSubtitle: {
        fontSize: TYPE.label,
        color: '#333333',
        marginTop: 2,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    metaHeaderBlock: {
        alignItems: 'flex-end',
    },
    metaHeaderLabel: {
        fontSize: TYPE.caption,
        color: '#555555',
        textTransform: 'uppercase',
    },
    metaHeaderValue: {
        fontSize: TYPE.body,
        fontWeight: 'bold',
        color: '#000000',
    },

    // ── Patient Demographics Block ────────────────────────────────────────────
    patientBlock: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: '6 10',
        marginBottom: 12,
        backgroundColor: '#fafafa',
    },
    patientGridRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    patientGridCol: {
        flex: 1,
        flexDirection: 'row',
    },
    patientKey: {
        fontSize: TYPE.label,
        fontWeight: 'bold',
        color: '#333333',
        width: 120,
        textTransform: 'uppercase',
    },
    patientVal: {
        fontSize: TYPE.label,
        color: '#000000',
        flex: 1,
    },

    // ── Extended Persona Profile Block ─────────────────────────────────────────
    personaBlock: {
        borderWidth: 1,
        borderColor: '#cccccc',
        padding: '6 10',
        marginBottom: 12,
        backgroundColor: '#ffffff',
    },
    personaHeader: {
        fontSize: TYPE.label,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingBottom: 2,
    },

    // ── Section Titles ────────────────────────────────────────────────────────
    sectionTitle: {
        fontSize: TYPE.subhead,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 3,
        marginBottom: 8,
        marginTop: 10,
        letterSpacing: 0.5,
    },

    // ── Clinical Assessment Block ─────────────────────────────────────────────
    assessmentName: {
        fontSize: TYPE.heading,
        fontWeight: 'bold',
        color: '#000000',
        marginBottom: 4,
    },
    assessmentText: {
        fontSize: TYPE.body,
        color: '#1a1a1a',
        lineHeight: 1.45,
        marginBottom: 8,
    },
    metricsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#cccccc',
        paddingVertical: 5,
        marginBottom: 10,
        backgroundColor: '#f5f5f5',
    },
    metricItem: {
        marginRight: 16,
        flexDirection: 'row',
        marginBottom: 2,
    },
    metricKey: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#444444',
        textTransform: 'uppercase',
        marginRight: 4,
    },
    metricVal: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#000000',
    },

    // ── Two Column Data Layout ────────────────────────────────────────────────
    twoColRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 10,
    },
    colHalf: {
        flex: 1,
    },

    // ── Bullet Lists & Block Text ─────────────────────────────────────────────
    bulletRow: {
        flexDirection: 'row',
        marginBottom: 3,
    },
    bulletDot: {
        fontSize: TYPE.body,
        fontWeight: 'bold',
        color: '#000000',
        width: 12,
    },
    bulletText: {
        fontSize: TYPE.body,
        color: '#1a1a1a',
        flex: 1,
        lineHeight: 1.4,
    },
    alertBodyText: {
        fontSize: TYPE.body,
        color: '#1a1a1a',
        lineHeight: 1.4,
        marginBottom: 4,
    },

    // ── Table Layout (Lab Report Style) ───────────────────────────────────────
    table: {
        borderWidth: 1,
        borderColor: '#000000',
        marginBottom: 12,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#e5e5e5',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingVertical: 5,
        paddingHorizontal: 6,
    },
    tableHeaderCell: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 5,
        paddingHorizontal: 6,
    },
    tableRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        paddingVertical: 5,
        paddingHorizontal: 6,
        backgroundColor: '#fafafa',
    },
    cellCategory: {
        width: 100,
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#333333',
        textTransform: 'uppercase',
    },
    cellRemedy: {
        width: 130,
        fontSize: TYPE.body,
        fontWeight: 'bold',
        color: '#000000',
        paddingRight: 6,
    },
    cellGuidance: {
        width: 160,
        fontSize: TYPE.body,
        color: '#222222',
        lineHeight: 1.35,
        paddingRight: 6,
    },
    cellAdmin: {
        width: 141,
        fontSize: TYPE.caption,
        color: '#333333',
        lineHeight: 1.35,
    },

    // ── Warning Box (Minimalist Red Left Border) ───────────────────────────────
    alertBox: {
        borderLeftWidth: 3,
        borderLeftColor: '#cc0000',
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e5e5e5',
        padding: 8,
        marginBottom: 10,
        backgroundColor: '#ffffff',
    },
    alertTitle: {
        fontSize: TYPE.label,
        fontWeight: 'bold',
        color: '#cc0000',
        textTransform: 'uppercase',
        marginBottom: 3,
    },

    // ── Sign Off Block (Zero Text Overlap) ────────────────────────────────────
    signOffRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#cccccc',
    },
    signOffBlock: {
        flexDirection: 'column',
    },
    signOffTitle: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#555555',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metadataText: {
        fontSize: TYPE.caption,
        color: '#1a1a1a',
        marginTop: 2,
        lineHeight: 1.3,
    },

    // ── Disclaimer Box ────────────────────────────────────────────────────────
    disclaimerBox: {
        borderWidth: 1,
        borderColor: '#cccccc',
        padding: 8,
        marginTop: 10,
        backgroundColor: '#fafafa',
    },
    disclaimerHeader: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#000000',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    disclaimerText: {
        fontSize: TYPE.caption,
        color: '#444444',
        lineHeight: 1.35,
    },
});

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface UserProfileSummary {
    age?: string;
    gender?: string;
    weight?: string;
    height?: string;
    medications?: string | string[];
    allergies?: string;
    conditions?: string[];
    familyHistory?: string | string[];
    smoking?: string;
    alcohol?: string;
    exercise?: string;
}

export interface SymptomDetailsSummary {
    duration?: string;
    frequency?: string;
    intensity?: number;
    triggers?: string;
    sensation?: string;
}

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
    userProfile?: UserProfileSummary;
    symptomDetails?: SymptomDetailsSummary;
    ddiAlerts?: string[];
    generatedAt?: Date;
}

interface MedicalReportPreviewProps {
    condition: Condition;
    confidence: number;
    uncertainty?: UncertaintyEstimate;
    alerts: string[];
    symptoms: string[];
    userName?: string;
}

// ─── Per-page Footer Component ────────────────────────────────────────────────
const PageFooterFixed = ({ reportId }: { reportId: string }) => (
    <View style={styles.pageFooter} fixed>
        <Text style={styles.footerText}>
            Arovia.AI · Confidential Health Assessment Report · ID: {reportId}
        </Text>
        <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
    </View>
);

// ─── Authentic Arovia.AI Medical Report Component ─────────────────────────────
export const MedicalReportDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts = [],
    symptoms = [],
    userName = 'PATIENT',
    reportId = 'HA-REPORT',
    clinicalRules = [],
    reasoningTrace = [],
    userProfile,
    symptomDetails,
    ddiAlerts = [],
    generatedAt,
}: MedicalReportPDFProps) => {
    const assessmentDate = generatedAt || new Date();
    const formattedDate = format(assessmentDate, 'dd-MMM-yyyy').toUpperCase();
    const formattedTime = format(assessmentDate, 'HH:mm').toUpperCase() + ' IST';

    // ── Build Dynamic Patient Demographic Items (NO DUMMY FALLBACKS, NO BP) ──────
    const demoItems: Array<{ key: string; val: string }> = [
        { key: 'PATIENT NAME:', val: (userName || 'PATIENT').toUpperCase() },
        { key: 'DATE & TIME:', val: `${formattedDate} ${formattedTime}` },
        { key: 'REPORT ID:', val: reportId },
        { key: 'ASSESSMENT TYPE:', val: 'Clinical Symptom Pattern Analysis' },
    ];

    if (userProfile?.age || userProfile?.gender) {
        const agePart = userProfile.age ? `${userProfile.age} YRS` : '';
        const genderPart = userProfile.gender ? userProfile.gender.toUpperCase() : '';
        const ageGender = [agePart, genderPart].filter(Boolean).join(' / ');
        demoItems.push({ key: 'AGE / GENDER:', val: ageGender });
    }
    if (userProfile?.weight) {
        demoItems.push({ key: 'WEIGHT:', val: userProfile.weight });
    }
    if (userProfile?.height) {
        demoItems.push({ key: 'HEIGHT:', val: userProfile.height });
    }

    // Pair items into 2-column rows for demographics block
    const demoRows: Array<Array<{ key: string; val: string }>> = [];
    for (let i = 0; i < demoItems.length; i += 2) {
        demoRows.push(demoItems.slice(i, i + 2));
    }

    // ── Extended Persona / History Items ──────────────────────────────────────
    const hasMedications = Boolean(userProfile?.medications);
    const hasAllergies = Boolean(userProfile?.allergies);
    const hasConditions = Boolean(userProfile?.conditions && userProfile.conditions.length > 0);
    const hasFamilyHistory = Boolean(userProfile?.familyHistory);
    const hasLifestyle = Boolean(userProfile?.smoking || userProfile?.alcohol || userProfile?.exercise);

    const hasExtendedPersona = hasMedications || hasAllergies || hasConditions || hasFamilyHistory || hasLifestyle;

    // Dynamic remedy consolidation — handles any number of remedies dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRemedies: any[] = [
        ...(condition.home_remedies || []).map(r => ({ ...r, category: 'Home Remedy' })),
        ...(condition.indianHomeRemedies || []).map(r => ({ ...r, category: 'Ayurvedic Care' })),
        ...(condition.ayurvedic_remedies || []).map(r => ({ ...r, category: 'Ayurvedic Care' })),
        ...(condition.homeopathic_remedies || []).map(r => ({ ...r, category: 'Homeopathic' })),
        ...(condition.remedies || []).map(r => ({ ...r, category: 'General Care' })),
    ];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <PageFooterFixed reportId={reportId} />

                {/* Letterhead Header */}
                <View style={styles.letterhead}>
                    <View>
                        <Text style={styles.brandTitle}>AROVIA.AI</Text>
                        <Text style={styles.brandSubtitle}>AI-Assisted Clinical Health Assessment</Text>
                    </View>
                    <View style={styles.metaHeaderBlock}>
                        <Text style={styles.metaHeaderLabel}>Report ID</Text>
                        <Text style={styles.metaHeaderValue}>{reportId}</Text>
                    </View>
                </View>

                {/* Dynamic Patient Demographics (ONLY Known Data Rendered, NO BP) */}
                <View style={styles.patientBlock} wrap={false}>
                    {demoRows.map((row, rIdx) => (
                        <View key={rIdx} style={styles.patientGridRow}>
                            {row.map((item, cIdx) => (
                                <View key={cIdx} style={styles.patientGridCol}>
                                    <Text style={styles.patientKey}>{item.key}</Text>
                                    <Text style={styles.patientVal}>{item.val}</Text>
                                </View>
                            ))}
                            {row.length === 1 && <View style={styles.patientGridCol} />}
                        </View>
                    ))}
                </View>

                {/* Extended Patient Persona & Clinical History */}
                {hasExtendedPersona && (
                    <View style={styles.personaBlock} wrap={false}>
                        <Text style={styles.personaHeader}>PATIENT CLINICAL HISTORY &amp; PERSONA PROFILE</Text>
                        {hasMedications && (
                            <View style={styles.bulletRow}>
                                <Text style={styles.patientKey}>MEDICATIONS:</Text>
                                <Text style={styles.bulletText}>
                                    {Array.isArray(userProfile!.medications)
                                        ? userProfile!.medications.join(', ')
                                        : userProfile!.medications}
                                </Text>
                            </View>
                        )}
                        {hasAllergies && (
                            <View style={styles.bulletRow}>
                                <Text style={styles.patientKey}>ALLERGIES:</Text>
                                <Text style={styles.bulletText}>{userProfile!.allergies}</Text>
                            </View>
                        )}
                        {hasConditions && (
                            <View style={styles.bulletRow}>
                                <Text style={styles.patientKey}>PRE-EXISTING:</Text>
                                <Text style={styles.bulletText}>
                                    {Array.isArray(userProfile!.conditions)
                                        ? userProfile!.conditions.join(', ')
                                        : userProfile!.conditions}
                                </Text>
                            </View>
                        )}
                        {hasFamilyHistory && (
                            <View style={styles.bulletRow}>
                                <Text style={styles.patientKey}>FAMILY HISTORY:</Text>
                                <Text style={styles.bulletText}>
                                    {Array.isArray(userProfile!.familyHistory)
                                        ? userProfile!.familyHistory.join(', ')
                                        : userProfile!.familyHistory}
                                </Text>
                            </View>
                        )}
                        {hasLifestyle && (
                            <View style={styles.bulletRow}>
                                <Text style={styles.patientKey}>LIFESTYLE:</Text>
                                <Text style={styles.bulletText}>
                                    {[
                                        userProfile!.smoking ? `Smoking: ${userProfile!.smoking}` : null,
                                        userProfile!.alcohol ? `Alcohol: ${userProfile!.alcohol}` : null,
                                        userProfile!.exercise ? `Exercise: ${userProfile!.exercise}` : null,
                                    ].filter(Boolean).join(' | ')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 1. Primary Clinical Assessment Impression */}
                <Text style={styles.sectionTitle}>1. Primary Clinical Assessment Impression</Text>
                <Text style={styles.assessmentName}>{condition.name}</Text>
                <Text style={styles.assessmentText}>{condition.description}</Text>

                {/* Metrics Summary Strip */}
                <View style={styles.metricsRow} wrap={false}>
                    {condition.severity && (
                        <View style={styles.metricItem}>
                            <Text style={styles.metricKey}>SEVERITY:</Text>
                            <Text style={styles.metricVal}>{condition.severity.toUpperCase()}</Text>
                        </View>
                    )}
                    <View style={styles.metricItem}>
                        <Text style={styles.metricKey}>CONFIDENCE SCORE:</Text>
                        <Text style={styles.metricVal}>
                            {uncertainty ? uncertainty.pointEstimate.toFixed(0) : confidence}%
                        </Text>
                    </View>
                    {uncertainty && (
                        <View style={styles.metricItem}>
                            <Text style={styles.metricKey}>95% CONFIDENCE INTERVAL:</Text>
                            <Text style={styles.metricVal}>
                                {uncertainty.confidenceInterval.lower.toFixed(0)}% – {uncertainty.confidenceInterval.upper.toFixed(0)}%
                            </Text>
                        </View>
                    )}
                    {uncertainty?.evidenceQuality && (
                        <View style={styles.metricItem}>
                            <Text style={styles.metricKey}>EVIDENCE QUALITY:</Text>
                            <Text style={styles.metricVal}>{uncertainty.evidenceQuality}</Text>
                        </View>
                    )}
                    {condition.prevalence && (
                        <View style={styles.metricItem}>
                            <Text style={styles.metricKey}>PREVALENCE:</Text>
                            <Text style={styles.metricVal}>{condition.prevalence.replace('_', ' ').toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                {/* 2. Reported Symptoms & Clinical Alerts */}
                <Text style={styles.sectionTitle}>2. Reported Symptoms &amp; Clinical Alerts</Text>
                <View style={styles.twoColRow} wrap={false}>
                    <View style={styles.colHalf}>
                        <Text style={[styles.patientKey, { marginBottom: 4 }]}>REPORTED SYMPTOMS:</Text>
                        {symptoms.length > 0 ? (
                            symptoms.map((symptom, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <Text style={styles.bulletDot}>•</Text>
                                    <Text style={styles.bulletText}>{symptom}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.bulletRow}>
                                <Text style={styles.bulletDot}>•</Text>
                                <Text style={styles.bulletText}>Symptoms evaluated during consultation session</Text>
                            </View>
                        )}
                        {symptomDetails && (
                            <View style={{ marginTop: 4 }}>
                                {symptomDetails.duration && (
                                    <Text style={styles.metadataText}>Duration: {symptomDetails.duration}</Text>
                                )}
                                {symptomDetails.intensity !== undefined && (
                                    <Text style={styles.metadataText}>Intensity: {symptomDetails.intensity}/10</Text>
                                )}
                                {symptomDetails.frequency && (
                                    <Text style={styles.metadataText}>Frequency: {symptomDetails.frequency}</Text>
                                )}
                            </View>
                        )}
                    </View>

                    <View style={styles.colHalf}>
                        <Text style={[styles.patientKey, { marginBottom: 4 }]}>CLINICAL ALERTS:</Text>
                        {alerts.length > 0 ? (
                            alerts.map((alert, i) => (
                                <View key={i} style={styles.bulletRow}>
                                    <Text style={[styles.bulletDot, { color: '#cc0000' }]}>!</Text>
                                    <Text style={styles.bulletText}>{alert}</Text>
                                </View>
                            ))
                        ) : (
                            <View style={styles.bulletRow}>
                                <Text style={[styles.bulletDot, { color: '#008800' }]}>✓</Text>
                                <Text style={styles.bulletText}>No immediate high-risk red flags identified.</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 3. Supportive Management & Remedies Table */}
                {allRemedies.length > 0 && (
                    <View style={{ marginTop: 6 }}>
                        <Text style={styles.sectionTitle}>3. Recommended Supportive Management &amp; Remedies</Text>
                        <View style={styles.table}>
                            {/* Table Header */}
                            <View style={styles.tableHeaderRow} fixed>
                                <Text style={styles.cellCategory}>CATEGORY</Text>
                                <Text style={styles.cellRemedy}>REMEDY / CARE STEP</Text>
                                <Text style={styles.cellGuidance}>INDICATION &amp; GUIDANCE</Text>
                                <Text style={styles.cellAdmin}>HOW TO USE / ADMINISTRATION</Text>
                            </View>

                            {/* Table Rows — Dynamic Auto-Flowing */}
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {allRemedies.map((rem: any, idx: number) => (
                                <View
                                    key={idx}
                                    style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                    wrap={false}
                                >
                                    <Text style={styles.cellCategory}>{rem.category}</Text>
                                    <Text style={styles.cellRemedy}>{rem.name || rem.remedy}</Text>
                                    <Text style={styles.cellGuidance}>{rem.description || rem.indication}</Text>
                                    <Text style={styles.cellAdmin}>
                                        {rem.method || rem.dosage || rem.preparation || 'As directed by healthcare provider'}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* 4. Recommended Next Steps & Emergency Safety */}
                <Text style={styles.sectionTitle}>4. Recommended Next Steps &amp; Safety Guidance</Text>
                <View style={{ marginBottom: 8 }} wrap={false}>
                    {[
                        'Monitor symptoms over the next 24–48 hours and track any change in intensity or character.',
                        'Maintain adequate oral hydration and rest unless clinically contraindicated.',
                        confidence < 75
                            ? `Diagnostic confidence is ${confidence}%. A formal clinical evaluation by a registered physician is advised.`
                            : null,
                        'Share this structured assessment with your registered medical practitioner (RMP) during your consultation.',
                        'Do not self-prescribe medication. All recommendations are supportive and supplementary.',
                    ].filter(Boolean).map((step, i) => (
                        <View key={i} style={styles.bulletRow}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Critical Emergency Criteria — FIXED NO OVERLAPPING TEXT */}
                {(condition.seekHelp || (condition.redFlags?.length ?? 0) > 0) && (
                    <View style={styles.alertBox} wrap={false}>
                        <Text style={styles.alertTitle}>CRITICAL EMERGENCY SAFETY CRITERIA</Text>
                        {condition.seekHelp && (
                            <Text style={styles.alertBodyText}>{condition.seekHelp}</Text>
                        )}
                        {condition.redFlags?.map((flag, i) => (
                            <View key={i} style={styles.bulletRow}>
                                <Text style={[styles.bulletDot, { color: '#cc0000' }]}>!</Text>
                                <Text style={styles.bulletText}>{flag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. Clinical Rules & Diagnostic Factors (Dynamic) */}
                {(clinicalRules.length > 0 || reasoningTrace.length > 0) && (
                    <View style={{ marginBottom: 8 }} wrap={false}>
                        <Text style={styles.sectionTitle}>5. Applied Clinical Rules &amp; Factors</Text>
                        {clinicalRules.slice(0, 4).map((rule, idx) => (
                            <View key={idx} style={styles.bulletRow}>
                                <Text style={styles.bulletDot}>-</Text>
                                <Text style={styles.bulletText}>
                                    <Text style={{ fontWeight: 'bold' }}>{rule.rule}: </Text>
                                    {rule.interpretation}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* DDI Warnings (Dynamic) */}
                {ddiAlerts.length > 0 && (
                    <View style={[styles.alertBox, { borderLeftColor: '#ff8800' }]} wrap={false}>
                        <Text style={[styles.alertTitle, { color: '#cc6600' }]}>MEDICATION INTERACTION NOTICES</Text>
                        {ddiAlerts.map((alert, i) => (
                            <Text key={i} style={styles.bulletText}>• {alert}</Text>
                        ))}
                    </View>
                )}

                {/* 6. Regulatory & Legal Disclaimer */}
                <View style={styles.disclaimerBox} wrap={false}>
                    <Text style={styles.disclaimerHeader}>IMPORTANT MEDICAL &amp; LEGAL DISCLAIMER</Text>
                    <Text style={styles.disclaimerText}>
                        INFORMATIONAL USE ONLY: This report is generated by Arovia.AI health information engine for informational purposes only. It does not constitute a clinical medical diagnosis, prescription, or treatment plan under the Indian Medical Council Act, 1956 or Drugs and Cosmetics Act, 1940. Always consult a licensed registered medical practitioner (RMP) before making healthcare decisions. Generated in compliance with the Digital Personal Data Protection (DPDP) Act, 2023.
                    </Text>
                </View>

                {/* Official Sign-Off Block */}
                <View style={styles.signOffRow} wrap={false}>
                    <View style={styles.signOffBlock}>
                        <Text style={styles.signOffTitle}>SYSTEM METADATA</Text>
                        <Text style={styles.metadataText}>Engine: Arovia Clinical Assessment Engine v2.0</Text>
                        <Text style={styles.metadataText}>Timestamp: {formattedDate} {formattedTime}</Text>
                    </View>
                    <View style={styles.signOffBlock}>
                        <Text style={styles.signOffTitle}>VERIFIED BY</Text>
                        <Text style={[styles.metadataText, { fontWeight: 'bold' }]}>AROVIA.AI CLINICAL ENGINE</Text>
                        <Text style={styles.metadataText}>Verification ID: {reportId}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ─── Watermarked Preview Document ─────────────────────────────────────────────
export const MedicalReportPreviewDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms = [],
    userName = 'PATIENT',
}: MedicalReportPreviewProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.letterhead}>
                <View>
                    <Text style={styles.brandTitle}>AROVIA.AI</Text>
                    <Text style={styles.brandSubtitle}>Clinical Assessment Report — Preview Version</Text>
                </View>
                <View style={styles.metaHeaderBlock}>
                    <Text style={styles.metaHeaderLabel}>Report Status</Text>
                    <Text style={styles.metaHeaderValue}>PREVIEW</Text>
                </View>
            </View>

            <View style={styles.patientBlock}>
                <View style={styles.patientGridRow}>
                    <View style={styles.patientGridCol}>
                        <Text style={styles.patientKey}>PATIENT NAME:</Text>
                        <Text style={styles.patientVal}>{userName.toUpperCase()}</Text>
                    </View>
                    <View style={styles.patientGridCol}>
                        <Text style={styles.patientKey}>DATE:</Text>
                        <Text style={styles.patientVal}>{format(new Date(), 'dd-MMM-yyyy').toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>1. Primary Clinical Assessment Impression</Text>
            <Text style={styles.assessmentName}>{condition.name}</Text>
            <Text style={styles.assessmentText}>{condition.description}</Text>

            <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                    <Text style={styles.metricKey}>SEVERITY:</Text>
                    <Text style={styles.metricVal}>{(condition.severity || 'MILD').toUpperCase()}</Text>
                </View>
                <View style={styles.metricItem}>
                    <Text style={styles.metricKey}>CONFIDENCE SCORE:</Text>
                    <Text style={styles.metricVal}>
                        {uncertainty ? uncertainty.pointEstimate.toFixed(0) : confidence}%
                    </Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>2. Reported Symptoms</Text>
            {(symptoms.length > 0 ? symptoms : ['Upper abdominal discomfort', 'Mild nausea']).map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{s}</Text>
                </View>
            ))}

            <View style={styles.disclaimerBox} wrap={false}>
                <Text style={styles.disclaimerHeader}>PREVIEW VERSION</Text>
                <Text style={styles.disclaimerText}>
                    This is a preview document. Upgrade to Arovia Plus to access full supportive management tables, clinical rule traces, and doctor-ready PDF exports.
                </Text>
            </View>
        </Page>
    </Document>
);
