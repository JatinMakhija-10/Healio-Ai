/**
 * Healio.AI - Treatment Options Component
 * Indian Home Remedies and Medical Advice (Doctor option removed per user request)
 */

export function TreatmentOptions(onSelect) {
  const containerId = 'treatment-options-' + Date.now();

  setTimeout(() => {
    const container = document.getElementById(containerId);
    if (container) {
      attachTreatmentHandlers(container, onSelect);
    }
  }, 0);

  return `
    <div class="treatment-options" id="${containerId}">
      <h3 class="treatment-title">How would you like to proceed?</h3>
      <p class="treatment-subtitle">Choose the approach that feels right for you</p>
      
      <div class="treatment-cards">
        <button class="treatment-card" data-type="home-remedies">
          <div class="treatment-icon home-remedies-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M12 6v6l4 2"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            </svg>
          </div>
          <div class="treatment-content">
            <h4 class="treatment-name">Indian Home Remedies</h4>
            <p class="treatment-name-en">Traditional Ayurvedic Solutions</p>
            <p class="treatment-desc">
              Natural remedies passed down through generations with video guides
            </p>
            <div class="treatment-tags">
              <span class="treatment-tag">Ayurveda</span>
              <span class="treatment-tag">Natural</span>
              <span class="treatment-tag">Videos</span>
            </div>
          </div>
        </button>
        
        <button class="treatment-card" data-type="medical-advice">
          <div class="treatment-icon medical-advice-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12h6M12 9v6"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <div class="treatment-content">
            <h4 class="treatment-name">Medical Advice</h4>
            <p class="treatment-name-en">Exercises & Lifestyle Tips</p>
            <p class="treatment-desc">
              Evidence-based guidance with exercise videos and lifestyle recommendations
            </p>
            <div class="treatment-tags">
              <span class="treatment-tag">Exercises</span>
              <span class="treatment-tag">Videos</span>
              <span class="treatment-tag">Lifestyle</span>
            </div>
          </div>
        </button>
      </div>
    </div>
  `;
}

function attachTreatmentHandlers(container, onSelect) {
  const cards = container.querySelectorAll('.treatment-card');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Remove selected from all
      cards.forEach(c => c.classList.remove('selected'));

      // Add selected to clicked
      card.classList.add('selected');

      const type = card.dataset.type;

      setTimeout(() => {
        if (onSelect) {
          onSelect(type);
        }
      }, 300);
    });
  });
}
