/**
 * Healio.AI - Home Screen
 */

import { Logo } from '../components/Logo.js';

export function HomeScreen() {
    return `
    <div class="home-screen">
      <div class="home-content animate-slide-up">
        <div class="home-logo">
          ${Logo()}
        </div>
        
        <h1 class="home-title">Let's understand your pain.</h1>
        
        <p class="home-subtitle">
          I'll ask a few questions and guide you safely.<br>
          I'm here to support you, not replace a doctor.
        </p>
        
        <div class="home-actions">
          <button id="start-chat-btn" class="btn btn-primary btn-lg">
            Start Conversation
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
          
          <a href="#" id="talk-to-doctor-link" class="home-link">
            Or talk to a doctor directly
          </a>
        </div>
      </div>
    </div>
  `;
}
