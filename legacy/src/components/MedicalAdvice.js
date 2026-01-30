/**
 * Healio.AI - Medical Advice Component
 * Shows condition-specific exercises and advice based on diagnosis
 */

export function MedicalAdvicePanel({ diagnosis }) {
  // Get the primary diagnosis (highest confidence)
  const primaryDiagnosis = diagnosis && diagnosis.length > 0 ? diagnosis[0] : null;
  const condition = primaryDiagnosis?.condition;

  if (!condition) {
    return `
      <div class="medical-advice-panel animate-slide-up">
        <div class="advice-header">
          <h3 class="advice-title">
            <span class="advice-icon">💊</span>
            Medical Advice
          </h3>
        </div>
        <div class="advice-disclaimer">
          <p>Unable to determine specific recommendations. Please consult a healthcare professional.</p>
        </div>
        <button class="btn btn-secondary" id="back-to-options-btn">← See Other Options</button>
      </div>
    `;
  }

  const exercises = condition.exercises || [];
  const warnings = condition.warnings || [];
  const seekHelp = condition.seekHelp || '';
  const confidence = primaryDiagnosis.confidence || 0;

  return `
    <div class="medical-advice-panel animate-slide-up">
      <div class="advice-header">
        <h3 class="advice-title">
          <span class="advice-icon">💊</span>
          Medical Advice
        </h3>
        <p class="advice-subtitle">Exercises & Lifestyle Tips</p>
      </div>
      
      <!-- Diagnosis Result -->
      <div class="diagnosis-card">
        <div class="diagnosis-header">
          <span class="diagnosis-icon">🔍</span>
          <div>
            <h4 class="diagnosis-name">${condition.name}</h4>
            <p class="diagnosis-desc">${condition.description}</p>
          </div>
        </div>
        <div class="diagnosis-confidence">
          <span class="confidence-label">Match confidence:</span>
          <span class="confidence-value ${confidence >= 70 ? 'high' : confidence >= 50 ? 'medium' : 'low'}">${confidence}%</span>
        </div>
      </div>
      
      <div class="advice-disclaimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>This is general guidance. For persistent or severe symptoms, please consult a doctor.</span>
      </div>
      
      <!-- Exercises Section -->
      <div class="advice-section">
        <h4 class="advice-section-title">
          <span>🏃</span> Recommended Exercises
        </h4>
        <div class="exercise-list">
          ${exercises.map(ex => `
            <div class="exercise-card">
              <div class="exercise-header">
                <strong>${ex.name}</strong>
                ${ex.duration ? `<span class="exercise-duration">${ex.duration}</span>` : ''}
              </div>
              <p class="exercise-desc">${ex.description}</p>
              ${ex.frequency ? `<span class="exercise-when">🕐 ${ex.frequency}</span>` : ''}
              ${ex.videoUrl ? `
                <a href="${ex.videoUrl}" target="_blank" class="exercise-video-link">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                  Watch: ${ex.videoTitle}
                </a>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      ${warnings.length > 0 ? `
        <div class="advice-section">
          <h4 class="advice-section-title">
            <span>⚠️</span> Important Tips
          </h4>
          <ul class="lifestyle-list">
            ${warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${seekHelp ? `
        <div class="seek-help-section">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          <span><strong>When to see a doctor:</strong> ${seekHelp}</span>
        </div>
      ` : ''}
      
      <div class="advice-footer">
        <button class="btn btn-secondary" id="back-to-options-btn">
          ← See Other Options
        </button>
      </div>
    </div>
  `;
}

export default MedicalAdvicePanel;
