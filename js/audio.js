let audioCtx = null;
export let isMuted = false;
const sounds = {};

// Optional sounds are disabled until files are supplied and paths set here.
export const AUDIO_MANIFEST = { flap: null, score: null, hit: null };

function getAudioContext() {
  if (audioCtx) return audioCtx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  try {
    audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

export async function loadAudio(manifest = AUDIO_MANIFEST) {
  const missing = [];
  for (const [key, path] of Object.entries(manifest)) {
    delete sounds[key];
    if (!path) continue;
    const context = getAudioContext();
    if (!context) {
      missing.push(key);
      continue;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(new URL(path, import.meta.url), { signal: controller.signal });
      if (!response.ok) throw new Error('Sound unavailable');
      sounds[key] = await context.decodeAudioData(await response.arrayBuffer());
    } catch {
      missing.push(key);
    } finally {
      clearTimeout(timeout);
    }
  }
  return { available: Object.keys(sounds).length > 0, missing };
}

export async function playSound(key) {
  if (isMuted || !sounds[key] || !audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    if (isMuted || audioCtx.state !== 'running') return;
    const source = audioCtx.createBufferSource();
    source.buffer = sounds[key];
    source.connect(audioCtx.destination);
    source.start();
  } catch {
    // Browser audio restrictions must never interrupt gameplay.
  }
}
