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
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-2xl">🎟</span> Экскурсии и эмоции
            </h3>
            <p className="text-gray-500 text-sm">Найдите активности от местных жителей на WB Впечатления.</p>
          </div>
          <a 
            href={getWBLink(itinerary.city)} target="_blank" rel="noopener noreferrer"
            className="relative z-10 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors shrink-0 whitespace-nowrap shadow-md"
          >
            Смотреть в {itinerary.city}
          </a>
        </div>

        {/* ТАЙМЛАЙН */}
        <div className="space-y-12 pb-12">
          {itinerary.days.map((day: any, dIdx: number) => {
            const color = DAY_COLORS[dIdx % DAY_COLORS.length];
            
            return (
              <div key={dIdx} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
                
                {/* Шапка Дня */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                  <span className={`${color.badgeBg} ${color.badgeText} font-bold px-4 py-2 rounded-xl text-sm w-fit`}>
                    День {day.day}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-800">{day.title}</h3>
                </div>
                
                {/* Ветка таймлайна */}
                <div className="relative pl-6 ml-2 border-l-2 border-gray-100 space-y-0">
                  {day.places.map((place: any, pIdx: number) => (
                    <React.Fragment key={pIdx}>
                      
                      {/* Карточка Места */}
                      <div className="relative group cursor-pointer" onClick={() => handlePlaceClick(place)}>
                        {/* Кружок на линии с цифрой */}
                        <div 
                          className="absolute -left-[37px] top-1 w-7 h-7 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center text-[11px] font-bold z-10 transition-transform group-hover:scale-110"
                          style={{ borderColor: color.hex, color: color.hex }}
                        >
                          {pIdx + 1}
                        </div>

                        <div className="bg-gray-50/50 hover:bg-gray-50 p-5 rounded-2xl border border-transparent hover:border-gray-200 transition-all">
                          <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {place.name}
                          </h4>
                          <p className="text-gray-600 text-sm leading-relaxed">{place.desc}</p>
                          
                          {/* Тег категории (визуальный) */}
                          <div className="mt-4 flex gap-2">
                            <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md shadow-sm">
                              📍 Локация
                            </span>
                            <span className="text-[11px] font-medium text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              Смотреть на карте ➔
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Линия пути до следующей точки (если это не последняя точка) */}
                      {pIdx < day.places.length - 1 && (
                        <div className="h-10 border-l-2 border-dashed border-gray-200 ml-[1px] my-1 flex items-center">
                          <span className="ml-6 text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-1">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                            Далее
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* РАЗДЕЛИТЕЛЬ */}
      <div 
        onMouseDown={() => setIsDragging(true)}
        className="hidden lg:flex w-1.5 bg-gray-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize transition-colors z-10 shrink-0"
      />

      {/* ПРАВАЯ ПАНЕЛЬ: Яндекс Карты */}
      <div className="flex-1 h-[50vh] lg:h-screen sticky top-0 bg-gray-100 overflow-hidden relative">
        <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_KEY }}>
          <Map 
            instanceRef={(ref) => { if (ref) mapRef.current = ref; }}
            defaultState={{ 
              center: [itinerary.days[0].places[0].lat, itinerary.days[0].places[0].lng], 
              zoom: 12 
            }} 
            width="100%" height="100%"
          >
            {itinerary.days.map((day: any, dIdx: number) => {
              const color = DAY_COLORS[dIdx % DAY_COLORS.length];
              const coordinates = day.places.map((p: any) => [p.lat, p.lng]);

              return (
                <React.Fragment key={`day-layer-${dIdx}`}>
                  {/* Линия маршрута для дня */}
                  <Polyline
                    geometry={coordinates}
                    options={{
                      strokeColor: color.hex,
                      strokeWidth: 4,
                      strokeOpacity: 0.7,
                      strokeStyle: 'shortdash', // Делаем линию пунктирной для красоты
                    }}
                  />

                  {/* Метки мест с цифрами внутри */}
                  {day.places.map((place: any, idx: number) => (
                    <Placemark 
                      key={`place-${day.day}-${idx}`} 
                      geometry={[place.lat, place.lng]} 
                      properties={{ 
                        iconContent: `${idx + 1}`, // Цифра внутри кружочка
                        hintContent: place.name,
                        balloonContentHeader: `<strong style="font-size: 16px; font-family: sans-serif;">${idx + 1}. ${place.name}</strong>`,
                        balloonContentBody: `<p style="font-size: 13px; color: #444; max-width: 250px; font-family: sans-serif;">${place.desc}</p>`
                      }} 
                      options={{ 
                        // Специальный пресет Яндекса для кругов с цифрами
                        preset: `islands#${color.colorName}CircleIcon`,
                      }}
                    />
                  ))}
                </React.Fragment>
              );
            })}
          </Map>
        </YMaps>
      </div>
      
    </div>
  );
}
