// components/ui/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";
import { useEffect, useState } from "react";

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    };
  },
});

// ============================================================
// 🎨 ӨНГӨНҮҮД
// ============================================================
const COLORS = [
  { name: "Хар / Default", value: "#000000" },
  { name: "Саарал / Gray", value: "#6B7280" },
  { name: "Улаан / Red", value: "#EF4444" },
  { name: "Улбар шар / Orange", value: "#F97316" },
  { name: "Шар / Yellow", value: "#EAB308" },
  { name: "Ногоон / Green", value: "#10B981" },
  { name: "Цэнхэр / Blue", value: "#3B82F6" },
  { name: "Нил ягаан / Purple", value: "#8B5CF6" },
  { name: "Ягаан / Pink", value: "#EC4899" },
];

const HIGHLIGHT_COLORS = [
  { name: "Шар / Yellow", value: "#FEF08A" },
  { name: "Ногоон / Green", value: "#A7F3D0" },
  { name: "Цэнхэр / Blue", value: "#BFDBFE" },
  { name: "Нил ягаан / Purple", value: "#E9D5FF" },
  { name: "Ягаан / Pink", value: "#FBCFE8" },
  { name: "Улбар шар / Orange", value: "#FED7AA" },
];

const FONT_SIZES = [
  { name: "Small", value: "12px" },
  { name: "Normal", value: "14px" },
  { name: "Medium", value: "16px" },
  { name: "Large", value: "18px" },
  { name: "H2", value: "20px" },
  { name: "H1", value: "24px" },
  { name: "XL", value: "28px" },
  { name: "XXL", value: "32px" },
];

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  minHeight = "300px",
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      FontSize,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      if (!isHtmlMode) {
        onChange(editor.getHTML());
      }
    },
    editorProps: { attributes: { class: "focus:outline-none" } },
    immediatelyRender: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && mounted && value !== editor.getHTML() && !isHtmlMode) {
      editor.commands.setContent(value);
    }
  }, [value, editor, mounted, isHtmlMode]);

  // HTML mode-д шилжих
  const toggleHtmlMode = () => {
    if (isHtmlMode) {
      // Visual mode руу буцах
      if (editor) {
        editor.commands.setContent(htmlValue);
        onChange(htmlValue);
      }
    } else {
      // HTML mode руу орох
      if (editor) {
        setHtmlValue(editor.getHTML());
      }
    }
    setIsHtmlMode(!isHtmlMode);
  };

  // HTML өөрчлөгдөхөд
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setHtmlValue(newValue);
    onChange(newValue);
  };

  if (!mounted || !editor) {
    return (
      <div
        className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden ${className}`}
      >
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-2 animate-pulse">
            <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
        <div className="p-6" style={{ minHeight }}>
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  const currentColor = editor.getAttributes("textStyle").color || "#000000";
  const currentFontSize = editor.getAttributes("textStyle").fontSize || "14px";

  return (
    <div
      className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-3 py-2 bg-gray-50/80 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-wrap items-center gap-1">
          {/* Mode Toggle - HTML / Visual */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
            <button
              type="button"
              onClick={toggleHtmlMode}
              className={`p-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                isHtmlMode
                  ? "bg-purple-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              title="Toggle HTML / Visual Mode"
            >
              {isHtmlMode ? "📝 Visual Mode" : "🔧 HTML Mode"}
            </button>
          </div>

          {/* Visual mode toolbar (зөвхөн visual mode үед харагдана) */}
          {!isHtmlMode && (
            <>
              {/* Text Formatting */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded-lg transition-all ${editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  title="Bold"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded-lg transition-all ${editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  title="Italic"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 4h4M14 20h-4M14 4l-4 16"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded-lg transition-all ${editor.isActive("underline") ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                  title="Underline"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 4v6a4 4 0 008 0V4M4 20h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Headings */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={`p-1.5 px-2 rounded-lg text-sm font-bold ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  H1
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={`p-1.5 px-2 rounded-lg text-sm font-semibold ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  H2
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  className={`p-1.5 px-2 rounded-lg text-xs font-medium ${editor.isActive("heading", { level: 3 }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  H3
                </button>
              </div>

              {/* Lists */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={`p-1.5 rounded-lg ${editor.isActive("bulletList") ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className={`p-1.5 rounded-lg ${editor.isActive("orderedList") ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h10M7 16h10M4 4h2M4 8h2M4 12h2"
                    />
                  </svg>
                </button>
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h10M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M8 12h8M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={`p-1.5 rounded-lg ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100"}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M10 12h10M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Font Size */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <div className="relative">
                  <button
                    onClick={() => setShowFontSizePicker(!showFontSizePicker)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-1 text-sm"
                  >
                    <span>📏</span>
                    <span>{currentFontSize}</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showFontSizePicker && (
                    <div className="absolute top-full left-0 mt-2 z-20 p-2 bg-white dark:bg-gray-800 rounded-xl border shadow-lg w-32">
                      {FONT_SIZES.map((size) => (
                        <button
                          key={size.value}
                          onClick={() => {
                            editor
                              .chain()
                              .focus()
                              .setFontSize(size.value)
                              .run();
                            setShowFontSizePicker(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100"
                          style={{ fontSize: size.value }}
                        >
                          {size.name}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          editor.chain().focus().unsetFontSize().run();
                          setShowFontSizePicker(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Color */}
              <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-gray-700 pr-2 mr-1">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowColorPicker(!showColorPicker);
                      setShowHighlightPicker(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                  >
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: currentColor }}
                    />
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-lg w-56">
                      <div className="grid grid-cols-5 gap-1.5">
                        {COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              editor
                                .chain()
                                .focus()
                                .setColor(color.value)
                                .run();
                              setShowColorPicker(false);
                            }}
                            className="w-8 h-8 rounded-lg border hover:scale-110"
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          editor.chain().focus().unsetColor().run();
                          setShowColorPicker(false);
                        }}
                        className="w-full mt-2 text-xs text-red-500"
                      >
                        Remove Color
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlight */}
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowHighlightPicker(!showHighlightPicker);
                      setShowColorPicker(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  {showHighlightPicker && (
                    <div className="absolute top-full left-0 mt-2 z-20 p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-lg w-56">
                      <div className="grid grid-cols-3 gap-1.5">
                        {HIGHLIGHT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              editor
                                .chain()
                                .focus()
                                .toggleHighlight({ color: color.value })
                                .run();
                              setShowHighlightPicker(false);
                            }}
                            className="w-10 h-8 rounded-lg border hover:scale-110"
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          editor.chain().focus().unsetHighlight().run();
                          setShowHighlightPicker(false);
                        }}
                        className="w-full mt-2 text-xs text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Undo/Redo */}
              <div className="flex items-center gap-0.5 ml-auto">
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor Content or HTML Textarea */}
      <div className="p-6 md:p-8 lg:p-10" style={{ minHeight }}>
        {isHtmlMode ? (
          <div>
            <div className="mb-2 flex justify-between items-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ✏️ Direct HTML editing - write your own HTML code
              </p>
              <button
                type="button"
                onClick={() => {
                  const prettified = htmlValue
                    .replace(/>\s+</g, "><")
                    .replace(/(<[^>]+>)/g, (match) => {
                      if (match.startsWith("</")) {
                        return "\n" + match;
                      }
                      return match;
                    });
                  setHtmlValue(prettified);
                }}
                className="text-xs text-blue-500 hover:underline"
              >
                Format
              </button>
            </div>
            <textarea
              value={htmlValue}
              onChange={handleHtmlChange}
              className="w-full h-96 p-4 font-mono text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="<div style='background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 1rem; border-radius: 0.5rem;'>  <h2>Your HTML content here...</h2></div>"
            />
            <div className="mt-2 text-xs text-gray-400">
              💡 Tip: You can write any HTML code. Make sure to close all tags
              properly.
            </div>
          </div>
        ) : (
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <style jsx global>{`
              .ProseMirror ul {
                list-style-type: disc !important;
                padding-left: 1.5rem !important;
                margin: 0.5rem 0 !important;
              }
              .ProseMirror ol {
                list-style-type: decimal !important;
                padding-left: 1.5rem !important;
                margin: 0.5rem 0 !important;
              }
              .ProseMirror li {
                margin: 0.25rem 0 !important;
                line-height: 1.5 !important;
              }
              .ProseMirror .is-editor-empty:first-child::before {
                content: attr(data-placeholder);
                float: left;
                color: #9ca3af;
                pointer-events: none;
                height: 0;
              }
            `}</style>
            <EditorContent editor={editor} />
          </div>
        )}
      </div>
    </div>
  );
}
