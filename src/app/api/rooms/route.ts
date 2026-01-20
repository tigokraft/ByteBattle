import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, generateRoomCode } from "@/lib/auth";

// GET /api/rooms - List user's active rooms
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        const players = await prisma.player.findMany({
            where: { userId: session.user.id },
            include: {
                room: {
                    include: {
                        players: {
                            include: { user: true },
                        },
                    },
                },
            },
        });

        const rooms = players.map((p) => ({
            id: p.room.id,
            code: p.room.code,
            status: p.room.status,
            playerCount: p.room.players.length,
            isHost: p.isHost,
            players: p.room.players.map((pl) => ({
                id: pl.id,
                username: pl.user.username,
                isHost: pl.isHost,
            })),
        }));

        return NextResponse.json({ rooms });
    } catch (error) {
        console.error("Get rooms error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}

// POST /api/rooms - Create a new room
export async function POST() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        }

        // Generate unique room code
        let code = generateRoomCode();
        let attempts = 0;
        while (await prisma.room.findUnique({ where: { code } })) {
            code = generateRoomCode();
            attempts++;
            if (attempts > 10) {
                return NextResponse.json(
                    { error: "Não foi possível criar sala" },
                    { status: 500 }
                );
            }
        }

        // Create room with host as first player
        const room = await prisma.room.create({
            data: {
                code,
                hostId: session.user.id,
                players: {
                    create: {
                        userId: session.user.id,
                        isHost: true,
                    },
                },
            },
            include: {
                players: {
                    include: { user: true },
                },
            },
        });

        return NextResponse.json({
            success: true,
            room: {
                id: room.id,
                code: room.code,
                status: room.status,
                inviteLink: `/join/${room.code}`,
                players: room.players.map((p) => ({
                    id: p.id,
                    username: p.user.username,
                    isHost: p.isHost,
                })),
            },
        });
    } catch (error) {
        console.error("Create room error:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
