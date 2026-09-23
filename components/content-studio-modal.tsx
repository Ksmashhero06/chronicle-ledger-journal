'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Copy,
  Check,
  Download,
  Eye,
  Edit3,
  History,
  Share2,
  Globe,
  FileCode,
  FileText,
  AlertTriangle,
  Minus,
  Smile,
  CheckCircle2,
  Clipboard,
} from 'lucide-react';

export type PublishingTarget = 'linkedin' | 'website' | 'markdown' | 'html' | 'plaintext';

export interface ContentVersion {
  version: number;
  label: string;
  timestamp: string;
  content: string;
  title?: string;
  subtitle?: string;
}

interface ContentStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  initialTitle?: string;
  initialTarget?: PublishingTarget;
  authorName?: string;
  onSave?: (savedContent: string) => void;
}

const COMMON_EMOJIS = ['🚀', '💡', '⚡', '🔍', '📈', '✅', '🛠️', '📝', '🤝', '🎯', '✨', '💻'];

export const ContentStudioModal: React.FC<ContentStudioModalProps> = ({
  isOpen,
  onClose,
  initialContent = '',
  initialTitle = 'Chronicle Ledger Technical Update',
  initialTarget = 'linkedin',
  authorName = 'Chronicle Builder',
  onSave,
}) => {
  // Target format
  const [target, setTarget] = useState<PublishingTarget>(initialTarget);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // Content preservation
  const [originalContent, setOriginalContent] = useState<string>('');
  const [articleTitle, setArticleTitle] = useState<string>(initialTitle);
  const [articleSubtitle, setArticleSubtitle] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Version History
  const [history, setHistory] = useState<ContentVersion[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [comparingVersion, setComparingVersion] = useState<ContentVersion | null>(null);

  // Find & Replace
  const [showFindReplace, setShowFindReplace] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');

  // AI Selection Action
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionRange, setSelectionRange] = useState<Range | null>(null);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [aiProposal, setAiProposal] = useState<{ original: string; proposed: string; action: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  // Editor DOM ref
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      const cleanInit = initialContent || '<p>We shipped Chronicle Ledger v2 on AWS using Lambda and Bedrock.</p>';
      const formattedHtml = cleanInit.includes('<p>') ? cleanInit : `<p>${cleanInit.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
      
      setOriginalContent(formattedHtml);
      setSaveStatus('saved');
      
      const v1: ContentVersion = {
        version: 1,
        label: 'AI Generated Draft',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: formattedHtml,
        title: initialTitle,
      };
      setHistory([v1]);

      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = formattedHtml;
        }
      }, 50);
    }
  }, [isOpen, initialContent, initialTitle]);

  if (!isOpen) return null;

  // Execute formatting command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorChange();
    }
  };

  // Capture selection for floating AI actions
  const handleSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectedText('');
      setSelectionRange(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length > 2) {
      setSelectedText(text);
      if (sel.rangeCount > 0) {
        setSelectionRange(sel.getRangeAt(0).cloneRange());
      }
    } else {
      setSelectedText('');
      setSelectionRange(null);
    }
  };

  const handleEditorChange = () => {
    setSaveStatus('unsaved');
  };

  // Get raw editor text
  const getEditorText = (): string => {
    return editorRef.current ? editorRef.current.innerText : '';
  };

  // Get raw editor HTML
  const getEditorHtml = (): string => {
    return editorRef.current ? editorRef.current.innerHTML : '';
  };

  // Convert HTML to clean Markdown
  const htmlToMarkdown = (html: string): string => {
    let md = html
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<u>(.*?)<\/u>/gi, '<ins>$1</ins>')
      .replace(/<s>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<strike>(.*?)<\/strike>/gi, '~~$1~~')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n\n')
      .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a href="([^"]*)">(.*?)<\/a>/gi, '[$2]($1)');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = md;
    return tempDiv.innerText.trim();
  };

  // Convert HTML to LinkedIn plain text with Unicode bold/italic if applicable
  const htmlToLinkedIn = (html: string): string => {
    return htmlToMarkdown(html)
      .replace(/\*\*(.*?)\*\*/g, '$1') // LinkedIn clean text
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)');
  };

  // Metadata metrics
  const textContent = getEditorText();
  const charCount = textContent.length;
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const hashtags = (textContent.match(/#[\w\d_]+/g) || []);
  const linkedinLimit = 3000;

  // Insert Link
  const handleInsertLink = () => {
    const url = prompt('Enter destination URL (e.g. https://...):', 'https://');
    if (url) {
      execCmd('createLink', url);
    }
  };

  // Insert Emoji
  const handleInsertEmoji = (emoji: string) => {
    execCmd('insertText', ` ${emoji} `);
    setShowEmojiPicker(false);
  };

  // Find and replace
  const handleReplaceAll = () => {
    if (!findQuery || !editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const regex = new RegExp(findQuery.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    editorRef.current.innerHTML = currentHtml.replace(regex, replaceQuery);
    handleEditorChange();
  };

  // Paste without formatting
  const handlePasteClean = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        document.execCommand('insertText', false, text);
        handleEditorChange();
      }
    } catch {
      alert('Please use Ctrl+Shift+V or paste plain text directly.');
    }
  };

  // Trigger Contextual AI Action on selected text
  const handleAiAction = async (action: string, targetLang?: string) => {
    if (!selectedText) return;
    setIsRewriting(true);
    try {
      const res = await fetch('/api/content-studio/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          fullContext: getEditorText(),
          action,
          targetLanguage: targetLang,
        }),
      });
      const data = await res.json();
      if (data.rewrittenText) {
        setAiProposal({
          original: selectedText,
          proposed: data.rewrittenText,
          action,
        });
      }
    } catch (err: any) {
      alert(`AI rewrite error: ${err.message || 'Service unavailable'}`);
    } finally {
      setIsRewriting(false);
    }
  };

  // Apply AI Rewrite to Editor
  const applyAiProposal = () => {
    if (!aiProposal) return;
    if (selectionRange) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(selectionRange);
      document.execCommand('insertText', false, aiProposal.proposed);
    } else {
      execCmd('insertText', aiProposal.proposed);
    }
    setAiProposal(null);
    setSelectedText('');
    handleEditorChange();
  };

  // Create Version Checkpoint
  const createCheckpoint = (label: string) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newVersion: ContentVersion = {
      version: history.length + 1,
      label,
      timestamp: nowTime,
      content: getEditorHtml(),
      title: articleTitle,
      subtitle: articleSubtitle,
    };
    setHistory((prev) => [newVersion, ...prev]);
    setSaveStatus('saved');
    setLastSavedTime(nowTime);
    if (onSave) onSave(getEditorHtml());
  };

  // Restore Original AI Version
  const handleRestoreOriginal = () => {
    if (confirm('Restore the original AI-generated draft? Your current manual edits will be archived in Version History.')) {
      createCheckpoint('Pre-restore Snapshot');
      if (editorRef.current) {
        editorRef.current.innerHTML = originalContent;
      }
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSaveStatus('saved');
      setLastSavedTime(nowTime);
    }
  };

  // Restore Specific Version
  const handleRestoreVersion = (ver: ContentVersion) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = ver.content;
      if (ver.title) setArticleTitle(ver.title);
      if (ver.subtitle) setArticleSubtitle(ver.subtitle);
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSaveStatus('saved');
      setLastSavedTime(nowTime);
      setShowHistoryModal(false);
      createCheckpoint(`Restored v${ver.version}`);
    }
  };

  // Copy Content based on format
  const handleCopy = async (format: 'formatted' | 'plaintext' | 'markdown' | 'html') => {
    let payload = '';
    if (format === 'formatted') {
      try {
        const blobHtml = new Blob([getEditorHtml()], { type: 'text/html' });
        const blobText = new Blob([getEditorText()], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        });
        await navigator.clipboard.write([item]);
        setCopiedFormat('formatted');
        setTimeout(() => setCopiedFormat(null), 2000);
        return;
      } catch {
        payload = getEditorText();
      }
    } else if (format === 'markdown') {
      payload = htmlToMarkdown(getEditorHtml());
    } else if (format === 'html') {
      payload = getEditorHtml();
    } else {
      payload = target === 'linkedin' ? htmlToLinkedIn(getEditorHtml()) : getEditorText();
    }

    await navigator.clipboard.writeText(payload);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Download File Export
  const handleDownload = () => {
    let content = '';
    let ext = 'txt';
    let mime = 'text/plain';

    if (target === 'markdown') {
      content = `# ${articleTitle}\n\n${articleSubtitle ? `*${articleSubtitle}*\n\n` : ''}${htmlToMarkdown(getEditorHtml())}`;
      ext = 'md';
      mime = 'text/markdown';
    } else if (target === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${articleTitle}</title></head><body><h1>${articleTitle}</h1>${articleSubtitle ? `<h3>${articleSubtitle}</h3>` : ''}${getEditorHtml()}</body></html>`;
      ext = 'html';
      mime = 'text/html';
    } else if (target === 'website') {
      content = `# ${articleTitle}\n\n${articleSubtitle ? `*${articleSubtitle}*\n\n` : ''}${htmlToMarkdown(getEditorHtml())}`;
      ext = 'md';
      mime = 'text/markdown';
    } else {
      content = htmlToLinkedIn(getEditorHtml());
      ext = 'txt';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${articleTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (saveStatus === 'unsaved') {
      if (!confirm('You have unsaved changes in Content Studio. Are you sure you want to close?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-2xl shadow-2xl border border-[#EEEEEE] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EEEEEE] bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-[#111111]">Content Studio</h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#F5F5F5] border border-[#E5E5E5] text-[#666666]">
                  Ready to edit
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1.5 ${
                  saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {saveStatus === 'saved' ? `Saved ${lastSavedTime}` : 'Unsaved changes'}
                </span>
              </div>
              <p className="text-[11px] text-[#666666]">
                Generate → Edit → Format → Choose Output → Preview & Export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target Selector */}
            <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E5E5] text-xs">
              <span className="text-[10px] font-semibold text-[#888888] uppercase px-2 hidden sm:inline">Target:</span>
              <button
                onClick={() => setTarget('linkedin')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  target === 'linkedin' ? 'bg-white text-[#0A66C2] shadow-2xs font-semibold' : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                <Share2 className="w-3 h-3" />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={() => setTarget('website')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  target === 'website' ? 'bg-white text-[#111111] shadow-2xs font-semibold' : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Article</span>
              </button>
              <button
                onClick={() => setTarget('markdown')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  target === 'markdown' ? 'bg-white text-[#111111] shadow-2xs font-semibold' : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                <FileCode className="w-3 h-3" />
                <span>Markdown</span>
              </button>
              <button
                onClick={() => setTarget('html')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 hidden md:flex ${
                  target === 'html' ? 'bg-white text-[#111111] shadow-2xs font-semibold' : 'text-[#666666] hover:text-[#111111]'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>HTML</span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F5F5F5] p-1 rounded-xl border border-[#E5E5E5] text-xs">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'edit' ? 'bg-white text-[#111111] shadow-2xs font-semibold' : 'text-[#666666]'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-white text-[#111111] shadow-2xs font-semibold' : 'text-[#666666]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[#888888] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer ml-1"
              title="Close Content Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Formatting Toolbar */}
        {viewMode === 'edit' && (
          <div className="px-5 py-2 border-b border-[#EEEEEE] bg-[#FAFAFA] flex items-center justify-between flex-wrap gap-2 text-xs shrink-0 select-none">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Text styling */}
              <button
                onClick={() => execCmd('bold')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] font-bold cursor-pointer"
                title="Bold (Ctrl+B)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('italic')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Italic (Ctrl+I)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('underline')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Underline (Ctrl+U)"
              >
                <Underline className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('strikeThrough')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Strikethrough"
              >
                <Strikethrough className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-[#E0E0E0] mx-1" />

              {/* Headings */}
              <button
                onClick={() => execCmd('formatBlock', '<h1>')}
                className="px-2 py-1 rounded hover:bg-white hover:shadow-2xs text-[#111111] font-bold cursor-pointer flex items-center gap-0.5 text-[11px]"
                title="Heading 1"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('formatBlock', '<h2>')}
                className="px-2 py-1 rounded hover:bg-white hover:shadow-2xs text-[#111111] font-bold cursor-pointer flex items-center gap-0.5 text-[11px]"
                title="Heading 2"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-4 bg-[#E0E0E0] mx-1" />

              {/* Lists & Quotes */}
              <button
                onClick={() => execCmd('insertUnorderedList')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Bullet List"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('insertOrderedList')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Numbered List"
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('formatBlock', '<blockquote>')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Blockquote"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('formatBlock', '<pre>')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Code Block"
              >
                <Code className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleInsertLink}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer"
                title="Insert Link"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#111111] cursor-pointer flex items-center gap-1"
                  title="Insert Emoji"
                >
                  <Smile className="w-3.5 h-3.5 text-amber-600" />
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-8 left-0 z-30 p-2 bg-white rounded-xl shadow-lg border border-[#EEEEEE] grid grid-cols-4 gap-1.5 w-40">
                    {COMMON_EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => handleInsertEmoji(e)}
                        className="p-1 text-base hover:bg-[#F5F5F5] rounded text-center cursor-pointer"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-[1px] h-4 bg-[#E0E0E0] mx-1" />

              {/* Undo / Redo */}
              <button
                onClick={() => execCmd('undo')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#666666] hover:text-[#111111] cursor-pointer"
                title="Undo (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => execCmd('redo')}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#666666] hover:text-[#111111] cursor-pointer"
                title="Redo (Ctrl+Y)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handlePasteClean}
                className="p-1.5 rounded hover:bg-white hover:shadow-2xs text-[#666666] hover:text-[#111111] cursor-pointer flex items-center gap-1 text-[11px]"
                title="Paste without formatting (Clean Plain Text)"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#555555]" />
                <span className="hidden md:inline">Paste Clean</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFindReplace(!showFindReplace)}
                className={`p-1.5 rounded text-xs flex items-center gap-1 cursor-pointer ${
                  showFindReplace ? 'bg-white shadow-2xs text-[#111111] font-semibold' : 'text-[#666666] hover:text-[#111111]'
                }`}
                title="Find & Replace"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Find</span>
              </button>

              <button
                onClick={() => setShowHistoryModal(true)}
                className="p-1.5 rounded text-xs text-[#666666] hover:text-[#111111] flex items-center gap-1 cursor-pointer hover:bg-white hover:shadow-2xs"
                title="View Version History"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">History ({history.length})</span>
              </button>

              <button
                onClick={handleRestoreOriginal}
                className="px-2.5 py-1 rounded text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium transition-colors cursor-pointer"
                title="Restore initial AI draft"
              >
                Restore AI Version
              </button>

              <button
                onClick={() => createCheckpoint('Manual Save')}
                className="px-3 py-1 rounded-lg bg-[#111111] hover:bg-black text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Save Draft
              </button>
            </div>
          </div>
        )}

        {/* Find & Replace Drawer */}
        {showFindReplace && viewMode === 'edit' && (
          <div className="px-5 py-2.5 bg-[#F0F0F0] border-b border-[#E5E5E5] flex items-center gap-3 text-xs">
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="p-1.5 bg-white border border-[#CCCCCC] rounded-lg text-xs w-48 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              className="p-1.5 bg-white border border-[#CCCCCC] rounded-lg text-xs w-48 focus:outline-none"
            />
            <button
              onClick={handleReplaceAll}
              className="px-3 py-1.5 bg-[#111111] text-white rounded-lg font-medium cursor-pointer hover:bg-black"
            >
              Replace All
            </button>
          </div>
        )}

        {/* Floating AI Selection Action Bar */}
        {selectedText && viewMode === 'edit' && (
          <div className="mx-5 my-2 p-2 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1 duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-semibold text-purple-950 truncate">
                Selected: &ldquo;{selectedText.slice(0, 36)}...&rdquo;
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleAiAction('improve')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Improve
              </button>
              <button
                onClick={() => handleAiAction('shorten')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Shorten
              </button>
              <button
                onClick={() => handleAiAction('technical')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Make Technical
              </button>
              <button
                onClick={() => handleAiAction('grammar')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Fix Grammar
              </button>
              <button
                onClick={() => handleAiAction('clearer')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Clearer
              </button>
              <button
                onClick={() => handleAiAction('translate', 'Spanish')}
                disabled={isRewriting}
                className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium cursor-pointer"
              >
                Translate
              </button>
            </div>
          </div>
        )}

        {/* AI Proposal Comparison Bar */}
        {aiProposal && (
          <div className="mx-5 my-2 p-3 rounded-xl bg-purple-100/70 border border-purple-300 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-purple-950 uppercase text-[10px] tracking-wider">
                AI Suggestion ({aiProposal.action})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiProposal(null)}
                  className="px-2.5 py-1 text-purple-800 hover:text-black cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={applyAiProposal}
                  className="px-3 py-1 bg-purple-900 text-white rounded-lg font-semibold hover:bg-black cursor-pointer shadow-xs"
                >
                  Accept & Replace
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-white/70 border border-purple-200 text-[#666666]">
                <span className="text-[10px] font-mono text-[#888888] block">Original</span>
                <p>{aiProposal.original}</p>
              </div>
              <div className="p-2 rounded bg-white border border-purple-300 text-purple-950 font-medium">
                <span className="text-[10px] font-mono text-purple-700 block">Proposed</span>
                <p>{aiProposal.proposed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Work Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-[#FAFAFA]">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Website/Blog Title & Subtitle Inputs */}
            {target === 'website' && (
              <div className="p-4 bg-white rounded-2xl border border-[#EEEEEE] space-y-3 shadow-2xs">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#888888] font-bold block mb-1">
                    Article Title
                  </label>
                  <input
                    type="text"
                    value={articleTitle}
                    onChange={(e) => {
                      setArticleTitle(e.target.value);
                      handleEditorChange();
                    }}
                    placeholder="Enter article title..."
                    className="w-full text-lg sm:text-xl font-bold text-[#111111] p-2 bg-[#F9F9F9] border border-[#EEEEEE] focus:border-[#111111] rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#888888] font-bold block mb-1">
                    Subtitle / Summary
                  </label>
                  <input
                    type="text"
                    value={articleSubtitle}
                    onChange={(e) => {
                      setArticleSubtitle(e.target.value);
                      handleEditorChange();
                    }}
                    placeholder="Enter short description or hook..."
                    className="w-full text-xs text-[#555555] p-2 bg-[#F9F9F9] border border-[#EEEEEE] focus:border-[#111111] rounded-xl focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* EDIT MODE CANVAS */}
            {viewMode === 'edit' ? (
              <div className="relative">
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorChange}
                  onMouseUp={handleSelection}
                  onKeyUp={handleSelection}
                  onPaste={(e) => {
                    // Prevent external HTML style contamination; paste clean plain text
                    e.preventDefault();
                    const text = e.clipboardData.getData('text/plain');
                    document.execCommand('insertText', false, text);
                    handleEditorChange();
                  }}
                  className="w-full min-h-[360px] p-6 bg-white rounded-2xl border border-[#EEEEEE] shadow-2xs text-[#111111] text-sm sm:text-base leading-relaxed focus:outline-none prose max-w-none focus:border-[#111111] transition-all"
                  style={{ minHeight: '380px' }}
                />
              </div>
            ) : (
              /* PREVIEW MODE RENDERING */
              <div className="space-y-4 animate-in fade-in duration-150">
                {target === 'linkedin' && (
                  /* Realistic LinkedIn Post Feed Preview Card */
                  <div className="bg-white rounded-2xl border border-[#DDDDDD] shadow-md overflow-hidden max-w-xl mx-auto">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-[#F0F0F0]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm">
                          {authorName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#111111] leading-tight">{authorName}</h4>
                          <p className="text-[11px] text-[#666666]">AWS Builder Center Competitor • Zero to Shipped 2026</p>
                          <p className="text-[10px] text-[#999999] flex items-center gap-1">
                            <span>Just now</span>
                            <span>•</span>
                            <Globe className="w-2.5 h-2.5" />
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="p-4 text-xs sm:text-sm text-[#111111] leading-relaxed whitespace-pre-wrap font-sans">
                      {htmlToLinkedIn(getEditorHtml())}
                    </div>

                    {/* Engagement bar */}
                    <div className="px-4 py-2 border-t border-[#EEEEEE] flex items-center justify-between text-xs text-[#666666] bg-[#FAFAFA]">
                      <span>👍 💡 🚀 48 reactions</span>
                      <span>12 comments</span>
                    </div>
                  </div>
                )}

                {target === 'website' && (
                  /* Website / Blog Article Preview */
                  <article className="p-8 bg-white rounded-2xl border border-[#EEEEEE] shadow-sm space-y-4">
                    <header className="space-y-2 border-b border-[#EEEEEE] pb-4">
                      <div className="flex items-center gap-2 text-xs text-[#888888] font-mono">
                        <span>ENGINEERING UPDATE</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                        {articleTitle}
                      </h1>
                      {articleSubtitle && (
                        <p className="text-base text-[#666666] italic">
                          {articleSubtitle}
                        </p>
                      )}
                    </header>
                    <div
                      className="prose prose-neutral max-w-none text-[#222222] text-sm sm:text-base leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: getEditorHtml() }}
                    />
                  </article>
                )}

                {target === 'markdown' && (
                  <div className="p-5 bg-[#1E1E1E] text-emerald-400 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {htmlToMarkdown(getEditorHtml())}
                  </div>
                )}

                {target === 'html' && (
                  <div className="p-5 bg-[#1E1E1E] text-amber-300 rounded-2xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {getEditorHtml()}
                  </div>
                )}

                {target === 'plaintext' && (
                  <div className="p-6 bg-white rounded-2xl border border-[#EEEEEE] font-mono text-xs whitespace-pre-wrap text-[#111111]">
                    {getEditorText()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="px-6 py-3 border-t border-[#EEEEEE] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Metrics Counters */}
          <div className="flex items-center gap-3 text-xs text-[#666666]">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#111111]">{charCount}</span>
              {target === 'linkedin' && (
                <span className={charCount > linkedinLimit ? 'text-rose-600 font-bold' : 'text-[#888888]'}>
                  / {linkedinLimit} chars
                </span>
              )}
              {target !== 'linkedin' && <span>characters</span>}
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#111111]">{wordCount}</span>
              <span>words</span>
            </div>
            {hashtags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1 text-[#0A66C2]">
                  <span className="font-semibold">{hashtags.length}</span>
                  <span>hashtags</span>
                </div>
              </>
            )}
          </div>

          {/* Export & Copy Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleCopy('formatted')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-[#111111] cursor-pointer shadow-2xs"
            >
              {copiedFormat === 'formatted' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'formatted' ? 'Copied' : 'Copy Rich Text'}</span>
            </button>

            <button
              onClick={() => handleCopy('markdown')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-[#111111] cursor-pointer shadow-2xs"
            >
              {copiedFormat === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'markdown' ? 'Copied MD' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={() => handleCopy('plaintext')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DDDDDD] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-[#111111] cursor-pointer shadow-2xs"
            >
              {copiedFormat === 'plaintext' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedFormat === 'plaintext' ? 'Copied' : 'Copy Plain'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-black text-white text-xs font-medium cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#EEEEEE] overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEEE] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#111111]" />
                <h3 className="text-sm font-semibold text-[#111111]">Content Version History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-[#888888] hover:text-[#111111]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {history.map((ver) => (
                <div
                  key={ver.version}
                  className="p-3 rounded-xl border border-[#EEEEEE] hover:border-[#111111] bg-[#FAFAFA] flex items-center justify-between text-xs transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#111111]">v{ver.version}</span>
                      <span className="font-medium text-[#444444]">{ver.label}</span>
                    </div>
                    <span className="text-[10px] text-[#888888]">{ver.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreVersion(ver)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F0F0F0] border border-[#DDDDDD] rounded-lg font-medium text-[#111111] cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
