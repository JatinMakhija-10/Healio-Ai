import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def create_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor('#0F172A')   # Slate 900
    SECONDARY = colors.HexColor('#0D9488') # Teal 600
    ACCENT = colors.HexColor('#2563EB')    # Blue 600
    TEXT_DARK = colors.HexColor('#1E293B') # Slate 800
    BG_LIGHT = colors.HexColor('#F8FAFC')  # Slate 50
    BORDER_COLOR = colors.HexColor('#E2E8F0') # Slate 200
    DARK_HEADER_BG = colors.HexColor('#1E293B')
    HIGHLIGHT_BG = colors.HexColor('#F0FDF4') # Green light
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=12
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=SECONDARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    
    table_text = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.white
    )

    story = []
    
    # Title Block
    story.append(Paragraph("HEALIO.AI — COMPREHENSIVE BUSINESS & COST ANALYSIS", title_style))
    story.append(Paragraph("Sub-30s Consultation Unit Economics (ChatGPT + Vercel Pro + Supabase Pro), TAM/SAM/SOM & Competitors", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=SECONDARY, spaceAfter=10))
    
    # Section 1: Executive Summary & Setup
    story.append(Paragraph("1. Executive Summary & High-Speed Technical Setup", h1_style))
    exec_text = (
        "This report evaluates <b>Healio.AI</b> under a high-performance production architecture using "
        "<b>OpenAI ChatGPT models (GPT-4o-mini / GPT-4o)</b>, <b>Vercel Pro</b>, and <b>Supabase Pro</b>, "
        "delivering complete diagnostic consultations in <b>under 30 seconds</b> across 4 to 5 adaptive turns. "
        "It also details the complete TAM/SAM/SOM calculations and competitive matrix."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Section 2: Sub-30s Consultation Cost Analysis
    story.append(Paragraph("2. Per-Consultation Unit Cost Analysis (OpenAI + Vercel Pro + Supabase Pro)", h1_style))
    story.append(Paragraph("A typical sub-30s session consumes 5 turns (~8,000 input tokens, ~2,000 output tokens cumulative context). All conversions at $1 USD = ₹83 INR.", body_style))
    
    cost_headers = [
        Paragraph("<b>Model / Architecture Option</b>", table_header),
        Paragraph("<b>Input Cost</b>", table_header),
        Paragraph("<b>Output Cost</b>", table_header),
        Paragraph("<b>AI Cost (INR)</b>", table_header),
        Paragraph("<b>Infra Overhead</b>", table_header),
        Paragraph("<b>Total Cost / Consult</b>", table_header)
    ]
    
    cost_rows = [
        cost_headers,
        [Paragraph("<b>GPT-4o-mini</b> <i>(Ultra-Fast & Cheap)</i>", table_text), Paragraph("$0.0012 (₹0.10)", table_text), Paragraph("$0.0012 (₹0.10)", table_text), Paragraph("₹0.20", table_text), Paragraph("₹0.066", table_text), Paragraph("<b>₹0.26 ($0.0032)</b>", table_text)],
        [Paragraph("<b>Hybrid Mode</b> <i>(GPT-4o-mini + GPT-4o)</i>", table_text), Paragraph("$0.0060 (₹0.50)", table_text), Paragraph("$0.0060 (₹0.50)", table_text), Paragraph("₹1.00", table_text), Paragraph("₹0.066", table_text), Paragraph("<b>₹1.06 ($0.0128)</b>", table_text)],
        [Paragraph("<b>GPT-4o Flagship</b> <i>(Full Premium)</i>", table_text), Paragraph("$0.0200 (₹1.66)", table_text), Paragraph("$0.0200 (₹1.66)", table_text), Paragraph("₹3.32", table_text), Paragraph("₹0.066", table_text), Paragraph("<b>₹3.38 ($0.0408)</b>", table_text)],
        [Paragraph("<b>Live Video Consult</b> <i>(Doctor + WebRTC)</i>", table_text), Paragraph("N/A", table_text), Paragraph("N/A", table_text), Paragraph("₹2.31 (Scribe)", table_text), Paragraph("₹0.39 (LiveKit)", table_text), Paragraph("<b>₹2.70 ($0.0326)</b>", table_text)]
    ]

    cost_widths = [140, 75, 75, 65, 75, 80]
    t_cost = Table(cost_rows, colWidths=cost_widths)
    t_cost.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_cost)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Key Financial Takeaway:", h2_style))
    story.append(Paragraph("• At <b>₹0.26 to ₹1.06 INR</b> per AI consultation, charging ₹199/month for B2C subscriptions or earning ₹90 commission per doctor consultation yields a <b>gross profit margin >98.8%</b>.", bullet_style))
    story.append(Paragraph("• 10,000 completed AI consultations cost only <b>₹2,600 to ₹10,600 INR ($32 to $128 USD)</b> per month in total API/cloud fees.", bullet_style))
    story.append(Spacer(1, 8))

    # Section 3: TAM / SAM / SOM Summary
    story.append(Paragraph("3. TAM, SAM, SOM Market Sizing Summary", h1_style))
    tam_text = (
        "<b>Total Addressable Market (TAM):</b> $353.4 Billion Global / <b>$46.3 Billion India (₹3,84,290 Cr)</b> (Digital Health $21.5B + AYUSH $24.8B).<br/>"
        "<b>Serviceable Addressable Market (SAM):</b> <b>$14.2 Billion (₹1,17,800 Cr)</b> targeting 221M digitally active health seekers in India.<br/>"
        "<b>Serviceable Obtainable Market (SOM - Year 5):</b> <b>$68.5 Million GMV (₹568 Cr) / $21.4 Million Net Revenue (₹177.2 Cr ARR)</b>."
    )
    story.append(Paragraph(tam_text, body_style))
    story.append(Spacer(1, 6))

    # Page Break for 5-Year Matrix & Competitors
    story.append(PageBreak())

    # Section 4: 5-Year Financial Projection Matrix
    story.append(Paragraph("4. 5-Year Financial Projection Matrix (Figures in INR Crores)", h1_style))
    
    headers = [
        Paragraph("<b>Financial Metric (₹ Cr)</b>", table_header),
        Paragraph("<b>Year 1</b>", table_header),
        Paragraph("<b>Year 2</b>", table_header),
        Paragraph("<b>Year 3</b>", table_header),
        Paragraph("<b>Year 4</b>", table_header),
        Paragraph("<b>Year 5</b>", table_header)
    ]
    
    rows = [
        headers,
        [Paragraph("MAU (Triage Users)", table_text), Paragraph("150,000", table_text), Paragraph("750,000", table_text), Paragraph("2.50M", table_text), Paragraph("6.50M", table_text), Paragraph("15.00M", table_text)],
        [Paragraph("Active Onboarded Doctors", table_text), Paragraph("50", table_text), Paragraph("350", table_text), Paragraph("1,200", table_text), Paragraph("3,500", table_text), Paragraph("8,500", table_text)],
        [Paragraph("Gross Merchandise Value (GMV)", table_text), Paragraph("₹2.40", table_text), Paragraph("₹18.50", table_text), Paragraph("₹84.20", table_text), Paragraph("₹245.00", table_text), Paragraph("₹568.00", table_text)],
        [Paragraph("<b>NET REVENUE TO HEALIO.AI</b>", table_text), Paragraph("<b>₹0.68</b>", table_text), Paragraph("<b>₹5.15</b>", table_text), Paragraph("<b>₹26.29</b>", table_text), Paragraph("<b>₹78.40</b>", table_text), Paragraph("<b>₹177.20</b>", table_text)],
        [Paragraph("<i>Net Revenue in USD ($)</i>", table_text), Paragraph("<i>$82K</i>", table_text), Paragraph("<i>$620K</i>", table_text), Paragraph("<i>$3.17M</i>", table_text), Paragraph("<i>$9.44M</i>", table_text), Paragraph("<i>$21.35M</i>", table_text)],
        [Paragraph("— E-Commerce Net Comm (20%)", table_text), Paragraph("₹0.32", table_text), Paragraph("₹2.40", table_text), Paragraph("₹11.36", table_text), Paragraph("₹33.00", table_text), Paragraph("₹76.00", table_text)],
        [Paragraph("— Consultation Net Comm (20%)", table_text), Paragraph("₹0.16", table_text), Paragraph("₹1.30", table_text), Paragraph("₹5.48", table_text), Paragraph("₹16.00", table_text), Paragraph("₹37.60", table_text)],
        [Paragraph("— B2C Healio Plus ARR", table_text), Paragraph("₹0.08", table_text), Paragraph("₹0.75", table_text), Paragraph("₹4.78", table_text), Paragraph("₹14.50", table_text), Paragraph("₹35.00", table_text)],
        [Paragraph("— B2B Doctor Pro SaaS ARR", table_text), Paragraph("₹0.12", table_text), Paragraph("₹0.50", table_text), Paragraph("₹2.88", table_text), Paragraph("₹8.40", table_text), Paragraph("₹20.40", table_text)],
        [Paragraph("— Ads & Enterprise Data", table_text), Paragraph("₹0.00", table_text), Paragraph("₹0.20", table_text), Paragraph("₹1.79", table_text), Paragraph("₹6.50", table_text), Paragraph("₹8.20", table_text)],
        [Paragraph("Gross Margin (%)", table_text), Paragraph("78.0%", table_text), Paragraph("81.5%", table_text), Paragraph("84.0%", table_text), Paragraph("85.5%", table_text), Paragraph("86.2%", table_text)],
        [Paragraph("Total OpEx", table_text), Paragraph("₹1.20", table_text), Paragraph("₹4.10", table_text), Paragraph("₹14.80", table_text), Paragraph("₹38.20", table_text), Paragraph("₹72.00", table_text)],
        [Paragraph("<b>EBITDA</b>", table_text), Paragraph("<b>-₹0.52</b>", table_text), Paragraph("<b>+₹0.09</b>", table_text), Paragraph("<b>+₹7.28</b>", table_text), Paragraph("<b>+₹28.83</b>", table_text), Paragraph("<b>+₹80.75</b>", table_text)],
        [Paragraph("EBITDA Margin (%)", table_text), Paragraph("-76.4%", table_text), Paragraph("+1.7%", table_text), Paragraph("+27.7%", table_text), Paragraph("+36.8%", table_text), Paragraph("+45.6%", table_text)]
    ]

    col_widths = [160, 65, 65, 65, 65, 65]
    t = Table(rows, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))

    # Section 5: Competitors & Defensible Moats
    story.append(Paragraph("5. Competitive Matrix & Defensible Moats", h1_style))
    
    comp_headers = [
        Paragraph("<b>Feature / Dimension</b>", table_header),
        Paragraph("<b>Healio.AI</b>", table_header),
        Paragraph("<b>Practo</b>", table_header),
        Paragraph("<b>Tata 1mg</b>", table_header),
        Paragraph("<b>Ada Health</b>", table_header),
        Paragraph("<b>Kapiva / D2C</b>", table_header)
    ]
    
    comp_rows = [
        comp_headers,
        [Paragraph("Core Triage Tech", table_text), Paragraph("<b>Bayesian Probabilistic</b>", table_text), Paragraph("Doctor Directory Search", table_text), Paragraph("Product Catalog Search", table_text), Paragraph("Static Decision Trees", table_text), Paragraph("Basic Product Search", table_text)],
        [Paragraph("Ayurvedic Integration", table_text), Paragraph("<b>Deep (Prakriti Engine)</b>", table_text), Paragraph("None", table_text), Paragraph("Basic Catalog Category", table_text), Paragraph("None", table_text), Paragraph("Brand Specific Only", table_text)],
        [Paragraph("Emergency Scan Latency", table_text), Paragraph("<b>&lt;200ms Red Flag</b>", table_text), Paragraph("None", table_text), Paragraph("None", table_text), Paragraph("Slow (&gt;1.5s)", table_text), Paragraph("None", table_text)],
        [Paragraph("Clinical Decision Rules", table_text), Paragraph("<b>Wells, PERC, HEART</b>", table_text), Paragraph("None", table_text), Paragraph("None", table_text), Paragraph("Limited", table_text), Paragraph("None", table_text)],
        [Paragraph("Diagnosis Handshake", table_text), Paragraph("<b>AI Snapshot to Doctor</b>", table_text), Paragraph("Manual Notes", table_text), Paragraph("None", table_text), Paragraph("None", table_text), Paragraph("None", table_text)],
        [Paragraph("Contextual E-Commerce", table_text), Paragraph("<b>Diagnosis-Driven Match</b>", table_text), Paragraph("Separate Module", table_text), Paragraph("Manual Search", table_text), Paragraph("None", table_text), Paragraph("Single Brand", table_text)],
        [Paragraph("Doctor AI SOAP Scribe", table_text), Paragraph("<b>Voice-to-SOAP Scribe</b>", table_text), Paragraph("None", table_text), Paragraph("None", table_text), Paragraph("None", table_text), Paragraph("None", table_text)],
        [Paragraph("Monetization Model", table_text), Paragraph("<b>4 Unified Pillars</b>", table_text), Paragraph("Consult Fee Only", table_text), Paragraph("E-Pharmacy Margins", table_text), Paragraph("Enterprise B2B", table_text), Paragraph("Product Sales Only", table_text)]
    ]

    comp_widths = [110, 85, 75, 75, 75, 70]
    t_comp = Table(comp_rows, colWidths=comp_widths)
    t_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_comp)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Strategic Moats Summary:", h2_style))
    story.append(Paragraph("<b>1. Fused Integrative Intelligence:</b> Fuses Western Bayesian diagnosis with Eastern Prakriti constitutional profiling.", bullet_style))
    story.append(Paragraph("<b>2. Diagnosis Handshake:</b> Streams AI triage context directly to doctor's screen before video call starts.", bullet_style))
    story.append(Paragraph("<b>3. Contextual E-Commerce:</b> 3.5% conversion rate on diagnosis-driven remedy recommendations vs <1% on standard e-pharmacies.", bullet_style))
    story.append(Paragraph("<b>4. Doctor Scribe Retention:</b> AI Voice-to-SOAP Scribe saves doctors 2 hours/day, creating high B2B switching costs.", bullet_style))

    doc.build(story)
    print(f"PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "HEALIO_AI_COMPLETE_COST_AND_BUSINESS_REPORT.pdf")
    create_pdf(pdf_path)
