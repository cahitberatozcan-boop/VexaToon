"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Chapter {
  id: number;
  chapterNumber: number;
  title?: string | null;
  pages?: string | null;
  videoUrl?: string | null;
  createdAt: string;
}

interface Series {
  id: number;
  title: string;
  slug: string;
  cover: string;
  genres: string;
  description: string;
  type: string;
  views: number;
  reads: number;
  chapters: Chapter[];
}

export default function SeriesPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);

  useEffect(() => {
    if (slug) {
      fetchSeries();
    }
  }, [slug]);

  async function fetchSeries() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/admin/manwha?slug=${encodeURIComponent(slug)}`
      );

      const data = await res.json();

      if (res.ok && data.series) {
        let foundSeries = null;

        if (Array.isArray(data.series)) {
          foundSeries = data.series.find(
            (item: Series) => item.slug === slug
          );
        } else {
          foundSeries = data.series;
        }

        if (foundSeries) {
          setSeries(foundSeries);
        }
      }
    } catch (error) {
      console.error("Seri yüklenirken hata oluştu:", error);
    } finally {
      setLoading(false);
    }
  }

  async function giveRating(score: number) {
    try {
      const user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      if (!user.id) {
        alert("Puan vermek için giriş yapmalısınız.");
        return;
      }

      if (!series) return;

      const res = await fetch("/api/rating", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          score,
          userId: user.id,
          seriesId: series.id,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRating(data.rating || score);
        setUserRating(score);
      } else {
        alert(data.message || "Puan verilemedi.");
      }
    } catch (error) {
      console.error("Rating error:", error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center">
        <div className="text-zinc-400">
          Seri yükleniyor...
        </div>
      </main>
    );
  }

  if (!series) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500">
            Seri bulunamadı
          </h1>

          <p className="text-zinc-500 mt-3">
            Aradığınız seri mevcut değil veya silinmiş olabilir.
          </p>

          <Link
            href="/series"
            className="inline-block mt-6 bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl font-bold"
          >
            Serilere Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">

      {/* ================================= */}
      {/* SERİ BANNER */}
      {/* ================================= */}

      <section className="relative min-h-[500px] overflow-hidden">

        {/* Arka Plan */}

        <img
          src={series.cover}
          alt={series.title}
          className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent" />

        {/* İçerik */}

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-16 py-24 flex flex-col md:flex-row gap-10 items-center md:items-end">

          {/* KAPAK */}

          <div className="w-48 md:w-64 flex-shrink-0">

            <img
              src={series.cover}
              alt={series.title}
              className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-zinc-800"
            />

          </div>


          {/* BİLGİLER */}

          <div className="flex-1">

            <span className="inline-block bg-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {series.type || "Manhwa"}
            </span>

            <h1 className="text-4xl md:text-6xl font-black mt-4">
              {series.title}
            </h1>

            <p className="text-red-500 font-semibold mt-3">
              {series.genres}
            </p>

            <p className="text-zinc-400 mt-5 max-w-2xl leading-relaxed">
              {series.description}
            </p>

            {/* İSTATİSTİKLER */}

            <div className="flex flex-wrap gap-6 mt-6 text-sm text-zinc-400">

              <span>
                👁 {series.views || 0} Görüntülenme
              </span>

              <span>
                📚 {series.reads || 0} Okuma
              </span>

              <span>
                📖 {series.chapters?.length || 0} Bölüm
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* ================================= */}
      {/* PUANLAMA */}
      {/* ================================= */}

      <section className="max-w-7xl mx-auto px-6 md:px-16 py-10">

        <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-6">

          <h2 className="text-xl font-bold">
            Bu seriyi puanla
          </h2>

          <div className="flex gap-2 mt-4">

            {[1, 2, 3, 4, 5].map((star) => (

              <button
                key={star}
                onClick={() => giveRating(star)}
                className={`text-3xl transition hover:scale-125 ${
                  star <= userRating
                    ? "opacity-100"
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                ⭐
              </button>

            ))}

          </div>

          <p className="text-zinc-400 mt-4">
            Ortalama Puan: ⭐{" "}
            <span className="text-white font-bold">
              {rating || "Henüz puan verilmedi"}
            </span>
          </p>

        </div>

      </section>


      {/* ================================= */}
      {/* BÖLÜMLER */}
      {/* ================================= */}

      <section className="max-w-7xl mx-auto px-6 md:px-16 pb-20">

        <div className="flex items-center justify-between border-b border-zinc-800 pb-5 mb-6">

          <div>

            <h2 className="text-3xl font-black">
              Bölümler
            </h2>

            <p className="text-zinc-500 text-sm mt-2">
              {series.chapters?.length || 0} bölüm mevcut
            </p>

          </div>

        </div>


        {series.chapters && series.chapters.length > 0 ? (

          <div className="space-y-3">

            {series.chapters.map((chapter) => (

              <Link
                key={chapter.id}
                href={`/series/${series.slug}/chapter/${chapter.id}`}
                className="block"
              >

                <div className="bg-[#141414] border border-zinc-800 hover:border-red-600 rounded-xl p-5 flex items-center justify-between transition group">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 bg-red-600/10 border border-red-600/30 rounded-xl flex items-center justify-center text-red-500 font-black">
                      {chapter.chapterNumber}
                    </div>

                    <div>

                      <h3 className="font-bold text-white group-hover:text-red-500 transition">
                        {chapter.title ||
                          `${chapter.chapterNumber}. Bölüm`}
                      </h3>

                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(
                          chapter.createdAt
                        ).toLocaleDateString("tr-TR")}
                      </p>

                    </div>

                  </div>

                  <span className="text-red-500 font-bold group-hover:translate-x-1 transition">
                    Oku →
                  </span>

                </div>

              </Link>

            ))}

          </div>

        ) : (

          <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-12 text-center">

            <div className="text-4xl mb-4">
              📖
            </div>

            <h3 className="text-xl font-bold">
              Henüz bölüm yok
            </h3>

            <p className="text-zinc-500 mt-2">
              Bu seri için henüz bölüm yayınlanmamış.
            </p>

          </div>

        )}

      </section>

    </main>
  );
}