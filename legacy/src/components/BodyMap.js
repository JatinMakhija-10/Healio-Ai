/**
 * Healio.AI - Interactive Body Map Component
 */

const BODY_REGIONS = [
    { id: 'head', label: 'Head' },
    { id: 'neck', label: 'Neck' },
    { id: 'shoulder', label: 'Shoulders' },
    { id: 'chest', label: 'Chest' },
    { id: 'upper-back', label: 'Upper Back' },
    { id: 'lower-back', label: 'Lower Back' },
    { id: 'arms', label: 'Arms' },
    { id: 'hands', label: 'Hands' },
    { id: 'abdomen', label: 'Abdomen' },
    { id: 'hips', label: 'Hips' },
    { id: 'legs', label: 'Legs' },
    { id: 'feet', label: 'Feet' }
];

export function BodyMap(onSelect) {
    const containerId = 'body-map-container-' + Date.now();

    setTimeout(() => {
        const container = document.getElementById(containerId);
        if (container) {
            attachBodyMapHandlers(container, onSelect);
        }
    }, 0);

    return `
    <div class="body-map-container" id="${containerId}">
      <h3 class="body-map-title">Where is your pain located?</h3>
      
      <div class="body-map">
        <svg viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Head -->
          <ellipse data-region="head" class="body-map-region" cx="100" cy="35" rx="30" ry="35"/>
          
          <!-- Neck -->
          <rect data-region="neck" class="body-map-region" x="90" y="65" width="20" height="20" rx="4"/>
          
          <!-- Shoulders -->
          <ellipse data-region="shoulder" class="body-map-region" cx="55" cy="95" rx="20" ry="15"/>
          <ellipse data-region="shoulder" class="body-map-region" cx="145" cy="95" rx="20" ry="15"/>
          
          <!-- Chest/Upper Body -->
          <rect data-region="chest" class="body-map-region" x="60" y="85" width="80" height="60" rx="10"/>
          
          <!-- Arms -->
          <rect data-region="arms" class="body-map-region" x="30" y="100" width="20" height="80" rx="8"/>
          <rect data-region="arms" class="body-map-region" x="150" y="100" width="20" height="80" rx="8"/>
          
          <!-- Hands -->
          <ellipse data-region="hands" class="body-map-region" cx="40" cy="195" rx="12" ry="15"/>
          <ellipse data-region="hands" class="body-map-region" cx="160" cy="195" rx="12" ry="15"/>
          
          <!-- Abdomen -->
          <rect data-region="abdomen" class="body-map-region" x="65" y="145" width="70" height="50" rx="8"/>
          
          <!-- Hips -->
          <ellipse data-region="hips" class="body-map-region" cx="100" cy="210" rx="45" ry="20"/>
          
          <!-- Upper Legs (Thighs) -->
          <rect data-region="legs" class="body-map-region" x="58" y="225" width="30" height="70" rx="12"/>
          <rect data-region="legs" class="body-map-region" x="112" y="225" width="30" height="70" rx="12"/>
          
          <!-- Lower Legs -->
          <rect data-region="legs" class="body-map-region" x="60" y="300" width="25" height="65" rx="10"/>
          <rect data-region="legs" class="body-map-region" x="115" y="300" width="25" height="65" rx="10"/>
          
          <!-- Feet -->
          <ellipse data-region="feet" class="body-map-region" cx="72" cy="380" rx="18" ry="10"/>
          <ellipse data-region="feet" class="body-map-region" cx="128" cy="380" rx="18" ry="10"/>
        </svg>
      </div>
      
      <div class="body-map-labels" id="body-map-labels">
        ${BODY_REGIONS.map(region => `
          <button class="body-map-label" data-region="${region.id}">
            ${region.label}
          </button>
        `).join('')}
      </div>
      
      <button class="btn btn-primary mt-6" id="body-map-confirm" disabled>
        Continue
      </button>
    </div>
  `;
}

function attachBodyMapHandlers(container, onSelect) {
    let selectedRegions = [];

    const regions = container.querySelectorAll('.body-map-region');
    const labels = container.querySelectorAll('.body-map-label');
    const confirmBtn = container.querySelector('#body-map-confirm');

    const updateSelection = (regionId, isSelected) => {
        if (isSelected) {
            if (!selectedRegions.includes(regionId)) {
                selectedRegions.push(regionId);
            }
        } else {
            selectedRegions = selectedRegions.filter(r => r !== regionId);
        }

        // Update SVG regions
        regions.forEach(region => {
            const id = region.dataset.region;
            if (selectedRegions.includes(id)) {
                region.classList.add('selected');
            } else {
                region.classList.remove('selected');
            }
        });

        // Update labels
        labels.forEach(label => {
            const id = label.dataset.region;
            if (selectedRegions.includes(id)) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });

        // Enable/disable confirm button
        confirmBtn.disabled = selectedRegions.length === 0;
    };

    // SVG region click
    regions.forEach(region => {
        region.addEventListener('click', () => {
            const regionId = region.dataset.region;
            const isSelected = !region.classList.contains('selected');
            updateSelection(regionId, isSelected);
        });
    });

    // Label click
    labels.forEach(label => {
        label.addEventListener('click', () => {
            const regionId = label.dataset.region;
            const isSelected = !label.classList.contains('selected');
            updateSelection(regionId, isSelected);
        });
    });

    // Confirm button
    confirmBtn.addEventListener('click', () => {
        if (selectedRegions.length > 0 && onSelect) {
            const selectedLabels = selectedRegions.map(id =>
                BODY_REGIONS.find(r => r.id === id)?.label
            ).filter(Boolean);
            onSelect(selectedLabels);
        }
    });
}

export { BODY_REGIONS };
