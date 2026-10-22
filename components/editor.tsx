'use client';
import { useEditor, EditorContent, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit'; // v3 already includes Underline
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { useTranslations } from 'next-intl';

const PROSE =
  'min-h-[24rem] rounded-b border border-gray-300 bg-white p-4 focus:outline-none [&_table]:border-collapse [&_td]:border [&_th]:border [&_td]:p-1 [&_th]:p-1 [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6';

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
    <div>
      <div role="toolbar" className="flex flex-wrap gap-1 rounded-t border border-b-0 border-gray-300 bg-gray-50 p-2">
        {items.map(([label, text, run, pressed]) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            aria-pressed={pressed}
            onClick={run}
            className={`rounded px-2 py-1 text-sm hover:bg-gray-200 ${pressed ? 'bg-gray-300 font-semibold' : ''}`}
          >
            {text}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
