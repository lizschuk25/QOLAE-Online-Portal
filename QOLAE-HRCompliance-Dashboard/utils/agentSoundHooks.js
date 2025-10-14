// ==============================================
// AGENT SOUND HOOKS SYSTEM
// ==============================================
// Purpose: Audio notifications for agent workflow status
// Usage: Add to any agent's code for real-time feedback
// ==============================================

class AgentSoundHooks {
  constructor() {
    this.sounds = {
      thinking: '/sounds/thinking.mp3',
      working: '/sounds/working.mp3',
      testing: '/sounds/testing.mp3',
      error: '/sounds/error.mp3',
      success: '/sounds/success.mp3',
      waiting: '/sounds/waiting.mp3',
      debugging: '/sounds/debugging.mp3',
      completion: '/sounds/completion.mp3'
    };
    
    this.isEnabled = true;
    this.volume = 0.3;
  }

  // ==============================================
  // PLAY SOUND METHOD
  // ==============================================
  play(soundType, customMessage = null) {
    if (!this.isEnabled) return;
    
    const soundFile = this.sounds[soundType];
    if (!soundFile) {
      console.warn(`⚠️ Unknown sound type: ${soundType}`);
      return;
    }

    try {
      // Browser environment
      if (typeof window !== 'undefined') {
        const audio = new Audio(soundFile);
        audio.volume = this.volume;
        audio.play().catch(e => console.log('🔇 Sound play failed:', e));
        
        // Show visual indicator
        this.showVisualIndicator(soundType, customMessage);
      }
      
      // Node.js environment (for server-side agents)
      if (typeof process !== 'undefined') {
        console.log(`🔊 Agent Sound: ${soundType.toUpperCase()}`);
        if (customMessage) {
          console.log(`📢 Message: ${customMessage}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Sound hook error:', error);
    }
  }

  // ==============================================
  // VISUAL INDICATOR (Browser only)
  // ==============================================
  showVisualIndicator(soundType, message) {
    const indicator = document.createElement('div');
    indicator.className = 'agent-sound-indicator';
    indicator.innerHTML = `
      <div class="sound-icon">${this.getSoundIcon(soundType)}</div>
      <div class="sound-message">${message || soundType.toUpperCase()}</div>
    `;
    
    // Add styles
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .agent-sound-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sound-icon {
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
      indicator.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => indicator.remove(), 300);
    }, 3000);
  }

  // ==============================================
  // SOUND ICONS
  // ==============================================
  getSoundIcon(soundType) {
    const icons = {
      thinking: '🤔',
      working: '💻',
      testing: '🧪',
      error: '❌',
      success: '✅',
      waiting: '⏳',
      debugging: '🐛',
      completion: '🎉'
    };
    return icons[soundType] || '🔊';
  }

  // ==============================================
  // ENABLE/DISABLE SOUNDS
  // ==============================================
  enable() {
    this.isEnabled = true;
    console.log('🔊 Agent sound hooks enabled');
  }

  disable() {
    this.isEnabled = false;
    console.log('🔇 Agent sound hooks disabled');
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`🔊 Sound volume set to ${this.volume}`);
  }

  // ==============================================
  // CONVENIENCE METHODS
  // ==============================================
  thinking(message = 'Agent is thinking...') {
    this.play('thinking', message);
  }

  working(message = 'Agent is working...') {
    this.play('working', message);
  }

  testing(message = 'Agent is testing...') {
    this.play('testing', message);
  }

  error(message = 'Agent encountered an error') {
    this.play('error', message);
  }

  success(message = 'Agent completed task successfully') {
    this.play('success', message);
  }

  waiting(message = 'Agent is waiting...') {
    this.play('waiting', message);
  }

  debugging(message = 'Agent is debugging...') {
    this.play('debugging', message);
  }

  completion(message = 'Agent workflow completed') {
    this.play('completion', message);
  }
}

// ==============================================
// CREATE GLOBAL INSTANCE
// ==============================================
const agentSounds = new AgentSoundHooks();

// ==============================================
// EXPORT FOR DIFFERENT ENVIRONMENTS
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = agentSounds;
} else if (typeof window !== 'undefined') {
  // Browser environment
  window.agentSounds = agentSounds;
}

// ==============================================
// USAGE EXAMPLES FOR AGENTS
// ==============================================

/*
// Add this to the top of any agent's main file:

import { agentSounds } from './utils/agentSoundHooks.js';

// Usage examples:
agentSounds.thinking('Analyzing requirements...');
agentSounds.working('Building database models...');
agentSounds.testing('Running unit tests...');
agentSounds.error('Database connection failed');
agentSounds.success('Model created successfully');
agentSounds.waiting('Waiting for Phoenix to complete...');
agentSounds.debugging('Fixing validation logic...');
agentSounds.completion('All tasks completed!');

// Or use the shorter methods:
agentSounds.play('thinking', 'Custom message');
agentSounds.play('working');
agentSounds.play('error', 'Specific error details');
*/

export default agentSounds;
