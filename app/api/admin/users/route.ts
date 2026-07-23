import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole, canManageUsers } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminUsername = searchParams.get("username");
    const adminRole = searchParams.get("role");

    if (!canManageUsers(adminUsername || undefined, adminRole || undefined)) {
      return NextResponse.json({ message: "Kullanıcı yönetimi yetkiniz yok" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json({ message: "Kullanıcılar alınamadı" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { adminUserId, targetUserId, newRole } = await req.json();

    const admin = await prisma.user.findUnique({ where: { id: parseInt(adminUserId) } });
    const adminRole = normalizeRole(admin?.username, admin?.role);

    if (!["owner", "admin"].includes(adminRole)) {
      return NextResponse.json({ message: "Rol değiştirme yetkiniz yok" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: parseInt(targetUserId) } });
    if (!targetUser) {
      return NextResponse.json({ message: "Hedef kullanıcı bulunamadı" }, { status: 404 });
    }

    // Only Owner can assign 'owner' or modify an 'owner' user
    if ((newRole === "owner" || targetUser.role === "owner") && adminRole !== "owner") {
      return NextResponse.json({ message: "Owner rolü işlemleri sadece Kurucu tarafından yapılabilir" }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(targetUserId) },
      data: { role: newRole }
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: "Rolünüz Güncellendi! 🎖️",
        message: `Hesabınızın rolü "${newRole}" olarak güncellendi.`,
        type: "security"
      }
    });

    return NextResponse.json({
      message: `${updatedUser.username} kullanıcısının rolü "${newRole}" yapıldı.`,
      user: updatedUser
    });
  } catch (error) {
    console.error("PATCH USER ROLE ERROR:", error);
    return NextResponse.json({ message: "Rol güncellenemedi" }, { status: 500 });
  }
}
