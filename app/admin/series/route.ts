import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const series = await prisma.series.create({
      data: {
        title: body.title,
        slug: body.slug,
        cover: body.cover,
        banner: body.banner,
        genres: body.genres,
        description: body.description,
        views: 0,
        reads: 0,
        rating: 0,
      },
    });

    return NextResponse.json({
      message: "Seri eklendi",
      series,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Hata oluştu",
      },
      { status: 500 }
    );
  }
}