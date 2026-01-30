/**
 * Healio.AI - Pain Type Selector Component
 */

const PAIN_TYPES = [
    { id: 'sharp', label: 'Sharp', icon: '⚡', description: 'Quick, stabbing sensation' },
    { id: 'dull', label: 'Dull', icon: '●', description: 'Constant, aching feeling' },
    { id: 'burning', label: 'Burning', icon: '🔥', description: 'Warm, stinging sensation' },
    { id: 'throbbing', label: 'Throbbing', icon: '💓', description: 'Pulsing with heartbeat' },
    { id: 'tingling', label: 'Tingling', icon: '✨', description: 'Pins and needles feeling' },
    { id: 'cramping', label: 'Cramping', icon: '〰️', description: 'Muscle tightness' }
];

export function PainTypeSelector(onSelect) {
    const containerId = 'pain-type-selector-' + Date.now();

    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            attachPainTypeHandlers(container, onSelect);
        }
    }, 0);

    return `
    <div class="frequency-selector" id="${containerId}">
      <h3 class="frequency-title">What does the pain feel like?</h3>
      
      <div class="frequency-options">
        ${PAIN_TYPES.map(type => `
          <button class="frequency-option" data-type="${type.id}">
            <div class="frequency-option-title">${type.label}</div>
            <div class="frequency-option-desc">${type.description}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function attachPainTypeHandlers(container, onSelect) {
    const options = container.querySelectorAll('.frequency-option');

    options.forEach(option => {
        option.addEventListener('click', () => {
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            const typeId = option.dataset.type;
            const typeData = PAIN_TYPES.find(t => t.id === typeId);

            setTimeout(() => {
                if (onSelect && typeData) {
                    onSelect(typeData);
                }
            }, 300);
        });
    });
}

export { PAIN_TYPES };
