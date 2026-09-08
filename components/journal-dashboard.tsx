'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth-provider';
import { JournalInteraction, JournalMode, TurnMessage } from '@/lib/types';
import {
  saveInteraction,
  deleteInteraction,
  toggleFavorite,
  subscribeToUserInteractions,
} from '@/lib/firestore-service';
import { formatDate } from '@/lib/utils';
import Markdown from 'react-markdown';
import { ChronicleLogo } from '@/components/chronicle-logo';
import {
  Sparkles,
  Plus,
  Search,
  Trash2,
  LogOut,
  Star,
  Copy,
  Check,
  Download,
  AlertTriangle,
  RotateCw,
  Send,
  BookOpen,
  MessageSquare,
  Lightbulb,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Pencil,
  Code2,
  Share2,
  PanelLeft,
  History,
  X,
} from 'lucide-react';

const REFLECTION_STARTERS = [
  'What energized me today and what drained my focus?',
  'I am wrestling with an important decision...',
  'Reflecting on a challenging conversation I had recently...',
  'Brainstorm 5 fresh angles on my current goal...',
];

const DEVLOG_STARTERS = [
  'Deployed our Firestore security rules with per-user isolation and tested fallback ladder on Cloud Run...',
  'Fixed a critical race condition in optimistic updates by syncing buffer states...',
  'Built our dual-cognitive intelligence pipeline connecting Gemini 3.6 Flash to developer logs...',
  'Refactored our server-side API proxy with zero-crash payload sanitization...',
];

function getNow(): number {
  return Date.now();
}

function generateInteractionId(): string {
  return `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateTurnId(role: string): string {
  return `turn_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

export function JournalDashboard() {
  const { user, logOut } = useAuth();

  // Interactions list from Firestore
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Active interaction state
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleDraft, setTitleDraft] = useState<string>('');

  // Input state
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<JournalMode>('reflection');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Subscribe to Firestore interactions for current user
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (items) => {
        setInteractions(items);
        setIsLoadingHistory(false);

        // If no active interaction is loaded, or if the active one was updated externally
        setActiveInteraction((prev) => {
          if (!prev) {
            return items.length > 0 ? items[0] : null;
          }
          const found = items.find((i) => i.id === prev.id);
          return found || prev;
        });
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setHistoryError('Failed to load past reflections from Firestore.');
        setIsLoadingHistory(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeInteraction?.turns, isGenerating]);

  // Handle creating a new reflection
  const handleStartNewEntry = () => {
    const newId = generateInteractionId();
    const now = getNow();
    const newEntry: JournalInteraction = {
      id: newId,
      userId: user?.uid || '',
      userEmail: user?.email || 'Anonymous',
      userName: user?.displayName || 'Chronicle User',
      title: 'Untitled Chronicle',
      mode: selectedMode,
      turns: [],
      summary: '',
      keyTakeaways: [],
      createdAt: now,
      updatedAt: now,
      tags: [],
    };
    setActiveInteraction(newEntry);
    setTitleDraft(newEntry.title);
    setInputPrompt('');
    setSaveError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Submit Prompt to Gemini and persist to Firestore
  const handleSubmitReflection = async (customPrompt?: string) => {
    const promptToSend = (customPrompt || inputPrompt).trim();
    if (!promptToSend || !user?.uid || isGenerating) return;

    setSaveError(null);
    setIsGenerating(true);

    const timestamp = getNow();
    const userTurn: TurnMessage = {
      id: generateTurnId('user'),
      role: 'user',
      text: promptToSend,
      timestamp,
    };

    // Prepare current session state
    const currentEntry: JournalInteraction = activeInteraction || {
      id: generateInteractionId(),
      userId: user.uid,
      userEmail: user.email || 'Anonymous',
      userName: user.displayName || 'Chronicle User',
      title: promptToSend.slice(0, 35) + (promptToSend.length > 35 ? '...' : ''),
      mode: selectedMode,
      turns: [],
      summary: '',
      keyTakeaways: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: [],
    };

    // Optimistically append user turn to UI
    const updatedTurnsWithUser = [...currentEntry.turns, userTurn];
    const optimisticEntry: JournalInteraction = {
      ...currentEntry,
      mode: selectedMode,
      turns: updatedTurnsWithUser,
      updatedAt: timestamp,
    };
    setActiveInteraction(optimisticEntry);

    // Call Gemini API route
    try {
      const historyPayload = currentEntry.turns.map((t) => ({
        role: t.role,
        text: t.text,
      }));

      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptToSend,
          mode: selectedMode,
          history: historyPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const modelTurn: TurnMessage = {
        id: generateTurnId('model'),
        role: 'model',
        text: data.reply || 'Reflection generated.',
        timestamp: getNow(),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
        dualResponse: data.dualResponse,
      };

      const finalTurns = [...updatedTurnsWithUser, modelTurn];
      const isFirstTurn = currentEntry.turns.length === 0;

      const finalizedEntry: JournalInteraction = {
        ...optimisticEntry,
        title:
          isFirstTurn && data.suggestedTitle
            ? data.suggestedTitle
            : (currentEntry.title === 'Untitled Chronicle' || currentEntry.title === 'Untitled Reflection') && data.suggestedTitle
            ? data.suggestedTitle
            : currentEntry.title,
        turns: finalTurns,
        summary: data.summary || currentEntry.summary || '',
        keyTakeaways:
          data.keyTakeaways && data.keyTakeaways.length > 0
            ? data.keyTakeaways
            : currentEntry.keyTakeaways || [],
        latestDualResponse: data.dualResponse || currentEntry.latestDualResponse,
        tags:
          data.dualResponse?.internal_tags && data.dualResponse.internal_tags.length > 0
            ? data.dualResponse.internal_tags
            : data.dualResponse?.internal_firestore_tags || currentEntry.tags || [],
        updatedAt: getNow(),
      };

      setActiveInteraction(finalizedEntry);
      setTitleDraft(finalizedEntry.title);

      // Persist to Firestore
      setSaveStatus('saving');
      await saveInteraction(user.uid, finalizedEntry);
      setSaveStatus('saved');

      // Clear input buffer ONLY after successful save
      setInputPrompt('');
    } catch (err: any) {
      console.error('Failed in reflection submission:', err);
      setSaveError(
        err?.message ||
          'Failed to complete reflection or persist to Firestore. Your draft is preserved.'
      );
      // Retain the prompt in input box so the user does not lose their thoughts
      setInputPrompt(promptToSend);
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry save if Firestore write failed
  const handleRetrySave = async () => {
    if (!activeInteraction || !user?.uid) return;
    try {
      setSaveStatus('saving');
      setSaveError(null);
      await saveInteraction(user.uid, activeInteraction);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Retry save failed:', err);
      setSaveError('Retry failed. Please check network connection and try again.');
    }
  };

  // Delete an interaction
  const handleDeleteInteraction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    try {
      await deleteInteraction(user.uid, id);
      setDeleteConfirmId(null);
      if (activeInteraction?.id === id) {
        const remaining = interactions.filter((i) => i.id !== id);
        setActiveInteraction(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete interaction:', err);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, currentVal: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.uid) return;
    try {
      await toggleFavorite(user.uid, id, !currentVal);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  // Update Title
  const handleSaveTitle = async () => {
    if (!activeInteraction || !user?.uid || !titleDraft.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = { ...activeInteraction, title: titleDraft.trim(), updatedAt: getNow() };
      setActiveInteraction(updated);
      setIsEditingTitle(false);
      await saveInteraction(user.uid, updated);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  // Copy full reflection transcript
  const handleCopyTranscript = () => {
    if (!activeInteraction) return;
    const textLines = [
      `# ${activeInteraction.title}`,
      `Date: ${formatDate(activeInteraction.createdAt)}`,
      `Mode: ${activeInteraction.mode}`,
      '',
    ];

    if (activeInteraction.summary) {
      textLines.push(`## Summary\n${activeInteraction.summary}\n`);
    }

    if (activeInteraction.keyTakeaways && activeInteraction.keyTakeaways.length > 0) {
      textLines.push('## Key Insights & Takeaways');
      activeInteraction.keyTakeaways.forEach((k) => textLines.push(`- ${k}`));
      textLines.push('');
    }

    textLines.push('## Conversation');
    activeInteraction.turns.forEach((t) => {
      textLines.push(`### ${t.role === 'user' ? 'Me' : 'Gemini'} (${formatDate(t.timestamp)}):`);
      textLines.push(`${t.text}\n`);
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedId('all');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy individual turn
  const handleCopyTurn = (turnId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(turnId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export as Markdown file
  const handleExportMarkdown = () => {
    if (!activeInteraction) return;
    const content = [
      `# ${activeInteraction.title}`,
      `*Generated on ${formatDate(activeInteraction.createdAt)} with Chronicle Ledger & Gemini*`,
      '',
      `**Mode:** ${activeInteraction.mode}`,
      '',
      activeInteraction.summary ? `## Summary\n${activeInteraction.summary}\n` : '',
      activeInteraction.keyTakeaways?.length
        ? `## Key Takeaways\n${activeInteraction.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n`
        : '',
      '## Chronicle Ledger Turns',
      ...activeInteraction.turns.map(
        (t) => `\n### ${t.role === 'user' ? 'You' : 'Gemini'}\n${t.text}`
      ),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeInteraction.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered interactions
  const filteredInteractions = interactions.filter((entry) => {
    const matchesSearch =
      !searchQuery ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.turns.some((t) => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMode = filterMode === 'all' || entry.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  // Render the History & Archive Timeline content for desktop sidebar and mobile slide-out drawer
  const renderArchiveTimelineContent = (isMobile: boolean = false) => (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Archive Header */}
      <div className="p-4 sm:p-6 pb-3 space-y-3 shrink-0 border-b border-[#F0F0F0]">
        {!isMobile && (
          <div className="flex items-center gap-3">
            <ChronicleLogo size={32} />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-medium tracking-tight text-[#111111] truncate">Chronicle Ledger</h1>
              <p className="text-[10px] sm:text-[11px] text-[#888888] font-mono mt-0.5 truncate">Production Directives v2.4 Active</p>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#AAAAAA]" />
          <input
            id={isMobile ? 'mobile-search-interactions-input' : 'search-interactions-input'}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Chronicle Ledger..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F5F5] border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-[#111111] placeholder:text-[#AAAAAA] text-[#111111]"
          />
        </div>

        {/* Mode Filter Pills: Horizontal Swipe Tray with hidden scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap pb-2 text-[10px]">
          {[
            { id: 'all', label: 'All' },
            { id: 'reflection', label: 'Reflection' },
            { id: 'brainstorm', label: 'Brainstorm' },
            { id: 'summary', label: 'Summary' },
            { id: 'freeform', label: 'Freeform' },
            { id: 'devlog', label: 'DevLog' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setFilterMode(m.id)}
              className={`px-2.5 py-1 rounded-full font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                filterMode === m.id
                  ? 'bg-[#111111] text-white'
                  : 'border border-[#DDDDDD] text-[#666666] hover:bg-white hover:text-[#111111]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 sm:px-6 py-2.5 text-[10px] uppercase tracking-widest text-[#BBBBBB] font-semibold flex items-center justify-between shrink-0 bg-[#FCFCFC] border-b border-[#F0F0F0]">
        <span>Recent Entries ({interactions.length})</span>
        <button
          onClick={() => {
            handleStartNewEntry();
            if (isMobile) setIsMobileDrawerOpen(false);
          }}
          className="text-[10px] text-[#666666] hover:text-[#111111] font-medium flex items-center gap-1 cursor-pointer hover:underline"
        >
          <Plus className="w-3 h-3" />
          <span>New</span>
        </button>
      </div>

      {/* List of Interactions */}
      <nav className="flex-1 px-3 sm:px-4 py-2 space-y-1.5 overflow-y-auto">
        {isLoadingHistory ? (
          <div className="p-8 text-center text-xs text-[#999999]">
            <RotateCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#999999]" />
            Loading your isolated entries...
          </div>
        ) : historyError ? (
          <div className="p-4 rounded-xl bg-[#FFF8F6] border border-[#F5C6CB] text-[#721C24] text-xs">
            {historyError}
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#999999] space-y-2">
            <BookOpen className="w-5 h-5 mx-auto text-[#BBBBBB]" />
            <p className="font-medium text-[#666666]">No entries found</p>
            <p className="text-[11px] text-[#999999]">
              {searchQuery ? 'Try a different search term' : 'Start your first session in Chronicle Ledger with Gemini.'}
            </p>
            <button
              onClick={() => {
                handleStartNewEntry();
                if (isMobile) setIsMobileDrawerOpen(false);
              }}
              className="mt-2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#111111] text-white text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Entry
            </button>
          </div>
        ) : (
          filteredInteractions.map((entry) => {
            const isSelected = activeInteraction?.id === entry.id;
            const previewSnippet =
              entry.summary ||
              entry.turns.find((t) => t.role === 'model')?.text ||
              entry.turns[0]?.text ||
              'Empty chronicle entry...';

            return (
              <div
                key={entry.id}
                id={`interaction-item-${entry.id}`}
                onClick={() => {
                  setActiveInteraction(entry);
                  setTitleDraft(entry.title);
                  setSaveError(null);
                  if (isMobile) setIsMobileDrawerOpen(false);
                }}
                className={`group relative px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#F5F5F5] border-l-2 border-[#111111] font-medium text-[#111111]'
                    : 'text-[#666666] hover:bg-[#FAFAFA] border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-xs sm:text-sm text-[#111111] line-clamp-1 flex-1">
                    {entry.title || 'Untitled Chronicle'}
                  </h3>
                  <button
                    onClick={(e) => handleToggleFavorite(entry.id, !!entry.isFavorite, e)}
                    className={`shrink-0 p-0.5 rounded hover:bg-white/80 ${
                      entry.isFavorite ? 'text-[#111111]' : 'text-[#CCCCCC] group-hover:text-[#999999]'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                <p className="text-[11px] text-[#999999] line-clamp-1 mt-0.5 leading-normal">
                  {previewSnippet}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F0F0F0] text-[10px] text-[#BBBBBB]">
                  <div className="flex items-center gap-1.5">
                    <span className="capitalize font-medium">{entry.mode}</span>
                    <span>•</span>
                    <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>{entry.turns.length} turns</span>
                    <button
                      onClick={(e) => handleDeleteInteraction(entry.id, e)}
                      className="opacity-70 sm:opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#999999] hover:text-[#D9534F] transition-opacity"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* User Profile Bar in Sidebar */}
      <div className="p-3.5 sm:p-4 border-t border-[#EEEEEE] bg-white space-y-2 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#666666] shrink-0">
            {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : 'JD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#111111] truncate">
              {user?.displayName || 'Julian Dearden'}
            </p>
            <p className="text-[10px] text-[#999999] truncate">
              {user?.email || 'Authenticated User'}
            </p>
          </div>
          <button
            onClick={logOut}
            className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors text-[#999999] hover:text-[#111111] cursor-pointer shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-1.5 border-t border-[#F5F5F5] text-[9px] text-[#888888] font-mono leading-tight text-center">
          <p>Chronicle Ledger • Isolated Firestore</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FDFDFD] text-[#1A1A1A] font-sans overflow-hidden">
      {/* Top Application Header */}
      <header className="h-16 sm:h-18 border-b border-[#F0F0F0] bg-white px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          {/* Mobile History Drawer Toggle */}
          <button
            id="mobile-history-toggle-btn"
            onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-[#111111] transition-colors cursor-pointer shadow-2xs shrink-0"
            title="History & Archive Timeline"
            aria-label="Toggle History & Archive Timeline"
          >
            <History className="w-3.5 h-3.5 text-[#111111]" />
            <span className="hidden xs:inline">Archive</span>
            {interactions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#111111] text-white text-[10px] font-mono">
                {interactions.length}
              </span>
            )}
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            id="desktop-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EEEEEE] hover:bg-[#F5F5F5] text-[#666666] hover:text-[#111111] transition-colors cursor-pointer text-xs font-medium shrink-0"
            title={isSidebarOpen ? 'Collapse Archive Panel' : 'Open Archive Panel'}
          >
            <PanelLeft className="w-3.5 h-3.5" />
            <span>{isSidebarOpen ? 'Hide Archive' : 'Archive'}</span>
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <ChronicleLogo size={28} />
            <span className="text-sm sm:text-base font-semibold text-[#111111] tracking-tight shrink-0">
              Chronicle Ledger
            </span>
            <span className="text-[#CCCCCC] hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-medium text-[#666666] truncate max-w-[110px] sm:max-w-xs md:max-w-sm">
              {activeInteraction?.title || 'Untitled Chronicle'}
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-[#F0F0F0] text-[#666666] rounded uppercase tracking-wide font-medium hidden md:inline-block shrink-0">
              {isGenerating ? 'Thinking' : activeInteraction ? activeInteraction.mode : 'Ready'}
            </span>
          </div>
        </div>

        {/* User Identity & Top Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <button
            id="new-reflection-top-btn"
            onClick={() => {
              handleStartNewEntry();
              setIsMobileDrawerOpen(false);
            }}
            className="px-3 sm:px-4 py-1.5 bg-[#111111] hover:bg-black text-white text-xs font-medium rounded-full transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">New Entry</span>
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-[#EEEEEE]">
            <div className="w-7 h-7 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#666666]">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : 'JD'}
            </div>
            <button
              id="logout-btn"
              onClick={logOut}
              className="p-1.5 hover:bg-[#F5F5F5] rounded-md transition-colors text-[#999999] hover:text-[#111111] cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dynamic Grid Layout */}
      <div className="flex-1 w-full overflow-hidden p-2 sm:p-4 lg:p-6 bg-[#FAFAFA]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 w-full max-w-7xl mx-auto h-full min-h-0">
          {/* Left Desktop Sidebar: History & Archive Timeline (hidden lg:flex on desktop, toggleable drawer on mobile) */}
          <aside
            className={`${
              isSidebarOpen ? 'lg:col-span-4 xl:col-span-4 lg:flex' : 'hidden'
            } hidden flex-col bg-white rounded-2xl border border-[#EEEEEE] h-full overflow-hidden shadow-2xs`}
          >
            {renderArchiveTimelineContent(false)}
          </aside>

          {/* Right / Center Canvas: Active Reflection Workspace (Full width on mobile/stacked, col-span-8 or 12 on desktop) */}
          <main
            className={`${
              isSidebarOpen ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12'
            } col-span-1 w-full h-full flex flex-col bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden shadow-2xs relative`}
          >
            {/* Active Session Sub-Header & Controls */}
            <div className="px-3 sm:px-6 md:px-8 py-3 border-b border-[#F0F0F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white/90">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                      className="text-sm font-medium text-[#111111] border border-[#CCCCCC] rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#111111]"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveTitle}
                      className="text-xs bg-[#111111] text-white px-3 py-1 rounded-full hover:bg-black cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="text-xs text-[#666666] hover:text-[#111111] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group min-w-0">
                    <h2 className="text-sm sm:text-base font-medium text-[#111111] tracking-tight truncate">
                      {activeInteraction?.title || 'New Reflection Session'}
                    </h2>
                    <button
                      onClick={() => {
                        setTitleDraft(activeInteraction?.title || 'Untitled');
                        setIsEditingTitle(true);
                      }}
                      className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-[#999999] hover:text-[#111111] p-1 rounded transition-opacity cursor-pointer shrink-0"
                      title="Edit Title"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Selector & Action Buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                {/* Horizontal Swipe Tray Container for Reflection Mode Tags */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap pb-2 w-full sm:w-auto">
                  {(['reflection', 'brainstorm', 'summary', 'freeform', 'devlog'] as JournalMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`px-3 py-1.5 rounded-full transition-colors capitalize cursor-pointer text-xs flex items-center gap-1.5 shrink-0 ${
                        selectedMode === mode
                          ? mode === 'devlog'
                            ? 'bg-[#111111] text-white font-medium shadow-2xs'
                            : 'bg-white border border-[#CCCCCC] text-[#111111] font-medium shadow-2xs'
                          : 'bg-[#F5F5F5] text-[#666666] hover:text-[#111111]'
                      }`}
                    >
                      {mode === 'devlog' && <Code2 className="w-3.5 h-3.5 text-[#22D3EE]" />}
                      <span>{mode === 'devlog' ? 'DevLog' : mode}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 border-l border-[#EEEEEE] pl-2 shrink-0">
                  <button
                    onClick={handleCopyTranscript}
                    disabled={!activeInteraction || activeInteraction.turns.length === 0}
                    className="p-1.5 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                    title="Copy entire session"
                  >
                    {copiedId === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={handleExportMarkdown}
                    disabled={!activeInteraction || activeInteraction.turns.length === 0}
                    className="p-1.5 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#F5F5F5] text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer"
                    title="Download Markdown (.md)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Status & Error Escalation Banner */}
            {saveError && (
              <div className="px-4 sm:px-6 py-2.5 bg-[#FFF8F6] border-b border-[#F5C6CB] text-[#721C24] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D9534F] shrink-0" />
                  <span>{saveError}</span>
                </div>
                <button
                  onClick={handleRetrySave}
                  className="w-full sm:w-auto px-3 py-1 rounded-full bg-[#111111] text-white font-medium hover:bg-black transition-colors text-center cursor-pointer"
                >
                  Retry Save
                </button>
              </div>
            )}

            {/* Adaptive Conversation & Paper Writing Canvas Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 w-full">
              {/* AI Executive Summary & Key Takeaways Card (if present) */}
              {activeInteraction && (activeInteraction.summary || (activeInteraction.keyTakeaways && activeInteraction.keyTakeaways.length > 0)) && (
                <div className="p-4 sm:p-6 bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE] max-w-3xl mx-auto w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-[#BBBBBB] font-bold">
                      Gemini • Synthesis & Insights
                    </div>
                    <span className="text-[10px] text-[#AAAAAA] font-mono">
                      {activeInteraction.turns.find((t) => t.modelUsed)?.modelUsed || 'gemini-3.6-flash'}
                    </span>
                  </div>

                  {activeInteraction.summary && (
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-[#111111] italic">
                      &ldquo;{activeInteraction.summary}&rdquo;
                    </p>
                  )}

                  {activeInteraction.keyTakeaways && activeInteraction.keyTakeaways.length > 0 && (
                    <div className="pt-3 border-t border-[#EEEEEE]">
                      <div className="text-[10px] uppercase tracking-widest text-[#BBBBBB] font-semibold block mb-1.5">
                        Key Takeaways
                      </div>
                      <ul className="space-y-1">
                        {activeInteraction.keyTakeaways.map((item, idx) => (
                          <li key={idx} className="text-xs sm:text-sm text-[#444444] flex items-start gap-2">
                            <span className="text-[#111111] font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeInteraction.tags && activeInteraction.tags.length > 0 && (
                    <div className="pt-2 border-t border-[#EEEEEE] flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap pb-2">
                      <span className="text-[10px] text-[#BBBBBB] font-mono uppercase shrink-0">Tags:</span>
                      {activeInteraction.tags.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-[#E5E5E5] text-[#555555] font-mono shrink-0">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Conversation Feed */}
              {(!activeInteraction || activeInteraction.turns.length === 0) ? (
                <div className="max-w-3xl mx-auto py-8 sm:py-12 text-center space-y-4 w-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center mx-auto text-[#111111]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-medium tracking-tight text-[#111111]">
                    What is on your mind today?
                  </h3>
                  <p className="text-xs sm:text-sm text-[#666666] leading-relaxed max-w-md mx-auto">
                    Write freely. Gemini will reflect back, highlight deeper patterns, brainstorm solutions,
                    or converse with you. Saved strictly to your isolated Firestore account.
                  </p>

                  {/* Quick Starters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-6 text-left w-full">
                    {(selectedMode === 'devlog' ? DEVLOG_STARTERS : REFLECTION_STARTERS).map((promptText, i) => (
                      <button
                        key={i}
                        onClick={() => handleSubmitReflection(promptText)}
                        className="p-3.5 rounded-xl bg-white border border-[#EEEEEE] hover:border-[#111111] hover:text-[#111111] text-xs text-[#666666] transition-all cursor-pointer w-full text-left"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 sm:space-y-8 max-w-3xl mx-auto w-full">
                  {activeInteraction.turns.map((turn) => {
                    const isUser = turn.role === 'user';
                    return (
                      <div key={turn.id} className="flex flex-col space-y-1.5 w-full">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] uppercase tracking-widest text-[#BBBBBB] font-bold">
                            {isUser ? (user?.displayName ? `${user.displayName} • ${formatDate(turn.timestamp)}` : `You • ${formatDate(turn.timestamp)}`) : `Gemini • ${formatDate(turn.timestamp)}`}
                          </div>
                          <button
                            onClick={() => handleCopyTurn(turn.id, turn.text)}
                            className="text-[10px] text-[#BBBBBB] hover:text-[#111111] transition-colors"
                            title="Copy"
                          >
                            {copiedId === turn.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>

                        {isUser ? (
                          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-[#444444] whitespace-pre-wrap">
                            {turn.text}
                          </p>
                        ) : (
                          <div className="p-4 sm:p-6 bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE] space-y-4 w-full">
                            {turn.dualResponse?.linkedin_optimized_post ? (
                              <div className="space-y-3">
                                {/* Control Element Scaling: flex-row stretching on mobile, compact on desktop */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#EEEEEE]">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
                                    <Share2 className="w-3.5 h-3.5 text-[#0A66C2]" />
                                    <span>LinkedIn Optimized Update</span>
                                  </div>
                                  <button
                                    onClick={() => handleCopyTurn(turn.id, turn.dualResponse!.linkedin_optimized_post!)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl sm:rounded-full bg-[#111111] text-white hover:bg-black font-medium text-xs transition-colors cursor-pointer shadow-2xs active:scale-[0.99]"
                                  >
                                    {copiedId === turn.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedId === turn.id ? 'Copied' : 'Copy Post'}</span>
                                  </button>
                                </div>
                                <div className="prose prose-neutral prose-xs sm:prose-sm md:prose-base max-w-none text-[#111111] leading-relaxed whitespace-pre-wrap">
                                  {turn.dualResponse.linkedin_optimized_post}
                                </div>
                              </div>
                            ) : (
                              <div className="prose prose-neutral prose-xs sm:prose-sm md:prose-base max-w-none text-[#111111] leading-relaxed">
                                <Markdown>{turn.text}</Markdown>
                              </div>
                            )}

                            {/* Touch-Friendly Swipe Tray for Emotional Posture & Directive Pills */}
                            {turn.dualResponse && (turn.dualResponse.internal_tags || turn.dualResponse.data_storage_directive || turn.dualResponse.ai_thematic_analysis) && (
                              <div className="pt-3 border-t border-[#EEEEEE] flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap pb-2 text-[10px]">
                                {turn.dualResponse.data_storage_directive && (
                                  <span className="px-2.5 py-1 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#666666] font-mono shrink-0">
                                    {turn.dualResponse.data_storage_directive}
                                  </span>
                                )}
                                {turn.dualResponse.ai_thematic_analysis && (
                                  <>
                                    <span className="text-[#888888] font-medium shrink-0">Mindset:</span>
                                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0E0E0] text-[#111111] font-medium shrink-0">
                                      {turn.dualResponse.ai_thematic_analysis.dominant_mindset}
                                    </span>
                                    <span className="text-[#888888] font-medium shrink-0">Resonance:</span>
                                    <span className="px-2.5 py-1 rounded-full bg-white border border-[#E0E0E0] text-[#111111] capitalize font-medium shrink-0">
                                      {turn.dualResponse.ai_thematic_analysis.resonance_level}
                                    </span>
                                  </>
                                )}
                                {turn.dualResponse.internal_tags?.map((tag, idx) => (
                                  <span key={idx} className="px-2.5 py-1 rounded-full bg-white border border-[#E0E0E0] text-[#111111] font-mono shrink-0">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Action suggestions in horizontal scroll tray */}
                            <div className="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-none whitespace-nowrap pb-2">
                              <button
                                onClick={() => handleSubmitReflection('Deepen this reflection and explore root causes')}
                                className="text-[11px] border border-[#DDDDDD] px-3.5 py-1.5 rounded-full text-[#666666] hover:bg-white hover:text-[#111111] transition-colors cursor-pointer shrink-0"
                              >
                                Explore root causes
                              </button>
                              <button
                                onClick={() => handleSubmitReflection('What are concrete actions I can take today?')}
                                className="text-[11px] border border-[#DDDDDD] px-3.5 py-1.5 rounded-full text-[#666666] hover:bg-white hover:text-[#111111] transition-colors cursor-pointer shrink-0"
                              >
                                Action steps
                              </button>
                              <button
                                onClick={() => handleSubmitReflection('Help me reframe this thought constructively')}
                                className="text-[11px] border border-[#DDDDDD] px-3.5 py-1.5 rounded-full text-[#666666] hover:bg-white hover:text-[#111111] transition-colors cursor-pointer shrink-0"
                              >
                                Reframe constructively
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* In-Flight Gemini Generation Indicator */}
              {isGenerating && (
                <div className="space-y-1.5 max-w-3xl mx-auto w-full">
                  <div className="text-[10px] uppercase tracking-widest text-[#BBBBBB] font-bold">
                    Chronicle Ledger • Just now
                  </div>
                  <div className="p-4 sm:p-6 bg-[#F9F9F9] rounded-2xl border border-[#EEEEEE] flex items-center gap-3 text-xs text-[#666666]">
                    <RotateCw className="w-4 h-4 animate-spin text-[#111111] shrink-0" />
                    <span>Chronicle Ledger is synthesizing insights and framing your response...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Adaptive Composer Footer with Fluid Variable Layout Padding */}
            <footer className="p-4 sm:p-6 md:p-8 bg-white border-t border-[#F0F0F0] shrink-0 w-full">
              <div className="w-full max-w-3xl mx-auto space-y-3">
                <div className="relative w-full">
                  <textarea
                    id="journal-prompt-textarea"
                    ref={textareaRef}
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey || e.key === 'Enter') && !e.shiftKey && e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitReflection();
                      }
                    }}
                    placeholder={
                      selectedMode === 'devlog'
                        ? 'Drop raw coding updates, sprint logs, deployments, or bug fixes to craft a LinkedIn post...'
                        : selectedMode === 'reflection'
                        ? 'Reflect further...'
                        : selectedMode === 'summary'
                        ? 'Paste or write notes to summarize...'
                        : selectedMode === 'brainstorm'
                        ? 'Describe a challenge to brainstorm solutions...'
                        : 'Ask a question or write freeform thoughts...'
                    }
                    rows={3}
                    disabled={isGenerating}
                    className="w-full p-3.5 sm:p-4 bg-[#F5F5F5] border border-transparent focus:border-[#111111] rounded-2xl text-xs sm:text-sm focus:bg-white transition-all placeholder-[#AAAAAA] text-[#111111] resize-none focus:outline-none"
                  />
                </div>

                {/* Scalable Controls: Flex-row stretching on mobile for thumb taps, compact on desktop */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center justify-between sm:justify-start gap-2 text-[10px] text-[#888888] font-mono order-2 sm:order-1">
                    <span className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                      <span className="truncate">Isolated: /users/{user?.uid.slice(0, 8)}...</span>
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="capitalize hidden sm:inline">Mode: {selectedMode}</span>
                  </div>

                  <button
                    id="reflect-submit-btn"
                    onClick={() => handleSubmitReflection()}
                    disabled={isGenerating || !inputPrompt.trim()}
                    className="w-full sm:w-auto order-1 sm:order-2 inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-[#111111] hover:bg-black text-white font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {isGenerating ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin text-white" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                        <span>{selectedMode === 'devlog' ? 'Generate DevLog with Gemini' : 'Reflect with Gemini'}</span>
                        <Send className="w-3.5 h-3.5 opacity-70 ml-0.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Mobile Slide-Out Drawer Dashboard (Active on screen widths below 1024px) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Slide-In Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#EEEEEE] shrink-0">
              <div className="flex items-center gap-2.5">
                <ChronicleLogo size={24} />
                <span className="font-semibold text-sm text-[#111111]">History & Archive Timeline</span>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#666666] hover:text-[#111111] transition-colors cursor-pointer"
                title="Close Timeline Drawer"
                aria-label="Close Timeline Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {renderArchiveTimelineContent(true)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
