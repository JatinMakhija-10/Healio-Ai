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
        if self._pageNumber > 1:
            self.drawString(36, 756, "HEALIO.AI — EQUITY DILUTION & VALUATION ADVISORY")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)
            
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_text)
        self.drawString(36, 25, "CONFIDENTIAL — PREPARED FOR FOUNDER CAP-TABLE NEGOTIATION")
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
    WARNING_BG = colors.HexColor('#FEF2F2')  # Red light
    SUCCESS_BG = colors.HexColor('#F0FDF4')  # Green light
    
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
    story.append(Paragraph("HEALIO.AI — ₹12 LAKHS EQUITY & VALUATION ADVISORY", title_style))
    story.append(Paragraph("Founder Cap-Table Preservation Guide, Pre-Money Valuation Scenarios & SAFE Note Structures", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))
    
    # Section 1: Executive Answer
    story.append(Paragraph("1. Executive Valuation & Equity Benchmark Answer", h1_style))
    exec_text = (
        "For a <b>₹12,00,000 INR ($15,000 USD)</b> micro pre-seed raise into Healio.AI, the recommended equity dilution is "
        "<b>4.0% to 6.0% (Maximum 7.5%)</b>. "
        "Giving away more than 7.5% for ₹12 Lakhs will severely over-dilute the founder cap-table, creating a major red flag "
        "for institutional VCs in future Seed and Series A rounds."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Valuation Table
    story.append(Paragraph("2. Valuation Scenarios for ₹12 Lakhs Investment", h1_style))
    story.append(Paragraph("Formula: Equity % = Investment Amount (₹12L) ÷ Post-Money Valuation (Pre-Money + ₹12L)", body_style))
    
    val_headers = [
        Paragraph("<b>Valuation Scenario</b>", table_header),
        Paragraph("<b>Pre-Money Valuation</b>", table_header),
        Paragraph("<b>Post-Money Valuation</b>", table_header),
        Paragraph("<b>Investor Equity %</b>", table_header),
        Paragraph("<b>Founder Recommendation</b>", table_header)
    ]
    
    val_rows = [
        val_headers,
        [Paragraph("<b>Scenario A</b> <i>(High Tech Value)</i>", table_text), Paragraph("₹3.00 Crore ($360K)", table_text), Paragraph("₹3.12 Crore ($375K)", table_text), Paragraph("<b>3.85%</b>", table_text), Paragraph("🟢 <b>Ideal for Founder</b>", table_text)],
        [Paragraph("<b>Scenario B</b> <i>(Standard Benchmark)</i>", table_text), Paragraph("₹2.00 Crore ($240K)", table_text), Paragraph("₹2.12 Crore ($255K)", table_text), Paragraph("<b>5.66% (~5.5%)</b>", table_text), Paragraph("🟢 <b>SWEET SPOT (Recommended)</b>", table_text)],
        [Paragraph("<b>Scenario C</b> <i>(Conservative Floor)</i>", table_text), Paragraph("₹1.50 Crore ($180K)", table_text), Paragraph("₹1.62 Crore ($195K)", table_text), Paragraph("<b>7.40% (~7.0%)</b>", table_text), Paragraph("🟡 <b>Acceptable Floor</b>", table_text)],
        [Paragraph("<b>Scenario D</b> <i>(Over-Diluted / Dangerous)</i>", table_text), Paragraph("₹60 Lakhs ($72K)", table_text), Paragraph("₹72 Lakhs ($86K)", table_text), Paragraph("<b>16.67%</b>", table_text), Paragraph("🔴 <b>REJECT (Destroys Cap-Table)</b>", table_text)]
    ]

    val_widths = [125, 95, 95, 80, 145]
    t_val = Table(val_rows, colWidths=val_widths)
    t_val.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-2), [colors.white, BG_LIGHT]),
        ('BACKGROUND', (0,2), (-1,2), SUCCESS_BG),
        ('BACKGROUND', (0,-1), (-1,-1), WARNING_BG),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_val)
    story.append(Spacer(1, 6))

    # Section 3: Recommended Deal Structures (SAFE Note)
    story.append(Paragraph("3. Recommended Deal Structures: iSAFE vs Direct Equity", h1_style))
    safe_text = (
        "Rather than issuing priced shares today at a low pre-seed valuation, founders should use an "
        "<b>iSAFE (India Simple Agreement for Future Equity)</b> note:<br/>"
        "• <b>Investment Amount:</b> ₹12,00,000 INR<br/>"
        "• <b>Valuation Cap:</b> ₹2.5 Crore to ₹3.0 Crore<br/>"
        "• <b>Discount Rate:</b> 20% discount on the upcoming Seed Round ($300k @ ₹12 Cr Cap).<br/>"
        "• <b>Key Advantage:</b> Avoids paying ₹50,000+ in corporate legal/CS/stamp duty fees today and prevents locking in a low equity price early."
    )
    story.append(Paragraph(safe_text, body_style))
    story.append(Spacer(1, 6))

    # Section 4: Golden Rules for Founder Cap Table Defense
    story.append(Paragraph("4. 4 Golden Rules of Pre-Seed Equity Negotiation", h1_style))
    rules = [
        "<b>Rule 1: Never Dilute >10% in Pre-Seed:</b> Total dilution prior to your institutional Seed round ($300k-$500k) must stay below 10-12% combined.",
        "<b>Rule 2: Implement 4-Year Vesting with 1-Year Cliff:</b> Ensure all founder equity and advisory shares vest over 4 years with a 1-year cliff.",
        "<b>Rule 3: Keep 10% ESOP Pool Separate:</b> Allocate a 10% Employee Stock Option Plan (ESOP) pool for key tech and medical hires prior to Series A.",
        "<b>Rule 4: Avoid Board Seat for <₹50 Lakhs:</b> Micro pre-seed investors (₹12L) should receive observer rights or advisory updates, NOT formal board voting control."
    ]
    for r in rules:
        story.append(Paragraph(r, bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Equity PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "HEALIO_EQUITY_VALUATION_ADVISORY.pdf")
    create_pdf(pdf_path)
