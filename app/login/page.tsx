"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  /*
  ==========================================
  GOOGLE LOGIN KONTROLÜ
  ==========================================
  */

  useEffect(() => {
    const googleUser =
      searchParams.get("googleUser");

    const error =
      searchParams.get("error");

    if (googleUser) {
      try {
        const user: User =
          JSON.parse(
            decodeURIComponent(
              googleUser
            )
          );

        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        setMessage(
          "Google ile giriş başarılı!"
        );

        /*
        URL'deki googleUser bilgisini temizle
        */

        window.history.replaceState(
          {},
          "",
          "/login"
        );

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);

      } catch (error) {
        console.error(
          "Google user parse error:",
          error
        );

        setMessage(
          "Google kullanıcı bilgileri alınamadı."
        );
      }
    }

    if (error) {
      console.error(
        "Google Login Error:",
        error
      );

      if (
        error ===
        "google_token"
      ) {
        setMessage(
          "Google doğrulaması başarısız."
        );
      }

      else if (
        error ===
        "google_user"
      ) {
        setMessage(
          "Google kullanıcı bilgileri alınamadı."
        );
      }

      else if (
        error ===
        "email_not_verified"
      ) {
        setMessage(
          "Google hesabınızın e-posta adresi doğrulanmamış."
        );
      }

      else if (
        error ===
        "google_failed"
      ) {
        setMessage(
          "Google ile giriş başarısız."
        );
      }

      else {
        setMessage(
          "Google girişinde bir hata oluştu."
        );
      }
    }
  }, [
    searchParams,
    router,
  ]);

  /*
  ==========================================
  NORMAL LOGIN
  ==========================================
  */

  async function handleLogin() {
    if (!email || !password) {
      setMessage(
        "E-posta ve şifre gerekli"
      );
      return;
    }

    try {
      setMessage(
        "Giriş yapılıyor..."
      );

      const res =
        await fetch(
          "/api/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                email,
                password,
              }),
          }
        );

      const data =
        await res.json();

      console.log(
        "LOGIN:",
        data
      );

      if (res.ok) {
        localStorage.setItem(
          "user",
          JSON.stringify(
            data.user
          )
        );

        setMessage(
          "Hoş geldin!"
        );

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);

      } else {
        setMessage(
          data.message ||
            "Giriş başarısız"
        );
      }

    } catch (error) {
      console.error(
        error
      );

      setMessage(
        "Sunucuya bağlanılamadı"
      );
    }
  }

  /*
  ==========================================
  SAYFA
  ==========================================
  */

  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-[#171717] border border-zinc-800 rounded-2xl p-8">

        <h1 className="text-3xl font-bold text-red-600 text-center">
          VexaToon
        </h1>

        <p className="text-zinc-400 text-center mt-3">
          Hesabına giriş yap
        </p>

        <div className="mt-8 space-y-5">

          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-red-600"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 outline-none focus:border-red-600"
          />

          <button
            onClick={
              handleLogin
            }
            className="w-full bg-red-600 py-3 rounded-lg hover:bg-red-700 transition font-semibold cursor-pointer"
          >
            Giriş Yap
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-zinc-700 flex-1" />
            <span className="text-xs text-zinc-500">
              VEYA
            </span>
            <div className="h-px bg-zinc-700 flex-1" />
          </div>

          <a
            href="/api/auth/google"
            className="w-full bg-white text-black py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition"
          >
            <span className="text-lg">
              G
            </span>

            Google ile Giriş Yap
          </a>

          {message && (
            <p className="text-center text-red-500">
              {message}
            </p>
          )}

        </div>

        <p className="text-center text-zinc-400 mt-6">

          Hesabın yok mu?

          <a
            href="/register"
            className="text-red-500 ml-2 hover:text-red-400"
          >
            Kayıt Ol
          </a>

        </p>

      </div>

    </main>
  );
}