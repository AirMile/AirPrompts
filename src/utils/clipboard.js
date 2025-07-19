// Clipboard utility functions

/**
 * Copy text to clipboard with fallback for older browsers
 * @param {string} text - Text to copy to clipboard
 * @returns {Promise<boolean>} - Returns true on success, false on failure
 */
export const copyToClipboard = async (text) => {
  try {
    // Modern approach using Clipboard API
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return result;
    } catch (fallbackErr) {
      console.error('Failed to copy to clipboard:', fallbackErr);
      return false;
    }
  }
};

/**
 * Check if clipboard API is supported
 * @returns {boolean} - True if clipboard API is available
 */
export const isClipboardSupported = () => {
  return !!(navigator.clipboard && navigator.clipboard.writeText);
};

/**
 * Copy text to clipboard and show a temporary notification
 * @param {string} text - Text to copy
 * @param {Function} onSuccess - Callback for successful copy
 * @param {Function} onError - Callback for failed copy
 * @returns {Promise<boolean>} - Returns true on success, false on failure
 */
export const copyWithNotification = async (text, onSuccess = null, onError = null) => {
  const success = await copyToClipboard(text);
  
  if (success && onSuccess) {
    onSuccess();
  } else if (!success && onError) {
    onError();
  }
  
  return success;
};
