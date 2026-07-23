import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");

    if (!userIdStr) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const userId = parseInt(userIdStr);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false }
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ message: "Bildirimler alınamadı" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, notificationId, markAllRead } = await req.json();

    if (markAllRead && userId) {
      await prisma.notification.updateMany({
        where: { userId: parseInt(userId), isRead: false },
        data: { isRead: true }
      });
      return NextResponse.json({ message: "Tüm bildirimler okundu olarak işaretlendi" });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: { isRead: true }
      });
      return NextResponse.json({ message: "Bildirim okundu olarak işaretlendi" });
    }

    return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
  } catch (error) {
    console.error("PATCH NOTIFICATIONS ERROR:", error);
    return NextResponse.json({ message: "Bildirim güncellenemedi" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { adminUserId, title, message, link, targetUserId } = await req.json();

    const admin = await prisma.user.findUnique({ where: { id: parseInt(adminUserId) } });
    const userRole = normalizeRole(admin?.username, admin?.role);

    if (!["owner", "admin"].includes(userRole)) {
      return NextResponse.json({ message: "Duyuru gönderme yetkiniz yok" }, { status: 403 });
    }

    if (!title || !message) {
      return NextResponse.json({ message: "Başlık ve mesaj alanları zorunludur" }, { status: 400 });
    }

    if (targetUserId) {
      await prisma.notification.create({
        data: {
          userId: parseInt(targetUserId),
          title,
          message,
          link: link || null,
          type: "announcement"
        }
      });
    } else {
      // Send to all users
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      const notificationsData = allUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        link: link || null,
        type: "announcement"
      }));

      await prisma.notification.createMany({
        data: notificationsData
      });
    }

    return NextResponse.json({ message: "Bildirim başarıyla gönderildi!" });
  } catch (error) {
    console.error("POST ANNOUNCEMENT ERROR:", error);
    return NextResponse.json({ message: "Bildirim gönderilemedi" }, { status: 500 });
  }
}
