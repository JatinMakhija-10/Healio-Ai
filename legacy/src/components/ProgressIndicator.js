/**
 * Healio.AI - Progress Indicator Component
 */

export function ProgressIndicator({ current, total, label }) {
    const percentage = (current / total) * 100;

    return `
    <div class="progress-indicator">
      <span>${label || `Question ${current} of ${total}`}</span>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: ${percentage}%"></div>
      </div>
    </div>
  `;
}
