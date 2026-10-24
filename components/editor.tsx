'use client';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'; // v3 already includes Underline
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { useTranslations } from 'next-intl';

const PROSE =
  'doc-paper min-h-[28rem] px-6 py-8 text-ink focus:outline-none sm:px-12 sm:py-12 [&_.selectedCell]:bg-accent-soft';

export function Editor({ initialHtml, onChange }: { initialHtml: string; onChange: (html: string) => void }) {
  const t = useTranslations('fill');
  const editor = useEditor({
    extensions: [StarterKit, TableKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
    content: initialHtml,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: PROSE } },
  });
  // re-render toolbar on selection/content change so aria-pressed stays current
  useEditorState({ editor, selector: (s) => s.editor?.state.selection });
  if (!editor) return null;

  const c = () => editor.chain().focus();
  const items: [string, string, () => void, boolean?][] = [
    [t('bold'), 'B', () => c().toggleBold().run(), editor.isActive('bold')],
    [t('italic'), 'I', () => c().toggleItalic().run(), editor.isActive('italic')],
    [t('underline'), 'U', () => c().toggleUnderline().run(), editor.isActive('underline')],
    [t('h1'), 'H1', () => c().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 })],
    [t('h2'), 'H2', () => c().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 })],
    [t('h3'), 'H3', () => c().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 })],
    [t('bullets'), '• List', () => c().toggleBulletList().run(), editor.isActive('bulletList')],
    [t('numbers'), '1. List', () => c().toggleOrderedList().run(), editor.isActive('orderedList')],
    [t('alignLeft'), 'Left', () => c().setTextAlign('left').run(), editor.isActive({ textAlign: 'left' })],
    [t('alignCenter'), 'Center', () => c().setTextAlign('center').run(), editor.isActive({ textAlign: 'center' })],
    [t('alignRight'), 'Right', () => c().setTextAlign('right').run(), editor.isActive({ textAlign: 'right' })],
    [t('insertTable'), 'Table', () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()],
    [t('addRow'), '+Row', () => c().addRowAfter().run()],
    [t('delRow'), '-Row', () => c().deleteRow().run()],
    [t('addCol'), '+Col', () => c().addColumnAfter().run()],
    [t('delCol'), '-Col', () => c().deleteColumn().run()],
  ];

  return (
    <div className="shell">
      <div role="toolbar" className="sticky top-20 z-10 flex flex-wrap gap-0.5 rounded-t-[1.375rem] bg-surface-2/90 p-1.5 backdrop-blur-xl sm:top-24">
        {items.map(([label, text, run, pressed]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            onClick={run}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-[0.8125rem] transition-colors duration-200 hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent ${pressed ? 'bg-surface font-semibold text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-muted'}`}
          >
            {text}
          </button>
        ))}
      </div>
      <div className="core mt-1.5 rounded-t-md">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
