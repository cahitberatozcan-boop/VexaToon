"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ROLE_LABELS, normalizeRole } from "@/lib/auth";

interface ChatMessageItem {
  id: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

interface UserSession {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export default function ChatPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = localStorage.getItem("user");
    if (data && data !== "undefined") {
      try {
        setUser(JSON.parse(data));
      } catch {
        localStorage.removeItem("user");
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 2500); // 2.5 second polling
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Fetch chat error:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("Sohbete katılmak için lütfen giriş yapın");
      return;
    }

    if (!inputContent.trim()) return;

    setSending(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          content: inputContent
        })
      });

      const data = await res.json();

      if (res.ok) {
        setInputContent("");
        fetchMessages();
      } else {
        setErrorMsg(data.message || "Mesaj gönderilemedi");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Sunucuya bağlanılamadı");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat?id=${messageId}&userId=${user.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentUserRole = normalizeRole(user?.username, user?.role);
  const canModerate = ["owner", "admin", "anime_manager", "manhwa_manager", "manga_manager"].includes(currentUserRole);

  return (
    <main className="min-h-screen bg-[#090909] text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-4xl mx-auto bg-[#141414] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[78vh]">
        {/* CHAT HEADER */}
        <div className="bg-[#181818] p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-red-600 flex items-center gap-2">
              <span>💬</span> VexaToon Genel Sohbet
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Toplulukla ve anime/manga severlerle sohbet et!
            </p>
          </div>

          <div className="text-xs text-zinc-500">
            🟢 Canlı Odadasınız ({messages.length} Mesaj)
          </div>
        </div>

        {/* MESSAGES CONTAINER */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-zinc-500 my-auto py-12">
              Henüz mesaj bulunmuyor. İlk mesajı sen yaz!
            </div>
          ) : (
            messages.map((m) => {
              const role = normalizeRole(m.user.username, m.user.role);
              const roleLabel = ROLE_LABELS[role] || "Okuyucu";
              const isMe = user?.id === m.user.id;

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} group`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-zinc-300">
                      {m.user.username}
                    </span>

                    {role !== "user" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-950/80 border border-red-800 text-red-400">
                        {roleLabel}
                      </span>
                    )}

                    <span className="text-[10px] text-zinc-500">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {canModerate && (
                      <button
                        onClick={() => handleDeleteMessage(m.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-400 transition ml-2 cursor-pointer"
                        title="Mesajı Sil"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  <div
                    className={`max-w-md p-4 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? "bg-red-600 text-white rounded-tr-none"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* CHAT INPUT FORM */}
        <div className="p-4 border-t border-zinc-800 bg-[#181818]">
          {!user ? (
            <div className="text-center py-2 text-sm text-zinc-400">
              Sohbete mesaj yazabilmek için lütfen{" "}
              <Link href="/login" className="text-red-500 hover:underline font-bold">
                Giriş Yapın
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                placeholder="Mesajınızı yazın... (Spam yapmayın)"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                maxLength={500}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3.5 text-white focus:border-red-600 outline-none text-sm"
              />

              <button
                type="submit"
                disabled={sending || !inputContent.trim()}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-7 py-3.5 rounded-xl transition cursor-pointer text-sm flex items-center gap-1.5"
              >
                {sending ? "..." : "Gönder 🚀"}
              </button>
            </form>
          )}

          {errorMsg && (
            <p className="text-xs text-red-500 mt-2 font-semibold text-center">
              {errorMsg}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
