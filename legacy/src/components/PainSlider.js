/**
 * Healio.AI - Pain Intensity Slider Component
 */

const SEVERITY_LABELS = {
    mild: { label: 'Mild', range: '1-3' },
    moderate: { label: 'Moderate', range: '4-6' },
    severe: { label: 'Severe', range: '7-10' }
};

export function PainSlider(onSelect) {
    const containerId = 'pain-slider-container-' + Date.now();

    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            attachSliderHandlers(container, onSelect);
        }
    }, 0);

    return `
    <div class="pain-slider-container" id="${containerId}">
      <h3 class="pain-slider-title">How intense is your pain?</h3>
      
      <div class="pain-slider-value mild" id="pain-value">1</div>
      <div class="pain-slider-label" id="pain-label">Mild discomfort</div>
      
      <div class="pain-slider-track">
        <div class="pain-slider-fill mild" id="pain-fill" style="width: 10%"></div>
        <input 
          type="range" 
          class="pain-slider" 
          id="pain-slider" 
          min="1" 
          max="10" 
          value="1"
        />
      </div>
      
      <div class="pain-slider-markers">
        <span class="pain-slider-marker">1</span>
        <span class="pain-slider-marker">2</span>
        <span class="pain-slider-marker">3</span>
        <span class="pain-slider-marker">4</span>
        <span class="pain-slider-marker">5</span>
        <span class="pain-slider-marker">6</span>
        <span class="pain-slider-marker">7</span>
        <span class="pain-slider-marker">8</span>
        <span class="pain-slider-marker">9</span>
        <span class="pain-slider-marker">10</span>
      </div>
      
      <button class="btn btn-primary mt-6" id="pain-slider-confirm">
        Continue
      </button>
    </div>
  `;
}

function getSeverity(value) {
    if (value <= 3) return 'mild';
    if (value <= 6) return 'moderate';
    return 'severe';
}

function getSeverityLabel(value) {
    if (value === 1) return 'Minimal discomfort';
    if (value === 2) return 'Mild discomfort';
    if (value === 3) return 'Noticeable but manageable';
    if (value === 4) return 'Moderate pain';
    if (value === 5) return 'Distracting pain';
    if (value === 6) return 'Hard to ignore';
    if (value === 7) return 'Significant pain';
    if (value === 8) return 'Intense pain';
    if (value === 9) return 'Very severe pain';
    return 'Worst pain imaginable';
}

function attachSliderHandlers(container, onSelect) {
    const slider = container.querySelector('#pain-slider');
    const valueDisplay = container.querySelector('#pain-value');
    const labelDisplay = container.querySelector('#pain-label');
    const fill = container.querySelector('#pain-fill');
    const confirmBtn = container.querySelector('#pain-slider-confirm');

    slider.addEventListener('input', () => {
        const value = parseInt(slider.value);
        const severity = getSeverity(value);
        const percentage = (value / 10) * 100;

        valueDisplay.textContent = value;
        valueDisplay.className = `pain-slider-value ${severity}`;

        labelDisplay.textContent = getSeverityLabel(value);

        fill.style.width = `${percentage}%`;
        fill.className = `pain-slider-fill ${severity}`;
    });

    confirmBtn.addEventListener('click', () => {
        const value = parseInt(slider.value);
        const severity = getSeverity(value);
        if (onSelect) {
            onSelect({
                value,
                severity,
                label: getSeverityLabel(value)
            });
        }
    });
}

export { getSeverity, getSeverityLabel };
