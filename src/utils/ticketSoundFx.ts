// Procedural Web Audio API Sound Effects for Ticket Tearing & Paper Slip Pull-Out
// Zero external audio files required; safe fallback if AudioContext is blocked or unsupported.

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays a realistic perforated ticket tearing sound ("แคว๊ก! / ชวึ่บ!")
 * Combines high-passed white noise with rapid perforation tooth clicks.
 */
export function playTicketRipSound(enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.42;

    // 1. Noise buffer for crisp paper fiber tear
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      // Modulate amplitude with rapid perforation "teeth" (28 teeth across the ticket)
      const toothMod = 0.65 + 0.35 * Math.sin(progress * Math.PI * 56);
      const envelope =
        progress < 0.08
          ? progress / 0.08
          : progress > 0.82
          ? (1 - progress) / 0.18
          : 1;
      output[i] = (Math.random() * 2 - 1) * toothMod * envelope;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    // Bandpass filter sweeping upward like a tear zipping across cardstock
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(3800, now + duration);
    filter.Q.setValueAtTime(1.8, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.22, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.008, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  } catch {
    // Ignore audio errors on restricted devices
  }
}

/**
 * Plays a smooth paper slip pull-out / unrolling sound ("ฟึ่บ...")
 * when the registration form paper slides out of the torn ticket slot.
 */
export function playPaperPullSound(enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 0.48;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const env = Math.sin(progress * Math.PI);
      output[i] = (Math.random() * 2 - 1) * env;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + duration * 0.7);
    filter.frequency.exponentialRampToValueAtTime(900, now + duration);
    filter.Q.setValueAtTime(2.4, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.005, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(now);
    source.stop(now + duration);
  } catch {
    // Ignore audio errors
  }
}

/**
 * Plays a joyful celebratory fanfare chord arpeggio + confetti pop sound
 * when the runner completes ticket purchase and receives their official BIB!
 */
export function playVictoryCelebrationSound(enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Crisp confetti cannon pop
    const popDuration = 0.14;
    const popBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * popDuration), ctx.sampleRate);
    const popData = popBuffer.getChannelData(0);
    for (let i = 0; i < popData.length; i++) {
      popData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
    }
    const popSource = ctx.createBufferSource();
    popSource.buffer = popBuffer;
    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.18, now);
    popGain.gain.exponentialRampToValueAtTime(0.005, now + popDuration);
    popSource.connect(popGain);
    popGain.connect(ctx.destination);
    popSource.start(now);

    // 2. Celebratory Major Fanfare Notes (C5, E5, G5, C6)
    const notes = [
      { freq: 523.25, delay: 0.04, dur: 0.22 },
      { freq: 659.25, delay: 0.14, dur: 0.22 },
      { freq: 783.99, delay: 0.24, dur: 0.24 },
      { freq: 1046.5, delay: 0.36, dur: 0.55 },
    ];

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.delay);

      gain.gain.setValueAtTime(0.001, now + n.delay);
      gain.gain.linearRampToValueAtTime(0.16, now + n.delay + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.delay + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.delay);
      osc.stop(now + n.delay + n.dur + 0.02);
    });
  } catch {
    // Ignore audio errors
  }
}

