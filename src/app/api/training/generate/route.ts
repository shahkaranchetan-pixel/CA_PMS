import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"

// --- AI GENERATION TEMPLATES ---
// These serve as high-quality fallbacks for common CA topics.
const SMART_TEMPLATES: Record<string, any> = {
    'Excel': {
        'Pivot Tables': {
            description: 'Master data analysis using Pivot Tables in Excel.',
            materials: [
                { title: 'Intro to Pivot Tables', type: 'TEXT', content: 'A Pivot Table is a powerful tool to calculate, summarize, and analyze data that lets you see comparisons, patterns, and trends in your data.' },
                { title: 'Creating your first Pivot Table', type: 'TEXT', content: '1. Select the cells you want. 2. Select Insert > PivotTable. 3. Under Choose the data that you want to analyze, select Select a table or range.' },
                { title: 'Excel Official Tutorial', type: 'LINK', content: 'https://support.microsoft.com/en-us/office/create-a-pivottable-to-analyze-worksheet-data-a9a84538-bfe9-40a9-a8e9-f99134456576' },
                {
                    title: 'Pivot Table Quiz', type: 'QUIZ', content: JSON.stringify([
                        { q: "What is the primary purpose of a Pivot Table?", opts: ["Data Entry", "Data Analysis & Summarization", "Formatting Cells", "Creating Charts"], ans: 1, expl: "Pivot Tables are primarily used to summarize and analyze large datasets." },
                        { q: "Where do you find the PivotTable option in Excel?", opts: ["Home Tab", "Formulas Tab", "Insert Tab", "Data Tab"], ans: 2, expl: "PivotTable is located under the Insert tab." }
                    ])
                }
            ]
        },
        'Basic Formulas': {
            description: 'Essential Excel formulas every CA staff should know.',
            materials: [
                { title: 'SUM, AVERAGE, COUNT', type: 'TEXT', content: 'Basic arithmetic operations are the foundation of any spreadsheet work.' },
                { title: 'VLOOKUP and XLOOKUP', type: 'TEXT', content: 'Use VLOOKUP when you need to find things in a table or a range by row.' }
            ]
        }
    },
    'GST': {
        'GSTR-1 Filing': {
            description: 'Step-by-step guide to filing GSTR-1 for clients.',
            materials: [
                { title: 'What is GSTR-1?', type: 'TEXT', content: 'GSTR-1 is a monthly or quarterly return that should be filed by every registered GST taxpayer. It contains details of all outward supplies (sales).' },
                { title: 'Dashboard Navigation', type: 'TEXT', content: 'Login to GST Portal > Services > Returns > Return Dashboard.' },
                { title: 'Official GST Help', type: 'LINK', content: 'https://tutorial.gst.gov.in/userguide/returns/index.htm#t=Manual_GSTR1.htm' }
            ]
        },
        'GSTR-3B Filing': {
            description: 'Advanced guide for monthly GST summary filing.',
            materials: [
                { title: 'Tax Payment & Offset', type: 'TEXT', content: 'Offsets occur against Cash and Input Tax Credit ledgers.' },
                { title: 'ITC Reversal Guide', type: 'TEXT', content: 'Understanding Section 17(5) and Rule 42/43 reversals.' }
            ]
        },
        'GST Rates & Slabs': {
            description: 'Current GST tax structures in India.',
            materials: [
                { title: 'Standard Rates', type: 'TEXT', content: 'Goods and services are divided into five different tax slabs: 0%, 5%, 12%, 18%, and 28%.' }
            ]
        }
    },
    'Tally': {
        'Company Creation': {
            description: 'Introduction to setting up a new business in Tally Prime.',
            materials: [
                { title: 'Initial Setup', type: 'TEXT', content: 'Go to Alt+K (Company) > Create. Enter Name, State, and Financial Year.' }
            ]
        }
    },
    'Income Tax': {
        'Residential Status': {
            description: 'Understanding Resident vs Non-Resident status for tax assessment.',
            materials: [
                { title: 'The 182-Day Rule', type: 'TEXT', content: 'An individual is a resident if they stay in India for 182 days or more during the financial year.' }
            ]
        },
        'TDS Basics': {
            description: 'Introduction to Tax Deducted at Source for CA staff.',
            materials: [
                { title: 'Section 194C', type: 'TEXT', content: 'Payments to contractors and sub-contractors.' },
                { title: 'Due Dates', type: 'TEXT', content: 'Payment is due by the 7th of the following month.' },
                {
                    title: 'TDS Basics Quiz', type: 'QUIZ', content: JSON.stringify([
                        { q: "What is the due date for TDS payment for the month of August?", opts: ["7th September", "15th September", "30th September", "7th October"], ans: 0, expl: "Monthly TDS payments are due by the 7th of the following month." },
                        { q: "Under which section is TDS on Contractor payments deducted?", opts: ["194J", "194I", "194C", "192"], ans: 2, expl: "Section 194C covers TDS on payments to contractors." }
                    ])
                }
            ]
        }
    },
    'MCA': {
        'Company Incorporation': {
            description: 'Step-by-step process of incorporating a Pvt Ltd Company.',
            materials: [
                { title: 'RUN & SPICe+', type: 'TEXT', content: 'Reservation of Unique Name (RUN) and SPICe+ (Simplified Proforma for Incorporating Company Electronically Plus).' },
                { title: 'Required Documents', type: 'TEXT', content: 'MOA, AOA, PAN/Aadhaar of directors, and proof of registered office.' },
                { title: 'Portal Link', type: 'LINK', content: 'https://www.mca.gov.in/' }
            ]
        },
        'Annual Filings (MGT-7 & AOC-4)': {
            description: 'Handling annual compliance for companies.',
            materials: [
                { title: 'AOC-4 (Financials)', type: 'TEXT', content: 'Due within 30 days of AGM.' },
                { title: 'MGT-7 (Annual Return)', type: 'TEXT', content: 'Due within 60 days of AGM.' }
            ]
        }
    },
    'PF_ESI': {
        'Monthly ECR Filing': {
            description: 'Process of filing PF monthly returns.',
            materials: [
                { title: 'Portal Navigation', type: 'TEXT', content: 'Login to Unified Portal > Establishment > ECR/Returns.' },
                { title: 'Payment Timeline', type: 'TEXT', content: 'PF contribution must be paid by the 15th of the following month.' }
            ]
        }
    },
    'Accounting': {
        'Bank Reconciliation': {
            description: 'Matching book balances with bank statements.',
            materials: [
                { title: 'Identifying Deffered Items', type: 'TEXT', content: 'Checks issued but not presented, interest not recorded, etc.' },
                {
                    title: 'BRS Quiz', type: 'QUIZ', content: JSON.stringify([
                        { q: "If a check is issued but not yet presented for payment, what should be done to the bank balance as per cash book?", opts: ["Add", "Subtract", "Ignore", "None of the above"], ans: 1, expl: "A check issued reduces the cash book balance immediately, but hasn't affected the bank yet." }
                    ])
                }
            ]
        },
        'Golden Rules': {
            description: 'Foundational principles of double-entry bookkeeping.',
            materials: [
                { title: 'Real, Personal, Nominal', type: 'TEXT', content: 'Debit what comes in, Credit what goes out. Debit the receiver, Credit the giver. Debit all expenses, Credit all incomes.' }
            ]
        }
    }
}

// --- Robust JSON parser that handles truncated AI responses ---
function safeParseJSON(text: string): any {
    // Clean up markdown fences
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    // Try direct parse first
    try {
        return JSON.parse(text);
    } catch (e) {
        // Truncated response — try to repair
    }

    // Try to close unterminated strings and brackets
    let repaired = text;
    
    // Count open/close brackets
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;

    // Check if we're inside an unterminated string
    let inString = false;
    let escaped = false;
    for (let i = 0; i < repaired.length; i++) {
        const c = repaired[i];
        if (escaped) { escaped = false; continue; }
        if (c === '\\') { escaped = true; continue; }
        if (c === '"') { inString = !inString; }
    }
    
    // Close unterminated string
    if (inString) {
        repaired += '"';
    }

    // Close arrays and objects
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

    try {
        return JSON.parse(repaired);
    } catch (e) {
        // Still failed — try to extract just the materials we can get
    }

    // Last resort: try to find the description and at least some materials
    try {
        const descMatch = text.match(/"description"\s*:\s*"([^"]+)"/);
        const description = descMatch ? descMatch[1] : "AI-generated training module";

        // Extract complete material objects using a greedy approach
        const materials: any[] = [];
        const matRegex = /\{\s*"title"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"(TEXT|LINK|QUIZ)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
        let match;
        while ((match = matRegex.exec(text)) !== null) {
            materials.push({
                title: match[1],
                type: match[2],
                content: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n')
            });
        }

        if (materials.length > 0) {
            return { description, materials };
        }
    } catch (e) {
        // Completely failed
    }

    throw new Error("Could not parse AI response as valid JSON");
}

// --- GEMINI AI INTEGRATION ---
async function callGeminiAPI(topic: string, category: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("Missing Gemini API Key. Add GEMINI_API_KEY to Vercel Environment Variables.");
    }

    const prompt = `You are an expert Indian Chartered Accountant trainer.
Create a training module for CA staff on: "${topic}" (Category: "${category}").

RULES:
- Do NOT write boring walls of text. Be intensely practical and relatable.
- Include a specific, realistic "Client Case Study" (e.g. Client X bought Y, how to enter?).
- Provide an accounting entry example formatted as a Markdown table (Debit/Credit).
- Highlight common mistakes using GitHub alerts (e.g., '> [!WARNING] Penalty risk...').
- Break down the content into 6 smaller "bitesize" materials: 5 TEXT lessons + 1 QUIZ.
- Keep each lesson under 250 words but dense with practical value.
- Include interactive "Reveal" sections using HTML <details> and <summary> tags for "Try it yourself" before showing the answer.

Return ONLY this JSON (no markdown fences, no explanation):
{
  "description": "Brief practical outcome of this module",
  "materials": [
    { "title": "Theory & Compliance", "type": "TEXT", "content": "Rules with section numbers..." },
    { "title": "Practical Case Study", "type": "TEXT", "content": "Scenario with a markdown table... <details><summary>Try it</summary>Answer</details>" },
    { "title": "Common Pitfalls", "type": "TEXT", "content": "> [!WARNING] ...\\\\n> [!NOTE] ..." },
    { "title": "Quiz", "type": "QUIZ", "content": "[{\\"q\\":\\"Question?\\",\\"opts\\":[\\"A\\",\\"B\\",\\"C\\",\\"D\\"],\\"ans\\":0,\\"expl\\":\\"Why\\"}]" }
  ]
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.7,
            }
        })
    });

    if (!response.ok) {
        const errBody = await response.text();
        console.error("[Gemini] API Error:", response.status, errBody);
        throw new Error(`Gemini API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        throw new Error("Gemini returned empty response");
    }
    return safeParseJSON(text);
}

// --- CLAUDE AI INTEGRATION ---
async function callClaudeAPI(topic: string, category: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Anthropic API Key. Add ANTHROPIC_API_KEY to Vercel Environment Variables.");
    }

    const prompt = `You are an expert Indian Chartered Accountant trainer.
Create a training module for CA staff on: "${topic}" (Category: "${category}").

RULES:
- Do NOT write boring walls of text. Be intensely practical and relatable.
- Include a specific, realistic "Client Case Study" (e.g. Client X bought Y, how to enter?).
- Provide an accounting entry example formatted as a Markdown table (Debit/Credit).
- Highlight common mistakes using GitHub alerts (e.g., '> [!WARNING] Penalty risk...').
- Break down the content into 6 smaller "bitesize" materials: 5 TEXT lessons + 1 QUIZ.
- The QUIZ must have exactly 3 multiple-choice questions.
- For QUIZ type, "content" must be a JSON string of an array.
- Include interactive "Reveal" sections using HTML <details> and <summary> tags.

Return ONLY this JSON object (no markdown fences, no explanation, no preamble):
{
  "description": "Brief practical outcome of this module",
  "materials": [
    { "title": "Theory & Compliance", "type": "TEXT", "content": "Rules with section numbers..." },
    { "title": "Practical Case Study", "type": "TEXT", "content": "Scenario with a markdown table... <details><summary>Try it</summary>Answer</details>" },
    { "title": "Common Pitfalls", "type": "TEXT", "content": "> [!WARNING] ...\\\\n> [!NOTE] ..." },
    { "title": "Assessment Quiz", "type": "QUIZ", "content": "[{\\"q\\":\\"Question text\\",\\"opts\\":[\\"A\\",\\"B\\",\\"C\\",\\"D\\"],\\"ans\\":0,\\"expl\\":\\"Explanation\\"}]" }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "claude-haiku-4-5",
            max_tokens: 4096,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error("[Claude] API Error:", response.status, error);
        throw new Error(error?.error?.message || `Claude API returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
        throw new Error("Claude returned empty response");
    }

    // Check if the response was truncated (stop_reason !== "end_turn")
    if (data.stop_reason && data.stop_reason !== "end_turn") {
        console.warn("[Claude] Response truncated, stop_reason:", data.stop_reason);
    }

    return safeParseJSON(text);
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Rate limit: 3 training generations per minute per user
        const userId = (session?.user as any)?.id || 'anonymous';
        const { allowed } = checkRateLimit(`training-gen-${userId}`, 3, 60000);
        if (!allowed) {
            return NextResponse.json({ error: "Rate limit exceeded. Please wait before generating more modules." }, { status: 429 });
        }

        const body = await req.json()
        const { category, topic } = body

        if (!category || !topic) {
            return NextResponse.json({ error: "Category and Topic are required" }, { status: 400 })
        }

        let moduleData;

        // STRATEGY: Try smart templates first, then Claude (fast Haiku), then Gemini
        // 1. Check if we have a pre-built template
        const templateMatch = SMART_TEMPLATES[category]?.[topic];
        if (templateMatch) {
            console.log(`[AI] Using smart template for: ${category}/${topic}`);
            moduleData = templateMatch;
        } else {
            // 2. Try Claude Haiku (fastest, cheapest, least likely to truncate)
            let claudeError = "";
            let geminiError = "";

            try {
                console.log(`[AI] Attempting Claude Haiku for: ${topic}`);
                moduleData = await callClaudeAPI(topic, category);
            } catch (err: any) {
                claudeError = err.message;
                console.warn("[AI] Claude failed:", claudeError);

                // 3. Fallback to Gemini
                try {
                    console.log(`[AI] Attempting Gemini for: ${topic}`);
                    moduleData = await callGeminiAPI(topic, category);
                } catch (gErr: any) {
                    geminiError = gErr.message;
                    console.error("[AI] Both AI providers failed.");
                    return NextResponse.json({
                        error: `AI Generation Failed.\nClaude: ${claudeError}\nGemini: ${geminiError}\n\nPlease check your API keys in Vercel Environment Variables.`
                    }, { status: 500 });
                }
            }
        }

        // Validate moduleData structure before saving
        if (!moduleData || !moduleData.materials || !Array.isArray(moduleData.materials) || moduleData.materials.length === 0) {
            return NextResponse.json({
                error: "AI generated an invalid module structure. Please try again."
            }, { status: 500 });
        }

        const newModule = await prisma.trainingModule.create({
            data: {
                title: topic,
                description: moduleData.description || `Training module on ${topic}`,
                category: category,
                materials: {
                    create: moduleData.materials.map((m: any, i: number) => ({
                        title: m.title || `Material ${i + 1}`,
                        type: m.type || 'TEXT',
                        content: m.content || '',
                        order: i
                    }))
                }
            },
            include: { materials: true }
        })

        return NextResponse.json(newModule)
    } catch (error) {
        console.error("[CRITICAL] Generation Error:", error)
        return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 500 })
    }
}
