// Simple notification utilities
// These can be replaced with a proper notification library later (e.g., react-hot-toast)

export const showSuccessNotification = (message) => {
  console.log('✅ Success:', message);
  // TODO: Implement actual notification UI
};

export const showErrorNotification = (message) => {
  console.error('❌ Error:', message);
  // TODO: Implement actual notification UI
};

export const showWarningNotification = (message) => {
  console.warn('⚠️ Warning:', message);
  // TODO: Implement actual notification UI
};

export const showInfoNotification = (message) => {
  console.info('ℹ️ Info:', message);
  // TODO: Implement actual notification UI
};