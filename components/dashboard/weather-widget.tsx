'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SunIcon, CloudIcon, RainIcon, StormIcon } from '@/components/weather-icons';
import { Loader2, MapPinOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento WMO Weather Codes
const getWeatherIcon = (code: number) => {
  if (code === 0 || code === 1) return <SunIcon />;
  if (code === 2 || code === 3) return <CloudIcon />;
  if ([45, 48].includes(code)) return <CloudIcon />; // Fog
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <RainIcon />;
  if ([95, 96, 99].includes(code)) return <StormIcon />;
  return <CloudIcon />; // Default
};

const getWeatherLabel = (code: number) => {
  if (code === 0) return "Céu Limpo";
  if (code === 1 || code === 2) return "Parc. Nublado";
  if (code === 3) return "Nublado";
  if ([51, 61, 80].includes(code)) return "Chuva Leve";
  if ([53, 63, 81].includes(code)) return "Chuva";
  if ([95, 99].includes(code)) return "Tempestade";
  return "Instável";
};

export function WeatherWidget() {
  const [time, setTime] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: number; code: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 1. Relógio (Brasília)
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        // second: '2-digit' // Opcional, removi para ficar mais limpo visualmente
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Clima (Geo + API)
  useEffect(() => {
    if (!navigator.geolocation) {
      setError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`
        );
        const data = await res.json();
        
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code
        });
      } catch (err) {
        console.error("Erro clima:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, () => {
      setError(true); // Usuário negou permissão
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex items-center gap-3 h-9 px-3 rounded-full bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm overflow-hidden">
      
      {/* Seção do Relógio (Sempre visível) */}
      <div className="flex items-center gap-2 border-r border-zinc-300 dark:border-zinc-700 pr-3">
        <span className="text-sm font-semibold font-mono tracking-tight text-zinc-700 dark:text-zinc-200">
          {time || "--:--"}
        </span>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase">BRT</span>
      </div>

      {/* Seção do Clima (Animada) */}
      <div className="flex items-center gap-2 min-w-[90px] justify-center">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            </motion.div>
          ) : error ? (
            <motion.div 
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 text-xs text-zinc-400"
            >
                <MapPinOff className="h-3 w-3" />
                <span>Loc. Off</span>
            </motion.div>
          ) : (
            <motion.div
              key="weather"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2"
            >
              {getWeatherIcon(weather!.code)}
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  {weather!.temp}°C
                </span>
                <span className="text-[9px] text-zinc-500 font-medium uppercase truncate max-w-[60px]">
                  {getWeatherLabel(weather!.code)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}