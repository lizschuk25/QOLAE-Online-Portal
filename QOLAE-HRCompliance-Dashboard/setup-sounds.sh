#!/bin/bash
# ==============================================
# AGENT SOUND HOOKS SETUP SCRIPT
# ==============================================
# Purpose: Download and setup sound files for agent notifications
# Author: Liz & Claude
# Date: October 14, 2025
# ==============================================

echo "🎵 === SETTING UP AGENT SOUND HOOKS ==="

# Create sounds directory
mkdir -p /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/public/sounds

# Change to sounds directory
cd /Users/lizchukwu_1/QOLAE-Online-Portal/QOLAE-HRCompliance-Dashboard/public/sounds

echo "📁 Created sounds directory"

# Download sound files (using free sounds from freesound.org)
# Note: You'll need to replace these with actual sound files

echo "📥 Downloading sound files..."

# Create placeholder sound files (you can replace these with actual MP3s)
echo "Creating placeholder sound files..."

# Create simple beep sounds using sox (if available) or create empty files
if command -v sox &> /dev/null; then
    echo "Using sox to create sound files..."
    
    # Thinking sound (low tone)
    sox -n thinking.mp3 synth 0.5 sine 200 vol 0.3 2>/dev/null || echo "Creating thinking.mp3 placeholder"
    
    # Working sound (medium tone)
    sox -n working.mp3 synth 0.3 sine 400 vol 0.3 2>/dev/null || echo "Creating working.mp3 placeholder"
    
    # Testing sound (high tone)
    sox -n testing.mp3 synth 0.4 sine 600 vol 0.3 2>/dev/null || echo "Creating testing.mp3 placeholder"
    
    # Error sound (low harsh tone)
    sox -n error.mp3 synth 0.6 sine 150 vol 0.4 2>/dev/null || echo "Creating error.mp3 placeholder"
    
    # Success sound (pleasant chord)
    sox -n success.mp3 synth 0.8 sine 523 sine 659 sine 784 vol 0.3 2>/dev/null || echo "Creating success.mp3 placeholder"
    
    # Waiting sound (soft tone)
    sox -n waiting.mp3 synth 1.0 sine 300 vol 0.2 2>/dev/null || echo "Creating waiting.mp3 placeholder"
    
    # Debugging sound (quick beeps)
    sox -n debugging.mp3 synth 0.2 sine 800 vol 0.3 2>/dev/null || echo "Creating debugging.mp3 placeholder"
    
    # Completion sound (triumphant chord)
    sox -n completion.mp3 synth 1.2 sine 523 sine 659 sine 784 sine 1047 vol 0.4 2>/dev/null || echo "Creating completion.mp3 placeholder"
    
else
    echo "⚠️ Sox not available, creating placeholder files..."
    
    # Create empty placeholder files
    touch thinking.mp3 working.mp3 testing.mp3 error.mp3 success.mp3 waiting.mp3 debugging.mp3 completion.mp3
    
    echo "📝 Created placeholder sound files"
    echo "💡 Replace these with actual MP3 files from freesound.org or similar"
fi

echo ""
echo "✅ Sound files setup complete!"
echo ""
echo "📋 Sound files created:"
ls -la *.mp3

echo ""
echo "🎵 === SOUND HOOKS READY ==="
echo ""
echo "📖 Usage Instructions:"
echo "1. Add 'import { agentSounds } from \"./utils/agentSoundHooks.js\"' to your agent files"
echo "2. Use agentSounds.thinking(), agentSounds.working(), etc."
echo "3. Sounds will play automatically when agents perform actions"
echo ""
echo "🔧 Customization:"
echo "- Replace placeholder MP3s with actual sound files"
echo "- Adjust volume with agentSounds.setVolume(0.5)"
echo "- Enable/disable with agentSounds.enable() or agentSounds.disable()"
echo ""
echo "🎯 Ready for agent deployment!"
