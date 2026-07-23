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

export default function HeroSlider() {
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const duration = 8000;

  useEffect(() => {
    const loadSeries = async () => {
      try {
        const res = await fetch("/api/admin/manwha");
        const data = await res.json();

        if (data.series && data.series.length > 0) {
          setSeries(data.series);
        }
      } catch (error) {
        console.error("Slider serileri yüklenemedi:", error);
      }
    };

    loadSeries();
  }, []);

  useEffect(() => {
    if (series.length <= 1) return;

    const intervalTime = 50;

    const timer = setInterval(() => {
      setProgress((current) => {
        const next = current + (intervalTime / duration) * 100;

        if (next >= 100) {
          setActiveIndex((currentIndex) => {
            return (currentIndex + 1) % series.length;
          });

          return 0;
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [series.length]);

  if (series.length === 0) {
    return null;
  }

  const activeSeries = series[activeIndex];

  const changeSlide = (index: number) => {
    setActiveIndex(index);
    setProgress(0);
  };

  return (
    <section className="relative w-full h-[500px] md:h-[620px] overflow-hidden bg-[#090909]">

      {/* ARKA PLANLAR */}

      {series.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === activeIndex
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <img
            src={item.cover}
            alt={item.title}
            className="w-full h-full object-cover"
          />

          {/* SOL KARARTMA */}

          <div className="absolute inset-0 bg-gradient-to-r from-[#090909] via-[#090909]/70 to-transparent" />

          {/* ALT KARARTMA */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent" />
        </div>
      ))}

      {/* İÇERİK */}

      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 md:px-16 flex items-center">

        <div className="max-w-xl">

          <div className="flex items-center gap-3 mb-4">

            <span className="bg-red-600 px-3 py-1 rounded text-xs font-bold uppercase">
              {activeSeries.type || "MANHWA"}
            </span>

            <span className="text-zinc-300 text-sm">
              {activeSeries.genres}
            </span>

          </div>

          <h1 className="text-4xl md:text-6xl font-black mb-5">
            {activeSeries.title}
          </h1>

          <p className="text-zinc-300 text-sm md:text-base leading-relaxed line-clamp-3 mb-7">
            {activeSeries.description ||
              "Bu seriyi keşfetmek için hemen incelemeye başlayın."}
          </p>

          <div className="flex gap-3">

            <Link
              href={`/series/${activeSeries.slug}`}
              className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
            >
              ▶ İncele
            </Link>

          </div>

        </div>

      </div>

      {/* NETFLIX TARZI İLERLEME ÇUBUKLARI */}

      <div className="absolute bottom-6 left-0 right-0 z-20">

        <div className="max-w-7xl mx-auto px-6 md:px-16">

          <div className="flex gap-2">

            {series.map((item, index) => (

              <button
                key={item.id}
                onClick={() => changeSlide(index)}
                className="relative flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >

                <div
                  className="absolute left-0 top-0 h-full bg-white"
                  style={{
                    width:
                      index === activeIndex
                        ? `${progress}%`
                        : index < activeIndex
                        ? "100%"
                        : "0%",
                  }}
                />

              </button>

            ))}

          </div>

        </div>

      </div>

    </section>
  );
}