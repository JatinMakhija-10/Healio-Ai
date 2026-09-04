import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

const mappings = [
    {
        targetDir: path.join(rootDir, 'docs', 'pdf_reports'),
        files: [
            'Arovia-Report-Sinus-Headache-2026-04-18.pdf',
            'Arovia_AI_Chatbot_Architecture_DeepDive.pdf',
            'Arovia_AI_Company_Registration_Dossier.pdf',
            'Arovia_AI_Investor_Pitch_QA_Guide.pdf',
            'Arovia_AI_Master_Investor_Dossier.pdf',
            'Arovia_AI_Math_RAG_Code_DeepDive.pdf',
            'Arovia_AI_Pitch_Master_Dossier.pdf',
            'Arovia_AI_Pitch_Night_Before_Briefing.pdf',
            'Arovia_AI_Plain_English_Tech_Guide.pdf',
            'Arovia_AI_Technical_Architecture.pdf',
            'Arovia_Engine_Documentation.pdf',
            'Arovia_Incubator_Board_Master_Prep_Guide.pdf',
            'Arovia_Investor_Pitch_Vision_Guide.pdf',
            'Arovia_UI_Audit_Report.pdf',
            'Healio_AI_Health_Persona_Impact_Analysis.pdf',
            'Healio_AI_Master_Pitch_and_Funding_Plan.pdf',
            'LUND.pdf',
            'Report.pdf'
        ]
    },
    {
        targetDir: path.join(rootDir, 'docs', 'architecture'),
        files: [
            'AROVIA_BRAND_CONTEXT.md',
            'AROVIA_REDESIGN_AUDIT.md',
            'Arovia-AI-Product-UX-Audit.md',
            'Arovia_Engine_Documentation.md',
            'CURRENT_STATUS.md',
            'HOMEOPATHY_KNOWLEDGE_BASE.md',
            'TODO.md',
            'arovia_landing_page_design_plan.md'
        ]
    },
    {
        targetDir: path.join(rootDir, 'scripts', 'generators'),
        files: [
            'generate_arovia_pdf.py',
            'generate_healio_master_pdf.py',
            'generate_persona_pdf.py',
            'generate_pitch_prep_pdf.py',
            'generate_pitch_vision_pdf.py'
        ]
    },
    {
        targetDir: path.join(rootDir, 'scripts', 'helpers'),
        files: [
            'commit_script.js',
            'run_full_disease_test.mjs',
            'test_long_chat.mjs',
            'tmp_analyze.js',
            'tmp_analyze_utf8.js',
            'tmp_pubmed_check.py'
        ]
    },
    {
        targetDir: path.join(rootDir, 'data', 'spreadsheets'),
        files: [
            'Essential_Medicines_List_2013_Delhi.xlsx',
            'cure_minor.xlsx'
        ]
    },
    {
        targetDir: path.join(rootDir, 'logs', 'build_and_lint'),
        files: [
            '.next-dev-3100.log',
            '.next-dev-mobile-fix.log',
            '.next-dev-uiux.err.log',
            '.next-dev-uiux.log',
            '.next-dev.log',
            'HEAD_diff.txt',
            'build_output.txt',
            'build_output2.txt',
            'build_output3.txt',
            'build_output_videos.txt',
            'get_diff.txt',
            'lint_errors_final.txt',
            'lint_final.json',
            'lint_final.txt',
            'lint_final2.json',
            'lint_final_new.json',
            'lint_output.txt',
            'lint_report.json',
            'lint_summary.txt',
            'lint_summary2.txt',
            'lint_summary_utf8.txt',
            'tmp_hooks.txt',
            'tmp_test_out.txt',
            'tmpval.txt',
            'tsc_output.txt',
            'vercel_out.txt'
        ]
    }
];

let movedCount = 0;

for (const group of mappings) {
    if (!fs.existsSync(group.targetDir)) {
        fs.mkdirSync(group.targetDir, { recursive: true });
    }

    for (const fileName of group.files) {
        const sourcePath = path.join(rootDir, fileName);
        const destPath = path.join(group.targetDir, fileName);

        if (fs.existsSync(sourcePath)) {
            fs.renameSync(sourcePath, destPath);
            movedCount++;
            console.log(`Moved: ${fileName} -> ${path.relative(rootDir, destPath)}`);
        }
    }
}

console.log(`Successfully organized ${movedCount} files without deleting anything!`);
