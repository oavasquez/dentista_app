const SHEET_NAME = 'Registros';
const PARAMS_SHEET_NAME = 'Parametros';
const SERVICES_SHEET_NAME = 'Servicios';
const CONSULTATION_TYPES_SHEET_NAME = 'TiposConsulta';
const TIMEZONE = 'America/Tegucigalpa';

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action || '' : '';

    if (action === 'today') {
      return jsonResponse({
        ok: true,
        appointments: getTodayPendingAppointments(),
      });
    }

    if (action === 'pending') {
      return jsonResponse({
        ok: true,
        appointments: getPendingAppointments(),
      });
    }

    if (action === 'config') {
      return jsonResponse({
        ok: true,
        config: getParameters(),
        services: getServices(),
        consultationTypes: getConsultationTypes(),
      });
    }

    return jsonResponse({
      ok: true,
      message: 'Clinica dental Fuentes appointment endpoint',
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function doPost(e) {
  try {
    const sheet = getSheet();
    const data = JSON.parse(e.postData.contents || '{}');

    if (data.action === 'markAttended') {
      const rowNumber = Number(data.rowNumber);

      if (!rowNumber || rowNumber < 2) {
        return jsonResponse({ ok: false, message: 'Invalid rowNumber' });
      }

      sheet.getRange(rowNumber, 8).setValue('Si');
      return jsonResponse({ ok: true });
    }

    sheet.appendRow([
      new Date(),
      data.patientName || '',
      data.age || '',
      data.phone || '',
      data.consultationType || '',
      data.preferredSchedule || '',
      data.notes || '',
      'No',
    ]);

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function getTodayPendingAppointments() {
  const today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');

  return getPendingAppointments().filter(function (appointment) {
    return appointment.createdDate === today;
  });
}

function getPendingAppointments() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const appointments = [];

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const createdAt = row[0];
    const attended = String(row[7] || '').trim().toLowerCase();

    if (!createdAt || attended === 'si' || attended === 'sí' || attended === 'yes') {
      continue;
    }

    const createdDateObject = createdAt instanceof Date ? createdAt : new Date(createdAt);

    if (isNaN(createdDateObject.getTime())) {
      continue;
    }

    const createdDate = Utilities.formatDate(createdDateObject, TIMEZONE, 'yyyy-MM-dd');

    appointments.push({
      rowNumber: index + 1,
      createdAt: Utilities.formatDate(createdDateObject, TIMEZONE, 'dd/MM/yyyy HH:mm'),
      createdDate: createdDate,
      patientName: row[1] || '',
      age: row[2] || '',
      phone: row[3] || '',
      consultationType: row[4] || '',
      preferredSchedule: row[5] || '',
      notes: row[6] || '',
      attended: row[7] || 'No',
    });
  }

  return appointments;
}

function getParameters() {
  const sheet = getSheetByName(PARAMS_SHEET_NAME, false);

  if (!sheet) {
    return {};
  }

  const rows = sheet.getDataRange().getValues();
  const params = {};

  for (let index = 1; index < rows.length; index++) {
    const key = String(rows[index][0] || '').trim();
    const value = String(rows[index][1] || '').trim();

    if (key) {
      params[key] = value;
    }
  }

  return params;
}

function getServices() {
  const sheet = getSheetByName(SERVICES_SHEET_NAME, false);

  if (!sheet) {
    return [];
  }

  const rows = sheet.getDataRange().getValues();
  const services = [];

  for (let index = 1; index < rows.length; index++) {
    const name = String(rows[index][0] || '').trim();
    const description = String(rows[index][1] || '').trim();
    const active = String(rows[index][2] || 'Si').trim().toLowerCase();

    if (name && active !== 'no') {
      services.push({
        name: name,
        description: description || 'Atencion con protocolos clinicos y seguimiento cercano.',
      });
    }
  }

  return services;
}

function getConsultationTypes() {
  const sheet = getSheetByName(CONSULTATION_TYPES_SHEET_NAME, false);

  if (!sheet) {
    return [];
  }

  const rows = sheet.getDataRange().getValues();
  const types = [];

  for (let index = 1; index < rows.length; index++) {
    const name = String(rows[index][0] || '').trim();
    const active = String(rows[index][1] || 'Si').trim().toLowerCase();

    if (name && active !== 'no') {
      types.push(name);
    }
  }

  return types;
}

function getSheet() {
  return getSheetByName(SHEET_NAME, true);
}

function getSheetByName(name, required) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('No hay spreadsheet activo. Abre Apps Script desde la hoja de calculo.');
  }

  const sheet = spreadsheet.getSheetByName(name);

  if (!sheet && required) {
    throw new Error('No existe una pestana llamada "' + name + '".');
  }

  return sheet;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
