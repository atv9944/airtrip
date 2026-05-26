'use client';

import React, { useState, useRef, useEffect } from 'react';
import { YMaps, Map, Placemark, Polyline } from '@pbe/react-yandex-maps';

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
  
  // Новые фильтры
  const [transport, setTransport] = useState<'walk' | 'car' | 'transit'>('walk');
  const [duration, setDuration] = useState<number>(4);

  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);

  const mapRef = useRef<any>(null);
  const [leftWidth, setLeftWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

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
        // Отправляем новые параметры на сервер
        body: JSON.stringify({ destination, days, transport, duration }),
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
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center tracking-tight">
          Air<span className="text-blue-600">Trip</span>.
        </h1>
        <p className="text-lg text-gray-500 mb-10 text-center max-w-lg leading-relaxed">
          ИИ создаст детальный маршрут с локациями на карте и подберет лучшие экскурсии за пару секунд.
        </p>
        
        {/* Обновленная форма поиска */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-4xl border border-gray-100 flex flex-col gap-6">
          
          {/* Верхний ряд: Куда и Дни */}
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Куда едем?</label>
              <input 
                type="text" placeholder="Например: Казань, Сочи" 
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-800 placeholder-gray-400"
                value={destination} onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="w-full md:w-40 flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">На сколько дней?</label>
              <input 
                type="number" placeholder="Дни" min="1" max="14"
                className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-800"
                value={days} onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Нижний ряд: Фильтры и кнопка */}
          <div className="flex flex-col lg:flex-row gap-5 items-end">
            
            {/* Транспорт */}
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <label className="text-sm font-semibold text-gray-700 ml-1">Транспорт</label>
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                {[
                  { id: 'walk', icon: '🚶‍♂️', label: 'Пешком' },
                  { id: 'car', icon: '🚗', label: 'Авто' },
                  { id: 'transit', icon: '🚌', label: 'Транспорт' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTransport(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      transport === t.id 
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span> 
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Длительность */}
            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <label className="text-sm font-semibold text-gray-700 ml-1">Длительность в день</label>
              <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                {[2, 3, 4, 5].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setDuration(hours)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      duration === hours 
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {hours} ч.
                  </button>
                ))}
              </div>
            </div>

            {/* Кнопка */}
            <button 
              onClick={generateTrip} disabled={loading}
              className="w-full lg:flex-1 bg-blue-600 text-white h-[52px] rounded-2xl font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-300 shadow-md flex items-center justify-center"
            >
              {loading ? 'Думаем...' : 'Спланировать'}
            </button>
            
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen font-sans text-gray-800 bg-white">
      
      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <div 
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }} 
        className="h-full p-6 lg:p-10 overflow-y-auto bg-[#FAFAFA] shrink-0"
      >
        <button onClick={() => setItinerary(null)} className="text-gray-500 text-sm font-medium mb-6 hover:text-gray-800 transition-colors flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Новый поиск
        </button>

        <h2 className="text-3xl font-extrabold mb-1 tracking-tight">{itinerary.city}</h2>
        <p className="text-gray-500 mb-8 font-medium text-sm flex gap-3 items-center flex-wrap">
          <span>Ваш персональный маршрут на {itinerary.days.length} дня</span>
          <span className="text-gray-300">|</span>
          <span className="bg-gray-100 px-2 py-0.5 rounded-md">
            {transport === 'walk' ? '🚶 Пешком' : transport === 'car' ? '🚗 На авто' : '🚌 Транспортом'}
          </span>
          <span className="bg-gray-100 px-2 py-0.5 rounded-md">До {duration} ч/день</span>
        </p>
        
        {/* WB Впечатления */}
        <div className="bg-white p-5 rounded-3xl mb-8 border border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-[0_4px_20px_rgb(0,0,0,0.03)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mr-10 -mt-10 opacity-60"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span className="text-xl">🎟</span> Экскурсии и эмоции
            </h3>
            <p className="text-gray-500 text-sm">Найдите экскурсии на WB Впечатления.</p>
          </div>
          <a 
            href={getWBLink(itinerary.city)} target="_blank" rel="noopener noreferrer"
            className="relative z-10 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors shrink-0 whitespace-nowrap shadow-md"
          >
            Смотреть в {itinerary.city}
          </a>
        </div>

        {/* ТАЙМЛАЙН */}
        <div className="space-y-8 pb-12">
          {itinerary.days.map((day: any, dIdx: number) => {
            const color = DAY_COLORS[dIdx % DAY_COLORS.length];
            
            return (
              <div key={dIdx} className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
                
                {/* Шапка Дня */}
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-50">
                  <span className={`${color.badgeBg} ${color.badgeText} font-bold px-3 py-1.5 rounded-lg text-xs`}>
                    День {day.day}
                  </span>
                  <h3 className="text-xl font-bold text-gray-800">{day.title}</h3>
                </div>
                
                {/* Ветка таймлайна */}
                <div className="relative pl-6 ml-2 border-l-2 border-gray-100 space-y-5">
                  {day.places.map((place: any, pIdx: number) => (
                    
                    /* Карточка Места (Компактная) */
                    <div key={pIdx} className="relative group cursor-pointer" onClick={() => handlePlaceClick(place)}>
                      {/* Кружок на линии */}
                      <div 
                        className="absolute -left-[37px] top-2 w-7 h-7 rounded-full bg-white border-[3px] shadow-sm flex items-center justify-center text-[11px] font-bold z-10 transition-transform group-hover:scale-110"
                        style={{ borderColor: color.hex, color: color.hex }}
                      >
                        {pIdx + 1}
                      </div>

                      <div className="bg-[#F8FAFC] group-hover:bg-gray-100 p-4 rounded-2xl transition-all">
                        <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {place.name}
                        </h4>
                        <p className="text-gray-600 text-[13px] leading-snug mb-3">{place.desc}</p>
                        
                        {/* Тег локации */}
                        <div className="flex">
                          <span className="text-[11px] font-medium text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                            <span className="text-red-500 text-[10px]">📍</span> Локация
                          </span>
                        </div>
                      </div>
                    </div>

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
                      strokeStyle: 'shortdash',
                    }}
                  />

                  {/* Метки мест с цифрами внутри */}
                  {day.places.map((place: any, idx: number) => (
                    <Placemark 
                      key={`place-${day.day}-${idx}`} 
                      geometry={[place.lat, place.lng]} 
                      properties={{ 
                        iconContent: `${idx + 1}`,
                        hintContent: place.name,
                        balloonContentHeader: `<strong style="font-size: 16px; font-family: sans-serif;">${idx + 1}. ${place.name}</strong>`,
                        balloonContentBody: `<p style="font-size: 13px; color: #444; max-width: 250px; font-family: sans-serif;">${place.desc}</p>`
                      }} 
                      options={{ 
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
