import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options";
import { NextResponse } from "next/server"

// --- AI GENERATION TEMPLATES ---
// These serve as high-quality fallbacks for common CA topics.
// In a production app, you would swap this logic for a call to Gemini or OpenAI API.
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

// --- GEMINI AI INTEGRATION ---
async function callGeminiAPI(topic: string, category: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
        throw new Error("Missing Gemini API Key");
    }

    const prompt = `
    You are an expert Indian Chartered Accountant and corporate trainer with 25+ years of experience.
    Create a COMPREHENSIVE and EXHAUSTIVE training module for: "${topic}" (Category: "${category}").
    
    The content must be specifically tailored for junior staff in an Indian CA firm, but it must be DEEP and THOROUGH. 
    
    EACH TEXT LESSON MUST:
    1. Be at least 600-800 words long. 
    2. Contain structured headings, sub-headings, and bullet points.
    3. Include CURRENT Financial Year (FY 2024-25) compliance, data, and edge cases.
    4. Reference exact SECTIONS and RULES of relevant acts (Income Tax, GST, Companies Act, etc.).
    5. Provide real-world case studies or numeric examples (e.g. calculation of interest, late fees, or tax liability).
    6. List "Pro-Tips" and "Common Audit Objections" related to this topic.

    The module MUST include exactly 3 distinct materials:
    - Lesson 1 (Title: In-depth Theory & Compliance)
    - Lesson 2 (Title: Practical Application & Filing Steps)
    - Quiz (5 scenario-based tough questions)

    Return the response as a valid JSON object:
    {
      "description": "Deep dive overview of ${topic}",
      "materials": [
        { "title": "...", "type": "TEXT", "content": "..." },
        { "title": "...", "type": "TEXT", "content": "..." },
        { "title": "...", "type": "QUIZ", "content": "[...]" }
      ]
    }

    Return ONLY the JSON. No markdown blocks.
    `;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!response.ok) {
        throw new Error("Gemini API call failed");
    }

    const data = await response.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
}

// --- CLAUDE AI INTEGRATION ---
async function callClaudeAPI(topic: string, category: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("Missing Anthropic API Key");
    }

    const prompt = `
    You are an elite Indian Chartered Accountant and corporate trainer.
    Generate a comprehensive training module for junior CA staff on: "${topic}" (Category: "${category}").
    
    REQUIREMENTS:
    - Use latest Indian Tax/Corporate laws (FY 2024-25).
    - Include specific Section numbers (e.g., Sec 194Q).
    - Provide 2 detailed TEXT lessons with structured markdown.
    - Provide 1 QUIZ with 5 high-quality, scenario-based multiple-choice questions.

    FORMAT:
    Return a valid JSON object with this exact keys: "description", "materials". 
    Each material needs "title", "type" (TEXT, LINK, or QUIZ), and "content".
    For QUIZ type, "content" should be a JSON-stringified array of {q, opts, ans, expl}.
    
    IMPORTANT: Provide ONLY the raw JSON object. No preamble, no explanation.
    `;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 8000,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error?.message || "Claude API call failed");
    }

    const data = await response.json();
    let text = data.content[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userRole = (session?.user as any)?.role

        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const body = await req.json()
        const { category, topic } = body

        if (!category || !topic) {
            return NextResponse.json({ error: "Category and Topic are required" }, { status: 400 })
        }

        let moduleData;

        // TIERED LOADING LOGIC: Claude (Best) -> Gemini (Fast)
        try {
            console.log(`[AI] Attempting Claude generation: ${topic}`);
            moduleData = await callClaudeAPI(topic, category);
        } catch (claudeError: any) {
            console.warn("[AI] Claude failed, falling back to Gemini:", claudeError.message);
            try {
                moduleData = await callGeminiAPI(topic, category);
            } catch (geminiError: any) {
                console.error("[AI] Both AI providers failed:", geminiError.message);
                return NextResponse.json({ 
                    error: `AI Generation Failed.\nClaude Error: ${claudeError.message}\nGemini Error: ${geminiError.message}.\nPlease check your Vercel Environment Variables.` 
                }, { status: 500 });
            }
        }

        const newModule = await prisma.trainingModule.create({
            data: {
                title: topic,
                description: moduleData.description,
                category: category,
                materials: {
                    create: moduleData.materials.map((m: any, i: number) => ({
                        ...m,
                        order: i
                    }))
                }
            },
            include: { materials: true }
        })

        return NextResponse.json(newModule)
    } catch (error) {
        console.error("[CRITICAL] Generation Error:", error)
        return NextResponse.json({ error: "Generation failed" }, { status: 500 })
    }
}
