import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ code: string }>;
}

// POST /api/rooms/[code]/start - Start game (host only)
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

        // Check if user is host
        if (room.hostId !== session.user.id) {
            return NextResponse.json(
                { error: "Apenas o host pode iniciar" },
                { status: 403 }
            );
        }

        // Need at least 2 players
        if (room.players.length < 2) {
            return NextResponse.json(
                { error: "Mínimo 2 jogadores" },
                { status: 400 }
            );
        }

        // Start game
        await prisma.room.update({
            where: { code },
            data: { status: "PLAYING" },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Start game error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
