export const sprites = {};

// Set a value to a module-relative image path to enable custom artwork.
// Null entries use the built-in Canvas graphics without making a request.
export const IMAGE_MANIFEST = {
  bird: null,
  obstacles: null,
  background: null
};

export async function loadImages(manifest = IMAGE_MANIFEST) {
  const missing = [];
  for (const [key, path] of Object.entries(manifest)) {
    sprites[key] = null;
    if (!path) continue;
    const loaded = await new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const timeout = setTimeout(() => finish(false), 8000);
      function finish(success) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        image.onload = null;
        image.onerror = null;
        if (success) sprites[key] = image;
        resolve(success);
      }
      image.onload = () => finish(image.naturalWidth > 0 && image.naturalHeight > 0 &&
        (key !== 'bird' || image.naturalWidth % 3 === 0));
      image.onerror = () => finish(false);
      try {
        image.src = new URL(path, import.meta.url).href;
      } catch {
        finish(false);
      }
    });
    if (!loaded) missing.push(key);
  }
  return missing;
}
