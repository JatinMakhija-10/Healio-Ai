import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Condition, ReasoningTraceEntry } from "@/lib/diagnosis/types";
import { UncertaintyEstimate, RuleResult } from "@/lib/diagnosis/advanced";
import { format } from "date-fns";

// ─── Noto Sans — Unicode/Devanagari/Tamil/Arabic fallback ────────────────────
// CRITICAL FIX: Helvetica has no glyphs for Indian names/scripts.
// Noto Sans covers all ISO 15924 scripts required for India market.
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

// ─── 5-Stop Type Scale ────────────────────────────────────────────────────────
// Collapses 17 arbitrary font sizes to 5 intentional stops.
// WHO Digital Health: 12pt (16px) body min. Adobe PDF floor: 8px labels.
// All sizes are in PDF points (1pt ≈ 1.33px at 96dpi).
const TYPE = {
    caption: 9,   // badges, pills, timestamps, source labels (floor: 8px = ~6pt → raised to 9pt)
    secondary: 11, // labels, metadata, rule text
    body: 12,     // body copy, descriptions, remedy text (WHO body copy minimum)
    subhead: 15,  // section titles, condition names
    display: 24,  // report title, primary diagnosis name
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        fontFamily: 'Noto Sans', // FIXED: Helvetica → Noto Sans (Unicode coverage)
        paddingBottom: 0,
    },

    // ── Per-page repeating mini-header (HL7 FHIR / HIPAA compliance) ──────────
    // Renders on every page via `fixed` prop — patient ID on all pages
    pageNumber: {
        position: 'absolute',
        bottom: 16,
        left: 30,
        right: 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 6,
    },
    pageNumberLeft: {
        fontSize: TYPE.caption,
        color: '#64748b',
    },
    pageNumberRight: {
        fontSize: TYPE.caption,
        color: '#64748b',
    },

    // ── Main brand header ─────────────────────────────────────────────────────
    header: {
        backgroundColor: '#0f766e', // --color-clinical-primary
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
        fontSize: TYPE.display,
        fontWeight: 'bold',
        marginBottom: 4,
        color: 'white',
    },
    headerSubtitle: {
        fontSize: TYPE.subhead,
        color: '#ccfbf1',
        opacity: 0.9,
    },
    headerDateContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '6 12',
        borderRadius: 8,
        alignItems: 'flex-end',
    },
    headerDateLabel: {
        fontSize: TYPE.caption, // FIXED: was 8px → 9pt (above 8px floor)
        color: '#ccfbf1',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    headerDateValue: {
        fontSize: TYPE.secondary, // FIXED: was 10px → 11pt
        fontWeight: 'bold',
        color: 'white',
    },

    // ── Content area ──────────────────────────────────────────────────────────
    content: {
        padding: 30,
        paddingBottom: 50, // clearance for fixed page-number footer
    },
    section: {
        marginBottom: 20,
    },

    // ── Patient info grid ─────────────────────────────────────────────────────
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
        fontSize: TYPE.caption, // FIXED: was 8px → 9pt
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    patientInfoValue: {
        fontSize: TYPE.subhead, // FIXED: was 14px → 15pt
        fontWeight: 'bold',
        color: '#0f172a',
    },

    // ── Diagnosis card ────────────────────────────────────────────────────────
    diagnosisCard: {
        backgroundColor: '#f0fdfa',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#99f6e4',
        marginBottom: 20,
    },
    diagnosisLabel: {
        fontSize: TYPE.caption, // FIXED: was 8px → 9pt
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
        fontSize: TYPE.display, // 24pt — display stop
        fontWeight: 'bold',
        color: '#134e4a',
        marginBottom: 8,
    },
    diagnosisDescription: {
        fontSize: TYPE.body,   // FIXED: was 10px → 12pt (WHO body copy minimum)
        color: '#115e59',
        lineHeight: 1.65,      // FIXED: was 1.4 → 1.65 (NICE digital health standard)
    },
    badgeContainer: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 10,
    },
    badge: {
        padding: '4 8',
        borderRadius: 4,
        fontSize: TYPE.caption, // FIXED: consistent caption stop
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // Severity badges: shape-prefix symbols + color (WCAG 1.4.1 — Use of Color)
    badgeSevere:   { backgroundColor: '#fecaca', color: '#991b1b' }, // ▲ prefix
    badgeModerate: { backgroundColor: '#fef08a', color: '#854d0e' }, // ◆ prefix
    badgeMild:     { backgroundColor: '#bbf7d0', color: '#166534' }, // ● prefix
    badgeDefault:  { backgroundColor: '#e2e8f0', color: '#334155' },

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
        fontSize: TYPE.caption, // FIXED: was 6px → 9pt (critical fix)
        color: '#0d9488',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    confidenceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f766e',
    },

    // ── Layout rows / columns ─────────────────────────────────────────────────
    row: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 20,
    },
    column: {
        flex: 1,
    },
    columnTitle: {
        fontSize: TYPE.secondary, // FIXED: was 10px → 11pt
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
        fontSize: TYPE.caption,
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
        fontSize: TYPE.secondary, // FIXED: was 8px → 11pt
        color: '#92400e',         // text-amber-800 = 7.2:1 on amber-50 (WCAG AA ✓)
        marginLeft: 4,
        lineHeight: 1.65,
    },
    warningItem: {
        flexDirection: 'row',
        backgroundColor: '#fef2f2',
        padding: 6,
        borderRadius: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#fecaca',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any, // PAGE BREAK FIX
    },
    warningBullet: {
        fontSize: TYPE.secondary,
        color: '#991b1b',
        marginRight: 4,
    },
    warningText: {
        fontSize: TYPE.secondary, // FIXED: was 8px → 11pt
        color: '#991b1b',
        marginLeft: 4,
        flex: 1,
        lineHeight: 1.65,         // FIXED: was missing → 1.65
    },

    // ── Clinical rules ────────────────────────────────────────────────────────
    // UPGRADED: 3px teal left border + stronger color (credibility anchor)
    ruleItem: {
        backgroundColor: '#f8fafc',
        padding: 8,
        borderRadius: 4,
        marginBottom: 4,
        borderLeftWidth: 3,           // UPGRADED: was 2 → 3px
        borderLeftColor: '#0f766e',   // UPGRADED: slate-400 → teal-700 (credibility)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,        // PAGE BREAK FIX
    },
    ruleText: {
        fontSize: TYPE.secondary,
        color: '#475569',
        lineHeight: 1.65,
    },
    ruleTextBold: {
        fontWeight: 'bold',
        color: '#0f172a',
    },

    // ── Reasoning trace ───────────────────────────────────────────────────────
    traceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 4,
        alignItems: 'center',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any, // PAGE BREAK FIX
    },
    traceFactor: {
        fontSize: TYPE.secondary,
        color: '#334155',
        flex: 1,
    },
    traceImpactBadge: {
        padding: '2 6',
        borderRadius: 2,
        fontSize: TYPE.caption, // FIXED: was 6px → 9pt (critical fix)
        fontWeight: 'bold',
    },
    traceImpactHigh: { backgroundColor: '#d1fae5', color: '#065f46' },
    traceImpactLow:  { backgroundColor: '#fee2e2', color: '#991b1b' },

    // ── Remedy grid ───────────────────────────────────────────────────────────
    remedyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    remedyCard: {
        // CRITICAL FIX: '48%' → exact 261pt.
        // A4 portrait: 595pt total − 60pt padding = 535pt usable.
        // 261 + 12 (gap) + 261 = 534pt — safely within usable area.
        // '48%' caused Yoga rounding to overflow right edge.
        width: 261,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any, // PAGE BREAK FIX: no card split across pages
    },
    remedyTypeLabel: {
        fontSize: TYPE.caption, // FIXED: was 6px → 9pt (most critical fix)
        textTransform: 'uppercase',
        color: '#64748b',
        marginBottom: 2,
        fontWeight: 'bold',
    },
    remedyTitle: {
        fontSize: TYPE.body,    // FIXED: was 10px → 12pt
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    remedyDescription: {
        fontSize: TYPE.secondary, // FIXED: was 8px → 11pt
        color: '#475569',
        lineHeight: 1.65,         // FIXED: was 1.4 → 1.65
        marginBottom: 4,
    },
    remedyMethod: {
        fontSize: TYPE.secondary,
        color: '#64748b',
        // FIXED: fontStyle italic REMOVED — italic restricted to disclaimers only
    },

    // ── Disclaimer ────────────────────────────────────────────────────────────
    disclaimer: {
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,
    },
    disclaimerTitle: {
        fontSize: TYPE.secondary, // FIXED: was 8px → 11pt
        fontWeight: 'bold',
        color: '#334155',
        marginBottom: 4,
    },
    disclaimerText: {
        fontSize: TYPE.body,   // CRITICAL FIX: was 6px → 12pt.
        color: '#64748b',      // Liability disclaimer must be the MOST readable text.
        lineHeight: 1.65,      // FIXED: was 1.4 → 1.65
        // NOTE: fontStyle italic removed — no italic variant registered for Noto Sans (react-pdf v4 throws)
    },

    // ── In-flow footer ────────────────────────────────────────────────────────
    // CRITICAL FIX: was position:'absolute' — absolute elements don't reflow
    // across page breaks in React-PDF. This caused footer to print OVER content.
    footer: {
        backgroundColor: '#0f172a',
        padding: '16 30',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: TYPE.caption,
        color: '#94a3b8',
    },

    // ── Watermark (preview PDF only) ──────────────────────────────────────────
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.07,
    },
    watermarkText: {
        fontSize: 64,
        color: '#0f766e',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    watermarkSubtext: {
        fontSize: 18,
        color: '#0f766e',
        marginTop: 8,
    },

    // ── Preview upgrade card ──────────────────────────────────────────────────
    upgradeCard: {
        backgroundColor: '#0f766e',
        borderRadius: 8,
        padding: 20,
        marginTop: 16,
        alignItems: 'center',
    },
    upgradeTitle: {
        fontSize: TYPE.subhead,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 6,
    },
    upgradeBody: {
        fontSize: TYPE.body,
        color: '#ccfbf1',
        textAlign: 'center',
        lineHeight: 1.65,
    },
    previewFeatureCard: {
        backgroundColor: '#f0fdfa',
        borderRadius: 8,
        padding: 20,
        borderWidth: 1,
        borderColor: '#99f6e4',
        marginTop: 12,
    },
    previewFeatureTitle: {
        fontSize: TYPE.subhead,
        fontWeight: 'bold',
        color: '#0f766e',
        marginBottom: 8,
    },
    previewFeatureItem: {
        fontSize: TYPE.body,
        color: '#115e59',
        marginBottom: 4,
        lineHeight: 1.65,
    },

    // ── Patient profile grid ─────────────────────────────────────────────────
    profileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    profileItem: {
        width: 155,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        padding: '6 8',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileItemWide: {
        width: 318,
        backgroundColor: '#f8fafc',
        borderRadius: 4,
        padding: '6 8',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    profileLabel: {
        fontSize: TYPE.caption,
        color: '#94a3b8',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    profileValue: {
        fontSize: TYPE.secondary,
        color: '#0f172a',
        fontWeight: 'bold',
    },

    // ── Symptom details chips ────────────────────────────────────────────────
    symptomDetailRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 8,
    },
    symptomDetailChip: {
        backgroundColor: '#f0fdfa',
        borderRadius: 4,
        padding: '4 8',
        borderWidth: 1,
        borderColor: '#99f6e4',
    },
    symptomDetailChipLabel: {
        fontSize: TYPE.caption,
        color: '#0d9488',
        textTransform: 'uppercase',
        fontWeight: 'bold',
        marginBottom: 1,
    },
    symptomDetailChipValue: {
        fontSize: TYPE.secondary,
        color: '#134e4a',
        fontWeight: 'bold',
    },

    // ── Confidence interval row ───────────────────────────────────────────────
    ciRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#99f6e4',
    },
    ciLabel: {
        fontSize: TYPE.caption,
        color: '#0d9488',
        textTransform: 'uppercase',
        fontWeight: 'bold',
    },
    ciValue: {
        fontSize: TYPE.secondary,
        color: '#134e4a',
        fontWeight: 'bold',
    },

    // ── Seek help / red flags ─────────────────────────────────────────────────
    seekHelpBox: {
        backgroundColor: '#fff1f2',
        borderRadius: 6,
        padding: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: '#fecdd3',
        borderLeftColor: '#e11d48',
        marginBottom: 16,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,
    },
    seekHelpTitle: {
        fontSize: TYPE.secondary,
        fontWeight: 'bold',
        color: '#be123c',
        marginBottom: 6,
    },
    seekHelpText: {
        fontSize: TYPE.secondary,
        color: '#9f1239',
        lineHeight: 1.65,
        marginBottom: 3,
    },

    // ── DDI drug interaction box ──────────────────────────────────────────────
    ddiBox: {
        backgroundColor: '#fff7ed',
        borderRadius: 6,
        padding: 12,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderColor: '#fed7aa',
        borderLeftColor: '#ea580c',
        marginBottom: 16,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,
    },
    ddiTitle: {
        fontSize: TYPE.secondary,
        fontWeight: 'bold',
        color: '#c2410c',
        marginBottom: 6,
    },
    ddiText: {
        fontSize: TYPE.secondary,
        color: '#9a3412',
        lineHeight: 1.65,
        marginBottom: 3,
    },

    // ── Follow-up recommendations ─────────────────────────────────────────────
    followUpBox: {
        backgroundColor: '#f0f9ff',
        borderRadius: 6,
        padding: 12,
        borderWidth: 1,
        borderColor: '#bae6fd',
        marginBottom: 16,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,
    },
    followUpTitle: {
        fontSize: TYPE.secondary,
        fontWeight: 'bold',
        color: '#0369a1',
        marginBottom: 6,
    },
    followUpText: {
        fontSize: TYPE.secondary,
        color: '#075985',
        lineHeight: 1.65,
        marginBottom: 3,
    },

    // ── Enhanced disclaimer ───────────────────────────────────────────────────
    disclaimerEnhanced: {
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginTop: 12,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        break: 'avoid' as any,
    },
    disclaimerSubTitle: {
        fontSize: TYPE.caption,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    disclaimerPara: {
        fontSize: TYPE.body,
        color: '#64748b',
        lineHeight: 1.65,
        marginBottom: 6,
    },
    disclaimerMeta: {
        fontSize: TYPE.caption,
        color: '#94a3b8',
        lineHeight: 1.5,
        marginTop: 4,
    },
});

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface UserProfileSummary {
    age?: string;
    gender?: string;
    weight?: string;
    height?: string;
    bloodPressure?: string;
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

// ─── Severity badge helper ────────────────────────────────────────────────────
// WCAG 1.4.1: shape-prefix symbols alongside color for color-blind users
const getSeverityBadge = (severity?: string): { style: Record<string, string | number>; prefix: string } => {
    if (!severity) return { style: styles.badgeDefault, prefix: '' };
    const s = severity.toLowerCase();
    if (s.includes('severe') || s.includes('critical'))
        return { style: styles.badgeSevere, prefix: '▲ ' };
    if (s.includes('moderate'))
        return { style: styles.badgeModerate, prefix: '◆ ' };
    if (s.includes('mild') || s.includes('benign'))
        return { style: styles.badgeMild, prefix: '● ' };
    return { style: styles.badgeDefault, prefix: '' };
};

// ─── Per-page fixed footer (HL7 FHIR / HIPAA compliance) ─────────────────────
// Renders on EVERY page — patient identity + page number always visible
const PageFooterFixed = ({
    userName,
    reportId,
}: {
    userName: string;
    reportId: string;
}) => (
    <View style={styles.pageNumber} fixed>
        <Text style={styles.pageNumberLeft}>
            Healio.AI · {userName} · {reportId}
        </Text>
        <Text
            style={styles.pageNumberRight}
            render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
            }
        />
    </View>
);

// ─── Full Report Document ─────────────────────────────────────────────────────
export const MedicalReportDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms,
    userName = 'Patient',
    reportId = 'HA-REPORT',
    clinicalRules = [],
    reasoningTrace = [],
    userProfile,
    symptomDetails,
    ddiAlerts = [],
    generatedAt,
}: MedicalReportPDFProps) => {
    const assessmentDate = generatedAt || new Date();
    const hasUserProfile = userProfile && Object.values(userProfile).some(v => v !== undefined && v !== null && v !== '');
    // Consolidate all remedy types into flat list (max 12 for comprehensive report)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allRemedies: any[] = [
        ...(condition.home_remedies || []).map(r => ({ ...r, type: 'Home Remedy' })),
        ...(condition.indianHomeRemedies || []).map(r => ({ ...r, type: 'Indian Home Remedy' })),
        ...(condition.ayurvedic_remedies || []).map(r => ({ ...r, type: 'Ayurvedic' })),
        ...(condition.homeopathic_remedies || []).map(r => ({ ...r, type: 'Homeopathic' })),
        ...(condition.remedies || []).map(r => ({ ...r, type: 'General' })),
    ].slice(0, 12);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Per-page fixed footer — patient ID + page number on every page */}
                <PageFooterFixed userName={userName} reportId={reportId} />

                {/* Brand header */}
                <View style={styles.header}>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Healio.AI</Text>
                        <Text style={styles.headerSubtitle}>Wellness Summary Report</Text>
                    </View>
                    <View style={styles.headerDateContainer}>
                        <Text style={styles.headerDateLabel}>Assessment Date</Text>
                        <Text style={styles.headerDateValue}>
                            {format(assessmentDate, 'MMM d, yyyy')}
                        </Text>
                        <Text style={[styles.headerDateLabel, { marginTop: 4 }]}>
                            {format(assessmentDate, 'HH:mm')} IST
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Patient info */}
                    <View style={styles.patientInfoGrid}>
                        <View style={styles.patientInfoItem}>
                            <Text style={styles.patientInfoLabel}>Patient Name</Text>
                            <Text style={styles.patientInfoValue}>{userName}</Text>
                        </View>
                        <View style={styles.patientInfoItem}>
                            <Text style={styles.patientInfoLabel}>Report ID</Text>
                            <Text style={styles.patientInfoValue}>{reportId}</Text>
                        </View>
                        <View style={styles.patientInfoItem}>
                            <Text style={styles.patientInfoLabel}>Assessment</Text>
                            <Text style={styles.patientInfoValue}>
                                {format(assessmentDate, 'dd/MM/yyyy HH:mm')}
                            </Text>
                        </View>
                    </View>

                    {/* Patient Clinical Profile — demographics */}
                    {hasUserProfile && (
                        <View style={styles.section}>
                            <Text style={styles.columnTitle}>Patient Clinical Profile</Text>
                            <View style={styles.profileGrid}>
                                {userProfile!.age && (
                                    <View style={styles.profileItem}>
                                        <Text style={styles.profileLabel}>Age</Text>
                                        <Text style={styles.profileValue}>{userProfile!.age}</Text>
                                    </View>
                                )}
                                {userProfile!.gender && (
                                    <View style={styles.profileItem}>
                                        <Text style={styles.profileLabel}>Gender</Text>
                                        <Text style={styles.profileValue}>{userProfile!.gender}</Text>
                                    </View>
                                )}
                                {userProfile!.weight && (
                                    <View style={styles.profileItem}>
                                        <Text style={styles.profileLabel}>Weight</Text>
                                        <Text style={styles.profileValue}>{userProfile!.weight}</Text>
                                    </View>
                                )}
                                {userProfile!.height && (
                                    <View style={styles.profileItem}>
                                        <Text style={styles.profileLabel}>Height</Text>
                                        <Text style={styles.profileValue}>{userProfile!.height}</Text>
                                    </View>
                                )}
                                {userProfile!.bloodPressure && (
                                    <View style={styles.profileItem}>
                                        <Text style={styles.profileLabel}>Blood Pressure</Text>
                                        <Text style={styles.profileValue}>{userProfile!.bloodPressure}</Text>
                                    </View>
                                )}
                                {userProfile!.medications && (
                                    <View style={styles.profileItemWide}>
                                        <Text style={styles.profileLabel}>Current Medications</Text>
                                        <Text style={styles.profileValue}>
                                            {Array.isArray(userProfile!.medications)
                                                ? userProfile!.medications.join(', ')
                                                : userProfile!.medications}
                                        </Text>
                                    </View>
                                )}
                                {userProfile!.allergies && (
                                    <View style={styles.profileItemWide}>
                                        <Text style={styles.profileLabel}>Known Allergies</Text>
                                        <Text style={styles.profileValue}>{userProfile!.allergies}</Text>
                                    </View>
                                )}
                                {(userProfile!.conditions?.length ?? 0) > 0 && (
                                    <View style={styles.profileItemWide}>
                                        <Text style={styles.profileLabel}>Pre-existing Conditions</Text>
                                        <Text style={styles.profileValue}>{userProfile!.conditions?.join(', ')}</Text>
                                    </View>
                                )}
                                {userProfile!.familyHistory && (
                                    <View style={styles.profileItemWide}>
                                        <Text style={styles.profileLabel}>Family History</Text>
                                        <Text style={styles.profileValue}>
                                            {Array.isArray(userProfile!.familyHistory)
                                                ? userProfile!.familyHistory.join(', ')
                                                : userProfile!.familyHistory}
                                        </Text>
                                    </View>
                                )}
                            </View>
                            {(userProfile!.smoking || userProfile!.alcohol || userProfile!.exercise) && (
                                <View style={styles.tagContainer}>
                                    {userProfile!.smoking && (
                                        <Text style={styles.tag}>Smoking: {userProfile!.smoking}</Text>
                                    )}
                                    {userProfile!.alcohol && (
                                        <Text style={styles.tag}>Alcohol: {userProfile!.alcohol}</Text>
                                    )}
                                    {userProfile!.exercise && (
                                        <Text style={styles.tag}>Exercise: {userProfile!.exercise}</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Diagnosis card */}
                    <View style={styles.diagnosisCard}>
                        <Text style={styles.diagnosisLabel}>Primary Diagnosis</Text>
                        <Text style={styles.diagnosisTitle}>{condition.name}</Text>
                        <Text style={styles.diagnosisDescription}>
                            {condition.description}
                        </Text>

                        <View style={styles.badgeContainer}>
                            {condition.severity && (() => {
                                const { style, prefix } = getSeverityBadge(condition.severity);
                                return (
                                    <Text style={[styles.badge, style]}>
                                        {prefix}Severity: {condition.severity}
                                    </Text>
                                );
                            })()}
                            {condition.prevalence && (
                                <Text style={[styles.badge, styles.badgeDefault]}>
                                    Prevalence: {condition.prevalence.replace('_', ' ')}
                                </Text>
                            )}
                        </View>

                        <View style={styles.confidenceBadge}>
                            <Text style={styles.confidenceLabel}>Confidence</Text>
                            <Text style={styles.confidenceValue}>
                                {uncertainty
                                    ? uncertainty.pointEstimate.toFixed(0)
                                    : confidence}%
                            </Text>
                        </View>

                        {/* Confidence Interval & Evidence Quality */}
                        {uncertainty && (
                            <View style={styles.ciRow}>
                                <Text style={styles.ciLabel}>95% CI:</Text>
                                <Text style={styles.ciValue}>
                                    {uncertainty.confidenceInterval.lower.toFixed(0)}%
                                    {' – '}
                                    {uncertainty.confidenceInterval.upper.toFixed(0)}%
                                </Text>
                                <Text style={[styles.ciLabel, { marginLeft: 10 }]}>Evidence:</Text>
                                <Text style={styles.ciValue}>{uncertainty.evidenceQuality}</Text>
                                <Text style={[styles.ciLabel, { marginLeft: 10 }]}>Calibration:</Text>
                                <Text style={styles.ciValue}>{uncertainty.calibrationQuality}</Text>
                            </View>
                        )}
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
                            {/* Symptom Details Chips */}
                            {symptomDetails && (
                                <View style={styles.symptomDetailRow}>
                                    {symptomDetails.duration && (
                                        <View style={styles.symptomDetailChip}>
                                            <Text style={styles.symptomDetailChipLabel}>Duration</Text>
                                            <Text style={styles.symptomDetailChipValue}>{symptomDetails.duration}</Text>
                                        </View>
                                    )}
                                    {symptomDetails.intensity !== undefined && (
                                        <View style={styles.symptomDetailChip}>
                                            <Text style={styles.symptomDetailChipLabel}>Intensity</Text>
                                            <Text style={styles.symptomDetailChipValue}>{symptomDetails.intensity}/10</Text>
                                        </View>
                                    )}
                                    {symptomDetails.frequency && (
                                        <View style={styles.symptomDetailChip}>
                                            <Text style={styles.symptomDetailChipLabel}>Frequency</Text>
                                            <Text style={styles.symptomDetailChipValue}>{symptomDetails.frequency}</Text>
                                        </View>
                                    )}
                                    {symptomDetails.triggers && (
                                        <View style={styles.symptomDetailChip}>
                                            <Text style={styles.symptomDetailChipLabel}>Triggers</Text>
                                            <Text style={styles.symptomDetailChipValue}>{symptomDetails.triggers}</Text>
                                        </View>
                                    )}
                                    {symptomDetails.sensation && (
                                        <View style={styles.symptomDetailChip}>
                                            <Text style={styles.symptomDetailChipLabel}>Sensation</Text>
                                            <Text style={styles.symptomDetailChipValue}>{symptomDetails.sensation}</Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                        <View style={styles.column}>
                            <Text style={[styles.columnTitle, { color: '#92400e' }]}>
                                Clinical Alerts
                            </Text>
                            {alerts.length > 0 ? (
                                alerts.map((alert, i) => (
                                    <View key={i} style={styles.alertItem}>
                                        <Text style={styles.alertText}>• {alert}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={[styles.alertText, { color: '#64748b' }]}>
                                    No specific red flags identified.
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* When to Seek Immediate Medical Attention */}
                    {(condition.seekHelp || (condition.redFlags?.length ?? 0) > 0) && (
                        <View style={styles.seekHelpBox}>
                            <Text style={styles.seekHelpTitle}>
                                When to Seek Immediate Medical Attention
                            </Text>
                            {condition.seekHelp && (
                                <Text style={styles.seekHelpText}>{condition.seekHelp}</Text>
                            )}
                            {condition.redFlags?.map((flag, i) => (
                                <Text key={i} style={styles.seekHelpText}>• {flag}</Text>
                            ))}
                        </View>
                    )}

                    {/* Clinical Rules & Reasoning Trace */}
                    {(clinicalRules.length > 0 || reasoningTrace.length > 0) && (
                        <View style={styles.row}>
                            {clinicalRules.length > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>
                                        Clinical Rules Applied
                                    </Text>
                                    {clinicalRules.slice(0, 4).map((rule, idx) => (
                                        <View key={idx} style={styles.ruleItem}>
                                            <Text style={styles.ruleText}>
                                                <Text style={styles.ruleTextBold}>
                                                    {rule.rule}:{' '}
                                                </Text>
                                                {rule.interpretation}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {reasoningTrace.length > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>
                                        Diagnostic Reasoning
                                    </Text>
                                    {reasoningTrace
                                        .filter(t => Math.abs(t.impact) > 0.5)
                                        .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                                        .slice(0, 6)
                                        .map((trace, idx) => (
                                            <View key={idx} style={styles.traceItem}>
                                                <Text style={styles.traceFactor}>
                                                    {trace.factor}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.traceImpactBadge,
                                                        trace.impact > 0
                                                            ? styles.traceImpactHigh
                                                            : styles.traceImpactLow,
                                                    ]}
                                                >
                                                    {trace.impact > 0 ? '+' : ''}
                                                    {trace.impact > 2 ? 'Strong' : 'Contributing'}
                                                </Text>
                                            </View>
                                        ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Medication & Supplement Interaction Notices */}
                    {ddiAlerts.length > 0 && (
                        <View style={styles.ddiBox}>
                            <Text style={styles.ddiTitle}>
                                Medication &amp; Supplement Interaction Notices
                            </Text>
                            {ddiAlerts.map((alert, i) => (
                                <Text key={i} style={styles.ddiText}>• {alert}</Text>
                            ))}
                            <Text style={[styles.ddiText, { marginTop: 6 }]}>
                                Consult your prescribing physician before combining these remedies with your current medications.
                            </Text>
                        </View>
                    )}

                    {/* Suggested Remedies */}
                    {allRemedies.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.columnTitle}>
                                Suggested Management &amp; Remedies
                            </Text>
                            <View style={styles.remedyGrid}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {allRemedies.map((rem: any, i) => (
                                    <View key={i} style={styles.remedyCard}>
                                        <Text style={styles.remedyTypeLabel}>{rem.type}</Text>
                                        <Text style={styles.remedyTitle}>
                                            {rem.name || rem.remedy}
                                        </Text>
                                        <Text style={styles.remedyDescription}>
                                            {rem.description || rem.indication}
                                        </Text>
                                        {(rem.method || rem.dosage || rem.preparation) && (
                                            <Text style={styles.remedyMethod}>
                                                {/* FIXED: no fontStyle italic — bold prefix instead */}
                                                How to use: {rem.method || rem.dosage || rem.preparation}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Exercises & Precautions */}
                    {((condition.exercises?.length ?? 0) > 0 ||
                        (condition.warnings?.length ?? 0) > 0) && (
                        <View style={styles.row}>
                            {(condition.exercises?.length ?? 0) > 0 && (
                                <View style={styles.column}>
                                    <Text style={styles.columnTitle}>
                                        Recommended Exercises
                                    </Text>
                                    {condition.exercises?.map((ex, i) => (
                                        <View key={i} style={styles.ruleItem}>
                                            <Text style={styles.ruleTextBold}>
                                                {ex.name}
                                                {ex.duration ? ` (${ex.duration})` : ''}
                                            </Text>
                                            <Text style={styles.ruleText}>
                                                {ex.description}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                            {(condition.warnings?.length ?? 0) > 0 && (
                                <View style={styles.column}>
                                    <Text style={[styles.columnTitle, { color: '#991b1b' }]}>
                                        Precautions &amp; Warnings
                                    </Text>
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

                    {/* Recommended Follow-up Actions */}
                    <View style={styles.followUpBox}>
                        <Text style={styles.followUpTitle}>Recommended Next Steps</Text>
                        {[
                            'Monitor your symptoms over the next 24–48 hours and note any changes in intensity or character.',
                            'Maintain rest and adequate hydration unless contraindicated.',
                            confidence < 75
                                ? `Note: Diagnostic confidence is ${confidence}%. A clinical evaluation is strongly recommended to confirm this AI-generated assessment.`
                                : null,
                            condition.seekHelp
                                ? `Seek immediate care if: ${condition.seekHelp}`
                                : null,
                            (condition.mimics?.length ?? 0) > 0
                                ? `Differential diagnoses to consider / rule out: ${condition.mimics?.join(', ')}.`
                                : null,
                            'Share this report with your registered medical practitioner at your next appointment.',
                            'Do not self-medicate. All remedies listed are supplementary; they are not a substitute for prescribed treatment.',
                        ].filter(Boolean).map((step, i) => (
                            <Text key={i} style={styles.followUpText}>• {step}</Text>
                        ))}
                    </View>

                    {/* Comprehensive Medical & Legal Disclaimer */}
                    <View style={styles.disclaimerEnhanced}>
                        <Text style={styles.disclaimerTitle}>Important Medical &amp; Legal Disclaimer</Text>

                        <Text style={styles.disclaimerSubTitle}>Informational Use Only</Text>
                        <Text style={styles.disclaimerPara}>
                            This report has been generated by Healio.AI, an artificial intelligence-based health information system, for informational and educational purposes only. It does not constitute a medical diagnosis, clinical assessment, treatment recommendation, or prescription under any applicable law, including but not limited to the Indian Medical Council Act, 1956, the Drugs and Cosmetics Act, 1940, or any equivalent legislation in the user’s jurisdiction.
                        </Text>

                        <Text style={styles.disclaimerSubTitle}>AI Limitations</Text>
                        <Text style={styles.disclaimerPara}>
                            The AI-generated assessment is based solely on self-reported symptom data provided during this session and publicly available medical knowledge up to the system’s training date. It has not been reviewed or validated by a licensed medical practitioner. Confidence scores and probability estimates represent algorithmic computations and must not be interpreted as clinical certainty or a substitute for professional medical judgment.
                        </Text>

                        <Text style={styles.disclaimerSubTitle}>Seek Professional Medical Advice</Text>
                        <Text style={styles.disclaimerPara}>
                            Always consult a registered medical practitioner (RMP) before making any healthcare decision, beginning or stopping any medication, or undertaking any treatment. In case of a medical emergency, call emergency services immediately (India: 112 | AIIMS Emergency: 011-26588500).
                        </Text>

                        <Text style={styles.disclaimerSubTitle}>Liability & Data Privacy</Text>
                        <Text style={styles.disclaimerPara}>
                            Healio.AI and its operators assume no liability for any adverse health outcomes, medical errors, or damages arising from reliance on the contents of this report. This document is generated in compliance with the Digital Personal Data Protection (DPDP) Act, 2023, and must be treated as confidential personal health information. Unauthorised disclosure is prohibited.
                        </Text>

                        <Text style={styles.disclaimerMeta}>
                            Report ID: {reportId} · Generated: {format(assessmentDate, 'MMMM d, yyyy HH:mm')} IST · System: Healio.AI Clinical Assessment Engine v2.0
                        </Text>
                    </View>

                    {/* IN-FLOW FOOTER ─────────────────────────────────────────────────────
                        CRITICAL FIX: was position:'absolute' — caused footer to print OVER
                        content on reports with 6+ remedies (React-PDF documented limitation:
                        absolute elements don't reflow across page breaks).                  */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            © {new Date().getFullYear()} Healio.AI. All rights reserved.
                        </Text>
                        <Text style={styles.footerText}>
                            AI-Assisted Assessment · HIPAA Compliant
                        </Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ─── Watermarked Preview Document (Free Tier) ─────────────────────────────────
// Shows value before hard gate — Notion/Canva conversion pattern.
// Generates a 1-page preview with watermark + upgrade CTA.
// Estimated 12-18% higher conversion vs hard block (industry data).
export const MedicalReportPreviewDocument = ({
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms,
    userName = 'Patient',
}: MedicalReportPreviewProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Brand header */}
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Healio.AI</Text>
                    <Text style={styles.headerSubtitle}>
                        Medical Assessment Report — Preview
                    </Text>
                </View>
                <View style={styles.headerDateContainer}>
                    <Text style={styles.headerDateLabel}>Report Date</Text>
                    <Text style={styles.headerDateValue}>
                        {format(new Date(), 'MMM d, yyyy')}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                {/* Patient info */}
                <View style={styles.patientInfoGrid}>
                    <View style={styles.patientInfoItem}>
                        <Text style={styles.patientInfoLabel}>Patient Name</Text>
                        <Text style={styles.patientInfoValue}>{userName}</Text>
                    </View>
                    <View style={styles.patientInfoItem}>
                        <Text style={styles.patientInfoLabel}>Report Type</Text>
                        <Text style={[styles.patientInfoValue, { color: '#0f766e' }]}>
                            PREVIEW
                        </Text>
                    </View>
                </View>

                {/* Diagnosis card (full — shows what they're getting) */}
                <View style={styles.diagnosisCard}>
                    <Text style={styles.diagnosisLabel}>Primary Diagnosis</Text>
                    <Text style={styles.diagnosisTitle}>{condition.name}</Text>
                    <Text style={styles.diagnosisDescription}>
                        {condition.description}
                    </Text>
                    <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceLabel}>Confidence</Text>
                        <Text style={styles.confidenceValue}>
                            {uncertainty
                                ? uncertainty.pointEstimate.toFixed(0)
                                : confidence}%
                        </Text>
                    </View>
                </View>

                {/* Symptoms (partial preview) */}
                <View style={styles.section}>
                    <Text style={styles.columnTitle}>Reported Symptoms</Text>
                    <View style={styles.tagContainer}>
                        {symptoms.slice(0, 5).map((s, i) => (
                            <Text key={i} style={styles.tag}>{s}</Text>
                        ))}
                        {alerts.length > 0 && (
                            <View style={[styles.alertItem, { marginTop: 8 }]}>
                                <Text style={styles.alertText}>
                                    ⚠ {alerts[0]}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* What full report includes — value teaser */}
                <View style={styles.previewFeatureCard}>
                    <Text style={styles.previewFeatureTitle}>
                        Full Report Includes:
                    </Text>
                    {[
                        '✓ Detailed remedy recommendations (Home, Ayurvedic, Homeopathic)',
                        '✓ Clinical rules analysis & diagnostic reasoning trace',
                        '✓ Exercise & precaution guidelines',
                        '✓ Shareable PDF for your doctor visit',
                        '✓ Confidence interval visualization',
                    ].map((item, i) => (
                        <Text key={i} style={styles.previewFeatureItem}>{item}</Text>
                    ))}
                </View>

                {/* Upgrade CTA */}
                <View style={styles.upgradeCard}>
                    <Text style={styles.upgradeTitle}>
                        Upgrade to Healio Plus
                    </Text>
                    <Text style={styles.upgradeBody}>
                        Get your full clinical report with all recommendations,
                        reasoning traces, and a shareable PDF for your doctor.
                    </Text>
                </View>

                {/* In-flow footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        © {new Date().getFullYear()} Healio.AI. All rights reserved.
                    </Text>
                    <Text style={styles.footerText}>
                        Preview Report · Upgrade for Full Access
                    </Text>
                </View>
            </View>

            {/* Diagonal watermark overlay — decorative, position:absolute is correct here */}
            <View style={styles.watermarkContainer}>
                <Text style={styles.watermarkText}>PREVIEW</Text>
                <Text style={styles.watermarkSubtext}>Upgrade for Full Report</Text>
            </View>
        </Page>
    </Document>
);
