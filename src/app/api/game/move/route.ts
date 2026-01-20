import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Board configuration - 10x10 grid with house types
const BOARD_SIZE = 100;
const CENTER_POSITION = 44; // Center of the board

// House types at each position
function getHouseType(position: number): { type: string; category?: string } {
    if (position === CENTER_POSITION) return { type: "CENTER" };

    // Special positions
    const teleports = [10, 30, 50, 70, 90];
    const mysteries = [15, 35, 55, 75, 95];

    if (teleports.includes(position)) return { type: "TELEPORT" };
    if (mysteries.includes(position)) return { type: "MYSTERY" };

    // Theme houses based on position quadrant
    const categories = ["PSI", "MAT", "GAE", "FIS"];
    const quadrant = Math.floor(position / 25);
    return { type: "THEME", category: categories[quadrant % 4] };
}

// POST /api/game/move - Validate move and apply house effects
export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { roomCode, targetPosition, diceValue } = await request.json();

        if (!roomCode || targetPosition === undefined || !diceValue) {
            return NextResponse.json(
                { error: "roomCode, targetPosition e diceValue são obrigatórios" },
                { status: 400 }
            );
        }

        // Get player
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

        // Validate move distance
        const distance = Math.abs(targetPosition - player.position);
        if (distance > diceValue) {
            return NextResponse.json({ error: "Movimento inválido" }, { status: 400 });
        }

        // Check if can move to center (needs all letters)
        const hasAllLetters = "@DIGITAL".split("").every((l) => player.inventory.includes(l));
        if (targetPosition === CENTER_POSITION && !hasAllLetters) {
            return NextResponse.json(
                { error: "Precisas de todas as letras @DIGITAL para ir ao centro" },
                { status: 400 }
            );
        }

        // Check for collision (duel)
        const occupyingPlayer = player.room.players.find(
            (p) => p.id !== player.id && p.position === targetPosition
        );

        // Get house type at target
        const house = getHouseType(targetPosition);

        // Update player position
        await prisma.player.update({
            where: { id: player.id },
            data: { position: targetPosition },
        });

        // Handle teleport
        let teleportTo: number | null = null;
        if (house.type === "TELEPORT") {
            const teleportPositions = [10, 30, 50, 70, 90];
            const currentIndex = teleportPositions.indexOf(targetPosition);
            teleportTo = teleportPositions[(currentIndex + 1) % teleportPositions.length];

            await prisma.player.update({
                where: { id: player.id },
                data: { position: teleportTo },
            });
        }

        return NextResponse.json({
            success: true,
            newPosition: teleportTo || targetPosition,
            house,
            teleportTo,
            duel: occupyingPlayer ? {
                opponentId: occupyingPlayer.id,
                opponentUserId: occupyingPlayer.userId,
            } : null,
            canWin: targetPosition === CENTER_POSITION && hasAllLetters,
        });
    } catch (error) {
        console.error("Move error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
