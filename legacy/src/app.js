/**
 * Healio.AI - Application Controller
 */

import { HomeScreen } from './pages/home.js';
import { ChatScreen } from './pages/chat.js';
import { ChatService } from './services/ChatService.js';

export class App {
    constructor(selector) {
        this.container = document.querySelector(selector);
        this.currentScreen = 'home';
        this.chatService = new ChatService();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for navigation events
        document.addEventListener('navigate', (e) => {
            this.navigateTo(e.detail.screen);
        });
    }

    navigateTo(screen) {
        this.currentScreen = screen;
        this.render();
    }

    render() {
        switch (this.currentScreen) {
            case 'home':
                this.container.innerHTML = HomeScreen();
                break;
            case 'chat':
                this.container.innerHTML = ChatScreen();
                this.initializeChat();
                break;
            default:
                this.container.innerHTML = HomeScreen();
        }

        this.attachHandlers();
    }

    attachHandlers() {
        // Home screen start button
        const startBtn = document.getElementById('start-chat-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.navigateTo('chat');
            });
        }

        // Doctor link
        const doctorLink = document.getElementById('talk-to-doctor-link');
        if (doctorLink) {
            doctorLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo('chat');
                setTimeout(() => {
                    this.chatService.showDoctorHandoff();
                }, 500);
            });
        }
    }

    initializeChat() {
        this.chatService.init(document.getElementById('chat-messages'));
        this.chatService.startConversation();

        // Chat input handling
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                this.chatService.sendMessage(message);
                chatInput.value = '';
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}
