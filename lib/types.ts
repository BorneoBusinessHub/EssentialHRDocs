export type Locale = 'en' | 'ms' | 'zh';
export type Profile = { id: string; company_name: string; role: 'admin' | 'customer'; expires_at: string | null; disabled: boolean };
export type Field = { key: string; label: string; hint?: string };
export type Template = { id: string; title: string; category: string; description: string; tags: string[]; docx_path: string; html: string; fields: Field[]; published: boolean; updated_at: string };
export type TemplateSummary = Pick<Template, 'id' | 'title' | 'category' | 'description' | 'tags'>;
