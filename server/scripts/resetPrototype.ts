import { resetPrototype, validateResetRequest } from '../src/services/devReset.service.js';

try {
  const args = process.argv.slice(2);
  // Reject unsafe invocation before loading privileged environment/client dependencies.
  validateResetRequest(process.env.NODE_ENV, args);
  const { supabaseAdmin } = await import('../src/lib/supabaseAdmin.js');
  console.log(JSON.stringify(await resetPrototype(process.env.NODE_ENV, args, name => supabaseAdmin.rpc(name))));
} catch {
  console.error('Demo reset refused or failed. Use a non-production server environment and exactly RESET_FARMPRISM_DEMO.');
  process.exitCode = 1;
}
