// File validation utilities for image uploads.
// Centralized so both the upload form and any future backend client
// can share the same rules.

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface FileValidationError {
  message: string;
}

export function validateImageFile(file: File): FileValidationError | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return {
      message: 'Unsupported file type. Please upload a JPG, JPEG, or PNG image.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      message: `File is too large (${mb} MB). Maximum allowed size is 10 MB.`,
    };
  }

  if (file.size === 0) {
    return {
      message: 'The selected file appears to be empty. Please choose a valid image.',
    };
  }

  return null;
}

// Read a File into a data URL for preview display.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}
