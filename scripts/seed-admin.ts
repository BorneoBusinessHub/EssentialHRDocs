// Usage: npx tsx scripts/seed-admin.ts <email> <password>
import { createClient } from '@supabase/supabase-js';

async function main() {
  process.loadEnvFile('.env.local');
  const [email, password] = process.argv.slice(2);
  if (!email || !password) throw new Error('usage: seed-admin.ts <email> <password>');

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const { error: e2 } = await sb
    .from('profiles')
    .insert({ id: data.user.id, company_name: 'Admin', role: 'admin', expires_at: null });
  if (e2) throw e2;
  console.log('admin created', data.user.id);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
