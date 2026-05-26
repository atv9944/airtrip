import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Убрали "as string"
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Убрали ": Request"
export async function POST(req) {
  try {
    const { destination, days, transport, duration } = await req.json();

    if (!destination || !days) {
      return NextResponse.json({ error: 'Укажите город и количество дней' }, { status: 400 });
    }

    // Переводим транспорт на русский для промпта
    let transportRu = 'пешком';
    if (transport === 'car') transportRu = 'на автомобиле';
    if (transport === 'transit') transportRu = 'на общественном транспорте';

    const prompt = `
      Ты профессиональный гид. Составь детальный туристический маршрут в город/место: ${destination} на ${days} дней.
      
      ВАЖНЫЕ ОГРАНИЧЕНИЯ (ОБЯЗАТЕЛЬНО К ИСПОЛНЕНИЮ):
      1. Способ передвижения пользователя: ${transportRu}. Учитывай это при расчете расстояний между точками. Если пешком - места должны быть близко друг к другу.
      2. Максимальная длительность маршрута в день (включая дорогу и время на осмотр): ровно ${duration} часов. 
      3. НЕ превышай это время! Выдавай ровно столько мест (обычно 2-4 места), сколько физически можно успеть качественно посмотреть за ${duration} часов, передвигаясь ${transportRu}.

      Для каждого дня придумай тему (title). Для каждого места (place) дай название (name), краткое интересное описание (desc) и РЕАЛЬНЫЕ, ТОЧНЫЕ координаты (lat, lng).
      
      Верни ответ СТРОГО в формате JSON, без маркдауна, без \`\`\`json.
      Формат:
      {
        "city": "Название города",
        "days": [
          {
            "day": 1,
            "title": "Тема дня",
            "places": [
              {
                "name": "Название места",
                "desc": "Описание",
                "lat": 55.7558,
                "lng": 37.6173
              }
            ]
          }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);

    return NextResponse.json(data);
    
  // Убрали ": any"
  } catch (error) {
    console.error('Ошибка Gemini:', error);
    return NextResponse.json({ error: error.message || 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
