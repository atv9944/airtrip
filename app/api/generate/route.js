import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';


export async function POST(req) {
  // Проверяем, есть ли вообще ключ
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'Ключ GROQ_API_KEY не найден в .env.local' }, { status: 500 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const { destination, days } = await req.json();

  const prompt = `Ты гид. Составь маршрут в город ${destination} на ${days} дней. 
  Верни ТОЛЬКО валидный JSON: {"city": "Название", "days": [{"day": 1, "title": "...", "places": [{"name": "...", "lat": 55.75, "lng": 37.62, "desc": "..."}]}]}. 
  Обязательно точные координаты lat и lng для Яндекс Карт. Никакого лишнего текста, только JSON.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192", 
      temperature: 0.1, 
    });

    const aiResponse = chatCompletion.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/); 
    
    if (!jsonMatch) {
      console.error("AI ответил, но не дал JSON:", aiResponse);
      return NextResponse.json({ error: 'AI вернул неправильный формат' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    // ВЫВОДИМ ТОЧНУЮ ОШИБКУ В ТЕРМИНАЛ
    console.error("ПОДРОБНАЯ ОШИБКА БЭКЕНДА:", error);
    // ОТПРАВЛЯЕМ ЕЁ НА САЙТ
    return NextResponse.json({ error: `Детали ошибки: ${error.message}` }, { status: 500 });
  }
}
