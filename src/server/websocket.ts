// WebSocket server for real-time game communication
// Run with: bun run src/server/websocket.ts

import { WebSocketServer, WebSocket } from "ws";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Setup Prisma
const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const PORT = 3001;

// Store connected clients by room code
const rooms = new Map<string, Map<string, WebSocket>>();

// Message types
type WSMessage = {
    type: string;
    roomCode?: string;
    playerId?: string;
    userId?: string;
    data?: unknown;
};

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (ws: WebSocket) => {
    let currentRoom: string | null = null;
    let currentPlayerId: string | null = null;

    ws.on("message", async (raw: Buffer) => {
        try {
            const message: WSMessage = JSON.parse(raw.toString());

            switch (message.type) {
                case "JOIN_ROOM": {
                    const { roomCode, playerId } = message;
                    if (!roomCode || !playerId) break;

                    // Store connection
                    if (!rooms.has(roomCode)) {
                        rooms.set(roomCode, new Map());
                    }
                    rooms.get(roomCode)!.set(playerId, ws);
                    currentRoom = roomCode;
                    currentPlayerId = playerId;

                    // Get room state and broadcast to all players
                    const room = await prisma.room.findUnique({
                        where: { code: roomCode },
                        include: { players: { include: { user: true } } },
                    });

                    if (room) {
                        broadcastToRoom(roomCode, {
                            type: "ROOM_STATE",
                            data: {
                                status: room.status,
                                currentTurn: room.currentTurn,
                                gameState: room.gameState,
                                players: room.players.map((p, idx) => ({
                                    id: p.id,
                                    username: p.user.username,
                                    position: p.position,
                                    inventory: p.inventory,
                                    isHost: p.isHost,
                                    isCurrentTurn: idx === room.currentTurn,
                                })),
                            },
                        });
                    }
                    break;
                }

                case "START_GAME": {
                    if (!currentRoom) break;

                    await prisma.room.update({
                        where: { code: currentRoom },
                        data: { status: "PLAYING", gameState: "WAITING", currentTurn: 0 },
                    });

                    broadcastToRoom(currentRoom, {
                        type: "GAME_STARTED",
                        data: { currentTurn: 0, gameState: "WAITING" },
                    });
                    break;
                }

                case "ROLL_DICE": {
                    if (!currentRoom || !currentPlayerId) break;

                    const diceValue = Math.floor(Math.random() * 6) + 1;

                    await prisma.room.update({
                        where: { code: currentRoom },
                        data: { gameState: "MOVING" },
                    });

                    broadcastToRoom(currentRoom, {
                        type: "DICE_ROLLED",
                        data: { playerId: currentPlayerId, diceValue },
                    });
                    break;
                }

                case "PLAYER_MOVED": {
                    if (!currentRoom) break;

                    const { playerId: movedPlayerId, position, houseType, category } = message.data as {
                        playerId: string;
                        position: number;
                        houseType: string;
                        category?: string;
                    };

                    await prisma.player.update({
                        where: { id: movedPlayerId },
                        data: { position },
                    });

                    if (houseType === "THEME") {
                        await prisma.room.update({
                            where: { code: currentRoom },
                            data: { gameState: "ANSWERING" },
                        });
                    }

                    broadcastToRoom(currentRoom, {
                        type: "PLAYER_MOVED",
                        data: { playerId: movedPlayerId, position, houseType, category },
                    });
                    break;
                }

                case "ANSWER_SUBMITTED": {
                    if (!currentRoom) break;

                    const { playerId: answerPlayerId, correct, reward, inventory } = message.data as {
                        playerId: string;
                        correct: boolean;
                        reward: string | null;
                        inventory: string;
                    };

                    if (reward) {
                        await prisma.player.update({
                            where: { id: answerPlayerId },
                            data: { inventory },
                        });
                    }

                    broadcastToRoom(currentRoom, {
                        type: "ANSWER_RESULT",
                        data: { playerId: answerPlayerId, correct, reward, inventory },
                    });

                    // Move to next player's turn
                    const room = await prisma.room.findUnique({
                        where: { code: currentRoom },
                        include: { players: true },
                    });

                    if (room) {
                        const nextTurn = (room.currentTurn + 1) % room.players.length;
                        await prisma.room.update({
                            where: { code: currentRoom },
                            data: { currentTurn: nextTurn, gameState: "WAITING" },
                        });

                        broadcastToRoom(currentRoom, {
                            type: "TURN_CHANGED",
                            data: { currentTurn: nextTurn },
                        });
                    }
                    break;
                }

                case "GAME_WON": {
                    if (!currentRoom) break;

                    const { playerId: winnerId, username } = message.data as {
                        playerId: string;
                        username: string;
                    };

                    await prisma.room.update({
                        where: { code: currentRoom },
                        data: { status: "FINISHED", gameState: "FINISHED" },
                    });

                    broadcastToRoom(currentRoom, {
                        type: "GAME_OVER",
                        data: { winnerId, username },
                    });
                    break;
                }

                case "CHAT": {
                    if (!currentRoom) break;
                    broadcastToRoom(currentRoom, {
                        type: "CHAT",
                        data: message.data,
                    });
                    break;
                }
            }
        } catch (error) {
            console.error("WebSocket message error:", error);
        }
    });

    ws.on("close", () => {
        if (currentRoom && currentPlayerId) {
            const roomClients = rooms.get(currentRoom);
            if (roomClients) {
                roomClients.delete(currentPlayerId);
                if (roomClients.size === 0) {
                    rooms.delete(currentRoom);
                } else {
                    broadcastToRoom(currentRoom, {
                        type: "PLAYER_DISCONNECTED",
                        data: { playerId: currentPlayerId },
                    });
                }
            }
        }
    });
});

function broadcastToRoom(roomCode: string, message: object) {
    const roomClients = rooms.get(roomCode);
    if (!roomClients) return;

    const payload = JSON.stringify(message);
    for (const client of roomClients.values()) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}
