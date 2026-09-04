import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
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
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0D9488")) # Teal accent
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "HEALIO.AI — PRE-SEED INVESTMENT & STRATEGIC MASTER PLAN")
            self.setStrokeColor(colors.HexColor("#E5E7EB"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#6B7280"))
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL — PREPARED FOR HEALIO.AI PITCH DEFENSE")
        self.setStrokeColor(colors.HexColor("#E5E7EB"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        
        self.restoreState()

def md_to_reportlab(text):
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#0D9488">\1</font>', text)
    return text

def build_pdf(md_file_path, output_pdf_path):
    with open(md_file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0D9488")    # Vibrant Medical Teal
    secondary_color = colors.HexColor("#0F766E")  # Deep Teal
    accent_color = colors.HexColor("#0284C7")     # Blue Accent
    dark_neutral = colors.HexColor("#111827")     # Dark Slate Text
    muted_neutral = colors.HexColor("#4B5563")    # Gray Body Text

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=0,
        spaceAfter=10
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

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=dark_neutral,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=body_style,
        fontSize=8,
        leading=10.5
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
                if num_cols == 4:
                    col_widths = [110, 80, 80, 234]
                elif num_cols == 3:
                    col_widths = [120, 140, 244]
                else:
                    col_widths = None

                t = Table(formatted_table_data, colWidths=col_widths)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), primary_color),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('TOPPADDING', (0, 0), (-1, -1), 4),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")])
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
            story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=8))
        elif line_str.startswith('## '):
            story.append(Paragraph(md_to_reportlab(line_str[3:]), h1_style))
        elif line_str.startswith('### '):
            story.append(Paragraph(md_to_reportlab(line_str[4:]), h2_style))
        elif line_str.startswith('* ') or line_str.startswith('- '):
            story.append(Paragraph(f"• {md_to_reportlab(line_str[2:])}", bullet_style))
        elif re.match(r'^\d+\.\s', line_str):
            num_content = re.sub(r'^\d+\.\s', '', line_str)
            story.append(Paragraph(f"• {md_to_reportlab(num_content)}", bullet_style))
        elif line_str == '---':
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceBefore=6, spaceAfter=6))
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
        t = Table(formatted_table_data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")])
        ]))
        story.append(t)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF generated cleanly at: {output_pdf_path}")

if __name__ == '__main__':
    md_path = r"c:\Users\JATIN\Desktop\Healio.AI\docs\business\Healio_AI_Master_Pitch_and_Funding_Plan.md"
    pdf_path = r"c:\Users\JATIN\Desktop\Healio.AI\Healio_AI_Master_Pitch_and_Funding_Plan.pdf"
    build_pdf(md_path, pdf_path)
