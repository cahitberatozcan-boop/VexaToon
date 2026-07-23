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
  views: number;
  reads: number;
  chapters?: {
    id: number;
  }[];
}

export default function PopularPage() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPopularSeries() {
      try {
        setLoading(true);

        const res = await fetch("/api/admin/manwha");

        if (!res.ok) {
          throw new Error("Seriler alınamadı");
        }

        const data = await res.json();

        if (Array.isArray(data.series)) {

          // En fazla görüntülenenden
          // en az görüntülenene doğru sırala
          const sortedSeries = [...data.series].sort(
            (a: SeriesItem, b: SeriesItem) => {
              return (b.views || 0) - (a.views || 0);
            }
          );

          setSeries(sortedSeries);
        }

      } catch (error) {
        console.error(
          "Popüler seriler yüklenirken hata oluştu:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPopularSeries();
  }, []);

  return (
    <main className="min-h-screen text-white px-6 md:px-16 py-12">

      <div className="max-w-7xl mx-auto">

        {/* BAŞLIK */}

        <div className="mb-10">

          <h1 className="text-4xl md:text-5xl font-black">
            Popüler Seriler
          </h1>

          <p className="text-zinc-400 mt-3">
            En çok görüntülenen serilerden başlayarak
            popüler içerikleri keşfet.
          </p>

        </div>


        {/* YÜKLENİYOR */}

        {loading ? (

          <div className="py-20 text-center text-zinc-400">
            Popüler seriler yükleniyor...
          </div>

        ) : series.length === 0 ? (

          <div className="bg-black/40 border border-red-900/50 rounded-2xl p-16 text-center">

            <div className="text-5xl mb-5">
              📚
            </div>

            <h2 className="text-xl font-bold">
              Henüz seri bulunmuyor.
            </h2>

            <p className="text-zinc-500 mt-2">
              Seriler eklendiğinde burada görünecek.
            </p>

          </div>

        ) : (

          /* SERİLER */

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">

            {series.map((item, index) => (

              <Link
                key={item.id}
                href={`/series/${item.slug}`}
                className="group"
              >

                <div className="relative bg-[#141414] rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-600 hover:-translate-y-2 transition-all duration-300 shadow-xl">


                  {/* SIRALAMA */}

                  <div className="
                    absolute
                    top-3
                    left-3
                    z-10
                    w-9
                    h-9
                    rounded-full
                    bg-black/90
                    border
                    border-red-600
                    flex
                    items-center
                    justify-center
                    text-sm
                    font-black
                    text-red-500
                  ">
                    #{index + 1}
                  </div>


                  {/* KAPAK */}

                  <div className="h-64 relative overflow-hidden bg-zinc-900">

                    <img
                      src={item.cover}
                      alt={item.title}
                      className="
                        w-full
                        h-full
                        object-cover
                        group-hover:scale-105
                        transition
                        duration-300
                      "
                    />


                    {/* TÜR */}

                    <span className="
                      absolute
                      top-3
                      right-3
                      bg-black/80
                      backdrop-blur-md
                      border
                      border-zinc-700
                      text-[10px]
                      px-2.5
                      py-1
                      rounded-full
                      text-zinc-200
                      uppercase
                      font-bold
                    ">
                      {item.type || "Manhwa"}
                    </span>

                  </div>


                  {/* BİLGİLER */}

                  <div className="p-4">

                    <h2 className="
                      font-bold
                      text-base
                      text-white
                      truncate
                    ">
                      {item.title}
                    </h2>


                    <p className="
                      text-xs
                      text-red-500
                      font-semibold
                      mt-1
                      truncate
                    ">
                      {item.genres || "Tür belirtilmemiş"}
                    </p>


                    {/* İSTATİSTİKLER */}

                    <div className="
                      flex
                      items-center
                      justify-between
                      mt-4
                      pt-3
                      border-t
                      border-zinc-800
                    ">

                      <span className="text-xs text-zinc-400">
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

      </div>

    </main>
  );
}