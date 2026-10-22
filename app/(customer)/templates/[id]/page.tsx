import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/access';
import type { Field } from '@/lib/types';
import { FillEdit } from './fill-edit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function TemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from('templates').select('id, title, html, fields').eq('id', id).maybeSingle();
  if (!data) notFound();
  return <FillEdit userId={user.id} templateId={data.id} title={data.title} html={data.html} fields={data.fields as Field[]} />;
}
