import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import {
  hasAdminPanelAccess,
  canManageSeriesType,
} from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const chapterId = searchParams.get("id");
    const seriesId = searchParams.get("seriesId");

    // TEK BÖLÜM GETİR
    if (chapterId) {
      const id = parseInt(chapterId);

      if (isNaN(id)) {
        return NextResponse.json(
          { message: "Geçersiz bölüm ID" },
          { status: 400 }
        );
      }

      const chapter = await prisma.chapter.findUnique({
        where: {
          id,
        },
      });

      if (!chapter) {
        return NextResponse.json(
          { message: "Bölüm bulunamadı" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        chapter,
      });
    }

    // SERİNİN BÖLÜMLERİNİ GETİR
    const chapters = await prisma.chapter.findMany({
      where: seriesId
        ? {
            seriesId: parseInt(seriesId),
          }
        : {},
      orderBy: {
        chapterNumber: "asc",
      },
    });

    return NextResponse.json({
      chapters,
    });
  } catch (error) {
    console.error("GET CHAPTERS ERROR:", error);

    return NextResponse.json(
      {
        message: "Bölümler alınamadı",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const seriesIdStr = formData.get("seriesId") as string;
    const chapterNumberStr =
      formData.get("chapterNumber") as string;

    const title =
      (formData.get("title") as string)?.trim() || "";

    const role =
      (formData.get("userRole") as string) || "user";

    const username =
      (formData.get("username") as string) || "";

    const videoUrlInput =
      (formData.get("videoUrl") as string)?.trim() || "";

    if (!seriesIdStr || !chapterNumberStr) {
      return NextResponse.json(
        {
          message:
            "Lütfen seri ve bölüm numarasını belirtin",
        },
        {
          status: 400,
        }
      );
    }

    const seriesId = parseInt(seriesIdStr);
    const chapterNumber = parseFloat(chapterNumberStr);

    if (isNaN(seriesId) || isNaN(chapterNumber)) {
      return NextResponse.json(
        {
          message:
            "Seri ID veya bölüm numarası geçersiz",
        },
        {
          status: 400,
        }
      );
    }

    const series = await prisma.series.findUnique({
      where: {
        id: seriesId,
      },
    });

    if (!series) {
      return NextResponse.json(
        {
          message: "Seçilen seri bulunamadı",
        },
        {
          status: 404,
        }
      );
    }

    // YETKİ KONTROLÜ
    if (
      !hasAdminPanelAccess(
        username,
        role
      ) ||
      !canManageSeriesType(
        series.type,
        username,
        role
      )
    ) {
      return NextResponse.json(
        {
          message: `Bu işlem için yetkiniz yok (${series.type} yönetimi yetkisi gerekli)`,
        },
        {
          status: 403,
        }
      );
    }

    let finalVideoUrl: string | null =
      videoUrlInput || null;

    const pageUrls: string[] = [];

    // ==========================================
    // ANİME VİDEO YÜKLEME
    // ==========================================

    const videoFile =
      formData.get("videoFile") as File | null;

    if (
      series.type === "Anime" &&
      videoFile &&
      videoFile.name
    ) {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "videos"
      );

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }

      const cleanName =
        videoFile.name.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        );

      const fileName =
        `${Date.now()}_${cleanName}`;

      const filePath = path.join(
        uploadDir,
        fileName
      );

      const bytes =
        await videoFile.arrayBuffer();

      const buffer =
        Buffer.from(bytes);

      fs.writeFileSync(
        filePath,
        buffer
      );

      finalVideoUrl =
        `/uploads/videos/${fileName}`;
    }

    // ==========================================
    // MANGA / MANHWA SAYFALARINI YÜKLE
    // ==========================================

    const files =
      formData.getAll("pages") as File[];

    const validFiles = files.filter(
      (file) =>
        file &&
        file instanceof File &&
        file.name
    );

    if (validFiles.length > 0) {
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "chapters",
        `series-${seriesId}-ch-${chapterNumber}`
      );

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, {
          recursive: true,
        });
      }

      for (
        let i = 0;
        i < validFiles.length;
        i++
      ) {
        const file = validFiles[i];

        const cleanName =
          file.name.replace(
            /[^a-zA-Z0-9.-]/g,
            "_"
          );

        const fileName =
          `${i + 1}_${Date.now()}_${cleanName}`;

        const filePath = path.join(
          uploadDir,
          fileName
        );

        const bytes =
          await file.arrayBuffer();

        const buffer =
          Buffer.from(bytes);

        fs.writeFileSync(
          filePath,
          buffer
        );

        pageUrls.push(
          `/uploads/chapters/series-${seriesId}-ch-${chapterNumber}/${fileName}`
        );
      }
    }

    // ==========================================
    // BÖLÜMÜ DATABASE'E KAYDET
    // ==========================================

    const chapter =
      await prisma.chapter.create({
        data: {
          seriesId,
          chapterNumber,
          title:
            title ||
            `${chapterNumber}. Bölüm`,
          pages:
            pageUrls.length > 0
              ? JSON.stringify(pageUrls)
              : null,
          videoUrl:
            finalVideoUrl,
        },
      });

    // ==========================================
    // FAVORİLERİ BİLDİR
    // ==========================================

    const favoritedUsers =
      await prisma.favorite.findMany({
        where: {
          seriesId,
        },
        select: {
          userId: true,
        },
      });

    if (favoritedUsers.length > 0) {
      const notifications =
        favoritedUsers.map(
          (fav) => ({
            userId: fav.userId,
            title:
              `Yeni Bölüm Geldi! 🚀 (${series.title})`,
            message:
              `Takip ettiğiniz "${series.title}" serisi için ${chapterNumber}. Bölüm yayınlandı!`,
            link:
              `/series/${series.slug}`,
            type: "chapter",
          })
        );

      await prisma.notification.createMany(
        {
          data: notifications,
        }
      );
    }

    return NextResponse.json({
      message:
        `${chapterNumber}. Bölüm başarıyla eklendi!`,
      chapter,
    });
  } catch (error) {
    console.error(
      "ADD CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Bölüm eklenirken sunucu hatası oluştu",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const chapterId =
      searchParams.get("id");

    const username =
      searchParams.get("username");

    const role =
      searchParams.get("role");

    if (
      !hasAdminPanelAccess(
        username || undefined,
        role || undefined
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Bu işlemi yapma yetkiniz yok",
        },
        {
          status: 403,
        }
      );
    }

    if (!chapterId) {
      return NextResponse.json(
        {
          message:
            "Bölüm ID gereklidir",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.chapter.delete({
      where: {
        id: parseInt(chapterId),
      },
    });

    return NextResponse.json({
      message: "Bölüm silindi",
    });
  } catch (error) {
    console.error(
      "DELETE CHAPTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Bölüm silinemedi",
      },
      {
        status: 500,
      }
    );
  }
}