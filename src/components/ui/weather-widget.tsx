"use client";

import { useEffect, useState } from "react";
import { CloudSun } from "lucide-react";

export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; desc: string; city: string } | null>(null);

  useEffect(() => {
    // Mock weather for now as requested (or use free API if needed, but mock is safer without keys)
    // In a real app, I'd use OpenMeteo or similar.
    // Let's try to fetch from OpenMeteo for "Beijing" (default) or guess based on timezone
    
    async function fetchWeather() {
      try {
        // Defaulting to Beijing for demo
        const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&current=temperature_2m,weather_code&timezone=Asia%2FShanghai");
        const data = await res.json();
        const temp = data.current.temperature_2m;
        const code = data.current.weather_code;
        
        // Simple code map
        let desc = "晴";
        if (code > 0 && code <= 3) desc = "多云";
        else if (code > 3 && code < 50) desc = "阴";
        else if (code >= 50) desc = "雨/雪";

        setWeather({ temp, desc, city: "北京" });
      } catch (e) {
        setWeather({ temp: 25, desc: "晴", city: "北京" });
      }
    }

    fetchWeather();
  }, []);

  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/20 px-3 py-1 rounded-full">
      <CloudSun className="h-4 w-4" />
      <span>{weather.city}</span>
      <span>{weather.temp}°C</span>
      <span>{weather.desc}</span>
    </div>
  );
}
