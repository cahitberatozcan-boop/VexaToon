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

export default function SeriesPage() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      const res = await fetch("/api/admin/manwha");
      const data = await res.json();
      if (data.series) {
        setSeries(data.series);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSeries = series.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre ? item.genres.toLowerCase().includes(selectedGenre.toLowerCase()) : true;
    return matchesSearch && matchesGenre;
  });

  return (
    <main className="min-h-screen bg-[#090909] text-white pt-24 px-6 md:px-16 pb-16">
      <section className="max-w-7xl mx-auto">
        <div className="border-b border-zinc-800 pb-6 mb-8">
          <h1 className="text-4xl font-black text-red-600">Tüm Seriler</h1>
          <p className="text-zinc-400 mt-2 text-sm">
            VexaToon üzerindeki eklenmiş tüm anime, manga ve manhwa serilerini keşfet.
          </p>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
          <input
            type="text"
            placeholder="Seri ismi ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 bg-[#141414] border border-zinc-700 rounded-xl px-5 py-3 outline-none focus:border-red-600 text-sm"
          />

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setSelectedGenre("")}
              className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                selectedGenre === ""
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-[#141414] border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              Tümü
            </button>

            {["Aksiyon", "Fantastik", "Macera", "Dövüş", "Romantik", "Komedi", "Dram", "Bilim Kurgu"].map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  selectedGenre === genre
                    ? "bg-red-600 border-red-600 text-white"
                    : "bg-[#141414] border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* SERIES GRID */}
        {loading ? (
          <div className="text-center text-zinc-500 py-16">Seriler yüklenecek...</div>
        ) : filteredSeries.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-16 text-center text-zinc-500">
            {series.length === 0
              ? "Henüz eklenmiş bir seri bulunmuyor. Admin panelinden ilk seriyi ekleyebilirsiniz."
              : "Aramanıza uygun seri bulunamadı."}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredSeries.map((item) => (
              <Link key={item.id} href={`/series/${item.slug}`}>
                <div className="bg-[#141414] rounded-2xl overflow-hidden border border-zinc-800 hover:border-red-600 hover:-translate-y-1.5 transition duration-200 shadow-xl flex flex-col justify-between h-full group">
                  <div>
                    <div className="h-64 relative bg-zinc-900 overflow-hidden">
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-zinc-700 text-[10px] px-2.5 py-1 rounded-full text-zinc-200 uppercase font-bold">
                        {item.type || "Manhwa"}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-base text-white truncate">{item.title}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-red-500 font-semibold">{item.genres}</p>
                        <span className="text-[11px] text-amber-400 font-bold">
                          📖 {item.chapters?.length || 0} Bölüm
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800/50 flex justify-between items-center text-xs text-zinc-500">
                    <span>👁 {item.views}</span>
                    <span className="text-red-500 font-bold group-hover:translate-x-1 transition">Detay &rarr;</span>
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