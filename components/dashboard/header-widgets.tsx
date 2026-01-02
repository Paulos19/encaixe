"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Moon, Sun, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";

// Mapeamento simples de WMO Codes (OpenMeteo) para ícones Lucide
const getWeatherIcon = (code: number, isNight: boolean) => {
  if (code === 0) return isNight ? Moon : Sun;
  if (code >= 1 && code <= 3) return isNight ? Cloud : CloudSun;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return Snowflake;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code >= 95) return CloudLightning;
  return Sun;
};

export function HeaderWidgets() {
  const [time, setTime] = useState<Date | null>(null);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);

  // 1. Relógio (Brasília)
  useEffect(() => {
    setTime(new Date()); // Evita hydration mismatch setando apenas no mount
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Clima (São Paulo/Brasília - Open-Meteo Free API)
  useEffect(() => {
    async function fetchWeather() {
      try {
        // Coordenadas de Brasília (-15.78, -47.92) para exemplo
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-15.78&longitude=-47.92&current=temperature_2m,weather_code,is_day&timezone=America%2FSao_Paulo"
        );
        const data = await res.json();
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code,
        });
      } catch (error) {
        console.error("Erro ao carregar clima", error);
      }
    }
    fetchWeather();
    // Atualiza a cada 30 min
    const weatherTimer = setInterval(fetchWeather, 1000 * 60 * 30);
    return () => clearInterval(weatherTimer);
  }, []);

  if (!time) return <div className="w-32 h-10 animate-pulse bg-zinc-900/50 rounded-md" />;

  const isNight = time.getHours() >= 18 || time.getHours() < 6;
  const WeatherIcon = weather ? getWeatherIcon(weather.code, isNight) : Sun;

  return (
    <div className="flex items-center gap-6 select-none">
      {/* Widget Clima */}
      <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50">
        <WeatherIcon 
          className={cn(
            "h-4 w-4", 
            weather?.code === 0 && !isNight ? "text-amber-500" : "text-zinc-400"
          )} 
        />
        <span className="text-sm font-semibold text-zinc-200">
          {weather ? `${weather.temp}°C` : "--"}
        </span>
      </div>

      {/* Widget Relógio - Foco em Legibilidade */}
      <div className="flex flex-col items-end leading-none">
        <span className="text-xl font-bold font-mono tracking-tight text-zinc-100 tabular-nums">
          {time.toLocaleTimeString("pt-BR", { 
            hour: "2-digit", 
            minute: "2-digit",
            timeZone: "America/Sao_Paulo" 
          })}
        </span>
        <span className="text-[10px] font-medium text-amber-500/80 uppercase tracking-widest mt-0.5">
          Brasília
        </span>
      </div>
    </div>
  );
}