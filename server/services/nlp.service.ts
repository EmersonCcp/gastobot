import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const parseExpenseText = async (text: string, availableCajas: string[] = []) => {
  const currentDate = new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const cajasLista = availableCajas.length > 0 ? availableCajas.join(', ') : 'Efectivo';
  
  const prompt = `
    Eres un asistente experto en finanzas personales. Tu tarea es extraer información estructurada de un texto libre.
    
    FECHA ACTUAL DE REFERENCIA: ${currentDate}
    CAJAS/CUENTAS DISPONIBLES: ${cajasLista}
    
    Texto del usuario: "${text}"
    
    Extrae los siguientes campos en formato JSON:
    - monto (número, sin símbolos)
    - descripcion (string corto)
    - categoria (string, ej: Comida, Transporte, Sueldo, Otros)
    - metodo_pago (string, ej: Efectivo, Tarjeta, Transferencia)
    - tipo (string, solo "ingreso" o "egreso")
    - fecha (string en formato AAAA-MM-DD. Si el usuario dice "ayer", calcula la fecha basándote en la fecha de referencia. Si no menciona fecha, usa la fecha de hoy).
    - caja (string, debe ser una de las CAJAS DISPONIBLES: [${cajasLista}]. Si no se menciona ninguna de estas explícitamente, devuelve ÚNICAMENTE "SIN_ASIGNAR").
    
    Responde ÚNICAMENTE con el objeto JSON.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Eres un extractor de datos financieros en formato JSON." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const jsonContent = response.choices[0]?.message.content || "{}";
  return JSON.parse(jsonContent);
};
