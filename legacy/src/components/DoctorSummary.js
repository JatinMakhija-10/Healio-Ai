/**
 * Healio.AI - Pain Summary Component
 */

export function DoctorSummary({ painData }) {
  const {
    location = 'Not specified',
    intensity = { value: 0, label: 'Not specified' },
    frequency = { title: 'Not specified' },
    type = { label: 'Not specified' },
    duration = 'Not specified',
    triggers = 'Not specified'
  } = painData || {};

  return `
    <div class="doctor-summary animate-slide-up">
      <h3 class="doctor-summary-header">Your Pain Summary</h3>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Location</span>
        <span class="doctor-summary-value">${Array.isArray(location) ? location.join(', ') : location}</span>
      </div>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Intensity</span>
        <span class="doctor-summary-value">${intensity.value}/10 (${intensity.label})</span>
      </div>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Frequency</span>
        <span class="doctor-summary-value">${frequency.title}</span>
      </div>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Type</span>
        <span class="doctor-summary-value">${type.label}</span>
      </div>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Duration</span>
        <span class="doctor-summary-value">${duration}</span>
      </div>
      
      <div class="doctor-summary-item">
        <span class="doctor-summary-label">Triggers</span>
        <span class="doctor-summary-value">${triggers}</span>
      </div>
      
      <div class="doctor-summary-actions">
        <button class="btn btn-secondary flex-1" id="copy-summary-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy Summary
        </button>
      </div>
    </div>
  `;
}
