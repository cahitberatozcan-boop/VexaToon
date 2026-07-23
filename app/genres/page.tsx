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
}

export default function GenresPage() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("Tümü");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeries() {
      try {
        const res = await fetch("/api/admin/manwha");

        if (!res.ok) {
          throw new Error("Seriler alınamadı");
        }

        const data = await res.json();

        if (Array.isArray(data.series)) {
          setSeries(data.series);
        }
      } catch (error) {
        console.error(
          "Seriler yüklenirken hata oluştu:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSeries();
  }, []);

  /*
    Buradaki türler her zaman görünecek.
    Serilerde kullanılan diğer türler de otomatik olarak eklenecek.
  */

  const defaultGenres = [
    "BL",
    "GL",
    "Aksiyon",
    "Macera",
    "Komedi",
    "Dram",
    "Romantik",
    "Fantastik",
    "Korku",
    "Gerilim",
    "Doğaüstü",
    "Okul",
    "Shounen",
    "Shoujo",
    "Slice of Life",
    "Psikolojik",
    "Bilim Kurgu",
    "Tarih",
    "Spor",
  ];

  const seriesGenres = series.flatMap((item) => {
    if (!item.genres) {
      return [];
    }

    return item.genres
      .split(",")
      .map((genre) => genre.trim())
      .filter(Boolean);
  });

  const genres = [
    "Tümü",
    ...Array.from(
      new Set([
        ...defaultGenres,
        ...seriesGenres,
      ])
    ),
  ];

  const filteredSeries =
    selectedGenre === "Tümü"
      ? series
      : series.filter((item) => {
          if (!item.genres) {
            return false;
          }

          return item.genres
            .split(",")
            .map((genre) => genre.trim().toLowerCase())
            .includes(selectedGenre.toLowerCase());
        });

  return (
    <main className="min-h-screen text-white px-6 md:px-16 py-12">

      <div className="max-w-7xl mx-auto">

        {/* BAŞLIK */}

        <div className="mb-8">

          <h1 className="text-4xl md:text-5xl font-black">
            Türler
          </h1>

          <p className="text-zinc-400 mt-3">
            Sevdiğin türe göre anime, manga ve manhwa serilerini keşfet.
          </p>

        </div>


        {/* TÜRLER */}

        <div className="flex flex-wrap gap-3 mb-10">

          {genres.map((genre) => (

            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`
                px-5
                py-2.5
                rounded-xl
                border
                font-semibold
                transition-all
                duration-300

                ${
                  selectedGenre === genre
                    ? "bg-red-600 border-red-500 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    : "bg-black/50 border-red-900/60 text-zinc-300 hover:border-red-500 hover:text-white hover:bg-red-950/50"
                }
              `}
            >
              {genre}
            </button>

          ))}

        </div>


        {/* YÜKLENİYOR */}

        {loading ? (

          <div className="py-20 text-center text-zinc-400">
            Seriler yükleniyor...
          </div>

        ) : filteredSeries.length === 0 ? (

          <div className="
            bg-black/40
            border
            border-red-900/50
            rounded-2xl
            p-16
            text-center
          ">

            <div className="text-5xl mb-5">
              📚
            </div>

            <h2 className="text-xl font-bold">
              Bu türde henüz seri bulunmuyor.
            </h2>

            <p className="text-zinc-500 mt-2">
              Bu türe ait seriler eklendiğinde burada görünecek.
            </p>

          </div>

        ) : (

          /* SERİLER */

          <div className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            gap-6
          ">

            {filteredSeries.map((item) => (

              <Link
                key={item.id}
                href={`/series/${item.slug}`}
                className="group"
              >

                <div className="
                  bg-[#141414]
                  rounded-2xl
                  overflow-hidden
                  border
                  border-zinc-800
                  hover:border-red-600
                  hover:-translate-y-2
                  transition-all
                  duration-300
                  shadow-xl
                ">

                  {/* KAPAK */}

                  <div className="
                    h-64
                    relative
                    overflow-hidden
                    bg-zinc-900
                  ">

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

                    <div className="
                      flex
                      items-center
                      justify-between
                      mt-4
                      pt-3
                      border-t
                      border-zinc-800
                    ">

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

      </div>

    </main>
  );
}