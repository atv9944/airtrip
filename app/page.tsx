'use client';

import { useState, useRef, useEffect } from 'react';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';

const DAY_COLORS = [
  { map: 'islands#blueIcon', hex: '#3B82F6', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700' },
  { map: 'islands#redIcon', hex: '#EF4444', badgeBg: 'bg-red-100', badgeText: 'text-red-700' },
  { map: 'islands#greenIcon', hex: '#10B981', badgeBg: 'bg-green-100', badgeText: 'text-green-700' },
  { map: 'islands#violetIcon', hex: '#8B5CF6', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700' },
  { map: 'islands#orangeIcon', hex: '#F97316', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700' },
  { map: 'islands#pinkIcon', hex: '#EC4899', badgeBg: 'bg-pink-100', badgeText: 'text-pink-700' },
  { map: 'islands#lightBlueIcon', hex: '#06B6D4', badgeBg: 'bg-cyan-100', badgeText: 'text-cyan-700' },
];

export default function Home() {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<any>(null);

  const mapRef = useRef<any>(null);
  const [leftWidth, setLeftWidth] = useState(45);
  const [isDragging, setIsDragging] = useState(false);

  // Логика перемещения ползунка
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

  // Центрирование + Открытие балуна
  const handlePlaceClick = (place: any) => {
    if (mapRef.current) {
      mapRef.current.setCenter([place.lat, place.lng], 16, {
        checkZoomRange: true,
        duration: 400 
      });
      mapRef.current.balloon.open(
        [place.lat, place.lng],
        `<div style="padding: 10px; max-width: 250px; font-family: sans-serif;">
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
    const token = btoa(encodedStr);
    return `https://www.wildberries.ru/travel/impressions/search?searchString=&token=${token}&filters=JTdCJTdE`;
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

  // Экран 1: Главная страница (Форма с новыми подписями)
  if (!itinerary) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 font-sans text-gray-800">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-center tracking-tight">
          Air<span className="text-blue-600">Trip</span>.
        </h1>
        <p className="text-lg text-gray-500 mb-10 text-center max-w-lg leading-relaxed">
          ИИ создаст персональный маршрут с локациями на карте и подберет лучшие впечатления за пару секунд.
        </p>
        
        {/* Добавили items-end, чтобы выровнять инпуты и кнопку по низу */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-4 w-full max-w-3xl border border-gray-100 items-end">
          
          {/* Поле Город */}
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-gray-500 ml-2 mb-2">Куда едем?</label>
            <input 
              type="text" 
              placeholder="Например: Казань, Сочи" 
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* Поле Дни */}
          <div className="w-full md:w-32">
            <label className="block text-sm font-semibold text-gray-500 ml-2 mb-2">Сколько дней?</label>
            <input 
              type="number" 
              placeholder="Дни" min="1" max="14"
              className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
              value={days} 
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </div>

          {/* Кнопка с фиксированной высотой для точного совпадения с инпутами */}
          <button 
            onClick={generateTrip} disabled={loading}
            className="w-full md:w-auto h-[56px] flex items-center justify-center bg-blue-600 text-white px-8 rounded-2xl font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-300 shadow-md"
          >
            {loading ? 'Думаем...' : 'Спланировать'}
          </button>
          
        </div>
      </main>
    );
  }

  // Экран 2: Результат
  return (
    <div className="flex flex-col lg:flex-row h-screen font-sans text-gray-800 bg-white">
      
      {/* ЛЕВАЯ ПАНЕЛЬ */}
      <div 
        style={{ width: typeof window !== 'undefined' && window.innerWidth >= 1024 ? `${leftWidth}%` : '100%' }} 
        className="h-full p-6 lg:p-10 overflow-y-auto bg-[#F9FAFB] shrink-0"
      >
        <button onClick={() => setItinerary(null)} className="text-blue-600 font-medium mb-8 hover:underline flex items-center gap-2">
          ← Назад к поиску
        </button>

        <h2 className="text-4xl font-extrabold mb-8 tracking-tight">Маршрут: {itinerary.city}</h2>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-3xl mb-10 border border-purple-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 shadow-sm">
          <div>
            <h3 className="text-xl font-bold text-purple-900 mb-1">Сделайте поездку незабываемой</h3>
            <p className="text-purple-700 text-sm">Найдите экскурсии от местных на портале WB Впечатления.</p>
          </div>
          <a 
            href={getWBLink(itinerary.city)} target="_blank" rel="noopener noreferrer"
            className="bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors shrink-0 whitespace-nowrap"
          >
            Искать в {itinerary.city}
          </a>
        </div>

        {/* ТАЙМЛАЙН */}
        <div className="space-y-12">
          {itinerary.days.map((day: any, dIdx: number) => {
            const color = DAY_COLORS[dIdx % DAY_COLORS.length];
            
            return (
              <div key={dIdx}>
                <div className="flex items-center gap-3 mb-6">
                  <span className={`${color.badgeBg} ${color.badgeText} font-bold px-4 py-1.5 rounded-lg text-sm`}>
                    День {day.day}
                  </span>
                  <h3 className="text-2xl font-bold">{day.title}</h3>
                </div>
                
                <div className="relative pl-8 ml-4 border-l-[3px] border-gray-200/80 space-y-6">
                  {day.places.map((place: any, pIdx: number) => (
                    <div key={pIdx} className="relative group cursor-pointer" onClick={() => handlePlaceClick(place)}>
                      <div 
                        className="absolute -left-[41px] top-4 w-5 h-5 rounded-full bg-white border-[4px] shadow-sm transition-transform group-hover:scale-125 group-hover:shadow-md"
                        style={{ borderColor: color.hex }}
                      />
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-md transition-all group-hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-gray-400 text-sm font-normal">Шаг {pIdx + 1}.</span> 
                            {place.name}
                          </h4>
                          <span className="text-xs text-blue-500 font-medium bg-blue-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Открыть ➔
                          </span>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-sm">{place.desc}</p>
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
        className="hidden lg:flex w-2 bg-gray-200 hover:bg-blue-400 active:bg-blue-600 cursor-col-resize transition-colors z-10 shrink-0"
      />

      {/* ПРАВАЯ ПАНЕЛЬ: Яндекс Карты */}
      <div className="flex-1 h-[50vh] lg:h-screen sticky top-0 bg-gray-200 overflow-hidden relative">
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
              return day.places.map((place: any, idx: number) => (
                <Placemark 
                  key={`${day.day}-${idx}`} 
                  geometry={[place.lat, place.lng]} 
                  properties={{ 
                    hintContent: place.name,
                    balloonContentHeader: `<strong style="font-size: 16px; font-family: sans-serif;">${place.name}</strong>`,
                    balloonContentBody: `<p style="font-size: 13px; color: #444; max-width: 250px; font-family: sans-serif;">${place.desc}</p>`
                  }} 
                  options={{ preset: color.map }}
                />
              ));
            })}
          </Map>
        </YMaps>
      </div>
      
    </div>
  );
}
