/**
 * Healio.AI - Chat Screen
 */

import { Logo } from '../components/Logo.js';

export function ChatScreen() {
    return `
    <div class="chat-screen">
      <header class="chat-header">
        <div class="chat-header-brand">
          <div class="chat-header-logo">
            ${Logo(20)}
          </div>
          <span class="chat-header-title">Healio.AI</span>
        </div>
        
        <button class="btn btn-ghost" id="restart-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Start Over
        </button>
      </header>
      
      <div class="chat-messages">
        <div class="chat-messages-container" id="chat-messages">
          <!-- Messages will be injected here -->
        </div>
      </div>
      
      <div class="chat-input-area">
        <div class="chat-input-container">
          <input 
            type="text" 
            id="chat-input" 
            class="chat-input" 
            placeholder="Type your message..."
            autocomplete="off"
          />
          <button id="send-btn" class="chat-send-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}
