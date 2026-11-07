// Crop coordinates in original-image pixels, matching the editor's clipped preview.
export function coverCrop(width, height, zoom = 1, x = 0.5, y = 0.5, aspect = 2) {
  if (!(width > 0 && height > 0 && aspect > 0)) throw new Error('Could not read this photo. Choose another image.');
  const scale = Math.max(1, Math.min(3, zoom));
  const w = Math.max(1, Math.floor(Math.min(width, height * aspect) / scale));
  const h = Math.max(1, Math.floor(w / aspect));
  return { width: w, height: h, x: Math.round((width - w) * Math.max(0, Math.min(1, x))), y: Math.round((height - h) * Math.max(0, Math.min(1, y))) };
}

export function coverUrl(url, crop) {
  const prefix = 'https://res.cloudinary.com/';
  if (!url.startsWith(prefix) || !url.includes('/image/upload/')) throw new Error('Photo upload returned an unsupported image.');
  const transform = `c_crop,w_${crop.width},h_${crop.height},x_${crop.x},y_${crop.y}/c_limit,w_1600/q_auto/`;
  return url.replace('/image/upload/', '/image/upload/' + transform);
}
