import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const getMonthName = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00');
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export const getCajas = async () => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = 'Configuracion';
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:A`,
    });
    const rows = response.data.values || [];
    return rows.flat().filter(c => c !== 'Cajas' && c);
  } catch (error) {
    return ['Efectivo'];
  }
};

export const appendToSheet = async (data: any) => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = getMonthName(data.fecha);

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetName);

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1:G1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Fecha', 'Descripción', 'Monto', 'Categoría', 'Método de Pago', 'Tipo', 'Caja']]
        }
      });
    }
  } catch (error) {
    console.log("Error verificando/creando hoja:", error);
  }

  const range = `${sheetName}!A:G`;
  const values = [[data.fecha, data.descripcion, data.monto, data.categoria, data.metodo_pago, data.tipo, data.caja]];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
};

export const getSummary = async () => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetTitles = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
  
  // 1. Obtener lista oficial de cajas primero
  const listaOficialCajas = await getCajas();
  let saldosPorCaja: { [key: string]: number } = {};
  listaOficialCajas.forEach(c => saldosPorCaja[c] = 0);

  let ingresos = 0;
  let egresos = 0;
  let todosLosMovimientos: any[] = [];

  for (const title of sheetTitles) {
    if (title === 'Configuracion') continue;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${title}!A:G`,
    });

    const rows = response.data.values || [];
    rows.forEach((row, index) => {
      if (index === 0 || row.length < 3) return;
      
      const movimiento = {
        fecha: row[0],
        descripcion: row[1],
        monto: Number(row[2]) || 0,
        categoria: row[3],
        metodo_pago: row[4],
        tipo: String(row[5]).toLowerCase(),
        caja: row[6] || 'Efectivo'
      };

      // Buscar la clave oficial que coincida (case-insensitive)
      const cajaKey = listaOficialCajas.find(c => c.toLowerCase() === movimiento.caja.toLowerCase()) || movimiento.caja;
      
      if (!saldosPorCaja[cajaKey]) saldosPorCaja[cajaKey] = 0;

      if (movimiento.tipo === 'ingreso') {
        ingresos += movimiento.monto;
        saldosPorCaja[cajaKey] += movimiento.monto;
      } else if (movimiento.tipo === 'egreso') {
        egresos += movimiento.monto;
        saldosPorCaja[cajaKey] -= movimiento.monto;
      }
      
      todosLosMovimientos.push(movimiento);
    });
  }

  todosLosMovimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return {
    ingresos,
    egresos,
    balance: ingresos - egresos,
    totalRegistros: todosLosMovimientos.length,
    ultimosMovimientos: todosLosMovimientos.slice(0, 10),
    saldosPorCaja
  };
};

export const addCaja = async (nombre: string) => {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const sheetName = 'Configuracion';

  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = spreadsheet.data.sheets?.some(s => s.properties?.title === sheetName);

    if (!sheetExists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: sheetName } } }]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['Cajas']] }
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[nombre]] }
    });
  } catch (error) {
    console.error("Error al añadir caja:", error);
  }
};
