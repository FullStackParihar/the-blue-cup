const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SERVER_URL = API_BASE.replace("/api", "");

export const getImageUrl = (imagePath: string | undefined): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Cloudinary, Unsplash, etc.)
  if (imagePath.startsWith("http")) {
    return imagePath;
  }
  
  // If it's a local path, prefix it with server URL
  return `${SERVER_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};
