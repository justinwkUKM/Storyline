import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Palette, 
  Code2, 
  Eye, 
  Sparkles, 
  Eraser,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { sanitizeRichTextHtml } from '../lib/richText';

interface HtmlBulletEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
}

const PRESET_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Primary Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Amber Orange', value: '#f59e0b' },
  { name: 'Rose Red', value: '#f43f5e' },
  { name: 'Purple', value: '#8b5cf6' }
];

export function HtmlBulletEditor({ 
  value, 
  onChange, 
  placeholder = "Enter rich text...",
  className
}: HtmlBulletEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync state from prop to contentEditable innerHTML ONLY if different to avoid cursor jumps
  useEffect(() => {
    if (editorRef.current && !isSourceMode) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value, isSourceMode]);

  // Handle rich text input changes
  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      // Clean up empty divs or break tags that browser inserts on empty input
      const cleanedHtml = currentHtml === '<br>' || currentHtml === '<div><br></div>' ? '' : currentHtml;
      onChange(sanitizeRichTextHtml(cleanedHtml));
    }
  };

  // Helper to execute document commands safely
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Custom styling commands
  const applyColor = (color: string) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  return (
    <div 
      className={cn(
        "w-full flex flex-col rounded-2xl border bg-white transition-all overflow-hidden",
        isFocused 
          ? "border-lime-400 shadow-sm ring-4 ring-lime-500/5" 
          : "border-lime-200/80 hover:border-lime-300",
        className
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        // Prevent immediate blur if clicking toolbar buttons
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocused(false);
          setShowColorPicker(false);
        }
      }}
    >
      {/* 1. Mini Formatting Toolbar (Visible always, highlighted when focused) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-lime-50/50 border-b border-lime-100/80 flex-wrap gap-2 select-none">
        <div className="flex items-center gap-1.5">
          {!isSourceMode ? (
            <>
              {/* Rich Formatting Actions */}
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-1.5 rounded-lg hover:bg-lime-100/70 text-lime-950 transition-colors cursor-pointer"
                title="Bold"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-1.5 rounded-lg hover:bg-lime-100/70 text-lime-950 transition-colors cursor-pointer"
                title="Italic"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-1.5 rounded-lg hover:bg-lime-100/70 text-lime-950 transition-colors cursor-pointer"
                title="Underline"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>

              {/* Text Color Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 rounded-lg hover:bg-lime-100/70 text-lime-950 transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Text Color"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                
                {showColorPicker && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-lime-200 rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1 min-w-[130px]">
                    <span className="text-[9px] font-black text-lime-900/40 uppercase tracking-widest px-1 pb-1.5 border-b border-lime-50">Colors</span>
                    {PRESET_COLORS.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => applyColor(col.value)}
                        className="text-left px-2 py-1 text-xs rounded-xl hover:bg-lime-50 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <span 
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0" 
                          style={{ backgroundColor: col.value === 'inherit' ? '#9ca3af' : col.value }}
                        />
                        <span className="truncate font-semibold text-lime-950">{col.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Formatting */}
              <button
                type="button"
                onClick={() => execCommand('removeFormat')}
                className="p-1.5 rounded-lg hover:bg-lime-100/70 text-lime-950 transition-colors cursor-pointer"
                title="Clear Formatting"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <span className="text-[10px] font-black text-lime-700 bg-lime-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              HTML Source Code Mode
            </span>
          )}
        </div>

        {/* Mode Toggle (WYSIWYG <--> Raw HTML) */}
        <button
          type="button"
          onClick={() => setIsSourceMode(!isSourceMode)}
          className={cn(
            "px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all border",
            isSourceMode
              ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              : "bg-white border-lime-200 text-lime-800 hover:bg-lime-50/40"
          )}
          title={isSourceMode ? "Switch to Rich Preview Editor" : "Switch to Raw HTML Code Editor"}
        >
          {isSourceMode ? (
            <>
              <Eye className="w-3 h-3" />
              WYSIWYG View
            </>
          ) : (
            <>
              <Code2 className="w-3 h-3" />
              HTML Code
            </>
          )}
        </button>
      </div>

      {/* 2. Editor Body */}
      <div className="relative min-h-[48px] flex items-stretch">
        {!isSourceMode ? (
          /* Rich WYSIWYG Editable DIV */
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className={cn(
              "flex-1 px-4 py-2.5 text-sm outline-none whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none text-lime-950 min-h-[48px] select-text font-semibold",
              value === '' && "before:content-[attr(placeholder)] before:text-lime-900/30 before:pointer-events-none before:absolute"
            )}
            style={{ minHeight: '48px' }}
          />
        ) : (
          /* Raw HTML Input Field */
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(sanitizeRichTextHtml(e.target.value))}
            placeholder="E.g. Support with <b>bold</b> or <i>italic</i> tags"
            className="flex-1 w-full px-4 py-2.5 text-sm text-lime-950 font-mono bg-lime-50/5 outline-none min-h-[48px]"
          />
        )}
      </div>

      {/* 3. Helper tip for advanced HTML customization */}
      {isFocused && (
        <div className="px-3.5 py-1.5 bg-lime-50/30 border-t border-lime-100/80 text-[10px] text-lime-900/50 font-bold flex items-center gap-1 select-none">
          <HelpCircle className="w-3 h-3 text-lime-600/60" />
          <span>Tip: You can use HTML tags like <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, or custom color tags.</span>
        </div>
      )}
    </div>
  );
}
