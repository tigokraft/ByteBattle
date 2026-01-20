import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ code: string }>;
}

// POST /api/rooms/[code]/join - Join room
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { code } = await params;

        const room = await prisma.room.findUnique({
            where: { code },
            include: { players: true },
        });

        if (!room) {
            return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
        }

        if (room.status !== "LOBBY") {
            return NextResponse.json(
                { error: "Jogo já começou" },
                { status: 400 }
            );
        }

        // Check if already in room
        const existingPlayer = room.players.find((p) => p.userId === session.user.id);
        if (existingPlayer) {
            return NextResponse.json({ success: true, alreadyJoined: true });
        }

        // Check player limit (6 max)
        if (room.players.length >= 6) {
            return NextResponse.json({ error: "Sala cheia (max 6)" }, { status: 400 });
        }

        // Join room
        await prisma.player.create({
            data: {
                userId: session.user.id,
                roomId: room.id,
                isHost: false,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Join room error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
