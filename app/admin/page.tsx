"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ROLE_LABELS, normalizeRole, hasAdminPanelAccess, canManageUsers } from "@/lib/auth";

interface ChapterItem {
  id: number;
  chapterNumber: number;
  title?: string;
  pages?: string;
  videoUrl?: string;
  createdAt: string;
}

interface SeriesItem {
  id: number;
  title: string;
  slug: string;
  cover: string;
  genres: string;
  description: string;
  type: string;
  views: number;
  reads: number;
  createdAt: string;
  chapters?: ChapterItem[];
}

interface UserSession {
  id: number;
  username: string;
  email: string;
  role?: string;
}

interface UserListItem {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<"series" | "users">("series");

  // Series Modal & Form States
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("Manhwa");
  const [cover, setCover] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submittingSeries, setSubmittingSeries] = useState(false);
  const [seriesMessage, setSeriesMessage] = useState("");
  const [seriesMessageType, setSeriesMessageType] = useState<"success" | "error">("success");

  // Chapter Modal & Form States
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | "">("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterPages, setChapterPages] = useState<FileList | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [submittingChapter, setSubmittingChapter] = useState(false);
  const [chapterMessage, setChapterMessage] = useState("");
  const [chapterMessageType, setChapterMessageType] = useState<"success" | "error">("success");

  // Series & User Lists
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [userList, setUserList] = useState<UserListItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      try {
        setUser(JSON.parse(data));
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoadingUser(false);
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    setLoadingData(true);
    try {
      const res = await fetch("/api/admin/manwha");
      const data = await res.json();
      if (data.series) {
        setSeriesList(data.series);
      }
    } catch (err) {
      console.error("Fetch series error:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/admin/users?username=${user.username}&role=${user.role}`);
      const data = await res.json();
      if (data.users) {
        setUserList(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const finalUserRole = normalizeRole(user?.username, user?.role);
  const isAuthorized = hasAdminPanelAccess(user?.username, user?.role);
  const canManageUserRoles = canManageUsers(user?.username, user?.role);

  const handleGrantOwner = () => {
    const updatedUser = user
      ? { ...user, role: "owner", username: user.username || "Jippon" }
      : { id: 1, username: "Jippon", email: "jippon@vexatoon.com", role: "owner" };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCover(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const resetSeriesForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setContentType("Manhwa");
    setCover(null);
    setPreviewUrl(null);
    setSeriesMessage("");
  };

  const resetChapterForm = () => {
    setChapterNumber("");
    setChapterTitle("");
    setChapterPages(null);
    setVideoFile(null);
    setVideoUrl("");
    setChapterMessage("");
  };

  async function addSeries(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !category || !description || !cover) {
      setSeriesMessage("Lütfen tüm alanları doldurun ve kapak resmini seçin");
      setSeriesMessageType("error");
      return;
    }

    setSubmittingSeries(true);
    setSeriesMessage("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("type", contentType);
      formData.append("cover", cover);
      formData.append("userRole", finalUserRole);
      formData.append("username", user?.username || "");

      const res = await fetch("/api/admin/manwha", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setSeriesMessage(data.message || "Seri başarıyla eklendi");
        setSeriesMessageType("success");
        resetSeriesForm();
        fetchSeries();
        setTimeout(() => {
          setIsSeriesModalOpen(false);
        }, 1200);
      } else {
        setSeriesMessage(data.message || "Ekleme başarısız oldu");
        setSeriesMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setSeriesMessage("Sunucu bağlantı hatası");
      setSeriesMessageType("error");
    } finally {
      setSubmittingSeries(false);
    }
  }

  async function addChapter(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSeriesId || !chapterNumber) {
      setChapterMessage("Lütfen bir seri seçin ve bölüm numarasını girin");
      setChapterMessageType("error");
      return;
    }

    setSubmittingChapter(true);
    setChapterMessage("");

    try {
      const formData = new FormData();
      formData.append("seriesId", selectedSeriesId.toString());
      formData.append("chapterNumber", chapterNumber);
      formData.append("title", chapterTitle);
      formData.append("userRole", finalUserRole);
      formData.append("username", user?.username || "");
      if (videoUrl) formData.append("videoUrl", videoUrl);
      if (videoFile) formData.append("videoFile", videoFile);

      if (chapterPages) {
        for (let i = 0; i < chapterPages.length; i++) {
          formData.append("pages", chapterPages[i]);
        }
      }

      const res = await fetch("/api/admin/chapter", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        setChapterMessage(data.message || "Bölüm eklendi");
        setChapterMessageType("success");
        resetChapterForm();
        fetchSeries();
        setTimeout(() => {
          setIsChapterModalOpen(false);
        }, 1200);
      } else {
        setChapterMessage(data.message || "Bölüm eklenemedi");
        setChapterMessageType("error");
      }
    } catch (err) {
      console.error(err);
      setChapterMessage("Sunucu hatası oluştu");
      setChapterMessageType("error");
    } finally {
      setSubmittingChapter(false);
    }
  }

  const handleDeleteSeries = async (id: number) => {
    if (!confirm("Bu seriyi ve tüm bölümlerini silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/admin/manwha?id=${id}&username=${user?.username}&role=${user?.role}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSeriesList((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRole = async (targetUserId: number, newRole: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUserId: user.id,
          targetUserId,
          newRole
        })
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center">
        <div className="text-zinc-400">Yükleniyor...</div>
      </main>
    );
  }

  // Strict Access Denied Screen
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-[#141414] border border-red-900/50 rounded-2xl p-8 text-center shadow-2xl">
          <div className="text-5xl mb-4">⛔</div>
          <h1 className="text-2xl font-bold text-red-500">Erişim Reddedildi</h1>
          <p className="text-zinc-400 mt-3 text-sm leading-relaxed">
            Bu alana erişim yetkiniz bulunmamaktadır. Admin Paneli sadece <b>Owner</b>, <b>Admin</b>, <b>Anime Sorumlusu</b>, <b>Manhwa Sorumlusu</b> veya <b>Manga Sorumlusu</b> hesaplarına açıktır.
          </p>
          <p className="text-zinc-500 mt-2 text-xs">
            Mevcut Rolünüz: <span className="text-zinc-300 font-semibold">{ROLE_LABELS[finalUserRole] || finalUserRole}</span>
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={handleGrantOwner}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-red-600/30 cursor-pointer"
            >
              👑 Jippon / Owner Olarak Paneli Aç
            </button>

            <Link
              href="/"
              className="inline-block bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold px-6 py-3 rounded-xl transition text-sm"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const selectedSeries = seriesList.find((s) => s.id === selectedSeriesId);

  return (
    <main className="min-h-screen bg-[#090909] text-white p-6 md:p-12 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black text-red-600">VexaToon Admin Panel</h1>
              <span className="px-3.5 py-1 bg-red-950 border border-red-800 text-red-400 text-xs font-semibold rounded-full uppercase">
                {ROLE_LABELS[finalUserRole] || finalUserRole}
              </span>
            </div>
            <p className="text-zinc-400 mt-1 text-sm">
              Hoş geldin, <b className="text-white">{user?.username || "Jippon"}</b>! Yönetim paneli.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetSeriesForm();
                setIsSeriesModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-3 text-sm rounded-xl shadow-lg shadow-red-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>➕</span> İçerik Ekle (Anime/Manga/Manhwa)
            </button>

            <button
              onClick={() => {
                resetChapterForm();
                if (seriesList.length > 0) setSelectedSeriesId(seriesList[0].id);
                setIsChapterModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-3 text-sm rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>📖</span> Bölüm Ekle
            </button>
          </div>
        </div>

        {/* ADMIN NAVIGATION TABS */}
        <div className="flex gap-4 border-b border-zinc-800 mt-8">
          <button
            onClick={() => {
              setActiveTab("series");
              fetchSeries();
            }}
            className={`pb-4 px-4 font-bold text-sm border-b-2 transition ${
              activeTab === "series" ? "border-red-600 text-red-500" : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            📚 İçerik ve Bölüm Yönetimi ({seriesList.length})
          </button>

          {canManageUserRoles && (
            <button
              onClick={() => {
                setActiveTab("users");
                fetchUsers();
              }}
              className={`pb-4 px-4 font-bold text-sm border-b-2 transition ${
                activeTab === "users" ? "border-red-600 text-red-500" : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              👥 Kullanıcı & Rol Yönetimi
            </button>
          )}
        </div>

        {/* MODAL FORM FOR ADDING SERIES */}
        {isSeriesModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>➕</span> Yeni İçerik Ekle
                </h2>
                <button onClick={() => setIsSeriesModalOpen(false)} className="text-zinc-400 hover:text-white text-xl font-bold p-2">
                  ✕
                </button>
              </div>

              <form onSubmit={addSeries} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">İçerik Türü *</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none font-bold"
                  >
                    <option value="Manhwa">Manhwa (Webtoon / Kore)</option>
                    <option value="Manga">Manga (Japon)</option>
                    <option value="Anime">Anime (Çizgi Dizi / Çizgi Film)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Seri / İçerik Adı *</label>
                  <input
                    type="text"
                    placeholder="Örn: Solo Leveling veya Attack on Titan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Kategori / Tür *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none"
                  >
                    <option value="">Kategori seçin...</option>
                    <option value="Aksiyon">Aksiyon</option>
                    <option value="Fantastik">Fantastik</option>
                    <option value="Macera">Macera</option>
                    <option value="Dövüş">Dövüş</option>
                    <option value="Romantik">Romantik</option>
                    <option value="Komedi">Komedi</option>
                    <option value="Dram">Dram</option>
                    <option value="Bilim Kurgu">Bilim Kurgu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Konusu / Açıklaması *</label>
                  <textarea
                    rows={4}
                    placeholder="İçerik konusunu detaylıca buraya yazın..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Kapak Resmi Dosyası *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                  />
                  {previewUrl && (
                    <div className="mt-4 flex items-center gap-4 bg-zinc-900/50 p-3 border border-zinc-800 rounded-xl">
                      <img src={previewUrl} alt="Önizleme" className="w-20 h-28 object-cover rounded-lg border border-zinc-700" />
                      <div className="text-xs text-zinc-400">
                        <p className="font-semibold text-zinc-200">{cover?.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                {seriesMessage && (
                  <div
                    className={`p-4 rounded-xl text-sm font-semibold border ${
                      seriesMessageType === "success"
                        ? "bg-green-950/60 border-green-800 text-green-400"
                        : "bg-red-950/60 border-red-800 text-red-400"
                    }`}
                  >
                    {seriesMessage}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSeriesModalOpen(false)}
                    className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded-xl font-semibold transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingSeries}
                    className="w-2/3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-red-600/30 cursor-pointer"
                  >
                    {submittingSeries ? "Kaydediliyor..." : "➕ Kaydet ve Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL FORM FOR ADDING CHAPTER */}
        {isChapterModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141414] border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800 mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📖</span> Yeni Bölüm Ekle
                </h2>
                <button onClick={() => setIsChapterModalOpen(false)} className="text-zinc-400 hover:text-white text-xl font-bold p-2">
                  ✕
                </button>
              </div>

              <form onSubmit={addChapter} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-2">Seri Seçin *</label>
                  <select
                    value={selectedSeriesId}
                    onChange={(e) => setSelectedSeriesId(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-600 outline-none font-bold"
                  >
                    {seriesList.length === 0 && <option value="">Önce bir içerik eklemelisiniz</option>}
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        [{s.type}] {s.title} ({s.genres})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Bölüm Numarası *</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Örn: 1 veya 1.5"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Bölüm Başlığı (İsteğe Bağlı)</label>
                    <input
                      type="text"
                      placeholder="Örn: Uyanış"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>

                {selectedSeries?.type === "Anime" ? (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Anime Video Dosyası veya URL</label>
                    <input
                      type="text"
                      placeholder="Video URL veya embed adresi (https://...)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white focus:border-amber-600 outline-none mb-3"
                    />
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Veya Doğrudan Video Dosyası Yükleyin:</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">Manga/Manhwa Sayfaları (Çoklu Resim Seçimi)</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setChapterPages(e.target.files)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-600 file:text-white cursor-pointer"
                    />
                    {chapterPages && (
                      <p className="mt-2 text-xs text-amber-400 font-semibold">
                        ✓ {chapterPages.length} sayfa yüklenecek olarak seçildi.
                      </p>
                    )}
                  </div>
                )}

                {chapterMessage && (
                  <div
                    className={`p-4 rounded-xl text-sm font-semibold border ${
                      chapterMessageType === "success"
                        ? "bg-green-950/60 border-green-800 text-green-400"
                        : "bg-red-950/60 border-red-800 text-red-400"
                    }`}
                  >
                    {chapterMessage}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChapterModalOpen(false)}
                    className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-4 rounded-xl font-semibold transition"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingChapter || seriesList.length === 0}
                    className="w-2/3 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition shadow-lg shadow-amber-600/30 cursor-pointer"
                  >
                    {submittingChapter ? "Bölüm Yükleniyor..." : "📖 Bölümü Yayınla"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 1: SERIES & CHAPTER MANAGEMENT */}
        {activeTab === "series" && (
          <div className="mt-8">
            {loadingData ? (
              <div className="text-zinc-500 py-12 text-center">İçerikler yükleniyor...</div>
            ) : seriesList.length === 0 ? (
              <div className="bg-[#141414] border border-zinc-800 rounded-2xl p-12 text-center text-zinc-500">
                Henüz hiçbir içerik eklenmemiş. Yukarıdaki "İçerik Ekle" butonuna tıklayarak ilk seriyi oluşturun.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {seriesList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#141414] border border-zinc-800 rounded-2xl overflow-hidden hover:border-red-600/50 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-56 relative bg-zinc-900">
                        <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                        <span className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-zinc-700 text-xs px-3 py-1 rounded-full text-zinc-200 font-bold uppercase">
                          {item.type || "Manhwa"}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-lg text-white truncate">{item.title}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-red-500 font-semibold">{item.genres}</p>
                          <span className="text-xs bg-zinc-900 border border-zinc-800 text-amber-400 px-2 py-0.5 rounded-md font-bold">
                            📖 {item.chapters?.length || 0} Bölüm
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border-t border-zinc-800/50 flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedSeriesId(item.id);
                          resetChapterForm();
                          setIsChapterModalOpen(true);
                        }}
                        className="w-full bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-900/60 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        + Bölüm Ekle
                      </button>

                      <button
                        onClick={() => handleDeleteSeries(item.id)}
                        className="w-full bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 py-1.5 rounded-xl text-xs transition cursor-pointer"
                      >
                        🗑️ Seriyi Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER & ROLE MANAGEMENT (OWNER & ADMIN ONLY) */}
        {activeTab === "users" && canManageUserRoles && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4">Kullanıcı Rolü Atama ve Yönetimi</h2>

            {loadingData ? (
              <div className="text-zinc-500 py-8 text-center">Kullanıcılar yükleniyor...</div>
            ) : (
              <div className="bg-[#141414] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs text-zinc-400 uppercase">
                      <th className="p-4">Kullanıcı</th>
                      <th className="p-4">E-posta</th>
                      <th className="p-4">Mevcut Rol</th>
                      <th className="p-4 text-right">Rol Değiştir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm">
                    {userList.map((u) => (
                      <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span>👤</span> {u.username}
                        </td>
                        <td className="p-4 text-zinc-400">{u.email}</td>
                        <td className="p-4 font-semibold text-amber-400">
                          {ROLE_LABELS[u.role] || u.role}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 text-xs text-white rounded-xl p-2 font-semibold cursor-pointer outline-none focus:border-red-600"
                          >
                            <option value="user">Okuyucu (Normal Üye)</option>
                            <option value="owner">👑 Owner (Kurucu)</option>
                            <option value="admin">🛡️ Admin (Yönetici)</option>
                            <option value="anime_manager">🎬 Anime Sorumlusu</option>
                            <option value="manhwa_manager">📚 Manhwa Sorumlusu</option>
                            <option value="manga_manager">📖 Manga Sorumlusu</option>
                            <option value="translator">🌐 Çevirmen</option>
                            <option value="editor">✏️ Editör</option>
                            <option value="manhwa_editor">🎨 Manhwa Editörü</option>
                            <option value="anime_editor">🎥 Anime Editörü</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}