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
            self.drawString(36, 756, "AROVIA.AI — TECHNICAL AI ENGINE ARCHITECTURE EXPLAINER")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)
            
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 25, page_text)
        self.drawString(36, 25, "CONFIDENTIAL — TECHNICAL & CLINICAL DEEP-DIVE")
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
        fontSize=19,
        leading=23,
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
        spaceAfter=8
    )
    
    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=9,
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
    story.append(Paragraph("AROVIA.AI — TECHNICAL AI ENGINE ARCHITECTURE", title_style))
    story.append(Paragraph("How the Diagnostic Engine Works: Math-First Bayesian MCMC, Prakriti Profiling, Clinical Rules & LLM Formatting", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=SECONDARY, spaceAfter=6))
    
    # Section 1: Core Architectural Thesis
    story.append(Paragraph("1. Core Thesis: Math-First Architecture (Not an LLM Wrapper)", h1_style))
    exec_text = (
        "Unlike generic symptom checkers or raw LLM chatbots (ChatGPT/WebMD) that suffer from diagnostic hallucinations, "
        "Arovia.AI implements a <b>Math-First Clinical Architecture</b>. "
        "The <b>Bayesian MCMC Probabilistic Engine has 100% TOTAL AUTHORITY</b> over the diagnosis and confidence scoring. "
        "The LLM (OpenAI / Gemini / Groq) acts purely as a <b>Natural Language Formatter & Compassionate Writer</b>, "
        "articulating pre-verified database remedies and medical descriptions."
    )
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 4))
    
    # Pipeline Diagram Table
    story.append(Paragraph("2. The 6-Stage Diagnostic Pipeline Architecture", h1_style))
    
    pipe_headers = [
        Paragraph("<b>Stage</b>", table_header),
        Paragraph("<b>Engine / Module</b>", table_header),
        Paragraph("<b>Key Operation & Functionality</b>", table_header),
        Paragraph("<b>Latency / Output</b>", table_header)
    ]
    
    pipe_rows = [
        pipe_headers,
        [Paragraph("<b>Stage 0</b>", table_text), Paragraph("Red Flag Scan", table_text), Paragraph("20+ regex emergency patterns (chest pain + sweat, cyanosis, worst headache). Bypasses AI if critical.", table_text), Paragraph("&lt;200ms (Immediate Override)", table_text)],
        [Paragraph("<b>Stage 1</b>", table_text), Paragraph("Bayesian MCMC Engine", table_text), Paragraph("Calculates P(Condition|Symptoms) in log-probability space across 265+ condition DBs with Prakriti weighting.", table_text), Paragraph("~150ms (Authority Score)", table_text)],
        [Paragraph("<b>Stage 1b</b>", table_text), Paragraph("Convergence Gate (CP10)", table_text), Paragraph("Checks R̂ ≤ 1.05 & ESS &gt; 100. If un-converged, blocks AI and triggers Information Gain clarifying question.", table_text), Paragraph("Adaptive Follow-up Q", table_text)],
        [Paragraph("<b>Stage 2</b>", table_text), Paragraph("Clinical Decision Rules", table_text), Paragraph("Evaluates ED scoring algorithms: Wells (DVT), PERC (Pulmonary Embolism), HEART (Cardiac), NEXUS, Ottawa.", table_text), Paragraph("Score Tier Output", table_text)],
        [Paragraph("<b>Stage 2.5</b>", table_text), Paragraph("DDI Safety Filter", table_text), Paragraph("Cross-checks all remedies against user medications & pregnancy. Removes contraindicated remedies from LLM prompt.", table_text), Paragraph("Blocked/Flagged List", table_text)],
        [Paragraph("<b>Stage 3</b>", table_text), Paragraph("LLM Natural Language", table_text), Paragraph("OpenAI / Gemini formats diagnosis rationale, safe remedies (Ayurvedic + Allopathic), and home remedies.", table_text), Paragraph("Compassionate Text", table_text)],
        [Paragraph("<b>Stage 4-6</b>", table_text), Paragraph("Clinical Intelligence", table_text), Paragraph("Quantifies 95% Bayesian credible intervals and runs 8 parallel intelligence modules (rare disease, similarity).", table_text), Paragraph("Enhanced Output", table_text)]
    ]

    pipe_widths = [55, 110, 260, 115]
    t_pipe = Table(pipe_rows, colWidths=pipe_widths)
    t_pipe.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), DARK_HEADER_BG),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_pipe)
    story.append(Spacer(1, 6))

    # Page Break for Deep Dive Details
    story.append(PageBreak())

    # Section 3: Deep Dive into Core Engines
    story.append(Paragraph("3. Deep-Dive Technical Mechanism of Key Engines", h1_style))
    
    story.append(Paragraph("A. Bayesian Log-Probability Scoring Engine", h2_style))
    story.append(Paragraph("Uses Bayes' Theorem calculated in log-probability space to prevent floating-point underflow:", body_style))
    story.append(Paragraph("P(Condition | Symptoms) ∝ P(Prior) × Π [Sensitivity / (1 - Specificity)]", bullet_style))
    story.append(Paragraph("• <b>Negation Handling (NegEx):</b> When a user says 'No fever', the log-odds actively <i>subtract</i> probability for fever-expecting conditions.", bullet_style))
    story.append(Paragraph("• <b>Sigmoid Normalization:</b> Converts raw log-odds into a calibrated 0-100% confidence score.", bullet_style))

    story.append(Paragraph("B. Ayurvedic Intelligence Layer (Prakriti & Vikriti Profiling)", h2_style))
    story.append(Paragraph("• <b>Prakriti Engine:</b> Assesses immutable birth constitution (Vata, Pitta, Kapha) across 20+ physical, physiological, and psychological parameters.", bullet_style))
    story.append(Paragraph("• <b>Bayesian Integration:</b> Modifies Bayesian log-odds priors based on dosha susceptibility (e.g. Vata users reporting joint stiffness receive calibrated constitutional weightings).", bullet_style))

    story.append(Paragraph("C. Medical NER & Information Gain Selector", h2_style))
    story.append(Paragraph("• <b>Medical NER:</b> Maps 200+ layman phrases ('my head is pounding' → headache) and detects duration, frequency, and severity modifiers.", bullet_style))
    story.append(Paragraph("• <b>Information Gain ('The Akinator Strategy'):</b> Selects follow-up questions that maximize Shannon Entropy reduction between candidate conditions.", bullet_style))

    story.append(Paragraph("D. Drug-Drug & Drug-Herb Interaction (DDI) Filter", h2_style))
    story.append(Paragraph("• Cross-checks recommended Ayurvedic herbs (*Ashwagandha, Guggulu, Trikatu*) and Allopathic remedies against active prescription drugs.", bullet_style))
    story.append(Paragraph("• Contraindicated items are stripped before passing context to OpenAI/Gemini, ensuring 100% clinical safety.", bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"AI Engine Explainer PDF successfully generated at: {filename}")

if __name__ == "__main__":
    out_dir = os.path.join(os.getcwd(), "docs", "business")
    os.makedirs(out_dir, exist_ok=True)
    pdf_path = os.path.join(out_dir, "AROVIA_AI_ENGINE_ARCHITECTURAL_EXPLAINER.pdf")
    create_pdf(pdf_path)
