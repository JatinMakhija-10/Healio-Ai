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
        self.setFillColor(colors.HexColor("#0F766E"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "HEALIO.AI — HEALTH PERSONA IMPACT & DIAGNOSTIC PIPELINE ANALYSIS")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(54, 744, 558, 744)
        
        # Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, footer_text)
        self.drawString(54, 36, "CONFIDENTIAL — TECHNICAL & CLINICAL ARCHITECTURE DOCUMENTATION")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, 48, 558, 48)
        
        self.restoreState()

def md_to_reportlab(text):
    # Convert bold **text** to <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Convert italic *text* to <i>text</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Convert inline code `text` to <font name="Courier" color="#0F766E"><b>\1</b></font>
    text = re.sub(r'`(.*?)`', r'<font name="Courier" color="#0F766E"><b>\1</b></font>', text)
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

    # Custom color palette
    primary_color = colors.HexColor("#0F766E")   # Deep Teal
    secondary_color = colors.HexColor("#0284C7") # Sky Blue / Slate Accent
    dark_neutral = colors.HexColor("#1E293B")    # Slate 800
    muted_neutral = colors.HexColor("#475569")   # Slate 600

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Title'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=primary_color,
        alignment=0,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=14,
        textColor=muted_neutral,
        spaceAfter=12
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
        leading=13,
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
        spaceAfter=3
    )

    blockquote_style = ParagraphStyle(
        'Blockquote_Custom',
        parent=body_style,
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F766E"),
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

    code_block_style = ParagraphStyle(
        'CodeBlock',
        parent=body_style,
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#0F766E"),
        leftIndent=10,
        spaceBefore=4,
        spaceAfter=4
    )

    story = []

    in_table = False
    table_data = []

    for line in lines:
        line_str = line.strip()

        # Handle tables
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
                if num_cols == 3:
                    col_widths = [110, 160, 234]
                elif num_cols == 2:
                    col_widths = [150, 354]
                elif num_cols == 4:
                    col_widths = [90, 110, 150, 154]
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
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")])
                ]))
                story.append(Spacer(1, 3))
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
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E2E8F0"), spaceBefore=6, spaceAfter=6))
        elif line_str.startswith('```'):
            continue
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
    print(f"PDF successfully created at: {output_pdf_path}")

md_document_text = """# HEALIO.AI — HEALTH PERSONA IMPACT ANALYSIS
> **Detailed Technical & Clinical Architecture Documentation**  
> *Author: Healio.AI Core AI Engineering Team | Version: 3.2 | Platform Architecture Report*

---

## 1. Executive Summary & System Architecture

In **Healio.AI**, a user's **Health Persona** (persisted in Supabase `user_metadata.medical_profile` and managed via `healthPersona.ts`) serves as the foundational clinical context for all diagnostic inference, drug safety filtering, and conversational output formatting.

Rather than relying solely on raw LLM prompts, Healio.AI implements a **Math-First, Bayesian-Authoritative Architecture**. When a patient completes their profile or onboarding, `PersonaEngine.ts` parses raw physiological metrics, lifestyle habits, active medications, and family history into a deterministic, typed data structure (`PersonaProfile`).

This structured profile is fed into four core subsystems:
1. **Bayesian MCMC Engine (`MCMCEngine.ts`)**: Adjusts disease prior probabilities via 12 groups of epidemiological covariate rules ($\alpha$ multipliers).
2. **Drug-Drug & Drug-Disease Interaction Filter (`ddi.ts`)**: Cross-checks candidate remedies against active medications, pre-existing conditions, and pregnancy status to block contraindicated substances.
3. **Clinical Intelligence & Risk Scoring (`orchestrator.ts`)**: Computes Polypharmacy Tiers, Clinical Frailty Index (0–10), and WHO BMI categories.
4. **LLM Prompt Context Generator (`chat/route.ts`)**: Injects structured profile directives, age-stratified dosing tiers, staleness warnings, and gentle interrogative question-framing rules into Groq/Gemini system prompts.

### End-to-End Persona Integration Flow

* **User Input / Onboarding** $\rightarrow$ Supabase `user_metadata.medical_profile`
* **Parser (`healthPersona.ts` & `PersonaEngine.ts`)** $\rightarrow$ Computes BMI, Frailty Index, Polypharmacy Tier, Comorbidity Flags, Medication Flags
* **Bayesian Scoring (`MCMCEngine.ts`)** $\rightarrow$ Applies Covariate Rule Multipliers ($\alpha$) to disease priors
* **Safety Filter (`ddi.ts`)** $\rightarrow$ Blocks contraindicated remedies & flags interactions
* **Prompt Construction (`chat/route.ts`)** $\rightarrow$ Injects structured profile, dosing tiers, & interrogative rules
* **Final Output** $\rightarrow$ Empathetic, personalized, clinical-grade bot response

---

## 2. Deep Dive: Persona Feature Extraction & Deterministic Parsing

The `PersonaEngine.ts` module operates pure deterministic parsing routines without LLM reliance to ensure zero-hallucination guarantee across clinical features:

### A. Body Metrics & BMI Stratification (`computeBMI`)
* **Unit Normalization**: Automatically converts free-text or structured height/weight inputs (`kg`, `lbs`, `cm`, `meters`, `feet/inches` like `5'10"`).
* **BMI Calculation**: $\text{BMI} = \frac{\text{Weight (kg)}}{[\text{Height (m)}]^2}$ rounded to 1 decimal place.
* **WHO Category Assignment**:
  * `underweight`: $\text{BMI} < 18.5$
  * `normal`: $18.5 \le \text{BMI} < 25.0$
  * `overweight`: $25.0 \le \text{BMI} < 30.0$
  * `obese_I`: $30.0 \le \text{BMI} < 35.0$
  * `obese_II`: $35.0 \le \text{BMI} < 40.0$
  * `obese_III`: $\text{BMI} \ge 40.0$ (Morbid Obesity)

### B. Comorbidity & Medication Parsing (`parseConditionFlags`, `parseMedicationFlags`)
* **Comorbidities Parsed**: RegEx pattern matching extracts flags for Thyroid, PCOS, Anemia, Asthma, CKD/Renal disease, Depression, Liver Disease, Autoimmune conditions, Gout, and Epilepsy.
* **High-Risk Medication Classes**: Identifies active usage of Steroids (prednisolone, dexamethasone), Immunosuppressants (cyclosporine, methotrexate), Antidepressants (SSRIs/SNRIs), Anticoagulants (warfarin, heparin, apixaban), Insulin, Thyroid replacement, Statins, and Antihypertensives.

### C. Polypharmacy & Clinical Frailty Index
* **Polypharmacy Risk Tiers**: Calculated from total active medication count:
  * `none`: 0–2 medications
  * `low`: 3–4 medications
  * `moderate`: 5–6 medications (standard polypharmacy threshold)
  * `high`: 7–9 medications
  * `critical`: 10+ medications (hyperpolypharmacy warning activated)
* **Clinical Frailty Index (0–10 Scale)**: Derived from age weighting ($\ge 65 \rightarrow +1$, $\ge 75 \rightarrow +2$, $\ge 85 \rightarrow +3$), physical deficits (sedentary, low sleep), comorbidity burden, polypharmacy tier, and high-risk medications.

---

## 3. Bayesian MCMC Engine & Covariate Rule Multipliers (`MCMCEngine.ts`)

The Bayesian engine computes disease posterior probabilities using Beta distribution priors $\text{Beta}(\alpha, \beta)$. The patient's persona dynamically shifts the prior by multiplying $\alpha$ across 12 rule groups (`COVARIATE_RULES`):

### Summary of Covariate Rule Groups & Multipliers

| Rule Group | Persona Condition / Flag | Targeted Conditions | Alpha Multiplier ($\alpha$) |
| :--- | :--- | :--- | :--- |
| **BMI (Obese III)** | $\text{BMI} \ge 40.0$ | Diabetes / T2DM, Sleep Apnea, Hypertension, GERD / NAFLD, DVT | $\times 3.0 - \times 4.0$ |
| **BMI (Underweight)** | $\text{BMI} < 18.5$ | Anemia, Tuberculosis (TB), Malnutrition, Electrolyte imbalance | $\times 2.0 - \times 2.5$ |
| **Alcohol** | Heavy Drinker / Daily | Gout, Peripheral Neuropathy, Depression / Anxiety | $\times 1.8 - \times 2.0$ |
| **Sleep** | Low Sleep ($<6\text{h}$) | Anxiety, Depression, Hypertension, Immune / Infections | $\times 1.5 - \times 1.8$ |
| **Diet** | Vegan / Vegetarian | B12 Deficiency ($\times 2.5$), Iron Deficiency Anemia ($\times 2.0$) | $\times 2.0 - \times 2.5$ |
| **Diet** | High Salt | Hypertension, Renal Impairment, Gastritis | $\times 1.5$ |
| **Occupation** | Desk Job / IT | Cervical Spondylosis, RSI, Lumbar Disc / Back Pain | $\times 2.0$ |
| **Occupation** | Healthcare Worker | TB, Viral Infections, Hepatitis | $\times 2.0$ |
| **Occupation** | Outdoor Worker | Heat Stroke, Dehydration, Sunburn | $\times 2.0$ |
| **Lifestyle** | Smoker | COPD, Pneumonia, Lung / Oral Cancer, PAD | $\times 2.0 - \times 2.5$ |
| **Family History** | Hereditary Disease Flagged | Cardiac ($\times 2.0$), Diabetes ($\times 2.5$), Cancer ($\times 2.0$), Stroke ($\times 1.8$) | $\times 1.8 - \times 2.5$ |
| **Medication** | On Steroids / Immunosuppressants | Opportunistic Infections, Osteoporosis, Hyperglycemia, Ulcers | $\times 2.0 - \times 2.5$ |
| **Pregnancy** | `isPregnant = true` | Gestational Diabetes ($\times 2.5$), Preeclampsia ($\times 2.5$), Anemia ($\times 2.0$) | $\times 2.0 - \times 2.5$ |

### Practical Clinical Case Comparison

To illustrate the mathematical power of the persona engine, consider two patients presenting with identical symptoms: **"Lower Leg Swelling and Dull Ache"**:

* **Patient A (No Built Persona - Baseline)**:
  * Prior Multipliers: None ($\alpha = 1.0$)
  * Top Diagnosis: Mild Muscle Strain / Venous Insufficiency ($68\%$ confidence)
  * DVT Prior: Low ($12\%$)
* **Patient B (Built Persona: 58y female, Obese Class II, Sedentary Desk Job, On Birth Control)**:
  * Prior Multipliers Applied: Obese DVT multiplier ($\times 2.5$), Sedentary DVT multiplier ($\times 1.8$), Birth Control covariate ($\times 2.0$).
  * Combined Prior Shift: Cumulative $\alpha$ multiplier cap $\times 5.0$.
  * Top Diagnosis: Deep Vein Thrombosis (DVT) / Pulmonary Embolism Risk ($89\%$ confidence)
  * Outcome: Triggers immediate clinical safety alert and recommendation for urgent Doppler ultrasound.

---

## 4. DDI Safety Filters & Drug-Disease Interaction (`ddi.ts`)

Before remedies are passed to the AI response formatter, the **DDI Safety Engine** performs stateless filtering:

1. **Contraindication Suppression**:
   * **Kidney / Renal Disease**: Removes NSAIDs (ibuprofen, naproxen) and nephrotoxic remedies.
   * **Liver Disease**: Removes high-dose acetaminophen/paracetamol and hepatotoxic herbal tinctures.
   * **Anticoagulant Therapy**: Blocks aspirin, ginkgo biloba, high-dose Vitamin E, and homeopathic remedies with antiplatelet properties.
   * **Pregnancy**: Filters out uterine stimulants, high-dose Vitamin A, standard NSAIDs (3rd trimester), and unverified botanicals.
2. **UI Safety Badges**:
   * Remedies with moderate interactions receive $\\Delta$ warning badges in the frontend component (`RemedyCard.tsx`).
   * Highly contraindicated remedies are completely removed from the AI system prompt context.

---

## 5. LLM Prompt Context & Interrogative Question Rules (`chat/route.ts`)

The server injects a formatted `[STRUCTURED PATIENT PROFILE]` block into the system prompt of Groq (Llama-3) or Gemini 1.5:

### Structured Profile Injection Block
```
[STRUCTURED PATIENT PROFILE]
- Name: Rahul Sharma
- Age: 68 years (young elderly (65–74) dosing tier)
- Gender: Male | Height: 172 cm | Weight: 84 kg | BMI: 28.4 (overweight)
[ALLERGIES — NEVER RECOMMEND]
- Penicillin, Sulfa drugs
[PRE-EXISTING CONDITIONS]
- Type 2 Diabetes, Hypertension
[CURRENT MEDICATIONS]
- Metformin 500mg, Telmisartan 40mg
- NOTE: High-risk polypharmacy warning active (2 active medications)
[CLINICAL INFERENCE RULES]
- Diabetes detected: Monitor blood glucose impact. Avoid corticosteroids.
- Hypertension detected: Avoid substances that raise BP (e.g. licorice/mulethi, pseudoephedrine).
[END STRUCTURED PATIENT PROFILE]
```

### Age-Stratified Dosing Tiers
* **Neonate / Infant ($\le 2$ yrs)**: Pediatrician mandatory notice, liquid micro-dosing.
* **Child ($3-11$ yrs)**: Halved adult dosing, gentle herbal formulations.
* **Adolescent ($12-17$ yrs)**: Near-adult dosing with parental guidance.
* **Adult ($18-64$ yrs)**: Standard dosing.
* **Elderly ($\ge 65$ yrs)**: Conservative dosing ($\frac{2}{3}$ standard dose), renal clearance monitoring, polypharmacy screening.

### Gentle Interrogative Framing Rules
The system prompt enforces strict rules regarding how questions are phrased to avoid presumptive or robotic tone:
* **Presumptive Questioning (FORBIDDEN)**: *"What makes your stomach pain worse?"* (Assumes the patient knows or has an aggravating factor).
* **Interrogative Framing (MANDATORY)**: *"Is there anything in particular that seems to make your stomach pain or nausea worse — such as eating certain foods, moving around, stress, or lying down?"*
* **Empathetic Transitions**: When red flags are absent, the bot transitions naturally: *"It is reassuring that those concerning signs are absent. Is there anything specific that brings you relief, like resting, warm fluids, or medicine?"*

---

## 6. Comprehensive Matrix: Default Persona vs Built Persona

| Subsystem / Feature | Default Mode (No Persona Built) | Persona-Built Mode |
| :--- | :--- | :--- |
| **Diagnostic Prior Baseline** | Unweighted population averages | Patient-specific Beta prior ($\alpha$ shifted by BMI, diet, sleep, occupation) |
| **MCMC Convergence Rate** | Standard multi-chain sampling | Accelerated convergence calibrated by individual frailty index |
| **Remedy Safety Filtering** | Generic OTC safety rules | Strict DDI filter matching active meds, pregnancy, & organ disease |
| **Dosing Guidance** | Uniform adult dosage recommendations | Age-stratified dosing tiers (Infant, Child, Adult, Elderly $\frac{2}{3}$ dose) |
| **Clinical Alerts** | Standard red-flag triggers | Tailored comorbidity & polypharmacy risk escalation (L1–L5) |
| **Question Framing** | Static diagnostic question bank | Dynamic, interrogative questions with relevant category examples |
| **RAG Vector Search** | Query based only on symptom text | Query rewritten with age, sex, & chronic condition context |

---

## 7. Conclusion & Architecture Validation

Integrating the **Health Persona** directly into the core mathematical engine rather than treating it as superficial text prompt context achieves three key architectural objectives:
1. **Mathematical Rigor**: Disease likelihoods reflect true epidemiological priors based on patient covariates.
2. **Clinical Safety**: Eliminates drug-drug and drug-disease interaction risks before response generation.
3. **Empathetic Communication**: Ensures conversational tone is respectful, interrogative, and structured around patient needs.
"""

if __name__ == '__main__':
    pdf_out_path = r"c:\Users\JATIN\Desktop\Healio.AI\Healio_AI_Health_Persona_Impact_Analysis.pdf"
    build_pdf(md_document_text, pdf_out_path)
