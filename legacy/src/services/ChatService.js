/**
 * Healio.AI - Chat Service
 * Manages conversation flow, message rendering, and intake process
 */

import { AIService } from './AIService.js';
import { MessageBubble, TypingIndicator } from '../components/MessageBubble.js';
import { BodyMap } from '../components/BodyMap.js';
import { PainSlider } from '../components/PainSlider.js';
import { FrequencySelector } from '../components/FrequencySelector.js';
import { PainTypeSelector } from '../components/PainTypeSelector.js';
import { SafetyAlert } from '../components/SafetyAlert.js';
import { DoctorSummary } from '../components/DoctorSummary.js';
import { ProgressIndicator } from '../components/ProgressIndicator.js';
import { TreatmentOptions } from '../components/TreatmentOptions.js';
import { HomeRemediesPanel } from '../components/HomeRemedies.js';
import { MedicalAdvicePanel } from '../components/MedicalAdvice.js';
import { LanguageSelector, TRANSLATIONS } from '../components/LanguageSelector.js';

// Intake flow steps
const INTAKE_STEPS = [
    'greeting',
    'location',
    'intensity',
    'frequency',
    'type',
    'duration',
    'triggers',
    'summary',
    'treatment-options'
];

export class ChatService {
    constructor() {
        this.aiService = new AIService();
        this.container = null;
        this.currentStep = 0;
        this.isTyping = false;
        this.inputContainer = null;
        this.language = 'en'; // Default language is English
    }

    /**
     * Initialize chat service with container element
     */
    init(container) {
        this.container = container;
        this.inputContainer = document.querySelector('.chat-input-area');
        this.currentStep = 0;
        this.language = 'en'; // Always start with English
        this.aiService.reset();
    }

    /**
     * Get translation for a key
     */
    t(key) {
        return TRANSLATIONS[this.language]?.[key] || TRANSLATIONS['en'][key] || key;
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        this.language = lang;
    }

    /**
     * Start the conversation
     */
    startConversation() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('greeting'));

            setTimeout(() => {
                this.addAIMessage(this.t('disclaimer'));

                setTimeout(() => {
                    this.moveToStep('location');
                }, 1000);
            }, 1500);
        }, 1500);
    }

    /**
     * Add AI message to chat
     */
    addAIMessage(content) {
        const messageHtml = MessageBubble({ type: 'ai', content });
        this.container.insertAdjacentHTML('beforeend', messageHtml);
        this.scrollToBottom();
    }

    /**
     * Add user message to chat
     */
    addUserMessage(content) {
        const messageHtml = MessageBubble({ type: 'user', content });
        this.container.insertAdjacentHTML('beforeend', messageHtml);
        this.aiService.addMessage('user', content);
        this.scrollToBottom();
    }

    /**
     * Show typing indicator
     */
    showTyping() {
        if (this.isTyping) return;
        this.isTyping = true;
        this.container.insertAdjacentHTML('beforeend', `
      <div id="typing-indicator">${TypingIndicator()}</div>
    `);
        this.scrollToBottom();
    }

    /**
     * Hide typing indicator
     */
    hideTyping() {
        this.isTyping = false;
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    /**
     * Show progress indicator
     */
    showProgress() {
        const current = INTAKE_STEPS.indexOf(this.getCurrentStepName()) + 1;
        const total = INTAKE_STEPS.length - 2; // Exclude greeting and treatment-options

        // Remove existing progress
        const existing = document.getElementById('intake-progress');
        if (existing) existing.remove();

        if (current > 1 && current <= total) {
            this.container.insertAdjacentHTML('beforeend', `
        <div id="intake-progress">
          ${ProgressIndicator({ current: current - 1, total: total - 1 })}
        </div>
      `);
        }
    }

    /**
     * Get current step name
     */
    getCurrentStepName() {
        return INTAKE_STEPS[this.currentStep] || 'greeting';
    }

    /**
     * Move to specific intake step
     */
    moveToStep(stepName) {
        const stepIndex = INTAKE_STEPS.indexOf(stepName);
        if (stepIndex !== -1) {
            this.currentStep = stepIndex;
        }

        this.showProgress();
        this.hideTextInput();

        switch (stepName) {
            case 'location':
                this.handleLocationStep();
                break;
            case 'intensity':
                this.handleIntensityStep();
                break;
            case 'frequency':
                this.handleFrequencyStep();
                break;
            case 'type':
                this.handleTypeStep();
                break;
            case 'duration':
                this.handleDurationStep();
                break;
            case 'triggers':
                this.handleTriggersStep();
                break;
            case 'summary':
                this.handleSummaryStep();
                break;
            case 'treatment-options':
                this.handleTreatmentOptionsStep();
                break;
        }
    }

    /**
     * Handle pain location step
     */
    handleLocationStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('locationQuestion'));

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', BodyMap((selectedLocations) => {
                    this.aiService.updatePainData('location', selectedLocations);
                    this.addUserMessage(`My pain is in my ${selectedLocations.join(', ').toLowerCase()}`);

                    // Remove body map
                    document.querySelector('.body-map-container').remove();

                    setTimeout(() => {
                        this.addAIMessage(
                            this.aiService.generateResponse('acknowledgment',
                                `I see, your ${selectedLocations[0].toLowerCase()} area. That's helpful to know.`
                            )
                        );
                        setTimeout(() => {
                            this.moveToStep('intensity');
                        }, 1000);
                    }, 500);
                }));
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Handle pain intensity step
     */
    handleIntensityStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('intensityQuestion'));

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', PainSlider((intensity) => {
                    this.aiService.updatePainData('intensity', intensity);
                    this.addUserMessage(`My pain is about ${intensity.value} out of 10 - ${intensity.label.toLowerCase()}`);

                    // Remove slider
                    document.querySelector('.pain-slider-container').remove();

                    // Check for high intensity
                    const severityCheck = this.aiService.safetyService.checkIntensitySeverity(intensity.value);

                    setTimeout(() => {
                        if (severityCheck.requiresAttention) {
                            this.container.insertAdjacentHTML('beforeend', SafetyAlert({
                                message: severityCheck.message
                            }));
                        }

                        this.addAIMessage(
                            this.aiService.generateResponse('empathy',
                                intensity.value >= 7
                                    ? this.t('empathySevere')
                                    : this.t('empathyMild')
                            )
                        );

                        setTimeout(() => {
                            this.moveToStep('frequency');
                        }, 1000);
                    }, 500);
                }));
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Handle pain frequency step
     */
    handleFrequencyStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('frequencyQuestion'));

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', FrequencySelector((frequency) => {
                    this.aiService.updatePainData('frequency', frequency);
                    this.addUserMessage(`The pain is ${frequency.title.toLowerCase()}`);

                    // Remove selector
                    document.querySelector('.frequency-selector').remove();

                    setTimeout(() => {
                        this.addAIMessage(this.t('acknowledgment'));
                        setTimeout(() => {
                            this.moveToStep('type');
                        }, 1000);
                    }, 500);
                }));
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Handle pain type step
     */
    handleTypeStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('typeQuestion'));

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', PainTypeSelector((type) => {
                    this.aiService.updatePainData('type', type);
                    this.addUserMessage(`It feels ${type.label.toLowerCase()} - ${type.description.toLowerCase()}`);

                    // Remove selector
                    document.querySelector('.frequency-selector').remove();

                    setTimeout(() => {
                        this.addAIMessage(this.t('transition'));
                        setTimeout(() => {
                            this.moveToStep('duration');
                        }, 800);
                    }, 500);
                }));
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Handle duration step
     */
    handleDurationStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('durationQuestion'));
            this.showTextInput();
            this.setInputHandler((message) => {
                this.aiService.updatePainData('duration', message);

                // Check for safety concerns
                const safetyResult = this.aiService.checkSafety(message);
                if (safetyResult.hasRedFlags) {
                    this.container.insertAdjacentHTML('beforeend', SafetyAlert({
                        message: safetyResult.message
                    }));
                }

                setTimeout(() => {
                    this.addAIMessage(
                        this.aiService.generateResponse('acknowledgment',
                            "That gives me a clearer picture."
                        )
                    );
                    setTimeout(() => {
                        this.moveToStep('triggers');
                    }, 800);
                }, 500);
            });
        }, 1000);
    }

    /**
     * Handle triggers step
     */
    handleTriggersStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('triggersQuestion'));
            this.showTextInput();
            this.setInputHandler((message) => {
                this.aiService.updatePainData('triggers', message);

                // Check for safety concerns
                const safetyResult = this.aiService.checkSafety(message);
                if (safetyResult.hasRedFlags) {
                    this.container.insertAdjacentHTML('beforeend', SafetyAlert({
                        message: safetyResult.message
                    }));
                }

                setTimeout(() => {
                    this.addAIMessage(this.t('reassurance'));
                    setTimeout(() => {
                        this.moveToStep('summary');
                    }, 1000);
                }, 500);
            });
        }, 1000);
    }

    /**
     * Handle summary step
     */
    handleSummaryStep() {
        this.showTyping();
        this.hideTextInput();

        setTimeout(() => {
            this.hideTyping();
            this.addAIMessage(this.t('summaryIntro'));

            setTimeout(() => {
                const summary = this.aiService.generateSummary();
                this.container.insertAdjacentHTML('beforeend', DoctorSummary({ painData: summary }));
                this.attachSummaryHandlers();

                setTimeout(() => {
                    this.addAIMessage(this.t('treatmentPrompt'));

                    // Show treatment options
                    setTimeout(() => {
                        this.moveToStep('treatment-options');
                    }, 1000);
                }, 1500);

                this.scrollToBottom();
            }, 1000);
        }, 1500);
    }

    /**
     * Handle treatment options step
     */
    handleTreatmentOptionsStep() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();

            this.container.insertAdjacentHTML('beforeend', TreatmentOptions((choice) => {
                // Remove treatment options
                document.querySelector('.treatment-options')?.remove();

                switch (choice) {
                    case 'home-remedies':
                        this.showHomeRemedies();
                        break;
                    case 'medical-advice':
                        this.showMedicalAdvice();
                        break;
                }
            }));
            this.scrollToBottom();
        }, 500);
    }

    /**
     * Show Indian home remedies panel
     */
    showHomeRemedies() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();

            // Get diagnosis
            const summary = this.aiService.generateSummary();
            const diagnosis = summary.diagnosis;
            const conditionName = diagnosis?.[0]?.condition?.name || 'your condition';

            this.addAIMessage(`Based on your symptoms, this looks like ${conditionName}. Here are some home remedies that may help:`);

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', HomeRemediesPanel({
                    diagnosis: diagnosis
                }));

                // Attach back button handler
                this.attachBackToOptionsHandler();
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Show medical advice panel
     */
    showMedicalAdvice() {
        this.showTyping();

        setTimeout(() => {
            this.hideTyping();

            // Get diagnosis
            const summary = this.aiService.generateSummary();
            const diagnosis = summary.diagnosis;
            const conditionName = diagnosis?.[0]?.condition?.name || 'your condition';

            this.addAIMessage(`Based on your symptoms, this looks like ${conditionName}. Here are exercises and advice that may help:`);

            setTimeout(() => {
                this.container.insertAdjacentHTML('beforeend', MedicalAdvicePanel({
                    diagnosis: diagnosis
                }));

                // Attach back button handler
                this.attachBackToOptionsHandler();
                this.scrollToBottom();
            }, 1000);
        }, 1000);
    }

    /**
     * Attach back to options button handler
     */
    attachBackToOptionsHandler() {
        const backBtn = document.getElementById('back-to-options-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Remove current panel
                document.querySelector('.remedies-panel')?.remove();
                document.querySelector('.medical-advice-panel')?.remove();

                this.addAIMessage("Choose another option below.");

                setTimeout(() => {
                    this.handleTreatmentOptionsStep();
                }, 500);
            });
        }
    }

    /**
     * Handle user text message
     */
    sendMessage(message) {
        if (!message.trim()) return;

        this.addUserMessage(message);

        // Detect emotion
        this.aiService.detectEmotion(message);

        // Check safety
        const safetyResult = this.aiService.checkSafety(message);
        if (safetyResult.requiresUrgentCare) {
            this.showTyping();
            setTimeout(() => {
                this.hideTyping();
                this.container.insertAdjacentHTML('beforeend', SafetyAlert({
                    message: safetyResult.message
                }));
                this.scrollToBottom();
            }, 1000);
            return;
        }

        // Trigger custom handler if set
        if (this.customInputHandler) {
            this.customInputHandler(message);
            this.customInputHandler = null;
        }
    }

    /**
     * Set custom input handler for current step
     */
    setInputHandler(handler) {
        this.customInputHandler = handler;
    }

    /**
     * Show text input
     */
    showTextInput() {
        if (this.inputContainer) {
            this.inputContainer.style.display = 'block';
            document.getElementById('chat-input')?.focus();
        }
    }

    /**
     * Hide text input
     */
    hideTextInput() {
        if (this.inputContainer) {
            this.inputContainer.style.display = 'none';
        }
    }

    /**
     * Attach summary card handlers
     */
    attachSummaryHandlers() {
        const copyBtn = document.getElementById('copy-summary-btn');

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const summary = this.aiService.generateSummary();
                const text = this.formatSummaryText(summary);
                navigator.clipboard.writeText(text).then(() => {
                    copyBtn.innerHTML = '✓ Copied';
                    setTimeout(() => {
                        copyBtn.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            `;
                    }, 2000);
                });
            });
        }
    }

    /**
     * Format summary as plain text
     */
    formatSummaryText(summary) {
        return `Pain Summary - Healio.AI
    
Location: ${Array.isArray(summary.location) ? summary.location.join(', ') : summary.location}
Intensity: ${summary.intensity.value}/10 (${summary.intensity.label})
Frequency: ${summary.frequency.title}
Type: ${summary.type.label}
Duration: ${summary.duration}
Triggers: ${summary.triggers}

Generated by Healio.AI - ${new Date().toLocaleDateString('en-IN')}`;
    }

    /**
     * Scroll chat to bottom
     */
    scrollToBottom() {
        const messagesContainer = document.querySelector('.chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    /**
     * Reset chat
     */
    reset() {
        this.container.innerHTML = '';
        this.currentStep = 0;
        this.aiService.reset();
        this.customInputHandler = null;
        this.startConversation();
    }
}

export { INTAKE_STEPS };
