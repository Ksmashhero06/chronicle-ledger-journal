import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithFallback, Type } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    // 1. Defensive payload ingestion
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const safeBody = body && typeof body === 'object' ? body : {};
    const prompt = typeof safeBody.prompt === 'string' ? safeBody.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const mode = typeof safeBody.mode === 'string' ? safeBody.mode.toLowerCase() : 'reflection';
    const rawHistory = Array.isArray(safeBody.history) ? safeBody.history : [];
    
    // Sanitize history turns
    const history = rawHistory
      .filter((turn: any) => turn && typeof turn.text === 'string' && (turn.role === 'user' || turn.role === 'model'))
      .map((turn: any) => ({
        role: turn.role === 'model' ? 'model' : 'user',
        parts: [{ text: turn.text.trim() }],
      }));

    // Add current prompt
    const contents = [
      ...history,
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];

    // Map mode to official active name
    let activeModeName = 'Reflection';
    if (mode === 'brainstorm') activeModeName = 'Brainstorm';
    else if (mode === 'summary') activeModeName = 'Summary';
    else if (mode === 'dialogue' || mode === 'freeform') activeModeName = 'Freeform';
    else if (mode === 'devlog') activeModeName = 'DevLog';

    const isDevLog = activeModeName === 'DevLog';

    const systemInstruction = `You are the AI core for Chronicle Ledger. Your job is to process user thoughts based on their chosen mode (Reflection, Brainstorm, Summary, Freeform, or DevLog). This application stores data directly into each individual user's personal Google Account via the Google Drive AppData Folder API. It runs entirely on local/client-side logic and standard API call structures with zero cloud billing requirements.

🎭 Instructions by Mode:
For Reflection, Brainstorm, Summary, Freeform: Act as a Socratic journaling coach. Provide an insightful response in Markdown. Put this response in the socratic_response_markdown field and leave linkedin_optimized_post as null.
For DevLog: Act as a technical copywriter. Turn raw engineering logs into a polished LinkedIn post featuring a catch hook, clean bullets, and the mandatory tags #AccelerateAIwithCloudRun and #BuildInPublic. Put this text in the linkedin_optimized_post field and leave socratic_response_markdown as null.

📊 Strict Output Format Constraint:
You must output your entire response in the following valid JSON schema format. Do not use code blocks, markdown backticks, or text before/after the JSON:
{
  "original_log_summary": "A short summary of the user's input.",
  "reflection_mode_active": "${activeModeName}",
  "socratic_response_markdown": "Your response text formatted in clean Markdown (or null if DevLog).",
  "linkedin_optimized_post": "Your copywritten LinkedIn post text (or null if not DevLog).",
  "data_storage_directive": "WRITE_TARGET: drive.files.create({ parents: [appDataFolder] })",
  "internal_tags": ["3-4 lowercase tags related to the topic"]
}

Currently active mode context: [${activeModeName}].
Ensure "reflection_mode_active" is set exactly to "${activeModeName}".`;

    // Attempt structured JSON output adhering strictly to the user schema
    try {
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          original_log_summary: {
            type: Type.STRING,
            description: "A short summary of the user's input.",
          },
          reflection_mode_active: {
            type: Type.STRING,
            description: "The mode selected by the user (Reflection, Brainstorm, Summary, Freeform, or DevLog).",
          },
          socratic_response_markdown: {
            type: Type.STRING,
            description: "Your response text formatted in clean Markdown (or null if DevLog).",
          },
          linkedin_optimized_post: {
            type: Type.STRING,
            description: "Your copywritten LinkedIn post text (or null if not DevLog).",
          },
          data_storage_directive: {
            type: Type.STRING,
            description: "Must be: WRITE_TARGET: drive.files.create({ parents: [appDataFolder] })",
          },
          internal_tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 lowercase tags related to the topic",
          },
        },
        required: [
          'original_log_summary',
          'reflection_mode_active',
          'data_storage_directive',
          'internal_tags',
        ],
      };

      const result = await generateContentWithFallback({
        contents,
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        preferredModel: 'gemini-3.6-flash',
        temperature: 0.7,
      });

      const parsed = JSON.parse(result.text);

      // Clean up fields per mode rules
      if (isDevLog) {
        parsed.socratic_response_markdown = null;
        if (!parsed.linkedin_optimized_post) {
          parsed.linkedin_optimized_post = parsed.original_log_summary;
        }
      } else {
        parsed.linkedin_optimized_post = null;
        if (!parsed.socratic_response_markdown) {
          parsed.socratic_response_markdown = parsed.original_log_summary;
        }
      }

      parsed.data_storage_directive = parsed.data_storage_directive || 'WRITE_TARGET: drive.files.create({ parents: [appDataFolder] })';
      parsed.internal_tags = parsed.internal_tags && parsed.internal_tags.length > 0
        ? parsed.internal_tags
        : [activeModeName.toLowerCase(), 'chronicle', 'reflection'];
      parsed.internal_firestore_tags = parsed.internal_tags;

      const mainText = isDevLog
        ? (parsed.linkedin_optimized_post || '')
        : (parsed.socratic_response_markdown || '');

      return NextResponse.json({
        reply: mainText,
        summary: parsed.original_log_summary || '',
        keyTakeaways: parsed.internal_tags || [],
        suggestedTitle: parsed.original_log_summary
          ? parsed.original_log_summary.slice(0, 35)
          : prompt.slice(0, 30),
        dualResponse: parsed,
        modelUsed: result.modelUsed,
      });
    } catch (schemaErr: any) {
      console.warn('Structured output failed, falling back to raw prompt generation:', schemaErr);

      // Fallback generation
      const result = await generateContentWithFallback({
        contents,
        systemInstruction: `${systemInstruction}\nOutput strictly valid JSON matching the schema specified above with no markdown code blocks.`,
        preferredModel: 'gemini-3.6-flash',
        temperature: 0.7,
      });

      let parsed: any = null;
      try {
        const cleanedText = result.text.replace(/```json\s*|```/g, '').trim();
        parsed = JSON.parse(cleanedText);
      } catch {
        parsed = {
          original_log_summary: prompt.slice(0, 100),
          reflection_mode_active: activeModeName,
          socratic_response_markdown: isDevLog ? null : result.text,
          linkedin_optimized_post: isDevLog ? result.text : null,
          data_storage_directive: 'WRITE_TARGET: drive.files.create({ parents: [appDataFolder] })',
          internal_tags: [activeModeName.toLowerCase(), 'chronicle', 'reflection'],
          internal_firestore_tags: [activeModeName.toLowerCase(), 'chronicle', 'reflection'],
        };
      }

      parsed.data_storage_directive = parsed.data_storage_directive || 'WRITE_TARGET: drive.files.create({ parents: [appDataFolder] })';
      parsed.internal_tags = parsed.internal_tags || [activeModeName.toLowerCase(), 'chronicle', 'reflection'];
      parsed.internal_firestore_tags = parsed.internal_tags;

      const mainText = isDevLog
        ? (parsed.linkedin_optimized_post || result.text)
        : (parsed.socratic_response_markdown || result.text);

      return NextResponse.json({
        reply: mainText,
        summary: parsed.original_log_summary || 'Journal reflection recorded.',
        keyTakeaways: parsed.internal_tags || [],
        suggestedTitle: prompt.slice(0, 30),
        dualResponse: parsed,
        modelUsed: result.modelUsed,
      });
    }
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    const message = error?.message || 'An unexpected error occurred during reflection generation.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
