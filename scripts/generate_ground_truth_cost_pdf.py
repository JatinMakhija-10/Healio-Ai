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
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor('#0F172A')   # Slate 900
    SECONDARY = colors.HexColor('#0D9488') # Teal 600
    ACCENT = colors.HexColor('#2563EB')    # Blue 600
    TEXT_DARK = colors.HexColor('#1E293B') # Slate 800
    BG_LIGHT = colors.HexColor('#F8FAFC')  # Slate 50
    BORDER_COLOR = colors.HexColor('#CBD5E1') # Slate 300
    DARK_HEADER_BG = colors.HexColor('#1E293B')
    SUCCESS_BG = colors.HexColor('#F0FDF4')
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceAfter=3
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=SECONDARY,
        spaceAfter=8
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=8,
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
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
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
    story.append(Paragraph("HEALIO.AI — 10-TURN CONVERSATION COST AUDIT", title_style))
    story.append(Paragraph("Mathematical Token Accumulation & Cost Analysis for 5-Turn vs 10-Turn Back-and-Forth AI Consultations", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=6))
    
    # Section 1: Executive Audit Summary
    story.append(Paragraph("1. Multi-Turn Cumulative Token Math (10 Back-and-Forth Turns)", h1_style))
    exec_text = (
        "In LLM chat completions, previous context is re-sent on every API call. For a <b>10-turn back-and-forth consultation</b>, "
        "the cumulative input tokens grow sequentially across turns. Below is the exact step-by-step accumulation matrix "
        "assuming a 1,500 token system prompt, 50 tokens user input/turn, and 150 tokens AI output/turn (1,000 tokens on turn 10)."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Turn Table
    turn_headers = [
        Paragraph("<b>Turn #</b>", table_header),
        Paragraph("<b>System + Context</b>", table_header),
        Paragraph("<b>History Tokens</b>", table_header),
        Paragraph("<b>User Input</b>", table_header),
        Paragraph("<b>Input Tokens</b>", table_header),
        Paragraph("<b>AI Output</b>", table_header)
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
        [Paragraph("<b>TOTAL</b>", table_text), Paragraph("<b>16,000</b>", table_text), Paragraph("<b>9,000</b>", table_text), Paragraph("<b>500</b>", table_text), Paragraph("<b>25,500 Input</b>", table_text), Paragraph("<b>2,350 Output</b>", table_text)]
    ]

    turn_widths = [65, 95, 85, 70, 95, 95]
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

    # Section 2: Cost Comparison Table
    story.append(Paragraph("2. Cost Comparison: 5 Turns vs 10 Turns Across Models", h1_style))
    story.append(Paragraph("All costs include OpenAI API + Vercel Pro + Supabase Pro overhead at $1 USD = ₹83 INR.", body_style))
    
    comp_headers = [
        Paragraph("<b>Model Option</b>", table_header),
        Paragraph("<b>5-Turn Cost</b>", table_header),
        Paragraph("<b>10-Turn Standard</b>", table_header),
        Paragraph("<b>10-Turn w/ Prompt Caching (50%)</b>", table_header),
        Paragraph("<b>Net Margin @ ₹199 Sub</b>", table_header)
    ]
    
    comp_rows = [
        comp_headers,
        [Paragraph("<b>GPT-4o-mini</b> <i>(Fast & Ultra Cheap)</i>", table_text), Paragraph("₹0.21 ($0.0025)", table_text), Paragraph("<b>₹0.45 ($0.0054)</b>", table_text), Paragraph("<b>₹0.28 ($0.0034)</b>", table_text), Paragraph("<b>99.8% Margin</b>", table_text)],
        [Paragraph("<b>Hybrid Mode</b> <i>(Mini + 4o Turn 10)</i>", table_text), Paragraph("₹1.67 ($0.0201)", table_text), Paragraph("<b>₹2.08 ($0.0250)</b>", table_text), Paragraph("<b>₹1.48 ($0.0178)</b>", table_text), Paragraph("<b>99.2% Margin</b>", table_text)],
        [Paragraph("<b>GPT-4o Pure</b> <i>(Flagship Model)</i>", table_text), Paragraph("₹3.29 ($0.0396)", table_text), Paragraph("<b>₹7.26 ($0.0874)</b>", table_text), Paragraph("<b>₹4.60 ($0.0554)</b>", table_text), Paragraph("<b>97.6% Margin</b>", table_text)]
    ]

    comp_widths = [135, 85, 95, 110, 80]
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

    story.append(Paragraph("Key Insights & Why GPT-4o-mini is so Cheap:", h2_style))
    story.append(Paragraph("• <b>Pricing Disparity:</b> GPT-4o-mini costs $0.15 per 1M input tokens vs $2.50 per 1M tokens for GPT-4o — making mini <b>16.6x cheaper per token</b>.", bullet_style))
    story.append(Paragraph("• <b>Automatic Prompt Caching:</b> OpenAI automatically applies a 50% discount to repeated input prompt context, bringing 10-turn GPT-4o-mini session cost down to <b>₹0.28 INR ($0.0034)</b>.", bullet_style))
    story.append(Paragraph("• <b>10-Turn Full GPT-4o Cost:</b> Even if using flagship GPT-4o for all 10 turns, the total cost is <b>₹7.26 INR ($0.087 USD)</b>, leaving a massive profit margin when charging ₹199/mo or taking a ₹90 commission.", bullet_style))

    doc.build(story)
    print(f"10-Turn Ground-Truth PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "HEALIO_GROUND_TRUTH_COST_AUDIT.pdf")
    create_pdf(pdf_path)
