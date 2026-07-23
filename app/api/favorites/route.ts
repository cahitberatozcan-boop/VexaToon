import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdStr = searchParams.get("userId");
    const seriesIdStr = searchParams.get("seriesId");

    if (!userIdStr) {
      return NextResponse.json({ favorites: [] });
    }

    const userId = parseInt(userIdStr);

    if (seriesIdStr) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          userId_seriesId: {
            userId,
            seriesId: parseInt(seriesIdStr)
          }
        }
      });
      return NextResponse.json({ isFavorite: !!favorite });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        series: {
          include: {
            chapters: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("GET FAVORITES ERROR:", error);
    return NextResponse.json({ message: "Favoriler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, seriesId } = await req.json();

    if (!userId || !seriesId) {
      return NextResponse.json({ message: "Geçersiz istek" }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_seriesId: {
          userId: parseInt(userId),
          seriesId: parseInt(seriesId)
        }
      }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ isFavorite: false, message: "Favorilerden çıkarıldı" });
    } else {
      await prisma.favorite.create({
        data: {
          userId: parseInt(userId),
          seriesId: parseInt(seriesId)
        }
      });
      return NextResponse.json({ isFavorite: true, message: "Favorilere eklendi" });
    }
  } catch (error) {
    console.error("POST FAVORITE ERROR:", error);
    return NextResponse.json({ message: "Favori işlemi başarısız" }, { status: 500 });
  }
}
