import { clearDemoActivity, validateClearRequest } from '../src/services/clearDemoActivity.service.js';
try {
  const args = process.argv.slice(2);
  validateClearRequest(process.env.NODE_ENV, args);
  const { clearActivityStore } = await import('../src/repositories/clearDemoActivity.repository.js');
  // Recheck after dotenv has loaded server configuration.
  const result = await clearDemoActivity(process.env.NODE_ENV, args, clearActivityStore);
  console.log(JSON.stringify(result));
} catch (error) {
  // Only local fixed-message errors; never forward database diagnostics.
  console.error('Activity cleanup refused or failed. Run only in development with exactly CLEAR_FARMPRISM_ACTIVITY. No reseeding occurs.');
  process.exitCode = 1;
}
