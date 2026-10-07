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
            self.drawString(36, 756, "AROVIA.AI — CONVERTIBLE NOTES & SAFE AGREEMENT GUIDE")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)
            
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_text)
        self.drawString(36, 25, "CONFIDENTIAL — FOUNDER LEGAL & FINANCIAL ADVISORY")
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
    story.append(Paragraph("AROVIA.AI — CONVERTIBLE NOTES & SAFE GUIDE", title_style))
    story.append(Paragraph("Complete Legal & Financial Framework for Pre-Seed Fundraising in India (iSAFE, CCD, CCPS, CN)", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=8))
    
    # Section 1: What is a Convertible Note / SAFE?
    story.append(Paragraph("1. Understanding Convertible Notes & SAFE Agreements", h1_style))
    exec_text = (
        "A <b>Convertible Note (CN)</b> or <b>SAFE (Simple Agreement for Future Equity)</b> is a fundraising instrument "
        "where an investor puts in capital today (e.g. ₹12 Lakhs) without pricing the equity shares immediately. "
        "Instead of issuing equity shares right away, the investment automatically <b>converts into equity shares at a future date</b> "
        "when the startup raises its next qualified round (e.g., $300,000 Seed Round)."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Key Terms
    story.append(Paragraph("2. The 4 Core Terms of a Convertible Note", h1_style))
    terms = [
        "<b>1. Valuation Cap ('Cap'):</b> The maximum company valuation at which the note converts into equity shares during the next round. E.g., a ₹3.0 Crore Cap ensures early investors get a lower price per share than new investors.",
        "<b>2. Discount Rate:</b> A percentage discount (typically <b>15% to 20%</b>) granted to the pre-seed investor on the share price of the upcoming Seed round.",
        "<b>3. Interest Rate (Coupon):</b> Traditional convertible debt carries 0% to 6% annual interest. SAFE and iSAFE notes carry <b>0% interest</b> as they are pure equity agreements.",
        "<b>4. Maturity Date / Longstop Date:</b> The timeframe (typically <b>18 to 36 months</b>) by which if no Seed round occurs, the note converts automatically at the Valuation Cap."
    ]
    for t in terms:
        story.append(Paragraph(t, bullet_style))
    story.append(Spacer(1, 6))

    # Instrument Comparison Matrix
    story.append(Paragraph("3. Comparison of Indian Fundraising Instruments for ₹12 Lakhs", h1_style))
    
    inst_headers = [
        Paragraph("<b>Instrument Name</b>", table_header),
        Paragraph("<b>Legal Structure</b>", table_header),
        Paragraph("<b>ROC Filing Cost</b>", table_header),
        Paragraph("<b>Conversion Trigger</b>", table_header),
        Paragraph("<b>Recommendation</b>", table_header)
    ]
    
    inst_rows = [
        inst_headers,
        [Paragraph("<b>iSAFE Note</b> <i>(100x.VC Standard)</i>", table_text), Paragraph("Future Equity Agreement", table_text), Paragraph("Zero (Simple Contract)", table_text), Paragraph("Next Seed Round / Cap", table_text), Paragraph("🟢 <b>TOP CHOICE for ₹12L</b>", table_text)],
        [Paragraph("<b>DPIIT Convertible Note</b>", table_text), Paragraph("Debt converting to Equity", table_text), Paragraph("Low (Stamp Duty)", table_text), Paragraph("Up to 10 Years", table_text), Paragraph("🟢 <b>Great for DPIIT Startups</b>", table_text)],
        [Paragraph("<b>CCD</b> <i>(Compulsorily Convertible)</i>", table_text), Paragraph("Debenture Instrument", table_text), Paragraph("Moderate (PAS-3)", table_text), Paragraph("Up to 10 Years", table_text), Paragraph("🟡 Standard Indian Angel Choice", table_text)],
        [Paragraph("<b>CCPS</b> <i>(Priced Equity Round)</i>", table_text), Paragraph("Preference Shares", table_text), Paragraph("High (₹50k+ Valuer + ROC)", table_text), Paragraph("Immediate Issuance", table_text), Paragraph("🔴 Too costly for ₹12L round", table_text)]
    ]

    inst_widths = [115, 105, 95, 105, 120]
    t_inst = Table(inst_rows, colWidths=inst_widths)
    t_inst.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('BACKGROUND', (0,1), (-1,1), SUCCESS_BG),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(t_inst)
    story.append(Spacer(1, 6))

    # Section 4: Numerical Example
    story.append(Paragraph("4. Step-by-Step Conversion Example for Arovia.AI", h1_style))
    example_text = (
        "<b>Step 1 (Today - Pre-Seed):</b> Investor invests <b>₹12,00,000 INR</b> into Arovia.AI via an iSAFE note with a <b>₹3.0 Crore Valuation Cap</b> and a <b>20% Discount</b>.<br/>"
        "<b>Step 2 (12 Months Later - Seed Round):</b> Arovia.AI raises a $300,000 (~₹2.5 Crore) Seed round from a VC at a <b>₹10.0 Crore Valuation</b>.<br/>"
        "<b>Step 3 (Conversion Math):</b><br/>"
        "• Standard Seed Price Valuation = ₹10.0 Crore<br/>"
        "• Investor's Cap Valuation = ₹3.0 Crore (Much better price for early investor than 20% discount on ₹10 Cr = ₹8 Cr).<br/>"
        "• Investor Equity Granted at Conversion = ₹12,00,000 ÷ (₹3,00,000,000 + ₹12,00,000) = <b>3.85% Equity</b>.<br/>"
        "<b>Result:</b> The ₹12L investor gets 3.85% equity when you scale to ₹10 Crore valuation, without you having to issue shares or pay ₹50k in ROC fees early!"
    )
    story.append(Paragraph(example_text, body_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Convertible Note PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "AROVIA_CONVERTIBLE_NOTE_AND_SAFE_GUIDE.pdf")
    create_pdf(pdf_path)
