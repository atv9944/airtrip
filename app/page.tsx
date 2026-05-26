'use client';

import React, { useState, useRef, useEffect } from 'react';
import { YMaps, Map, Placemark, Polyline } from '@pbe/react-yandex-maps';

// Yandex Maps поддерживает строгие названия цветов для круглых иконок с цифрами
const DAY_COLORS = [
  { colorName: 'blue', hex: '#3B82F6', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' },
  { colorName: 'red', hex: '#EF4444', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  { colorName: 'green', hex: '#10B981', badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
  { colorName: 'violet', hex: '#8B5CF6', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' },
  { colorName: 'orange', hex: '#F97316', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
  { colorName: 'pink', hex: '#EC4899', badgeBg: 'bg-pink-100', badgeText: 'text-pink-700' },
  { colorName: 'lightBlue', hex: '#06B6D4', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700' },
];

export default function Home() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);

  const mapRef = useRef<any>(null);
  const [leftWidth, setLeftWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

  // Смена размера панелей
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
        if (mapRef.current) mapRef.current.container.fitToViewport();
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      if (mapRef.current) mapRef.current.container.fitToViewport();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; 
    } else {
      document.body.style.userSelect = 'auto';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Клик по месту: центрирование и открытие балуна
  const handlePlaceClick = (place: any) => {
    if (mapRef.current) {
      mapRef.current.setCenter([place.lat, place.lng], 16, { checkZoomRange: true, duration: 400 });
      mapRef.current.balloon.open(
        [place.lat, place.lng],
        `<div style="padding: 10px; max-width: 280px; font-family: sans-serif;">
          <h4 style="margin: 0 0 8px 0; font-size: 16px; color: #1a202c;">${place.name}</h4>
          <p style="margin: 0; font-size: 13px; color: #4a5568; line-height: 1.5;">${place.desc}</p>
        </div>`,
        { closeButton: true }
      );
    }
  };

  // Ссылка WB Впечатления
  const getWBLink = (city: string) => {
    const data = { city: city, member: 1 };
    let encodedStr = encodeURIComponent(JSON.stringify(data));
    encodedStr = encodedStr.replace(/%3A/g, ':').replace(/%2C/g, ',');
    return `https://www.wildberries.ru/travel/impressions/search?searchString=&token=${btoa(encodedStr)}&filters=JTdCJTdE`;
  };

  const generateTrip = async () => {
    if (!destination) return alert("Пожалуйста, введите город!");
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, days }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItinerary(data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Ошибка генерации");
    }
    setLoading(false);
  };

  if (!itinerary) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 font-sans text-gray-800">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-center tracking-tight">
          Air<span className="text-blue-600">Trip</span>.
        </h1>
        <p className="text-lg text-gray-500 mb-10 text-center max-w-lg leading-relaxed">
          ИИ создаст детальный маршрут с локациями на карте и подберет лучшие впечатления за пару секунд.
        </p>
        <div className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 w-full max-w-3xl border border-gray-100">
          <input 
            type="text" placeholder="Куда летим? (например: Казань, Сочи)" 
            className="flex-1 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            value={destination} onChange={(e) => setDestination(e.target.value)}
          />
          <input 
            type="number" placeholder="Дни" min="1" max="14"
            className="w-full md:w-32 p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            value={days} onChange={(e) => setDays(Number(e.target.value))}
          />
          <button 
            onClick={generateTrip} disabled={loading}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-300 shadow-md"
          >
            {loading ? 'Думаем...' : 'Спланировать'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen font-sans text-gray-800 bg-white">
      
      {/* ЛЕВАЯ ПАНЕЛЬ: Маршрут */}
      <div 
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }} 
        className="h-full p-6 lg:p-10 overflow-y-auto bg-[#FAFAFA] shrink-0"
      >
        <button onClick={() => setItinerary(null)} className="text-gray-500 text-sm font-medium mb-8 hover:text-gray-800 transition-colors flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Новый поиск
        </button>

        <h2 className="text-4xl font-extrabold mb-2 tracking-tight">{itinerary.city}</h2>
        <p className="text-gray-500 mb-8 font-medium">Ваш персональный маршрут на {itinerary.days.length} дня</p>
        
        {/* Wildberries Впечатления */}
        <div className="bg-white p-6 rounded-3xl mb-10 border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
          <div className="relative z-10">
            <h
