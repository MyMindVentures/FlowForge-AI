import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resizes a base64 image to a maximum width/height while maintaining aspect ratio.
 * This helps stay within Firestore's 1MB document limit.
 */
export async function resizeBase64Image(
  base64: string, 
  maxWidth: number = 800, 
  maxHeight: number = 450
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use jpeg with 0.7 quality to significantly reduce size
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = (err) => reject(err);
  });
}
