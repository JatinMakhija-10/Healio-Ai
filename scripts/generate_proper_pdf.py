import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (pages 2+)
        if self._pageNumber > 1:
            self.drawString(36, 756, "HEALIO.AI — PROPER COST & FINANCIAL AUDIT REPORT")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)
            
        # Footer (all pages)
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_text)
        self.drawString(36, 25, "CONFIDENTIAL — FOR HEALIO.AI EXECUTIVE & INVESTOR REVIEW")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 35, 576, 35)
        
        self.restoreState()

def create_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor('#0F172A')     # Slate 900
    SECONDARY = colors.HexColor('#0D9488')   # Teal 600
    ACCENT = colors.HexColor('#2563EB')      # Blue 600
    TEXT_DARK = colors.HexColor('#1E293B')   # Slate 800
    BG_LIGHT = colors.HexColor('#F8FAFC')    # Slate 50
    BORDER_COLOR = colors.HexColor('#CBD5E1')# Slate 300
    DARK_HEADER_BG = colors.HexColor('#1E293B')
    SUCCESS_BG = colors.HexColor('#F0FDF4')
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=SECONDARY,
        spaceAfter=10
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=SECONDARY,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=body_style,
        leftIndent=10,
        firstLineIndent=-6,
        spaceAfter=2
    )
    
    table_text = ParagraphStyle(
        'TableText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
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
    story.append(Paragraph("HEALIO.AI — PROPER FINANCIAL & COST AUDIT REPORT", title_style))
    story.append(Paragraph("Ground-Truth Multi-Turn Token Accumulation, Sub-30s Infra Unit Costs, TAM/SAM/SOM & Competitor Matrix", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))
    
    # Section 1: Executive Audit Summary
    story.append(Paragraph("1. Executive Cost Audit & Token Accumulation Thesis", h1_style))
    exec_text = (
        "In Large Language Model (LLM) API calls, every turn in a chat session re-sends the cumulative conversation history. "
        "For a <b>10-turn back-and-forth consultation</b>, input tokens grow sequentially across requests. "
        "This audit provides the <b>exact ground-truth cost per consultation</b> accounting for cumulative input context, "
        "OpenAI automatic prompt caching (50% discount), Vercel Pro compute, Supabase Pro DB IOPS, LiveKit WebRTC, and Razorpay fees "
        "at <b>$1 USD = ₹83 INR</b>."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Turn Table
    story.append(Paragraph("2. Turn-by-Turn Cumulative Token Accumulation Matrix (10 Back-and-Forth Turns)", h1_style))
    story.append(Paragraph("Baseline assumptions: 1,500 token system prompt, 50 tokens user input/turn, 150 tokens AI output/turn (1,000 tokens output on Turn 10 final differential synthesis).", body_style))
    
    turn_headers = [
        Paragraph("<b>Turn #</b>", table_header),
        Paragraph("<b>System Context</b>", table_header),
        Paragraph("<b>History Tokens</b>", table_header),
        Paragraph("<b>User Input</b>", table_header),
        Paragraph("<b>Total Input Tokens</b>", table_header),
        Paragraph("<b>AI Output Tokens</b>", table_header)
    ]
    
    turn_rows = [
        turn_headers,
        [Paragraph("Turn 1", table_text), Paragraph("1,500", table_text), Paragraph("0", table_text), Paragraph("50", table_text), Paragraph("1,550", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 2", table_text), Paragraph("1,500", table_text), Paragraph("200", table_text), Paragraph("50", table_text), Paragraph("1,750", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 3", table_text), Paragraph("1,500", table_text), Paragraph("400", table_text), Paragraph("50", table_text), Paragraph("1,950", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 4", table_text), Paragraph("1,500", table_text), Paragraph("600", table_text), Paragraph("50", table_text), Paragraph("2,150", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 5", table_text), Paragraph("1,500", table_text), Paragraph("800", table_text), Paragraph("50", table_text), Paragraph("2,350", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 6", table_text), Paragraph("1,500", table_text), Paragraph("1,000", table_text), Paragraph("50", table_text), Paragraph("2,550", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 7", table_text), Paragraph("1,500", table_text), Paragraph("1,200", table_text), Paragraph("50", table_text), Paragraph("2,750", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 8", table_text), Paragraph("1,500", table_text), Paragraph("1,400", table_text), Paragraph("50", table_text), Paragraph("2,950", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 9", table_text), Paragraph("1,500", table_text), Paragraph("1,600", table_text), Paragraph("50", table_text), Paragraph("3,150", table_text), Paragraph("150", table_text)],
        [Paragraph("Turn 10 (Final)", table_text), Paragraph("2,500 (DB Match)", table_text), Paragraph("1,800", table_text), Paragraph("50", table_text), Paragraph("4,350", table_text), Paragraph("1,000 (Report)", table_text)],
        [Paragraph("<b>TOTALS</b>", table_text), Paragraph("<b>16,000</b>", table_text), Paragraph("<b>9,000</b>", table_text), Paragraph("<b>500</b>", table_text), Paragraph("<b>25,500 Input</b>", table_text), Paragraph("<b>2,350 Output</b>", table_text)]
    ]

    turn_widths = [65, 95, 85, 70, 110, 115]
    t_turn = Table(turn_rows, colWidths=turn_widths)
    t_turn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, BG_LIGHT]),
        ('BACKGROUND', (0,-1), (-1,-1), SUCCESS_BG),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(t_turn)
    story.append(Spacer(1, 6))

    # Section 3: Cost Comparison Table across Models & Turn Lengths
    story.append(Paragraph("3. Itemized Cost Matrix: 5 Turns vs 10 Turns Across AI Models", h1_style))
    story.append(Paragraph("Includes AI API costs + Vercel Pro compute + Supabase Pro DB & Auth overhead.", body_style))
    
    comp_headers = [
        Paragraph("<b>Model Option</b>", table_header),
        Paragraph("<b>5-Turn Cost</b>", table_header),
        Paragraph("<b>10-Turn Standard</b>", table_header),
        Paragraph("<b>10-Turn w/ Prompt Cache (50%)</b>", table_header),
        Paragraph("<b>Net Margin @ ₹199 Sub</b>", table_header)
    ]
    
    comp_rows = [
        comp_headers,
        [Paragraph("<b>GPT-4o-mini</b> <i>(Fast & Efficient)</i>", table_text), Paragraph("₹0.21 ($0.0025)", table_text), Paragraph("<b>₹0.45 ($0.0054)</b>", table_text), Paragraph("<b>₹0.28 ($0.0034)</b>", table_text), Paragraph("<b>99.8% Margin</b>", table_text)],
        [Paragraph("<b>Hybrid Mode</b> <i>(Mini + 4o Turn 10)</i>", table_text), Paragraph("₹1.67 ($0.0201)", table_text), Paragraph("<b>₹2.08 ($0.0250)</b>", table_text), Paragraph("<b>₹1.48 ($0.0178)</b>", table_text), Paragraph("<b>99.2% Margin</b>", table_text)],
        [Paragraph("<b>GPT-4o Pure</b> <i>(Flagship Model)</i>", table_text), Paragraph("₹3.29 ($0.0396)", table_text), Paragraph("<b>₹7.26 ($0.0874)</b>", table_text), Paragraph("<b>₹4.60 ($0.0554)</b>", table_text), Paragraph("<b>97.6% Margin</b>", table_text)]
    ]

    comp_widths = [135, 85, 95, 120, 105]
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
    story.append(Spacer(1, 6))

    # Page Break for Live Doctor Consult & TAM/SAM/SOM
    story.append(PageBreak())

    # Section 4: Live Doctor Video Consultation Audit
    story.append(Paragraph("4. Type B: Human Doctor Video Tele-Consultation (10-Minute Call)", h1_style))
    story.append(Paragraph("When a patient escalates to a live video consultation with an MBBS/BAMS doctor, additional WebRTC video, audio transcription, and payment processing fees apply:", body_style))
    
    doc_headers = [
        Paragraph("<b>Cost Component</b>", table_header),
        Paragraph("<b>Provider / Resource</b>", table_header),
        Paragraph("<b>Metric</b>", table_header),
        Paragraph("<b>Cost (USD)</b>", table_header),
        Paragraph("<b>Cost (INR)</b>", table_header)
    ]
    
    doc_rows = [
        doc_headers,
        [Paragraph("<b>Pre-Call AI Triage Context</b>", table_text), Paragraph("OpenAI (Hybrid Mode)", table_text), Paragraph("5 Triage Turns", table_text), Paragraph("$0.0201", table_text), Paragraph("₹1.67", table_text)],
        [Paragraph("<b>WebRTC Video Streaming</b>", table_text), Paragraph("LiveKit Cloud", table_text), Paragraph("2 participants × 10 mins @ $0.004", table_text), Paragraph("$0.0800", table_text), Paragraph("₹6.64", table_text)],
        [Paragraph("<b>AI Audio Transcription</b>", table_text), Paragraph("OpenAI Whisper API", table_text), Paragraph("10 mins audio @ $0.006/min", table_text), Paragraph("$0.0600", table_text), Paragraph("₹4.98", table_text)],
        [Paragraph("<b>AI SOAP Note Auto-Scribe</b>", table_text), Paragraph("OpenAI GPT-4o-mini", table_text), Paragraph("4.5k tokens transcript summary", table_text), Paragraph("$0.0009", table_text), Paragraph("₹0.075", table_text)],
        [Paragraph("<b>Vercel + Supabase Overhead</b>", table_text), Paragraph("Vercel / Supabase Pro", table_text), Paragraph("Session logging & media route", table_text), Paragraph("$0.0001", table_text), Paragraph("₹0.01", table_text)],
        [Paragraph("<b>DIRECT INFRASTRUCTURE TOTAL</b>", table_text), Paragraph("<b>All Cloud Systems</b>", table_text), Paragraph("<b>1 Completed Consultation</b>", table_text), Paragraph("<b>$0.1611</b>", table_text), Paragraph("<b>₹13.375</b>", table_text)],
        [Paragraph("<b>Payment Gateway Fee (Razorpay)</b>", table_text), Paragraph("Razorpay Route (2.36%)", table_text), Paragraph("2.36% fee on ₹500 Ticket", table_text), Paragraph("$0.1422", table_text), Paragraph("₹11.80", table_text)],
        [Paragraph("<b>TOTAL SESSION COST (WITH PG)</b>", table_text), Paragraph("<b>Complete Session</b>", table_text), Paragraph("<b>Includes ₹500 Payment Fee</b>", table_text), Paragraph("<b>$0.3033 USD</b>", table_text), Paragraph("<b>₹25.18 INR</b>", table_text)]
    ]

    doc_widths = [135, 110, 135, 70, 90]
    t_doc = Table(doc_rows, colWidths=doc_widths)
    t_doc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('BACKGROUND', (0,6), (-1,6), SUCCESS_BG),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_doc)
    story.append(Spacer(1, 8))

    # Section 5: 5-Year Financial Projection Matrix
    story.append(Paragraph("5. 5-Year Financial Projection Matrix (Figures in INR Crores)", h1_style))
    
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
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    # Section 6: Competitors & Defensive Moats
    story.append(Paragraph("6. Competitive Intelligence & Why Healio.AI Wins", h1_style))
    
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
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_comp)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Proper PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "HEALIO_PROPER_COST_AND_BUSINESS_REPORT.pdf")
    create_pdf(pdf_path)
