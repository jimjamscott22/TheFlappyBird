const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export let isMuted = false;

export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

const sounds = {};

export async function loadAudio() {
  const manifest = {
    flap: '../assets/audio/flap.wav',
    score: '../assets/audio/score.wav',
    hit: '../assets/audio/hit.wav'
  };

  for (const [key, path] of Object.entries(manifest)) {
    try {
      const url = new URL(path, import.meta.url).href;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        sounds[key] = await audioCtx.decodeAudioData(arrayBuffer);
      } else {
        console.warn(`Audio missing: ${path}`);
      }
    } catch (e) {
      console.warn(`Could not load audio ${key}:`, e);
    }
  }
}

export function playSound(key) {
  if (isMuted || !sounds[key]) return;
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const source = audioCtx.createBufferSource();
  source.buffer = sounds[key];
  source.connect(audioCtx.destination);
  source.start(0);
}
