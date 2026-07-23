"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

interface ChapterData {
  id: number;
  chapterNumber: number;
  title?: string;
  pages?: string; // JSON array of page URLs
  videoUrl?: string;
  seriesId: number;
  series: {
    title: string;
    slug: string;
    type: string;
    chapters: { id: number; chapterNumber: number }[];
  };
}

interface PageProps {
  params: Promise<{ slug: string; chapterId: string }>;
}

export default function ChapterReaderPage({ params }: PageProps) {
  const { slug, chapterId } = use(params);

  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // For Manga mode

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  const fetchChapter = async () => {
    try {
      const res = await fetch(`/api/admin/manwha`);
      const data = await res.json();
      if (data.series) {
        const foundSeries = data.series.find((s: any) => s.slug === slug);
        if (foundSeries && foundSeries.chapters) {
          const foundChapter = foundSeries.chapters.find((c: any) => c.id === parseInt(chapterId));
          if (foundChapter) {
            setChapter({
              ...foundChapter,
              series: {
                title: foundSeries.title,
                slug: foundSeries.slug,
                type: foundSeries.type,
                chapters: foundSeries.chapters
              }
            });

            if (foundChapter.pages) {
              try {
                const parsedPages = JSON.parse(foundChapter.pages);
                setPages(Array.isArray(parsedPages) ? parsedPages : []);
              } catch {
                setPages([]);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center items-center">
        <div className="text-zinc-400 font-semibold">Bölüm hazırlanıyor...</div>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center items-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Bölüm Bulunamadı</h1>
          <Link href={`/series/${slug}`} className="bg-zinc-800 px-6 py-3 rounded-xl text-sm font-bold">
            &larr; Seri Detayına Dön
          </Link>
        </div>
      </main>
    );
  }

  const allChapters = chapter.series.chapters || [];
  const currentIndex = allChapters.findIndex((c) => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const contentType = chapter.series.type || "Manhwa";

  return (
    <main className="min-h-screen bg-[#060606] text-white pt-20 pb-16">
      {/* CHAPTER NAVBAR */}
      <div className="sticky top-16 z-40 bg-[#121212]/90 backdrop-blur-md border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href={`/series/${chapter.series.slug}`} className="text-xs text-zinc-400 hover:text-white font-semibold">
              &larr; {chapter.series.title}
            </Link>
            <h1 className="text-lg md:text-xl font-black text-white mt-0.5">
              {chapter.chapterNumber}. Bölüm {chapter.title ? `- ${chapter.title}` : ""}
            </h1>
          </div>

          {/* CHAPTER SELECTOR AND NAVIGATION */}
          <div className="flex items-center gap-3">
            {prevChapter ? (
              <Link
                href={`/series/${chapter.series.slug}/chapter/${prevChapter.id}`}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                &larr; Önceki Bölüm
              </Link>
            ) : (
              <span className="opacity-40 bg-zinc-900 text-zinc-600 px-4 py-2 rounded-xl text-xs font-bold">
                &larr; Önceki Bölüm
              </span>
            )}

            {nextChapter ? (
              <Link
                href={`/series/${chapter.series.slug}/chapter/${nextChapter.id}`}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/20"
              >
                Sonraki Bölüm &rarr;
              </Link>
            ) : (
              <span className="opacity-40 bg-zinc-900 text-zinc-600 px-4 py-2 rounded-xl text-xs font-bold">
                Sonraki Bölüm &rarr;
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT READER CONTAINER */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* ANIME VIDEO PLAYER MODE */}
        {contentType === "Anime" ? (
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-4">
            {chapter.videoUrl ? (
              <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden">
                <video
                  src={chapter.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
            ) : (
              <div className="p-16 text-center text-zinc-500">
                Bu bölüm için henüz bir video dosyası yüklenmemiş.
              </div>
            )}
          </div>
        ) : contentType === "Manga" ? (
          /* MANGA PAGE-BY-PAGE READER MODE */
          <div className="bg-[#121212] border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center">
            {pages.length === 0 ? (
              <div className="p-12 text-zinc-500">Bu bölüm için henüz sayfa yüklenmemiş.</div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center bg-zinc-900 p-3 rounded-xl text-xs text-zinc-400">
                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentPageIndex === 0}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-4 py-2 rounded-lg text-white font-bold cursor-pointer"
                  >
                    &larr; Önceki Sayfa
                  </button>

                  <span className="font-semibold text-zinc-200">
                    Sayfa {currentPageIndex + 1} / {pages.length}
                  </span>

                  <button
                    onClick={() => setCurrentPageIndex((prev) => Math.min(pages.length - 1, prev + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 px-4 py-2 rounded-lg text-white font-bold cursor-pointer"
                  >
                    Sonraki Sayfa &rarr;
                  </button>
                </div>

                <div className="flex justify-center bg-black rounded-2xl p-2 border border-zinc-800 min-h-[500px]">
                  <img
                    src={pages[currentPageIndex]}
                    alt={`Sayfa ${currentPageIndex + 1}`}
                    className="max-h-[85vh] w-auto object-contain rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MANHWA WEBTOON VERTICAL SCROLL READER MODE */
          <div className="flex flex-col items-center gap-2 bg-[#121212] border border-zinc-800/80 rounded-3xl p-4 md:p-6 shadow-2xl">
            {pages.length === 0 ? (
              <div className="p-16 text-zinc-500 text-center">Bu bölüm için henüz sayfa yüklenmemiş.</div>
            ) : (
              pages.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`Bölüm ${chapter.chapterNumber} - Sayfa ${index + 1}`}
                  className="w-full max-w-3xl h-auto object-contain shadow-lg"
                  loading="lazy"
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION BAR */}
      <div className="max-w-4xl mx-auto px-4 mt-12 flex justify-between items-center bg-[#121212] border border-zinc-800 p-5 rounded-2xl">
        {prevChapter ? (
          <Link
            href={`/series/${chapter.series.slug}/chapter/${prevChapter.id}`}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition"
          >
            &larr; Önceki Bölüm
          </Link>
        ) : (
          <span className="opacity-30 text-zinc-500 text-xs font-bold">&larr; İlk Bölüm</span>
        )}

        <Link href={`/series/${chapter.series.slug}`} className="text-xs text-red-500 hover:text-red-400 font-bold">
          Bölüm Listesine Dön
        </Link>

        {nextChapter ? (
          <Link
            href={`/series/${chapter.series.slug}/chapter/${nextChapter.id}`}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-red-600/20"
          >
            Sonraki Bölüm &rarr;
          </Link>
        ) : (
          <span className="opacity-30 text-zinc-500 text-xs font-bold">Son Bölüm &rarr;</span>
        )}
      </div>
    </main>
  );
}
