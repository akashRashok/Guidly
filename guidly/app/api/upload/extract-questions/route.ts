import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateQuestionsFromText } from "@/lib/ai";
import mammoth from "mammoth";

/**
 * POST /api/upload/extract-questions
 * 
 * Upload a document and extract questions using AI
 */
export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const topic = formData.get("topic") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!topic) {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Unsupported file type. Please upload PDF, TXT, or DOCX files" },
                { status: 400 }
            );
        }

        // Extract text from file
        let extractedText = "";

        if (file.type === "application/pdf") {
            try {
                // Polyfill DOMMatrix for pdf-parse (required in newer Node versions)
                if (!global.DOMMatrix) {
                    // Minimal polyfill sufficient for pdf.js text extraction
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    global.DOMMatrix = class {
                        m: number[];
                        constructor() { this.m = [1, 0, 0, 1, 0, 0]; }
                        multiply() { return this; }
                        translate() { return this; }
                        scale() { return this; }
                        rotate() { return this; }
                        transformPoint(p: any) { return p; }
                    } as any;
                }

                // Extract from PDF - use dynamic require
                const pdfParseModule = require("pdf-parse");
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const data = await pdfParseModule(buffer);
                extractedText = data.text;
            } catch (pdfError) {
                console.error("PDF extraction error:", pdfError);
                return NextResponse.json(
                    { error: "Failed to extract text from PDF. Please try a TXT or DOCX file instead." },
                    { status: 400 }
                );
            }
        } else if (file.type === "text/plain") {
            // Extract from TXT
            extractedText = await file.text();
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            // Extract from DOCX
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
        }

        // Clean up text
        extractedText = extractedText.trim();

        if (!extractedText || extractedText.length < 50) {
            return NextResponse.json(
                { error: "Could not extract enough text from the document. Please ensure the document contains readable text." },
                { status: 400 }
            );
        }

        // Generate questions using AI
        const questions = await generateQuestionsFromText(extractedText, topic, 5);

        if (questions.length === 0) {
            return NextResponse.json(
                { error: "Could not generate questions from the document. Please try a different document or add questions manually." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            questions,
            extractedTextLength: extractedText.length,
        });
    } catch (error) {
        console.error("Error extracting questions from document:", error);
        return NextResponse.json(
            { error: "Failed to process document. Please try again." },
            { status: 500 }
        );
    }
}
