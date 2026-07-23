"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SeriesItem {
  id: number;
  title: string;
  slug: string;
  cover: string;
  type: string;
  genres: string;
  description: string;
  views: number;
  reads: number;
  chapters?: { id: number }[];
}

export default function Home() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/manwha")
      .then((res) => res.json())
      .then((data) => {
        if (data.series) {
          setSeries(data.series);
        }
      })
      .catch((error) => {
        console.error("Seriler yüklenirken hata oluştu:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen text-white">

      {/* BANNER */}

      <section className="relative h-[550px] md:h-[650px] w-full overflow-hidden">

        <img
          src="/Firefly.jpg"
          alt="Firefly"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-10 md:px-16 flex items-center">

          <div className="max-w-xl">

            <span className="inline-block bg-red-600 px-3 py-1 rounded text-xs font-bold uppercase">
              Manhwa
            </span>

            <h1 className="text-5xl md:text-6xl font-black mt-4">
              Firefly
            </h1>

            <p className="text-zinc-300 mt-4 text-sm md:text-base leading-relaxed">
              Firefly serisini Suzurin üzerinden keşfet.
              Serinin bölümlerini okumaya hemen başlayabilirsin.
            </p>

            <Link
              href="/series/firefly"
              className="inline-block mt-6 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
            >
              İncele
            </Link>

          </div>

        </div>

      </section>

      {/* SERİLER */}

      <section className="max-w-7xl mx-auto px-6 md:px-16 py-12">

        <div className="flex items-end justify-between border-b border-red-900/50 pb-6 mb-8">

          <div>

            <h2 className="text-3xl md:text-4xl font-black">
              Seriler
            </h2>

            <p className="text-zinc-400 mt-2 text-sm">
              Suzurin'deki anime, manga ve manhwa serilerini keşfet.
            </p>

          </div>

          <Link
            href="/series"
            className="text-red-500 hover:text-red-400 text-sm font-semibold transition"
          >
            Tümünü Gör →
          </Link>

        </div>

        {loading ? (

          <div className="text-center text-zinc-400 py-20">
            Seriler yükleniyor...
          </div>

        ) : series.length === 0 ? (

          <div className="bg-black/40 border border-red-900/50 rounded-2xl p-16 text-center text-zinc-400">
            Henüz eklenmiş bir seri bulunmuyor.
          </div>

        ) : (

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

            {series.map((item) => (

              <Link
                key={item.id}
                href={`/series/${item.slug}`}
                className="group"
              >

                <div className="bg-[#141414] rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-600 hover:-translate-y-1.5 transition duration-200 shadow-xl">

                  <div className="h-64 relative bg-zinc-900 overflow-hidden">

                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    <span className="absolute top-3 right-3 bg-black/80 border border-zinc-700 text-[10px] px-2.5 py-1 rounded-full text-zinc-200 uppercase font-bold">
                      {item.type || "Manhwa"}
                    </span>

                  </div>

                  <div className="p-4">

                    <h2 className="font-bold text-base text-white truncate">
                      {item.title}
                    </h2>

                    <p className="text-xs text-red-500 font-semibold mt-1 truncate">
                      {item.genres || "Tür belirtilmemiş"}
                    </p>

                    <div className="flex items-center gap-1 mt-3 text-xs text-zinc-400">
                      <span>📖</span>
                      <span>
                        {item.chapters?.length || 0} Bölüm
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">

                      <span className="text-xs text-zinc-500">
                        👁 {item.views || 0}
                      </span>

                      <span className="text-xs text-zinc-500">
                        📚 {item.reads || 0}
                      </span>

                    </div>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        )}

      </section>

    </main>
  );
}