/* ============================================
   AUDIO.JS - Procedural Web Audio API Sound Effects
   CampusConnect Premium Upgrade
   ============================================ */

'use strict';

const AudioEngine = (() => {
  let ctx = null;

  // Initialize context on first user interaction to comply with browser auto-play policies
  function initCtx() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) ctx = new AudioContext();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, type, duration, vol = 0.1) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    // Envelope
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  return {
    init: initCtx,

    // Subtle UI click (high pitched, very short tick)
    click: () => {
      initCtx();
      playTone(800, 'sine', 0.05, 0.05);
    },

    // Satisfying rising dual-tone for XP
    xp: () => {
      initCtx();
      if (!ctx) return;
      playTone(523.25, 'sine', 0.2, 0.1); // C5
      setTimeout(() => playTone(659.25, 'sine', 0.4, 0.1), 100); // E5
    },

    // Epic chord arpeggio for level up / badges
    levelUp: () => {
      initCtx();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
      notes.forEach((freq, i) => {
        setTimeout(() => {
          playTone(freq, 'triangle', 0.6, 0.15);
        }, i * 120);
      });
    },

    // Warning / error buzz
    error: () => {
      initCtx();
      playTone(150, 'sawtooth', 0.3, 0.1);
      setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.1), 150);
    }
  };
})();

window.AudioEngine = AudioEngine;

// Auto-initialize audio on first click anywhere
document.addEventListener('click', () => {
  if (window.AudioEngine) window.AudioEngine.init();
}, { once: true });
