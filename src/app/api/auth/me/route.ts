import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({
            user: {
                id: session.user.id,
                username: session.user.username,
            },
        });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({ user: null });
    }
}
