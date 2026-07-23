import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { seriesId, userId, identifier } = await req.json();

    if (!seriesId) {
      return NextResponse.json({ message: "Series ID gereklidir" }, { status: 400 });
    }

    const numericSeriesId = parseInt(seriesId);
    const numericUserId = userId ? parseInt(userId) : null;

    if (numericUserId) {
      // Check if logged-in user already viewed this series
      const existingView = await prisma.seriesView.findUnique({
        where: {
          seriesId_userId: {
            seriesId: numericSeriesId,
            userId: numericUserId
          }
        }
      });

      if (!existingView) {
        await prisma.seriesView.create({
          data: {
            seriesId: numericSeriesId,
            userId: numericUserId,
            identifier: identifier || null
          }
        });

        // Increment total views on Series
        const updatedSeries = await prisma.series.update({
          where: { id: numericSeriesId },
          data: { views: { increment: 1 } }
        });

        return NextResponse.json({ views: updatedSeries.views, incremented: true });
      }
    } else if (identifier) {
      // For guest users, track by identifier (e.g. session token)
      const guestView = await prisma.seriesView.findFirst({
        where: {
          seriesId: numericSeriesId,
          identifier
        }
      });

      if (!guestView) {
        await prisma.seriesView.create({
          data: {
            seriesId: numericSeriesId,
            identifier
          }
        });

        const updatedSeries = await prisma.series.update({
          where: { id: numericSeriesId },
          data: { views: { increment: 1 } }
        });

        return NextResponse.json({ views: updatedSeries.views, incremented: true });
      }
    }

    const currentSeries = await prisma.series.findUnique({
      where: { id: numericSeriesId },
      select: { views: true }
    });

    return NextResponse.json({ views: currentSeries?.views || 0, incremented: false });
  } catch (error) {
    console.error("TRACK UNIQUE VIEW ERROR:", error);
    return NextResponse.json({ message: "Görüntülenme işlenemedi" }, { status: 500 });
  }
}
