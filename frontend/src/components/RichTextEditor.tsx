import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Undo, Redo, Heading2, Heading3, Code
} from 'lucide-react';

interface ToolbarButtonProps {
  onMouseDown: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  active?: boolean;
}

function ToolbarButton({ onMouseDown, title, children, active }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      title={title}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active
          ? 'bg-primary text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value → DOM (only when value comes from outside, not from typing)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const cmd = (command: string, arg?: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    exec(command, arg);
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.prompt('URL ссылки:');
    if (url) exec('createLink', url);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
        <ToolbarButton onMouseDown={cmd('bold')} title="Жирный"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('italic')} title="Курсив"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('underline')} title="Подчёркнутый"><Underline className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('strikeThrough')} title="Зачёркнутый"><Strikethrough className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onMouseDown={cmd('formatBlock', 'h2')} title="Заголовок H2"><Heading2 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('formatBlock', 'h3')} title="Заголовок H3"><Heading3 className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('formatBlock', 'p')} title="Обычный текст">
          <span className="text-xs font-medium px-0.5">P</span>
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onMouseDown={cmd('insertUnorderedList')} title="Маркированный список"><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('insertOrderedList')} title="Нумерованный список"><ListOrdered className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('formatBlock', 'pre')} title="Блок кода"><Code className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onMouseDown={cmd('justifyLeft')} title="По левому краю"><AlignLeft className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('justifyCenter')} title="По центру"><AlignCenter className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('justifyRight')} title="По правому краю"><AlignRight className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onMouseDown={handleLink} title="Ссылка"><LinkIcon className="w-4 h-4" /></ToolbarButton>

        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <ToolbarButton onMouseDown={cmd('undo')} title="Отменить"><Undo className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onMouseDown={cmd('redo')} title="Повторить"><Redo className="w-4 h-4" /></ToolbarButton>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose prose-sm dark:prose-invert max-w-none min-h-[220px] px-4 py-3 focus:outline-none text-gray-900 dark:text-gray-100 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 dark:empty:before:text-gray-500 empty:before:pointer-events-none"
      />
    </div>
  );
}
