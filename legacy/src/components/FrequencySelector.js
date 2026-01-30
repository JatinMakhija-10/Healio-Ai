/**
 * Healio.AI - Pain Frequency Selector Component
 */

const FREQUENCY_OPTIONS = [
    {
        id: 'constant',
        title: 'Constant',
        description: 'The pain is always there, non-stop'
    },
    {
        id: 'comes-and-goes',
        title: 'Comes and goes',
        description: 'Pain appears and disappears throughout the day'
    },
    {
        id: 'during-activity',
        title: 'Only during activity',
        description: 'Pain occurs when moving or doing specific activities'
    },
    {
        id: 'at-night',
        title: 'Mostly at night',
        description: 'Pain is worse at night or when resting'
    },
    {
        id: 'random',
        title: 'Random / Unpredictable',
        description: 'Pain occurs without any clear pattern'
    }
];

export function FrequencySelector(onSelect) {
    const containerId = 'frequency-selector-' + Date.now();

    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            attachFrequencyHandlers(container, onSelect);
        }
    }, 0);

    return `
    <div class="frequency-selector" id="${containerId}">
      <h3 class="frequency-title">How often does the pain occur?</h3>
      
      <div class="frequency-options">
        ${FREQUENCY_OPTIONS.map(option => `
          <button class="frequency-option" data-frequency="${option.id}">
            <div class="frequency-option-title">${option.title}</div>
            <div class="frequency-option-desc">${option.description}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function attachFrequencyHandlers(container, onSelect) {
    const options = container.querySelectorAll('.frequency-option');

    options.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected from all
            options.forEach(opt => opt.classList.remove('selected'));

            // Add selected to clicked
            option.classList.add('selected');

            // Get selected data
            const frequencyId = option.dataset.frequency;
            const frequencyData = FREQUENCY_OPTIONS.find(f => f.id === frequencyId);

            // Delay to show selection, then callback
            setTimeout(() => {
                if (onSelect && frequencyData) {
                    onSelect(frequencyData);
                }
            }, 300);
        });
    });
}

export { FREQUENCY_OPTIONS };
