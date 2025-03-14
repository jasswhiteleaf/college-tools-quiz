/**
 * Encodes a file as a base64 string
 * @param file The file to encode
 * @returns A promise that resolves to the base64 string
 */
export const encodeFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validates a file to ensure it's a PDF under the size limit
 * @param file The file to validate
 * @param maxSizeInMB The maximum file size in MB
 * @returns True if the file is valid, false otherwise
 */
export const isValidPdfFile = (
  file: File,
  maxSizeInMB: number = 5
): boolean => {
  return (
    file.type === 'application/pdf' && file.size <= maxSizeInMB * 1024 * 1024
  );
};

/**
 * Checks if the browser is Safari
 * @returns True if the browser is Safari, false otherwise
 */
export const isSafariBrowser = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};
