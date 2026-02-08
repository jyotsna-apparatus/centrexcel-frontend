'use client'

import * as React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  Strikethrough,
} from 'lucide-react'

export interface TiptapEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  className?: string
  maxLength?: number
  'aria-invalid'?: boolean
  disabled?: boolean
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-cs-border bg-transparent p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(editor.isActive('bold') && 'bg-cs-primary/20 text-cs-primary')}
        title="Bold"
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(editor.isActive('italic') && 'bg-cs-primary/20 text-cs-primary')}
        title="Italic"
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(editor.isActive('strike') && 'bg-cs-primary/20 text-cs-primary')}
        title="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={cn(editor.isActive('code') && 'bg-cs-primary/20 text-cs-primary')}
        title="Code"
      >
        <Code className="size-4" />
      </Button>
      <span className="mx-1 h-4 w-px bg-cs-border" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(editor.isActive('heading', { level: 2 }) && 'bg-cs-primary/20 text-cs-primary')}
        title="Heading"
      >
        <Heading2 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(editor.isActive('bulletList') && 'bg-cs-primary/20 text-cs-primary')}
        title="Bullet list"
      >
        <List className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(editor.isActive('orderedList') && 'bg-cs-primary/20 text-cs-primary')}
        title="Numbered list"
      >
        <ListOrdered className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(editor.isActive('blockquote') && 'bg-cs-primary/20 text-cs-primary')}
        title="Quote"
      >
        <Quote className="size-4" />
      </Button>
    </div>
  )
}

export function TiptapEditor({
  value = '',
  onChange,
  placeholder = 'Write something...',
  className,
  maxLength,
  'aria-invalid': ariaInvalid,
  disabled,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html === '<p></p>' ? '' : html)
    },
    editorProps: {
      attributes: {
        'aria-invalid': ariaInvalid,
        class:
          'min-h-[120px] w-full rounded-b-md border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 prose prose-sm max-w-none text-cs-text prose-headings:text-cs-heading prose-p:text-cs-text prose-li:text-cs-text prose-blockquote:text-cs-text prose-code:text-cs-text',
      },
    },
  })

  React.useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== (value || '<p></p>')) {
      editor.commands.setContent(value || '', false)
    }
  }, [value, editor])

  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [editor, disabled])

  return (
    <div
      className={cn(
        'rounded-md border border-cs-border focus-within:ring-2 focus-within:ring-cs-primary/30 focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      {maxLength != null && editor && (
        <div className="px-3 pb-2 text-right text-xs text-cs-text/70">
          {editor.getText().length} / {maxLength}
        </div>
      )}
    </div>
  )
}
