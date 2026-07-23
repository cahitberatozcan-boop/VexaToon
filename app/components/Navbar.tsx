"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  username: string;
  email?: string;
  role?: string;
};

export default function Navbar() {
  const [show, setShow] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);
  const [user, setUser] = useState<User | null>(null);

  // ==========================================
  // KULLANICI BİLGİLERİNİ LOCALSTORAGE'DAN AL
  // ==========================================

  useEffect(() => {
    const loadUser = () => {
      const data = localStorage.getItem("user");

      if (!data || data === "undefined" || data === "null") {
        setUser(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(data);

        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(
          "Kullanıcı bilgileri okunamadı:",
          error
        );

        localStorage.removeItem("user");
        setUser(null);
      }
    };

    loadUser();

    // Kullanıcı adı başka bir yerde değişirse
    // Navbar'ın güncellenmesini sağlar.
    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener(
      "userUpdated",
      handleUserUpdate
    );

    return () => {
      window.removeEventListener(
        "userUpdated",
        handleUserUpdate
      );
    };
  }, []);

  // ==========================================
  // SCROLL KONTROLÜ
  // ==========================================

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (
        currentScroll > lastScroll &&
        currentScroll > 100
      ) {
        setShow(false);
      } else {
        setShow(true);
      }

      setLastScroll(currentScroll);
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, [lastScroll]);

  // ==========================================
  // ÇIKIŞ YAP
  // ==========================================

  function logout() {
    localStorage.removeItem("user");

    setUser(null);

    window.dispatchEvent(
      new Event("userUpdated")
    );

    window.location.href = "/";
  }

  return (
    <header
      className={`
        fixed top-0 left-0 w-full z-50
        border-b border-red-900/50
        bg-black/90 backdrop-blur-md
        transition-all duration-500
        ${
          show
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">

        {/* LOGO */}

        <a
          href="/"
          className="flex items-center flex-shrink-0"
        >
          <img
            src="/suzurin%20logo.png"
            alt="Suzurin Logo"
            className="h-12 w-auto object-contain"
          />
        </a>

        {/* MENÜ */}

        <nav className="hidden md:flex items-center gap-3">

          <a
            href="/"
            className="
              px-4 py-2
              rounded-xl
              border border-red-600/50
              bg-gradient-to-r from-red-950/80 via-black to-red-950/80
              text-white
              font-bold
              hover:border-red-500
              hover:from-red-900
              hover:to-black
              hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
              transition-all duration-300
            "
          >
            Ana Sayfa
          </a>

          <a
            href="/series"
            className="
              px-4 py-2
              rounded-xl
              border border-red-600/50
              bg-gradient-to-r from-red-950/80 via-black to-red-950/80
              text-white
              font-bold
              hover:border-red-500
              hover:from-red-900
              hover:to-black
              hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
              transition-all duration-300
            "
          >
            Seriler
          </a>

          <a
            href="/popular"
            className="
              px-4 py-2
              rounded-xl
              border border-red-600/50
              bg-gradient-to-r from-red-950/80 via-black to-red-950/80
              text-white
              font-bold
              hover:border-red-500
              hover:from-red-900
              hover:to-black
              hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
              transition-all duration-300
            "
          >
            Popüler
          </a>

          <a
            href="/genres"
            className="
              px-4 py-2
              rounded-xl
              border border-red-600/50
              bg-gradient-to-r from-red-950/80 via-black to-red-950/80
              text-white
              font-bold
              hover:border-red-500
              hover:from-red-900
              hover:to-black
              hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
              transition-all duration-300
            "
          >
            Türler
          </a>

          <a
            href="/chat"
            className="
              px-4 py-2
              rounded-xl
              border border-red-600/50
              bg-gradient-to-r from-red-950/80 via-black to-red-950/80
              text-white
              font-bold
              hover:border-red-500
              hover:from-red-900
              hover:to-black
              hover:shadow-[0_0_15px_rgba(220,38,38,0.4)]
              transition-all duration-300
            "
          >
            Sohbet
          </a>

        </nav>

        {/* KULLANICI */}

        {user ? (
          <div className="flex items-center gap-3 flex-shrink-0">

            <a
              href="/profile"
              className="
                px-4 py-2
                rounded-xl
                border border-red-600/50
                bg-black/60
                text-white
                font-bold
                hover:border-red-500
                hover:text-red-400
                transition
              "
            >
              {user.username}
            </a>

            <button
              onClick={logout}
              className="
                bg-red-600
                px-5 py-2
                rounded-xl
                font-bold
                hover:bg-red-700
                hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]
                transition
              "
            >
              Çıkış
            </button>

          </div>
        ) : (
          <a
            href="/login"
            className="
              flex-shrink-0
              bg-red-600
              px-5 py-2
              rounded-xl
              font-bold
              hover:bg-red-700
              hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]
              transition
            "
          >
            Giriş
          </a>
        )}

      </div>
    </header>
  );
}