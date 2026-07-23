"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [message, setMessage] = useState("");


  async function handleRegister() {

    if (!username || !email || !password || !passwordAgain) {
      setMessage("Tüm alanları doldur");
      return;
    }


    if (password !== passwordAgain) {
      setMessage("Şifreler aynı değil");
      return;
    }


    try {

      setMessage("Kayıt yapılıyor...");


      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });


      console.log("STATUS:", res.status);
      console.log("URL:", res.url);


      const data = await res.json();


      if (!res.ok) {
        setMessage(data.message || "Kayıt başarısız");
        return;
      }


      setMessage("Kayıt başarılı");


      setTimeout(() => {
        router.push("/login");
      }, 1500);


    } catch (error) {

      console.error(error);

      setMessage("Sunucuya bağlanılamadı");

    }

  }



  return (
    <main className="min-h-screen bg-[#090909] text-white flex items-center justify-center px-6">

      <div className="w-full max-w-md bg-[#171717] border border-zinc-800 rounded-2xl p-8">

        <h1 className="text-3xl font-bold text-red-600 text-center">
          VexaToon
        </h1>

        <p className="text-zinc-400 text-center mt-3">
          Yeni hesap oluştur
        </p>


        <div className="mt-8 space-y-5">

          <input
            placeholder="Kullanıcı adı"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
          />


          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
          />


          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
          />


          <input
            type="password"
            placeholder="Şifre tekrar"
            value={passwordAgain}
            onChange={(e)=>setPasswordAgain(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3"
          />


          <button
            onClick={handleRegister}
            className="w-full bg-red-600 py-3 rounded-lg hover:bg-red-700 transition font-semibold"
          >
            Kayıt Ol
          </button>


          {message && (
            <p className="text-center text-red-500 break-words">
              {message}
            </p>
          )}

        </div>


        <p className="text-center text-zinc-400 mt-6">
          Zaten hesabın var mı?
          <a href="/login" className="text-red-500 ml-2">
            Giriş Yap
          </a>
        </p>


      </div>

    </main>
  );
}