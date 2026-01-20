import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface RouteParams {
    params: Promise<{ code: string }>;
}

// GET /api/rooms/[code] - Get room details
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const { code } = await params;

        const room = await prisma.room.findUnique({
            where: { code },
            include: {
                players: {
                    include: { user: true },
                },
            },
        });

        if (!room) {
            return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 });
        }

        return NextResponse.json({
            room: {
                id: room.id,
                code: room.code,
                status: room.status,
                hostId: room.hostId,
                players: room.players.map((p) => ({
                    id: p.id,
                    username: p.user.username,
                    isHost: p.isHost,
                    position: p.position,
                    inventory: p.inventory,
                })),
            },
        });
    } catch (error) {
        console.error("Get room error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

// DELETE /api/rooms/[code] - Leave room
export async function DELETE(request: Request, { params }: RouteParams) {
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

        const player = room.players.find((p) => p.userId === session.user.id);
        if (!player) {
            return NextResponse.json({ error: "Não está na sala" }, { status: 400 });
        }

        // If host leaves, delete room. Otherwise just remove player.
        if (player.isHost) {
            await prisma.room.delete({ where: { code } });
            return NextResponse.json({ success: true, roomDeleted: true });
        }

        await prisma.player.delete({ where: { id: player.id } });
        return NextResponse.json({ success: true, roomDeleted: false });
    } catch (error) {
        console.error("Leave room error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
