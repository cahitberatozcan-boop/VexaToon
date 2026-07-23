import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/auth";

// Simple in-memory rate limiting map: userId -> lastTimestamp
const lastMessageMap = new Map<number, number>();

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      take: 50,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET CHAT ERROR:", error);
    return NextResponse.json({ message: "Sohbet mesajları alınamadı" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, content } = await req.json();

    if (!userId || !content || !content.trim()) {
      return NextResponse.json({ message: "Mesaj boş olamaz" }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 500) {
      return NextResponse.json({ message: "Mesaj en fazla 500 karakter olabilir" }, { status: 400 });
    }

    // Rate limiting: 1.5 seconds cooldown
    const now = Date.now();
    const lastTime = lastMessageMap.get(userId) || 0;
    if (now - lastTime < 1500) {
      return NextResponse.json(
        { message: "Çok hızlı mesaj gönderiyorsunuz. Lütfen 1-2 saniye bekleyin." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    lastMessageMap.set(userId, now);

    const message = await prisma.chatMessage.create({
      data: {
        userId: user.id,
        content: trimmedContent
      },
      include: {
        user: {
          select: { id: true, username: true, role: true }
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("POST CHAT ERROR:", error);
    return NextResponse.json({ message: "Mesaj gönderilirken hata oluştu" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("id");
    const userIdStr = searchParams.get("userId");

    if (!messageId || !userIdStr) {
      return NextResponse.json({ message: "Geçersiz parametreler" }, { status: 400 });
    }

    const userId = parseInt(userIdStr);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userRole = normalizeRole(user?.username, user?.role);

    // Only owner, admin, or managers can delete chat messages
    const canDelete = ["owner", "admin", "anime_manager", "manhwa_manager", "manga_manager"].includes(userRole);
    if (!canDelete) {
      return NextResponse.json({ message: "Bu mesajı silme yetkiniz yok" }, { status: 403 });
    }

    await prisma.chatMessage.delete({
      where: { id: parseInt(messageId) }
    });

    return NextResponse.json({ message: "Mesaj başarıyla silindi" });
  } catch (error) {
    console.error("DELETE CHAT ERROR:", error);
    return NextResponse.json({ message: "Mesaj silinemedi" }, { status: 500 });
  }
}
