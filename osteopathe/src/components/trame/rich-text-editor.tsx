"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { parseTrameContent } from "@/lib/trame-parser";
import { readTramesFromStorage, type TrameFromStorage } from "@/lib/trame-at-expand";
import { RichEditorToolbar } from "@/components/rich-editor-toolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [dropdown, setDropdown] = useState<{
    visible: boolean;
    x: number;
    y: number;
    query: string;
    items: TrameFromStorage[];
    selectedIndex: number;
  }>({
    visible: false,
    x: 0,
    y: 0,
    query: "",
    items: [],
    selectedIndex: 0,
  });

  const [hasBubbles, setHasBubbles] = useState(false);
  const [hasUnselectedBubbles, setHasUnselectedBubbles] = useState(false);

  // Sync initial value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === "" && value) {
      editorRef.current.innerHTML = valueToHtml(value);
      updateBroomState();
    }
  }, []);

  const valueToHtml = (val: string) => {
    const tokens = parseTrameContent(val);
    return tokens.map(t => {
      if (t.type === "chip") {
        return `<span contenteditable="false" class="trame-bubble" data-value="${t.value}">${t.value}</span>`;
      }
      return t.value;
    }).join("");
  };

  const htmlToValue = () => {
    if (!editorRef.current) return "";
    let result = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains("trame-bubble")) {
          result += `[${el.getAttribute("data-value")}]`;
        } else {
          Array.from(el.childNodes).forEach(walk);
        }
      }
    };
    Array.from(editorRef.current.childNodes).forEach(walk);
    return result;
  };

  const updateBroomState = () => {
    if (!editorRef.current) return;
    const bubbles = editorRef.current.querySelectorAll(".trame-bubble");
    const unselected = editorRef.current.querySelectorAll(".trame-bubble:not(.is-selected)");
    setHasBubbles(bubbles.length > 0);
    setHasUnselectedBubbles(unselected.length > 0);
  };

  const handleInput = () => {
    updateBroomState();
    const currentText = htmlToValue();
    onChange(currentText);

    // Detect @ for dropdown
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      const textBefore = text.slice(0, offset);
      const lastAtIndex = textBefore.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const query = textBefore.slice(lastAtIndex + 1);
        if (!query.includes(" ")) {
          const rect = range.getBoundingClientRect();
          const trames = readTramesFromStorage();
          const filtered = trames.filter(t => t.command.startsWith(query));
          
          setDropdown({
            visible: true,
            x: rect.left,
            y: rect.bottom + window.scrollY,
            query,
            items: filtered,
            selectedIndex: 0,
          });
          return;
        }
      }
    }
    setDropdown(prev => ({ ...prev, visible: false }));
  };

  const insertTrame = (trame: TrameFromStorage) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;

    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent || "";
    const textBefore = text.slice(0, offset);
    const lastAtIndex = textBefore.lastIndexOf("@");
    
    if (lastAtIndex === -1) return;

    node.textContent = text.slice(0, lastAtIndex) + text.slice(offset);
    range.setStart(node, lastAtIndex);
    range.setEnd(node, lastAtIndex);
    
    const tokens = parseTrameContent(trame.content || "");
    const fragment = document.createDocumentFragment();
    
    tokens.forEach(token => {
      if (token.type === "text") {
        fragment.appendChild(document.createTextNode(token.value));
      } else {
        const span = document.createElement("span");
        span.className = "trame-bubble";
        span.contentEditable = "false";
        span.setAttribute("data-value", token.value);
        span.textContent = token.value;
        fragment.appendChild(span);
      }
    });

    range.insertNode(fragment);
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.setStartAfter(fragment.lastChild || node);
    newRange.collapse(true);
    selection.addRange(newRange);

    setDropdown(prev => ({ ...prev, visible: false }));
    updateBroomState();
    onChange(htmlToValue());
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("trame-bubble")) {
      target.classList.toggle("is-selected");
      updateBroomState();
      onChange(htmlToValue());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (dropdown.visible) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdown(prev => ({ ...prev, selectedIndex: (prev.selectedIndex + 1) % Math.max(1, prev.items.length) }));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdown(prev => ({ ...prev, selectedIndex: (prev.selectedIndex - 1 + prev.items.length) % Math.max(1, prev.items.length) }));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = dropdown.items[dropdown.selectedIndex];
        if (selected) insertTrame(selected);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setDropdown(prev => ({ ...prev, visible: false }));
      }
    }
  };

  const runBroom = () => {
    if (!editorRef.current) return;
    const unselected = editorRef.current.querySelectorAll(".trame-bubble:not(.is-selected)");
    unselected.forEach(el => el.remove());
    editorRef.current.normalize();
    updateBroomState();
    onChange(htmlToValue());
  };

  useEffect(() => {
    const handler = () => setDropdown(prev => ({ ...prev, visible: false }));
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  return (
    <div className={`rich-text-editor-container ${className}`}>
      <RichEditorToolbar 
        onBroomFinalize={hasBubbles ? runBroom : undefined}
        broomActive={hasUnselectedBubbles}
      />
      <div
        ref={editorRef}
        contentEditable
        className="rich-text-editor-area"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onClick={handleEditorClick}
        onBlur={() => setTimeout(updateBroomState, 100)}
      />
      {dropdown.visible && dropdown.items.length > 0 && (
        <div 
          className="trame-dropdown"
          style={{ position: "absolute", left: dropdown.x, top: dropdown.y, zIndex: 1000 }}
          onMouseDown={e => e.preventDefault()}
        >
          {dropdown.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`trame-dropdown-item ${idx === dropdown.selectedIndex ? "is-active" : ""}`}
              onClick={() => insertTrame(item)}
              onMouseEnter={() => setDropdown(prev => ({ ...prev, selectedIndex: idx }))}
            >
              <span className="trame-dropdown-cmd">@{item.command}</span>
              <span className="trame-dropdown-preview">{item.content?.slice(0, 30)}...</span>
            </div>
          ))}
        </div>
      )}
      {editorRef.current?.innerHTML === "" && placeholder && (
        <div className="rich-text-editor-placeholder">{placeholder}</div>
      )}

      <style jsx global>{`
        .rich-text-editor-area {
          min-height: 150px;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: #fff;
          outline: none;
          font-size: 1rem;
          line-height: 1.5;
        }
        .trame-bubble {
          display: inline-block;
          padding: 2px 8px;
          margin: 0 2px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          background: #fff;
          color: #6b7280;
          font-size: 0.9em;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
        }
        .trame-bubble.is-selected {
          background: #ecfdf5;
          border-color: #10b981;
          color: #065f46;
        }
        .trame-dropdown {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          overflow: hidden;
        }
        .trame-dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .trame-dropdown-item.is-active {
          background: var(--app-accent-soft);
        }
        .trame-dropdown-cmd {
          font-weight: 700;
          color: var(--app-accent);
        }
        .trame-dropdown-preview {
          font-size: 0.8rem;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}
