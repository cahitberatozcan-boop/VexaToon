"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ChapterItem {
  id: number;
  chapterNumber: number;
  title?: string;
  createdAt: string;
}

interface SeriesDetail {
  id: number;
  title: string;
  slug: string;
  cover: string;
  genres: string;
  description: string;
  type: string;
  views: number;
  reads: number;
  chapters: ChapterItem[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SeriesDetailPage({ params }: PageProps) {
  const { slug } = use(params);

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Favorites & Rating State
  const [isFavorite, setIsFavorite] = useState(false);
  const [averageScore, setAverageScore] = useState<number>(0);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hoverScore, setHoverScore] = useState<number>(0);
  const [viewsCount, setViewsCount] = useState<number>(0);

  useEffect(() => {
    let currentUser: any = null;
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      try {
        currentUser = JSON.parse(data);
        setUser(currentUser);
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetchSeriesData(currentUser);
  }, [slug]);

  const fetchSeriesData = async (currentUser: any) => {
    try {
      const res = await fetch(`/api/admin/manwha`);
      const data = await res.json();
      if (data.series) {
        const found = data.series.find((s: any) => s.slug === slug);
        if (found) {
          setSeries(found);
          setViewsCount(found.views || 0);

          // Trigger Unique View Tracking
          trackUniqueView(found.id, currentUser);

          // Fetch Ratings
          fetchRatings(found.id, currentUser);

          // Fetch Favorite status if user logged in
          if (currentUser) {
            fetchFavoriteStatus(found.id, currentUser.id);
          }
        }
      }
    } catch (err) {
      console.error("Fetch series detail error:", err);
    } finally {
      setLoading(false);
    }
  };

  const trackUniqueView = async (seriesId: number, currentUser: any) => {
    try {
      let identifier = localStorage.getItem("guest_session_id");
      if (!identifier) {
        identifier = "guest_" + Math.random().toString(36).substring(2) + Date.now();
        localStorage.setItem("guest_session_id", identifier);
      }

      const res = await fetch("/api/views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId,
          userId: currentUser?.id || null,
          identifier
        })
      });
      const data = await res.json();
      if (data.views !== undefined) {
        setViewsCount(data.views);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRatings = async (seriesId: number, currentUser: any) => {
    try {
      const url = currentUser
        ? `/api/ratings?seriesId=${seriesId}&userId=${currentUser.id}`
        : `/api/ratings?seriesId=${seriesId}`;
      const res = await fetch(url);
      const data = await res.json();
      setAverageScore(data.averageScore || 0);
      setTotalVotes(data.totalVotes || 0);
      setUserScore(data.userScore || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFavoriteStatus = async (seriesId: number, userId: number) => {
    try {
      const res = await fetch(`/api/favorites?seriesId=${seriesId}&userId=${userId}`);
      const data = await res.json();
      setIsFavorite(!!data.isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user || !series) {
      alert("Favorilere eklemek için lütfen giriş yapın.");
      return;
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, seriesId: series.id })
      });
      const data = await res.json();
      setIsFavorite(data.isFavorite);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRate = async (score: number) => {
    if (!user || !series) {
      alert("Puan vermek için lütfen giriş yapın.");
      return;
    }

    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, seriesId: series.id, score })
      });
      const data = await res.json();
      if (res.ok) {
        setAverageScore(data.averageScore);
        setTotalVotes(data.totalVotes);
        setUserScore(data.userScore);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center">
        <div className="text-zinc-500">Seri detayları yükleniyor...</div>
      </main>
    );
  }

  if (!series) {
    return (
      <main className="min-h-screen bg-[#090909] text-white pt-28 px-6 flex justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Seri Bulunamadı</h1>
          <Link href="/series" className="bg-zinc-800 px-5 py-2.5 rounded-xl text-sm">
            &larr; Tüm Serilere Dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white pt-24 px-6 md:px-16 pb-16">
      <div className="max-w-6xl mx-auto">
        <Link href="/series" className="inline-block text-zinc-400 hover:text-white mb-6 text-sm">
          &larr; Serilere Dön
        </Link>

        {/* HERO BANNER & DETAILS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-[#141414] border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl mb-12">
          {/* COVER */}
          <div className="md:col-span-1">
            <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-xl relative">
              <img src={series.cover} alt={series.title} className="w-full h-96 object-cover" />
              <span className="absolute top-4 left-4 bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full uppercase shadow">
                {series.type || "Manhwa"}
              </span>
            </div>
          </div>

          {/* METADATA */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <span className="px-3.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-full">
                  {series.genres}
                </span>

                <button
                  onClick={handleToggleFavorite}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    isFavorite
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                      : "bg-zinc-800 hover:bg-amber-500 hover:text-black text-amber-400 border border-amber-500/40"
                  }`}
                >
                  <span>{isFavorite ? "★" : "☆"}</span>
                  {isFavorite ? "Favorilerinizde" : "Favorilere Ekle"}
                </button>
              </div>

              <h1 className="text-3xl md:text-4xl font-black mb-4 text-white">{series.title}</h1>

              {/* RATING DISPLAY & INTERACTIVE VOTING */}
              <div className="bg-[#1a1a1a] border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-amber-400">★ {averageScore}</span>
                  <div className="text-xs text-zinc-400">
                    <p className="font-bold text-zinc-200">{totalVotes} Kullanıcı Puanladı</p>
                    <p>{userScore ? `Verdiğiniz Puan: ${userScore}/10` : "Puan vermek için tıklayın"}</p>
                  </div>
                </div>

                {/* 10-STAR SELECTOR */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverScore(star)}
                      onMouseLeave={() => setHoverScore(0)}
                      onClick={() => handleRate(star)}
                      className={`text-lg transition ${
                        star <= (hoverScore || userScore || 0) ? "text-amber-400 scale-110" : "text-zinc-700"
                      }`}
                      title={`${star} Puan Ver`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Konu & Açıklama</h3>
                <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">{series.description}</p>
              </div>
            </div>

            {/* VIEWS & READS BAR */}
            <div className="flex items-center gap-6 bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl text-xs text-zinc-400">
              <div>
                <span className="block text-[10px] uppercase text-zinc-500 font-bold">Benzersiz Görüntülenme</span>
                <span className="font-extrabold text-sm text-white flex items-center gap-1 mt-0.5">
                  👁 {viewsCount}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div>
                <span className="block text-[10px] uppercase text-zinc-500 font-bold">Toplam Bölüm</span>
                <span className="font-extrabold text-sm text-amber-400 mt-0.5 block">
                  📖 {series.chapters?.length || 0} Bölüm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CHAPTERS LIST SECTION */}
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📖</span> Bölüm Listesi ({series.chapters?.length || 0})
          </h2>

          {!series.chapters || series.chapters.length === 0 ? (
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
              Henüz bu seriye eklenmiş bir bölüm yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {series.chapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/series/${series.slug}/chapter/${ch.id}`}
                  className="bg-[#141414] border border-zinc-800 hover:border-red-600 rounded-2xl p-5 transition flex justify-between items-center group shadow-md"
                >
                  <div>
                    <h4 className="font-bold text-white group-hover:text-red-500 transition text-sm">
                      {ch.chapterNumber}. Bölüm {ch.title ? `- ${ch.title}` : ""}
                    </h4>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      {new Date(ch.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                  </div>

                  <span className="bg-red-950 border border-red-800/60 text-red-400 text-xs px-3 py-1.5 rounded-xl font-bold group-hover:bg-red-600 group-hover:text-white transition">
                    Oku / İzle &rarr;
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
