import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/questions - Fetch questions by category and difficulty
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const difficulty = searchParams.get("difficulty");
        const count = parseInt(searchParams.get("count") || "1");

        const where: { category?: string; difficulty?: string } = {};
        if (category) where.category = category;
        if (difficulty) where.difficulty = difficulty;

        // Get random questions matching criteria
        const questions = await prisma.question.findMany({
            where,
        });

        // Shuffle and take requested count
        const shuffled = questions.sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));

        // Return questions without revealing correct answer
        const sanitized = selected.map((q) => ({
            id: q.id,
            category: q.category,
            question: q.question,
            options: JSON.parse(q.options),
            difficulty: q.difficulty,
        }));

        return NextResponse.json({ questions: sanitized });
    } catch (error) {
        console.error("Get questions error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
