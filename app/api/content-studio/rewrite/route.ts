import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback } from '@/lib/gemini';

export interface RewriteRequest {
  selectedText: string;
  fullContext?: string;
  action: 'improve' | 'shorten' | 'expand' | 'grammar' | 'clearer' | 'technical' | 'rewrite' | 'translate';
  targetLanguage?: string;
}

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const selectedText = typeof body?.selectedText === 'string' ? body.selectedText.trim() : '';
    const fullContext = typeof body?.fullContext === 'string' ? body.fullContext.trim() : '';
    const action = body?.action || 'improve';
    const targetLanguage = body?.targetLanguage || 'Spanish';

    if (!selectedText) {
      return NextResponse.json({ error: 'selectedText is required.' }, { status: 400 });
    }

    const actionPrompts: Record<string, string> = {
      improve: 'Improve the clarity, impact, and flow of the selected text while keeping its core message intact.',
      shorten: 'Condense the selected text to be concise and punchy without losing key facts.',
      expand: 'Elaborate on the selected text with relevant technical context, rationale, and descriptive depth.',
      grammar: 'Fix any grammatical, punctuation, capitalization, or syntactic errors in the selected text.',
      clearer: 'Rewrite the selected text to be simple, direct, and effortless to read.',
      technical: 'Elevate the vocabulary and engineering precision of the selected text with standard architectural terminology.',
      rewrite: 'Provide a fresh alternative phrasing for the selected text.',
      translate: `Translate the selected text accurately into ${targetLanguage}, preserving technical terms.`,
    };

    const instruction = actionPrompts[action] || actionPrompts.improve;

    // Check if Gemini API key is configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are a technical editor for Chronicle Ledger Content Studio.
Task: ${instruction}

Full document context (for reference only):
"""
${fullContext.slice(0, 1500)}
"""

Text to rewrite:
"""
${selectedText}
"""

Instructions:
Return ONLY the rewritten replacement text. Do NOT wrap in quotes, do NOT add conversational filler like "Here is your rewrite:", and do NOT change unaffected parts. Output plain rewritten text directly.`;

        const result = await generateContentWithFallback({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          temperature: 0.3,
        });

        const rewritten = result.text.trim().replace(/^["']|["']$/g, '');
        return NextResponse.json({
          rewrittenText: rewritten,
          action,
          modelUsed: result.modelUsed,
        });
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to local heuristic editor:', err?.message);
      }
    }

    // Heuristic Fallback (Runs offline or when API key is unconfigured)
    let fallbackText = selectedText;
    switch (action) {
      case 'shorten':
        fallbackText = selectedText
          .replace(/\b(in order to|as a means to)\b/gi, 'to')
          .replace(/\b(due to the fact that)\b/gi, 'because')
          .replace(/\b(at this point in time)\b/gi, 'now')
          .replace(/\b(utilize|utilizing)\b/gi, 'use')
          .replace(/\s+/g, ' ')
          .trim();
        break;
      case 'technical':
        fallbackText = selectedText
          .replace(/\b(worked on|built)\b/gi, 'architected')
          .replace(/\b(fixed|cleaned up)\b/gi, 'refactored and hardened')
          .replace(/\b(fast|quick)\b/gi, 'sub-millisecond deterministic')
          .replace(/\b(checked|tested)\b/gi, 'evaluated against formal verification AST');
        break;
      case 'clearer':
      case 'grammar':
      case 'improve':
      case 'rewrite':
        fallbackText = selectedText.charAt(0).toUpperCase() + selectedText.slice(1);
        if (!/[.!?]$/.test(fallbackText)) fallbackText += '.';
        break;
      case 'expand':
        fallbackText = `${selectedText} Specifically, this ensures verifiable provenance, reproducible execution bounds, and zero-loss payload serialization across all runtime steps.`;
        break;
      case 'translate':
        fallbackText = `[${targetLanguage}]: ${selectedText}`;
        break;
      default:
        fallbackText = selectedText;
    }

    return NextResponse.json({
      rewrittenText: fallbackText,
      action,
      modelUsed: 'heuristic-local-engine',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to rewrite selected text.' },
      { status: 500 }
    );
  }
}
