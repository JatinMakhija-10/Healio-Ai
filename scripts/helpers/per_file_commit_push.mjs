import { execSync } from 'child_process';

const commits = [
  // 1. Core feature changes
  {
    files: ['src/app/api/chat/route.ts'],
    msg: 'feat(chat): inject dynamic symptom context and interrogative prompt framing'
  },
  {
    files: ['src/app/dashboard/consult/components/PainSliderWidget.tsx'],
    msg: 'feat(ui): implement dynamic symptom title and description extraction in PainSliderWidget'
  },
  {
    files: ['src/app/dashboard/consult/components/ChatWindow.tsx'],
    msg: 'feat(ui): pass latest message content to PainSliderWidget for dynamic symptom parsing'
  },
  {
    files: ['src/components/chat/IntakeCard.tsx'],
    msg: 'feat(ui): update IntakeCard trigger and relief labels to interrogative style'
  },
  {
    files: ['src/lib/diagnosis/dialogue/SymptomQuestionSchemas.ts'],
    msg: 'feat(diagnosis): update symptom question schemas with interrogative trigger framing'
  },
  {
    files: ['src/app/dashboard/consult/components/__tests__/PainSliderWidget.test.ts'],
    msg: 'test(ui): add unit tests for dynamic symptom term extraction in PainSliderWidget'
  },

  // 2. Relocated Documentation Architecture Files
  {
    files: ['AROVIA_BRAND_CONTEXT.md', 'docs/architecture/AROVIA_BRAND_CONTEXT.md'],
    msg: 'docs: relocate AROVIA_BRAND_CONTEXT.md to docs/architecture/'
  },
  {
    files: ['AROVIA_REDESIGN_AUDIT.md', 'docs/architecture/AROVIA_REDESIGN_AUDIT.md'],
    msg: 'docs: relocate AROVIA_REDESIGN_AUDIT.md to docs/architecture/'
  },
  {
    files: ['Arovia-AI-Product-UX-Audit.md', 'docs/architecture/Arovia-AI-Product-UX-Audit.md'],
    msg: 'docs: relocate Arovia-AI-Product-UX-Audit.md to docs/architecture/'
  },
  {
    files: ['Arovia_Engine_Documentation.md', 'docs/architecture/Arovia_Engine_Documentation.md'],
    msg: 'docs: relocate Arovia_Engine_Documentation.md to docs/architecture/'
  },
  {
    files: ['CURRENT_STATUS.md', 'docs/architecture/CURRENT_STATUS.md'],
    msg: 'docs: relocate CURRENT_STATUS.md to docs/architecture/'
  },
  {
    files: ['HOMEOPATHY_KNOWLEDGE_BASE.md', 'docs/architecture/HOMEOPATHY_KNOWLEDGE_BASE.md'],
    msg: 'docs: relocate HOMEOPATHY_KNOWLEDGE_BASE.md to docs/architecture/'
  },
  {
    files: ['TODO.md', 'docs/architecture/TODO.md'],
    msg: 'docs: relocate TODO.md to docs/architecture/'
  },
  {
    files: ['arovia_landing_page_design_plan.md', 'docs/architecture/arovia_landing_page_design_plan.md'],
    msg: 'docs: relocate arovia_landing_page_design_plan.md to docs/architecture/'
  },
  {
    files: ['CHUt/Arovia-AI-Forensic-Engineering-Audit.md', 'Extra/Arovia-AI-Forensic-Engineering-Audit.md'],
    msg: 'docs: relocate Forensic Engineering Audit to Extra/'
  },
  {
    files: ['CHUt/arovia-ai-audit-of-audit.md', 'Extra/arovia-ai-audit-of-audit.md'],
    msg: 'docs: relocate audit of audit file to Extra/'
  },

  // 3. New Documentation & Business Guides
  {
    files: ['docs/business/Arovia_Investor_Pitch_Vision_Guide.md'],
    msg: 'docs(business): add Arovia Investor Pitch Vision Guide'
  },
  {
    files: ['docs/business/Healio_AI_Master_Pitch_and_Funding_Plan.md'],
    msg: 'docs(business): add Healio AI Master Pitch and Funding Plan'
  },

  // 4. Relocated & New Python Generators
  {
    files: ['generate_arovia_pdf.py', 'scripts/generators/generate_arovia_pdf.py'],
    msg: 'scripts: relocate generate_arovia_pdf.py to scripts/generators/'
  },
  {
    files: ['scripts/generators/generate_healio_master_pdf.py'],
    msg: 'scripts: add generate_healio_master_pdf.py generator script'
  },
  {
    files: ['scripts/generators/generate_persona_pdf.py'],
    msg: 'scripts: add generate_persona_pdf.py generator script'
  },
  {
    files: ['generate_pitch_prep_pdf.py', 'scripts/generators/generate_pitch_prep_pdf.py'],
    msg: 'scripts: relocate generate_pitch_prep_pdf.py to scripts/generators/'
  },
  {
    files: ['scripts/generators/generate_pitch_vision_pdf.py'],
    msg: 'scripts: add generate_pitch_vision_pdf.py generator script'
  },

  // 5. Relocated & New Scripts & Helpers
  {
    files: ['commit_script.js', 'scripts/helpers/commit_script.js'],
    msg: 'scripts: relocate commit_script.js helper script'
  },
  {
    files: ['scripts/helpers/run_full_disease_test.mjs'],
    msg: 'scripts: add run_full_disease_test.mjs helper script'
  },
  {
    files: ['test_long_chat.mjs', 'scripts/helpers/test_long_chat.mjs'],
    msg: 'scripts: relocate test_long_chat.mjs helper script'
  },
  {
    files: ['scripts/organize_workspace.mjs'],
    msg: 'scripts: add organize_workspace.mjs workspace organizer script'
  },

  // 6. Cleanup root outputs
  {
    files: [
      'build_output.txt',
      'build_output2.txt',
      'build_output3.txt',
      'tmpval.txt',
      'tsc_output.txt',
      'vercel_out.txt',
      'cure_minor.xlsx',
      '.gitignore'
    ],
    msg: 'chore: update .gitignore and clean up root directory log outputs'
  },

  // 7. Workspace documentation
  {
    files: ['WORKSPACE_STRUCTURE.md'],
    msg: 'docs: add WORKSPACE_STRUCTURE.md repository structure guide'
  }
];

let totalCommitted = 0;
let totalPushed = 0;

for (const item of commits) {
  try {
    for (const f of item.files) {
      execSync(`git add "${f}"`, { stdio: 'pipe' });
    }
    execSync(`git commit -m "${item.msg}"`, { stdio: 'pipe' });
    totalCommitted++;
    console.log(`[COMMIT ${totalCommitted}/${commits.length}] ${item.msg}`);

    // Push each commit individually
    execSync(`git push origin master`, { stdio: 'pipe' });
    totalPushed++;
    console.log(`  └─ Pushed to origin/master successfully.`);
  } catch (err) {
    console.error(`Error processing ${item.msg}:`, err.message);
  }
}

console.log(`\nCompleted! Total commits created: ${totalCommitted}, Total pushes: ${totalPushed}`);
