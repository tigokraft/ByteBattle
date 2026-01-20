import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/game/answer - Validate answer and award letter
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { roomCode, questionId, answerIndex, timeRemaining } = await request.json();

        if (!roomCode || !questionId || answerIndex === undefined) {
            return NextResponse.json(
                { error: "roomCode, questionId e answerIndex são obrigatórios" },
                { status: 400 }
            );
        }

        // Get question
        const question = await prisma.question.findUnique({
            where: { id: questionId },
        });

        if (!question) {
            return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
        }

        // Check if answer is correct
        const isCorrect = question.correctIndex === answerIndex;

        // Get player in room
        const player = await prisma.player.findFirst({
            where: {
                userId: session.user.id,
                room: { code: roomCode },
            },
            include: { room: true },
        });

        if (!player) {
            return NextResponse.json({ error: "Jogador não encontrado na sala" }, { status: 404 });
        }

        let reward: string | null = null;

        if (isCorrect) {
            // Award letter based on category
            const categoryLetters: Record<string, string[]> = {
                PSI: ["D", "I", "G"],
                MAT: ["I", "T", "A"],
                GAE: ["@", "L", "A"],
                FIS: ["I", "T", "L"],
            };

            const possibleLetters = categoryLetters[question.category] || [];
            const currentInventory = player.inventory;

            // Find a letter not yet collected
            for (const letter of possibleLetters) {
                if (!currentInventory.includes(letter)) {
                    reward = letter;
                    break;
                }
            }

            if (reward) {
                // Update player inventory
                await prisma.player.update({
                    where: { id: player.id },
                    data: { inventory: currentInventory + reward },
                });
            }
        }

        // Check win condition
        const newInventory = player.inventory + (reward || "");
        const hasAllLetters = "@DIGITAL".split("").every((l) => newInventory.includes(l));

        return NextResponse.json({
            correct: isCorrect,
            correctIndex: question.correctIndex,
            reward,
            newInventory: player.inventory + (reward || ""),
            hasAllLetters,
            timeBonus: timeRemaining > 20 ? 1 : 0,
        });
    } catch (error) {
        console.error("Answer validation error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
