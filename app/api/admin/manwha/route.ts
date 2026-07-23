import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import { hasAdminPanelAccess, canManageSeriesType, normalizeRole } from "@/lib/auth";

function createSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        chapters: {
          select: { id: true, chapterNumber: true, title: true, createdAt: true },
          orderBy: { chapterNumber: "asc" }
        },
        ratings: true
      }
    });
    return NextResponse.json({ series });
  } catch (error) {
    console.error("GET SERIES ERROR:", error);
    return NextResponse.json({ message: "Seriler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = (formData.get("title") as string)?.trim();
    const category = (formData.get("category") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const contentType = (formData.get("type") as string) || "Manhwa";
    const role = (formData.get("userRole") as string) || "user";
    const username = (formData.get("username") as string) || "";
    const file = formData.get("cover") as File | null;

    // Strict RBAC check
    if (!hasAdminPanelAccess(username, role) || !canManageSeriesType(contentType, username, role)) {
      return NextResponse.json(
        { message: `Bu işlem için yetkiniz yok (${contentType} yönetim yetkisi gerekli)` },
        { status: 403 }
      );
    }

    if (!title || !category || !description || !file) {
      return NextResponse.json(
        { message: "Lütfen tüm alanları ve kapak resmini doldurun" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${Date.now()}-${cleanFileName}`;
    const uploadPath = path.join(uploadDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(uploadPath, buffer);

    let baseSlug = createSlug(title) || `series-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await prisma.series.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const series = await prisma.series.create({
      data: {
        title,
        slug: uniqueSlug,
        cover: `/uploads/${fileName}`,
        genres: category,
        description,
        type: contentType
      }
    });

    return NextResponse.json({
      message: `${contentType} serisi başarıyla eklendi!`,
      series
    });
  } catch (error) {
    console.error("ADD SERIES ERROR:", error);
    return NextResponse.json(
      { message: "Seri eklenirken sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("id");
    const username = searchParams.get("username");
    const role = searchParams.get("role");

    if (!hasAdminPanelAccess(username || undefined, role || undefined)) {
      return NextResponse.json({ message: "Bu işlemi yapma yetkiniz yok" }, { status: 403 });
    }

    if (!seriesId) {
      return NextResponse.json({ message: "Seri ID gereklidir" }, { status: 400 });
    }

    await prisma.series.delete({
      where: { id: parseInt(seriesId) }
    });

    return NextResponse.json({ message: "Seri ve bölümleri silindi" });
  } catch (error) {
    console.error("DELETE SERIES ERROR:", error);
    return NextResponse.json({ message: "Seri silinemedi" }, { status: 500 });
  }
}