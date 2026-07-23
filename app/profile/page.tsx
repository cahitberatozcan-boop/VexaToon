"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserSession {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function ProfilePage() {
  const [tab, setTab] = useState("profile");
  const [user, setUser] = useState<UserSession | null>(null);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      try {
        const parsed = JSON.parse(data);
        setUser(parsed);
        setUsernameInput(parsed.username || "");
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  let userRole = user?.role || "user";
  if (user?.username?.trim().toLowerCase() === "jippon") {
    userRole = "owner";
  }
  const isAuthorizedForAdmin = ["owner", "admin", "anime_manager", "manhwa_manager"].includes(userRole);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return { label: "👑 Kurucu & Owner (Tam Yetki)", color: "bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 text-white font-bold" };
      case "admin":
        return { label: "Sistem Yöneticisi (Admin)", color: "bg-red-600 text-white" };
      case "anime_manager":
        return { label: "Anime Sorumlusu", color: "bg-purple-600 text-white" };
      case "manhwa_manager":
        return { label: "Manhwa Sorumlusu", color: "bg-blue-600 text-white" };
      default:
        return { label: "VexaToon Üyesi (Okuma Yetkisi)", color: "bg-zinc-800 text-zinc-300" };
    }
  };

  const roleInfo = getRoleBadge(userRole);

  const menu = [
    {
      id: "profile",
      title: "Profil",
      icon: "👤"
    },
    {
      id: "security",
      title: "Güvenlik",
      icon: "🔒"
    },
    ...(isAuthorizedForAdmin
      ? [
          {
            id: "admin",
            title: "Admin Panel",
            icon: "⚙️"
          }
        ]
      : [])
  ];

  const handleUpdateProfile = () => {
    if (!user) return;
    const updated = { ...user, username: usernameInput };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
    alert("Profil bilgileri güncellendi");
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white flex pt-20">
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-zinc-800 bg-[#0d0d0d] p-6">
        <div className="bg-gradient-to-br from-red-600/20 to-black border border-zinc-800 rounded-2xl p-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-2xl font-bold uppercase">
            {user?.username ? user.username[0] : "U"}
          </div>

          <h2 className="text-xl font-bold mt-4">
            {user?.username || "Kullanıcı"}
          </h2>

          <p className="text-zinc-400 text-sm mt-1">
            {user?.email || "Giriş yapılmadı"}
          </p>

          <div className="mt-3">
            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`
                w-full flex items-center gap-4 px-5 py-4 rounded-xl transition cursor-pointer
                ${
                  tab === item.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-zinc-400 hover:bg-zinc-800"
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              {item.title}
            </button>
          ))}
        </div>
      </aside>

      {/* CONTENT */}
      <section className="flex-1 p-10">
        <div className="max-w-5xl">
          {tab === "profile" && (
            <div>
              <h1 className="text-4xl font-bold">Profil Ayarları</h1>
              <p className="text-zinc-500 mt-2 mb-8">Hesap bilgilerini yönet.</p>

              <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-8 max-w-xl">
                <label className="text-sm text-zinc-400">Kullanıcı adı</label>
                <input
                  className="w-full mt-2 bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none"
                  placeholder="Kullanıcı adı"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                />

                <label className="text-sm text-zinc-400 mt-6 block">E-posta</label>
                <input
                  className="w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-400 cursor-not-allowed"
                  value={user?.email || ""}
                  disabled
                />

                <label className="text-sm text-zinc-400 mt-6 block">Rol ve Yetki</label>
                <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-zinc-300">
                  {roleInfo.label}
                </div>

                <button
                  onClick={handleUpdateProfile}
                  className="mt-6 bg-red-600 px-8 py-3 rounded-xl hover:bg-red-700 font-semibold cursor-pointer transition"
                >
                  Kaydet
                </button>
              </div>
            </div>
          )}

          {tab === "security" && (
            <div>
              <h1 className="text-4xl font-bold">Güvenlik</h1>
              <p className="text-zinc-500 mt-2 mb-8">Şifre ve hesap güvenliği.</p>

              <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-8 max-w-xl">
                <input
                  type="password"
                  placeholder="Yeni şifre"
                  className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white focus:border-red-600 outline-none"
                />

                <button className="mt-6 bg-red-600 px-8 py-3 rounded-xl hover:bg-red-700 font-semibold cursor-pointer transition">
                  Şifreyi Güncelle
                </button>
              </div>
            </div>
          )}

          {tab === "admin" && isAuthorizedForAdmin && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-red-500">Admin Panel Yönetimi</h1>
                  <p className="text-zinc-500 mt-2">VexaToon içerik ve rol yönetimi genel bakış.</p>
                </div>

                <Link
                  href="/admin"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition flex items-center gap-2"
                >
                  ⚙️ Tam Admin Panele Git
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(userRole === "owner" || userRole === "admin" || userRole === "manhwa_manager") && (
                  <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 hover:border-red-600/50 transition">
                    <div className="text-3xl mb-3">📚</div>
                    <h3 className="text-xl font-bold">Manhwa Yönetimi</h3>
                    <p className="text-zinc-500 mt-2 text-sm">
                      Yeni manhwa serisi ekle, kapak resmi yükle ve içerik açıklamasını düzenle.
                    </p>
                    <Link
                      href="/admin"
                      className="inline-block mt-4 text-red-500 hover:text-red-400 font-semibold text-sm"
                    >
                      Manhwa Ekle &rarr;
                    </Link>
                  </div>
                )}

                {(userRole === "owner" || userRole === "admin" || userRole === "anime_manager") && (
                  <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 hover:border-purple-600/50 transition">
                    <div className="text-3xl mb-3">🎬</div>
                    <h3 className="text-xl font-bold">Anime Yönetimi</h3>
                    <p className="text-zinc-500 mt-2 text-sm">
                      Anime serilerini ve bölümlerini yönet.
                    </p>
                    <Link
                      href="/admin"
                      className="inline-block mt-4 text-purple-400 hover:text-purple-300 font-semibold text-sm"
                    >
                      Anime İşlemleri &rarr;
                    </Link>
                  </div>
                )}

                {(userRole === "owner" || userRole === "admin") && (
                  <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 hover:border-amber-600/50 transition">
                    <div className="text-3xl mb-3">👥</div>
                    <h3 className="text-xl font-bold">Kullanıcı & Roller</h3>
                    <p className="text-zinc-500 mt-2 text-sm">
                      Kullanıcılara Admin, Anime Sorumlusu veya Manhwa Sorumlusu rolü ata.
                    </p>
                    <Link
                      href="/admin"
                      className="inline-block mt-4 text-amber-400 hover:text-amber-300 font-semibold text-sm"
                    >
                      Rolleri Yönet &rarr;
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}