// Usage: npx tsx scripts/set-password.ts <email> <new-password>
import { createClient } from '@supabase/supabase-js';

async function main() {
  process.loadEnvFile('.env.local');
  const [email, password] = process.argv.slice(2);
  if (!email || !password) throw new Error('usage: set-password.ts <email> <new-password>');
  if (password.length < 8) throw new Error('password must be at least 8 characters');

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  // ponytail: first 1000 users only; page through listUsers if there are more
  const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`no user with email ${email}`);

  const { error: e2 } = await sb.auth.admin.updateUserById(user.id, { password });
  if (e2) throw e2;
  console.log('password updated for', user.email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
