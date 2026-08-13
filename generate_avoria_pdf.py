import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "AVORIA.AI — OFFICIAL COMPANY REGISTRATION & INCORPORATION DOSSIER")
            self.setStrokeColor(colors.HexColor("#E5E7EB"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL — FOR AVORIA HEALTHTECH PRIVATE LIMITED INCORPORATION FILING")
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        
        self.restoreState()

def md_to_reportlab(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#1F2937">\1</font>', text)
    return text

def build_pdf(md_content, output_pdf_path):
    lines = md_content.split('\n')

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0F766E")   # Deep Teal
    secondary_color = colors.HexColor("#059669") # Emerald
    dark_neutral = colors.HexColor("#111827")    # Charcoal
    muted_neutral = colors.HexColor("#4B5563")   # Gray

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=0,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=secondary_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=dark_neutral,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=dark_neutral,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    blockquote_style = ParagraphStyle(
        'Blockquote_Custom',
        parent=body_style,
        fontName='Helvetica-Oblique',
        textColor=muted_neutral,
        leftIndent=14,
        rightIndent=14,
        spaceBefore=4,
        spaceAfter=4
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=body_style,
        fontSize=7.5,
        leading=9.5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=table_cell_style,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    story = []

    in_table = False
    table_data = []

    for line in lines:
        line_str = line.strip()

        if line_str.startswith('|'):
            in_table = True
            if '---' in line_str:
                continue
            cells = [c.strip() for c in line_str.split('|')[1:-1]]
            table_data.append(cells)
            continue
        elif in_table:
            if table_data:
                formatted_table_data = []
                for row_idx, row in enumerate(table_data):
                    formatted_row = []
                    for col in row:
                        st = table_header_style if row_idx == 0 else table_cell_style
                        formatted_row.append(Paragraph(md_to_reportlab(col), st))
                    formatted_table_data.append(formatted_row)

                num_cols = len(table_data[0])
                if num_cols == 2:
                    col_widths = [160, 344]
                elif num_cols == 3:
                    col_widths = [120, 160, 224]
                else:
                    col_widths = None

                t = Table(formatted_table_data, colWidths=col_widths)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")])
                ]))
                story.append(Spacer(1, 4))
                story.append(t)
                story.append(Spacer(1, 6))
            in_table = False
            table_data = []

        if not line_str:
            story.append(Spacer(1, 3))
            continue

        if line_str.startswith('# '):
            story.append(Paragraph(md_to_reportlab(line_str[2:]), title_style))
            story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceAfter=8))
        elif line_str.startswith('## '):
            story.append(Paragraph(md_to_reportlab(line_str[3:]), h1_style))
        elif line_str.startswith('### '):
            story.append(Paragraph(md_to_reportlab(line_str[4:]), h2_style))
        elif line_str.startswith('#### '):
            story.append(Paragraph(md_to_reportlab(line_str[5:]), h3_style))
        elif line_str.startswith('> '):
            story.append(Paragraph(md_to_reportlab(line_str[2:]), blockquote_style))
        elif line_str.startswith('* ') or line_str.startswith('- '):
            story.append(Paragraph(f"• {md_to_reportlab(line_str[2:])}", bullet_style))
        elif re.match(r'^\d+\.\s', line_str):
            num_content = re.sub(r'^\d+\.\s', '', line_str)
            story.append(Paragraph(f"• {md_to_reportlab(num_content)}", bullet_style))
        elif line_str == '---':
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceBefore=6, spaceAfter=6))
        else:
            story.append(Paragraph(md_to_reportlab(line_str), body_style))

    if in_table and table_data:
        formatted_table_data = []
        for row_idx, row in enumerate(table_data):
            formatted_row = []
            for col in row:
                st = table_header_style if row_idx == 0 else table_cell_style
                formatted_row.append(Paragraph(md_to_reportlab(col), st))
            formatted_table_data.append(formatted_row)
        num_cols = len(table_data[0])
        col_widths = [160, 344] if num_cols == 2 else None
        t = Table(formatted_table_data, colWidths=col_widths)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")])
        ]))
        story.append(t)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully created: {output_pdf_path}")

md_content = """# Official Company Registration & Incorporation Dossier: Avoria.AI

## 1. Company Quick Reference & NIC Codes

| Field | Official Value / Specification |
|---|---|
| Proposed Corporate Name | Avoria Healthtech Private Limited (or Avoria.AI Inc.) |
| Brand / Trade Name | Avoria.AI |
| Industry Sector | Healthcare Technology (HealthTech) / Digital Health & AI Wellness |
| Business Category | Information Technology Enabled Services (ITES) — Software & Triage Platform |
| Primary NIC Code 1 | 62011 / 62099 — Development of computer software, medical AI engines, and IT services |
| Primary NIC Code 2 | 86909 — Other human health activities (Digital health assessment, triage & consultation platform) |
| Primary NIC Code 3 | 63112 — Data processing, hosting, and web portal service operations |

---

## 2. Nature of Business (Short Formal Statement)

> Nature of Business: Avoria.AI is engaged in the business of software development, artificial intelligence research, and digital healthcare delivery. The company designs, operates, and maintains an AI-powered clinical decision support and health triage platform that integrates modern evidence-based medicine with digitized Ayurvedic constitutional intelligence (Prakriti/Vikriti). The platform operates a three-sided marketplace connecting individual patients, verified medical doctors and Ayurvedic practitioners, and public health analytics administrators.

---

## 3. Short Description of Business (For Official Forms / SPICe+ Brief — 150 Words)

Avoria.AI is a next-generation HealthTech platform that functions as the "intelligent front door" to healthcare. It replaces panicky web searches with a mathematically backed, empathetic Bayesian AI diagnosis engine that assesses 265+ medical conditions across 19 specialized databases in real time.

Uniquely fusing modern clinical decision rules (such as Wells, PERC, and HEART scores) with digitized Ayurvedic wisdom (Prakriti body-type analysis and Vikriti imbalance tracking), Avoria provides users with instant, anxiety-reducing triage reports, home remedies, dietary guidance, and seamless appointment booking with certified medical specialists.

The platform operates on a multi-pillar business model, combining Direct-to-Consumer (DTC) wellness subscriptions (Avoria Plus), Provider SaaS subscriptions (Avoria Pro dashboard for doctors), consultation marketplace commissions, and anonymized public health bio-surveillance analytics.

---

## 4. Comprehensive Description of Business & Operational Architecture

### 4.1 Core Product & AI Diagnostic Engine (Core IP)
* Bayesian Inference Engine: Computes condition probabilities based on disease prevalence, demographic risk factors (age, gender), and symptom specificity.
* Akinator-Style Dynamic Questioning: Uses maximum information-gain algorithms (Shannon entropy reduction) to ask 5–7 targeted follow-up questions, avoiding user fatigue.
* Natural Language Understanding (NLU) & Empathy:
  * IntentEngine: Priority cascade scanner executing in sub-50ms to detect 20+ life-threatening cardiac, stroke, respiratory, or mental health crisis patterns and route users to emergency protocols.
  * MedicalNER: Named Entity Recognition module mapping 200+ layman terms to normalized medical terminology.
  * Empathetic Response Generator: De-escalates health anxiety using supportive, conversational language tailored for Gen Z and young adults.
* Clinical Decision Support System (CDSS): Hardcoded clinical algorithms (Wells Score, PERC Rule, HEART Score, NEXUS Criteria, Ottawa Ankle Rules) and 13 symptom correlation pattern boosters.

### 4.2 Integrated Ayurvedic & Holistic Wellness Engine
* Prakriti Assessment: Digitized constitutional scoring determining dominant Doshas (Vata, Pitta, Kapha) through a 6-category weighted vector model.
* Vikriti & Remedy Mapping: Maps 45,000+ bytes of Ayurvedic condition data to offer Sanskrit-named conditions, verified home remedies (Dadi Maa Ke Nuskhe), yoga asanas, and dietary adjustments alongside modern OTC guidance.

### 4.3 Three-Sided Platform Architecture
1. Patient Portal (B2C App): Unlimited AI health triage, anxiety reduction, 5 automated health risk calculators (Framingham-adapted cardiovascular, diabetes, liver, respiratory, BMI), downloadable medical reports, and specialist booking.
2. Doctor/Practitioner Portal (B2B SaaS — Avoria Pro): AI-generated pre-consultation intake summaries (saving physicians up to 2 hours of daily notes), digital prescription tools, credential verification, and patient recovery analytics.
3. Admin & Bio-Surveillance Portal (Enterprise): Real-time geographic symptom clustering heatmaps for epidemic outbreak detection and clinical trial participant matching.

### 4.4 Business & Revenue Model (4-Pillar Ecosystem)
1. Direct-to-Consumer (DTC): Avoria Plus freemium subscription (Rs 199/month or $4.99/month) for deep reports, family profiles, and unlimited Ayurvedic scans + Contextual affiliate commerce.
2. Provider SaaS (B2B): Monthly/annual subscriptions for doctors to access the Avoria Pro Workspace and sponsored clinic search placement.
3. Marketplace Commissions: 10%–20% platform commission fee per virtual/in-person doctor booking.
4. Enterprise & Data Licensing: Anonymized public health bio-surveillance analytics for health authorities and clinical trial recruitment fees.

---

## 5. Main Objects of the Company (Clause III(A) Memorandum of Association — MoA Drafting)

1. To design, develop, build, test, deploy, license, import, export, buy, sell, and maintain artificial intelligence software, machine learning models, Bayesian probabilistic algorithms, natural language understanding engines, clinical decision support systems, mobile applications, and web portals for medical triage, health assessment, and holistic wellness guidance.

2. To establish, operate, manage, and scale a multi-sided digital health platform and e-marketplace connecting individuals and patients with verified allopathic doctors, Ayurvedic practitioners, homeopathic physicians, wellness consultants, clinics, hospitals, diagnostic centers, and healthcare providers for tele-consultations, appointment booking, medical records management, and care coordination.

3. To digitize, structure, analyze, integrate, and commercialize traditional and alternative systems of medicine, including Ayurveda, Yoga, Naturopathy, Homeopathy, and natural remedies, combining them with modern evidence-based clinical decision rules to provide personalized, preventive, and holistic health care recommendations.

4. To develop and provide B2B Software-as-a-Service (SaaS) applications, practice management dashboards, electronic health records (EHR) summaries, automated clinical documentation tools, and professional branding portals for healthcare professionals, clinics, and medical institutions.

5. To collect, aggregate, process, analyze, and license non-personally identifiable, anonymized epidemiological data, bio-surveillance heatmaps, clinical trial matching indexes, and health risk analytics to public health authorities, research organizations, pharmaceutical companies, and insurance partners, strictly adhering to global data protection laws (HIPAA, DISHA, GDPR).

---

## 6. Technical & Strategic Differentiators (Moat)

* Client-Side/Edge AI Execution: Computes complex Bayesian inference directly within the client application, reducing per-query server infrastructure costs to near zero (~80–90% gross margins).
* Dual-Knowledge Graph: Proprietary database mapping 265+ clinical conditions to modern treatments and Ayurvedic protocols (Vata/Pitta/Kapha balances), creating a multi-year entry barrier for competitors.
* Validated Safety Firewall: Sub-50ms priority triage cascade ensuring zero false negatives for critical emergencies while reducing unnecessary panic for benign symptoms.
"""

if __name__ == '__main__':
    output_pdf = r"c:\Users\JATIN\Desktop\Healio.AI\Avoria_AI_Company_Registration_Dossier.pdf"
    build_pdf(md_content, output_pdf)
