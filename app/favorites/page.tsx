"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FavoriteItem {
  id: number;
  series: {
    id: number;
    title: string;
    slug: string;
    cover: string;
    type: string;
    genres: string;
    description: string;
    chapters?: { id: number }[];
  };
}

export default function FavoritesPage() {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      try {
        const parsed = JSON.parse(data);
        setUser(parsed);
        fetchFavorites(parsed.id);
      } catch {
        localStorage.removeItem("user");
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = async (userId: number) => {
    try {
      const res = await fetch(`/api/favorites?userId=${userId}`);
      const data = await res.json();
      if (data.favorites) {
        setFavorites(data.favorites);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (seriesId: number) => {
    if (!user) return;
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, seriesId })
      });
      setFavorites((prev) => prev.filter((f) => f.series.id !== seriesId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center">
        <div className="text-zinc-500">Favorileriniz yükleniyor...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center">
        <div className="max-w-md w-full bg-[#141414] border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h1 className="text-2xl font-bold mb-3">Favorilerim</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Favori serilerinizi görmek ve yeni bölümlerden anında bildirim almak için giriş yapmalısınız.
          </p>
          <Link
            href="/login"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white pt-24 px-6 md:px-16 pb-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-red-600 flex items-center gap-2">
              <span>⭐</span> Favori Serilerim
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Takip ettiğiniz anime, manga ve manhwa içerikleri ({favorites.length})
            </p>
          </div>

          <Link
            href="/series"
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Yeni Seriler Keşfet
          </Link>
        </div>

        {favorites.length === 0 ? (
          <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
            Henüz favorilerinize bir seri eklemediniz. Serilerin detay sayfasındaki "⭐ Favorilere Ekle" butonunu kullanarak buraya ekleyebilirsiniz.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((fav) => (
              <div
                key={fav.id}
                className="bg-[#141414] border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition flex flex-col justify-between group"
              >
                <div>
                  <div className="h-64 relative bg-zinc-900 overflow-hidden">
                    <img
                      src={fav.series.cover}
                      alt={fav.series.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-zinc-700 text-[10px] px-2.5 py-1 rounded-full text-zinc-200 uppercase font-bold">
                      {fav.series.type || "Manhwa"}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-base text-white truncate">{fav.series.title}</h3>
                    <p className="text-xs text-red-500 font-semibold mt-1">{fav.series.genres}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-zinc-800/50 flex flex-col gap-2">
                  <Link
                    href={`/series/${fav.series.slug}`}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-xl text-xs font-bold transition"
                  >
                    Detaya Git &rarr;
                  </Link>

                  <button
                    onClick={() => removeFavorite(fav.series.id)}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 py-1.5 rounded-xl text-xs transition cursor-pointer"
                  >
                    Favorilerden Çıkar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
