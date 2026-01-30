/**
 * Healio.AI - Message Bubble Component
 */

export function MessageBubble({ type, content, showAvatar = true }) {
    const isAI = type === 'ai';
    const avatarContent = isAI
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
       </svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
       </svg>`;

    return `
    <div class="message message-${type}">
      ${showAvatar ? `
        <div class="message-avatar">
          ${avatarContent}
        </div>
      ` : ''}
      <div class="message-content">
        ${content}
      </div>
    </div>
  `;
}

export function TypingIndicator() {
    return `
    <div class="message message-ai">
      <div class="message-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
}
