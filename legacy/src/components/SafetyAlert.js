/**
 * Healio.AI - Safety Alert Component
 */

export function SafetyAlert({ message, symptoms = [] }) {
    return `
    <div class="safety-alert animate-slide-up">
      <div class="safety-alert-header">
        <svg class="safety-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span class="safety-alert-title">This could be important</span>
      </div>
      
      <p class="safety-alert-message">
        ${message || "Based on what you've described, I recommend speaking to a healthcare professional as soon as possible. This isn't meant to alarm you — it's to make sure you get the care you deserve."}
      </p>
      
      ${symptoms.length > 0 ? `
        <div class="safety-alert-symptoms">
          <p class="text-sm text-muted mb-2">You mentioned:</p>
          <ul>
            ${symptoms.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <button class="btn btn-primary safety-alert-btn" id="talk-to-doctor-btn">
        Talk to a Doctor Now
      </button>
    </div>
  `;
}
