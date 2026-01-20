import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/game/roll - Roll dice and get value
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { roomCode } = await request.json();

        if (!roomCode) {
            return NextResponse.json({ error: "roomCode é obrigatório" }, { status: 400 });
        }

        // Verify player is in room and it's their turn
        const player = await prisma.player.findFirst({
            where: {
                userId: session.user.id,
                room: { code: roomCode },
            },
            include: { room: { include: { players: true } } },
        });

        if (!player) {
            return NextResponse.json({ error: "Jogador não encontrado na sala" }, { status: 404 });
        }

        if (player.room.status !== "PLAYING") {
            return NextResponse.json({ error: "Jogo não está em andamento" }, { status: 400 });
        }

        // Roll dice (1-6)
        const diceValue = Math.floor(Math.random() * 6) + 1;

        // Calculate possible moves
        const currentPos = player.position;
        const possibleMoves: number[] = [];

        for (let i = 1; i <= diceValue; i++) {
            const forward = currentPos + i;
            const backward = currentPos - i;
            if (forward < 100) possibleMoves.push(forward);
            if (backward >= 0) possibleMoves.push(backward);
        }

        // Check if player has all letters - can move to center
        const hasAllLetters = "@DIGITAL".split("").every((l) => player.inventory.includes(l));
        const CENTER = 44;

        if (hasAllLetters && Math.abs(CENTER - currentPos) <= diceValue) {
            possibleMoves.push(CENTER);
        }

        return NextResponse.json({
            diceValue,
            currentPosition: currentPos,
            possibleMoves: [...new Set(possibleMoves)],
            hasAllLetters,
        });
    } catch (error) {
        console.error("Roll dice error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
