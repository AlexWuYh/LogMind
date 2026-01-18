"use client";

import { useEffect, useState } from "react";
import { CloudSun } from "lucide-react";

export function WeatherWidget() {
  const [weather, setWeather] = useState<{ temp: number; desc: string; city: string } | null>(null);

  useEffect(() => {
    async function fetchWeather(lat: number, lon: number, cityName?: string) {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
        const data = await res.json();
        const temp = data.current.temperature_2m;
        const code = data.current.weather_code;
        
        // Simple code map
        let desc = "晴";
        if (code > 0 && code <= 3) desc = "多云";
        else if (code > 3 && code < 50) desc = "阴";
        else if (code >= 50) desc = "雨/雪";

        setWeather({ temp, desc, city: cityName || "成都市" });
      } catch (e) {
        setWeather({ temp: 20, desc: "晴", city: "成都市" });
      }
    }

    if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
         (position) => {
           // Success: Use coords (City name is hard to get from OpenMeteo without reverse geocoding, 
           // but we can just say "Local" or try to guess. For now, let's leave city generic or use a placeholder if geolocated)
           // Actually, OpenMeteo doesn't return city name. 
           // We can default to "本地" (Local) or "当前位置" if geolocated.
           fetchWeather(position.coords.latitude, position.coords.longitude, "当前位置");
         },
         (error) => {
           // Error: Use Chengdu
           console.log("Geolocation failed, using Chengdu default");
           fetchWeather(30.5728, 104.0668, "成都市");
         }
       );
    } else {
       // Fallback Chengdu
       fetchWeather(30.5728, 104.0668, "成都市");
    }
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
