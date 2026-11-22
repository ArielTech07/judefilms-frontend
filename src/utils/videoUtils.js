/**
 * Utilidad para transformar enlaces de video (Google Drive, YouTube, etc.)
 * en URLs aptas para incrustar en un iframe.
 */
export const getVideoEmbedUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const cleanUrl = url.trim();

  // 1. Google Drive (formatos comunes: /file/d/ID/view, /open?id=ID, /uc?id=ID)
  const driveMatch = cleanUrl.match(/\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }

  // 2. YouTube (watch?v=ID, youtu.be/ID, embed/ID, shorts/ID)
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }
  return cleanUrl;
};
