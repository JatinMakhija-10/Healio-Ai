/**
 * Healio.AI - Indian Home Remedies Component
 * Shows condition-specific remedies based on diagnosis
 */

export function HomeRemediesPanel({ diagnosis }) {
  // Get the primary diagnosis (highest confidence)
  const primaryDiagnosis = diagnosis && diagnosis.length > 0 ? diagnosis[0] : null;
  const condition = primaryDiagnosis?.condition;

  if (!condition) {
    return `
      <div class="remedies-panel animate-slide-up">
        <div class="remedies-header">
          <h3 class="remedies-title">
            <span class="remedies-icon">🌿</span>
            Home Remedies
          </h3>
        </div>
        <div class="remedies-disclaimer">
          <p>Unable to determine specific recommendations. Please consult a healthcare professional.</p>
        </div>
        <button class="btn btn-secondary" id="back-to-options-btn">← See Other Options</button>
      </div>
    `;
  }

  const remedies = condition.remedies || [];
  const warnings = condition.warnings || [];
  const seekHelp = condition.seekHelp || '';
  const confidence = primaryDiagnosis.confidence || 0;

  return `
    <div class="remedies-panel animate-slide-up">
      <div class="remedies-header">
        <h3 class="remedies-title">
          <span class="remedies-icon">🌿</span>
          Home Remedies
        </h3>
        <p class="remedies-subtitle">Based on your symptoms</p>
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
      
      <div class="remedies-disclaimer">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
        <span>These are traditional remedies for relief. If symptoms persist, please consult a doctor.</span>
      </div>
      
      <div class="remedies-list">
        ${remedies.map((remedy, index) => `
          <div class="remedy-card" style="animation-delay: ${index * 0.1}s">
            <div class="remedy-header">
              <h4 class="remedy-name">${remedy.name}</h4>
            </div>
            
            <p class="remedy-description">${remedy.description}</p>
            
            ${remedy.ingredients && remedy.ingredients.length > 0 ? `
              <div class="remedy-section">
                <strong>Ingredients:</strong>
                <ul class="remedy-ingredients">
                  ${remedy.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div class="remedy-section">
              <strong>Method:</strong>
              <p>${remedy.method}</p>
            </div>
            
            ${remedy.videoUrl ? `
              <a href="${remedy.videoUrl}" target="_blank" class="remedy-video-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
                <span>Watch: ${remedy.videoTitle}</span>
              </a>
            ` : ''}
          </div>
        `).join('')}
      </div>
      
      ${warnings.length > 0 ? `
        <div class="warnings-section">
          <h4 class="warnings-title">⚠️ Important Tips</h4>
          <ul class="warnings-list">
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
      
      <div class="remedies-footer">
        <button class="btn btn-secondary" id="back-to-options-btn">
          ← See Other Options
        </button>
      </div>
    </div>
  `;
}

export default HomeRemediesPanel;
