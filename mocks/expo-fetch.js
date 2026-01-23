// Mock for expo/fetch to allow builds without expo
// The @arkade-os/sdk will fall back to standard fetch at runtime
module.exports = {
  fetch: global.fetch || fetch
};
