export const sprites = {};

export async function loadImages() {
  const manifest = {
    bird: '../assets/sprites/bird.png',
    obstacles: '../assets/sprites/obstacles.png',
    background: '../assets/sprites/background.png'
  };

  const loadProms = Object.keys(manifest).map(key => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        sprites[key] = img;
        resolve(true);
      };
      img.onerror = () => {
        console.warn(`Could not load image: ${manifest[key]}`);
        sprites[key] = null; // Mark as failed
        resolve(false);
      };
      img.src = new URL(manifest[key], import.meta.url).href;
    });
  });

  await Promise.all(loadProms);
}
