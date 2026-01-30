import { Activity, AlertTriangle, Calendar, CheckCircle2, FileText, Heart, Shield, Stethoscope, User, Clock } from "lucide-react";

interface Remedy {
    name: string;
    description: string;
    method?: string;
}

interface Condition {
    name: string;
    description: string;
    remedies: Remedy[];
}

interface UncertaintyEstimate {
    pointEstimate: number;
}

interface MedicalReportTemplateProps {
    id: string;
    condition: Condition;
    confidence: number;
    uncertainty?: UncertaintyEstimate;
    alerts: string[];
    symptoms: string[];
    userName?: string;
}

const formatDate = (date: Date) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

export function MedicalReportTemplate({
    id,
    condition,
    confidence,
    uncertainty,
    alerts,
    symptoms,
    userName = "Patient"
}: MedicalReportTemplateProps) {
    const reportId = `HA-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const currentDate = new Date();
    const reportDate = formatDate(currentDate);
    const reportTime = formatTime(currentDate);

    return (
        <div
            id={id}
            style={{
                width: '794px',
                minHeight: '1123px',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                position: 'relative',
                margin: 0,
                padding: 0
            }}
        >
            {/* HEADER */}
            <div style={{
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                color: '#ffffff',
                padding: '40px 48px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Activity style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                        </div>
                        <h1 style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            margin: 0,
                            letterSpacing: '-0.5px'
                        }}>Healio.AI</h1>
                    </div>
                    <p style={{
                        color: '#ccfbf1',
                        fontSize: '18px',
                        fontWeight: 500,
                        marginLeft: '56px',
                        marginTop: 0,
                        marginBottom: '24px'
                    }}>Medical Assessment Report</p>

                    <div style={{
                        display: 'flex',
                        gap: '24px',
                        marginLeft: '56px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '8px 16px',
                            borderRadius: '8px'
                        }}>
                            <Calendar style={{ width: '16px', height: '16px', color: '#ccfbf1' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{reportDate}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            padding: '8px 16px',
                            borderRadius: '8px'
                        }}>
                            <Clock style={{ width: '16px', height: '16px', color: '#ccfbf1' }} />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>{reportTime}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ padding: '32px 48px' }}>

                {/* PATIENT & REPORT INFO */}
                <div style={{
                    marginBottom: '32px',
                    paddingBottom: '24px',
                    borderBottom: '2px solid #f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '32px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                            backgroundColor: '#f0fdfa',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px solid #ccfbf1'
                        }}>
                            <User style={{ width: '24px', height: '24px', color: '#0d9488' }} />
                        </div>
                        <div>
                            <p style={{
                                fontSize: '11px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                                margin: '0 0 4px 0'
                            }}>Patient Name</p>
                            <p style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: '#0f172a',
                                margin: 0
                            }}>{userName}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                            backgroundColor: '#f1f5f9',
                            padding: '12px',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0'
                        }}>
                            <FileText style={{ width: '24px', height: '24px', color: '#475569' }} />
                        </div>
                        <div>
                            <p style={{
                                fontSize: '11px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                fontWeight: 'bold',
                                letterSpacing: '0.5px',
                                margin: '0 0 4px 0'
                            }}>Report ID</p>
                            <p style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#334155',
                                fontFamily: 'monospace',
                                margin: 0
                            }}>{reportId}</p>
                        </div>
                    </div>
                </div>

                {/* PRIMARY DIAGNOSIS CARD */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        background: 'linear-gradient(to bottom right, #f0fdfa, rgba(204, 251, 241, 0.5))',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '2px solid #99f6e4',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'relative', zIndex: 10 }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: '20px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'inline-block',
                                        backgroundColor: '#0f766e',
                                        color: '#ffffff',
                                        padding: '6px 16px',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '12px'
                                    }}>
                                        Primary Diagnosis
                                    </div>
                                    <h2 style={{
                                        fontSize: '36px',
                                        fontWeight: 'bold',
                                        color: '#134e4a',
                                        lineHeight: 1.2,
                                        margin: '0 0 12px 0',
                                        maxWidth: '85%'
                                    }}>
                                        {condition.name}
                                    </h2>
                                    <p style={{
                                        color: '#115e59',
                                        lineHeight: 1.6,
                                        fontSize: '15px',
                                        maxWidth: '85%',
                                        margin: 0
                                    }}>
                                        {condition.description}
                                    </p>
                                </div>

                                <div style={{
                                    backgroundColor: '#ffffff',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    border: '2px solid #99f6e4',
                                    textAlign: 'center',
                                    minWidth: '120px'
                                }}>
                                    <span style={{
                                        display: 'block',
                                        fontSize: '11px',
                                        fontWeight: 'bold',
                                        color: '#0d9488',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginBottom: '4px'
                                    }}>
                                        Confidence
                                    </span>
                                    <span style={{
                                        fontSize: '28px',
                                        fontWeight: 'bold',
                                        color: '#0f766e'
                                    }}>
                                        {uncertainty ? uncertainty.pointEstimate.toFixed(0) : confidence}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SYMPTOMS & ALERTS GRID */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '32px',
                    marginBottom: '32px'
                }}>
                    {/* SYMPTOMS */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        padding: '24px',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #e2e8f0'
                        }}>
                            <div style={{
                                backgroundColor: '#ccfbf1',
                                padding: '8px',
                                borderRadius: '8px'
                            }}>
                                <Activity style={{ width: '20px', height: '20px', color: '#0f766e' }} />
                            </div>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#0f172a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                margin: 0
                            }}>
                                Reported Symptoms
                            </h3>
                        </div>
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px'
                        }}>
                            {symptoms.map((s, i) => (
                                <span
                                    key={i}
                                    style={{
                                        backgroundColor: '#ffffff',
                                        color: '#334155',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        border: '1px solid #e2e8f0'
                                    }}
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* ALERTS */}
                    <div style={{
                        backgroundColor: '#fffbeb',
                        borderRadius: '12px',
                        padding: '24px',
                        border: '1px solid #fde68a'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px',
                            paddingBottom: '12px',
                            borderBottom: '1px solid #fde68a'
                        }}>
                            <div style={{
                                backgroundColor: '#fde68a',
                                padding: '8px',
                                borderRadius: '8px'
                            }}>
                                <AlertTriangle style={{ width: '20px', height: '20px', color: '#92400e' }} />
                            </div>
                            <h3 style={{
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#0f172a',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                margin: 0
                            }}>
                                Clinical Alerts
                            </h3>
                        </div>
                        {alerts.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {alerts.map((alert, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            gap: '10px',
                                            alignItems: 'flex-start',
                                            fontSize: '13px',
                                            backgroundColor: '#ffffff',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #fde68a',
                                            color: '#78350f'
                                        }}
                                    >
                                        <AlertTriangle style={{
                                            width: '16px',
                                            height: '16px',
                                            flexShrink: 0,
                                            marginTop: '2px',
                                            color: '#b45309'
                                        }} />
                                        <span style={{ lineHeight: 1.5 }}>{alert}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                color: '#92400e',
                                backgroundColor: '#ffffff',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #fde68a'
                            }}>
                                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0d9488' }} />
                                <span>No specific red flags identified.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* RECOMMENDATIONS */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid #e2e8f0'
                    }}>
                        <div style={{
                            backgroundColor: '#ffe4e6',
                            padding: '8px',
                            borderRadius: '8px'
                        }}>
                            <Heart style={{ width: '20px', height: '20px', color: '#e11d48' }} />
                        </div>
                        <h3 style={{
                            fontSize: '13px',
                            fontWeight: 'bold',
                            color: '#0f172a',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            margin: 0
                        }}>
                            Recommended Management Plan
                        </h3>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px'
                    }}>
                        {condition.remedies.map((rem, i) => (
                            <div
                                key={i}
                                style={{
                                    backgroundColor: '#ffffff',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '2px solid #f1f5f9'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '12px',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        backgroundColor: '#ccfbf1',
                                        padding: '6px',
                                        borderRadius: '8px',
                                        marginTop: '2px'
                                    }}>
                                        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#0f766e' }} />
                                    </div>
                                    <h4 style={{
                                        fontWeight: 'bold',
                                        color: '#0f172a',
                                        fontSize: '15px',
                                        lineHeight: 1.3,
                                        margin: 0,
                                        flex: 1
                                    }}>
                                        {rem.name}
                                    </h4>
                                </div>
                                <p style={{
                                    fontSize: '13px',
                                    color: '#475569',
                                    lineHeight: 1.6,
                                    marginBottom: '12px',
                                    marginLeft: '36px',
                                    marginTop: 0
                                }}>
                                    {rem.description}
                                </p>
                                {rem.method && (
                                    <div style={{
                                        marginLeft: '36px',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #f1f5f9'
                                    }}>
                                        <p style={{
                                            fontSize: '11px',
                                            color: '#64748b',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '4px',
                                            marginTop: 0
                                        }}>
                                            Application Method
                                        </p>
                                        <p style={{
                                            fontSize: '12px',
                                            color: '#334155',
                                            lineHeight: 1.5,
                                            margin: 0
                                        }}>
                                            {rem.method}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* DISCLAIMER */}
                <div style={{
                    backgroundColor: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    gap: '16px'
                }}>
                    <div style={{
                        backgroundColor: '#e2e8f0',
                        padding: '10px',
                        borderRadius: '8px',
                        height: 'fit-content'
                    }}>
                        <Shield style={{ width: '24px', height: '24px', color: '#475569' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            fontWeight: 'bold',
                            color: '#0f172a',
                            marginBottom: '8px',
                            fontSize: '13px',
                            marginTop: 0
                        }}>Medical Disclaimer</p>
                        <p style={{
                            fontSize: '11px',
                            color: '#475569',
                            lineHeight: 1.6,
                            margin: 0
                        }}>
                            This report is generated by an artificial intelligence system (Healio.AI) and is intended for
                            informational purposes only. It does not constitute a medical diagnosis, treatment, or professional
                            medical advice. Always seek the advice of a physician or other qualified health provider with any
                            questions you may have regarding a medical condition. If you think you may have a medical emergency,
                            call your doctor or emergency services immediately.
                        </p>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#94a3b8',
                padding: '20px 48px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px'
                }}>
                    <p style={{ margin: 0 }}>© {currentDate.getFullYear()} Healio.AI. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Shield style={{ width: '12px', height: '12px' }} />
                            HIPAA Compliant
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity style={{ width: '12px', height: '12px' }} />
                            AI-Assisted Assessment
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}