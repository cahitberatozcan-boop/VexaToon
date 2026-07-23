import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesIdStr = searchParams.get("seriesId");
    const userIdStr = searchParams.get("userId");

    if (!seriesIdStr) {
      return NextResponse.json({ averageScore: 0, totalVotes: 0, userScore: null });
    }

    const seriesId = parseInt(seriesIdStr);
    const userId = userIdStr ? parseInt(userIdStr) : null;

    const ratings = await prisma.rating.findMany({
      where: { seriesId }
    });

    const totalVotes = ratings.length;
    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalVotes > 0 ? (totalScore / totalVotes).toFixed(1) : 0;

    let userScore = null;
    if (userId) {
      const userRating = ratings.find((r) => r.userId === userId);
      if (userRating) {
        userScore = userRating.score;
      }
    }

    return NextResponse.json({
      averageScore: Number(averageScore),
      totalVotes,
      userScore
    });
  } catch (error) {
    console.error("GET RATINGS ERROR:", error);
    return NextResponse.json({ message: "Puanlar alınamadı" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, seriesId, score } = await req.json();

    if (!userId || !seriesId || !score || score < 1 || score > 10) {
      return NextResponse.json({ message: "Geçersiz puan değeri (1-10 arası olmalı)" }, { status: 400 });
    }

    await prisma.rating.upsert({
      where: {
        userId_seriesId: {
          userId: parseInt(userId),
          seriesId: parseInt(seriesId)
        }
      },
      update: { score: parseInt(score) },
      create: {
        userId: parseInt(userId),
        seriesId: parseInt(seriesId),
        score: parseInt(score)
      }
    });

    const ratings = await prisma.rating.findMany({
      where: { seriesId: parseInt(seriesId) }
    });

    const totalVotes = ratings.length;
    const totalScore = ratings.reduce((sum, r) => sum + r.score, 0);
    const averageScore = (totalScore / totalVotes).toFixed(1);

    return NextResponse.json({
      message: "Puanınız başarıyla kaydedildi!",
      averageScore: Number(averageScore),
      totalVotes,
      userScore: parseInt(score)
    });
  } catch (error) {
    console.error("POST RATING ERROR:", error);
    return NextResponse.json({ message: "Puan kaydedilemedi" }, { status: 500 });
  }
}
