const SHEET_NAME = 'Registros';
const PARAMS_SHEET_NAME = 'Parametros';
const SERVICES_SHEET_NAME = 'Servicios';
const CONSULTATION_TYPES_SHEET_NAME = 'TiposConsulta';
const SCHEDULE_SHEET_NAME = 'Horarios';
const BLOCKS_SHEET_NAME = 'Bloqueos';
const TIMEZONE = 'America/Tegucigalpa';

function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action || '' : '';

    if (action === 'today') {
      return jsonResponse({ ok: true, appointments: getTodayPendingAppointments() });
    }

    if (action === 'pending') {
      return jsonResponse({ ok: true, appointments: getPendingAppointments() });
    }

    if (action === 'availability') {
      return jsonResponse({
        ok: true,
        slots: getAvailability(e.parameter.date || '', Number(e.parameter.excludeRow) || 0),
      });
    }

    if (action === 'blocks') {
      return jsonResponse({ ok: true, blocks: getActiveBlocks() });
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
    const data = JSON.parse(e.postData.contents || '{}');

    if (data.action === 'markAttended') {
      return markAttended(data);
    }

    if (data.action === 'markReminderSent') {
      return markReminderSent(data);
    }

    if (data.action === 'saveSchedule') {
      return saveSchedule(data);
    }

    if (data.action === 'saveBlock') {
      return saveBlock(data);
    }

    if (data.action === 'removeBlock') {
      return removeBlock(data);
    }

    if (data.action === 'reschedule') {
      return rescheduleAppointment(data);
    }

    return createAppointment(data);
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function createAppointment(data) {
  const sheet = getSheet();
  const appointmentDate = data.appointmentDate || '';
  const appointmentTime = data.appointmentTime || '';

  sheet.appendRow([
    new Date(),
    data.patientName || '',
    data.age || '',
    data.phone || '',
    data.consultationType || '',
    data.preferredSchedule || [appointmentDate, appointmentTime].join(' ').trim(),
    data.notes || '',
    'No',
    appointmentDate,
    appointmentTime,
    'No',
    '',
  ]);

  return jsonResponse({ ok: true });
}

function markAttended(data) {
  const sheet = getSheet();
  const rowNumber = Number(data.rowNumber);

  if (!rowNumber || rowNumber < 2) {
    return jsonResponse({ ok: false, message: 'Invalid rowNumber' });
  }

  sheet.getRange(rowNumber, 8).setValue('Si');
  return jsonResponse({ ok: true });
}

function markReminderSent(data) {
  const sheet = getSheet();
  const rowNumber = Number(data.rowNumber);

  if (!rowNumber || rowNumber < 2) {
    return jsonResponse({ ok: false, message: 'Invalid rowNumber' });
  }

  sheet.getRange(rowNumber, 11).setValue('Si');
  sheet.getRange(rowNumber, 12).setValue(new Date());
  return jsonResponse({ ok: true });
}

function rescheduleAppointment(data) {
  const sheet = getSheet();
  const rowNumber = Number(data.rowNumber);
  const appointmentDate = String(data.appointmentDate || '').trim();
  const appointmentTime = String(data.appointmentTime || '').trim();

  if (!rowNumber || rowNumber < 2 || !appointmentDate || !appointmentTime) {
    return jsonResponse({ ok: false, message: 'Datos incompletos para reprogramar' });
  }

  sheet.getRange(rowNumber, 6).setValue(appointmentDate + ' ' + appointmentTime);
  sheet.getRange(rowNumber, 9).setValue(appointmentDate);
  sheet.getRange(rowNumber, 10).setValue(appointmentTime);

  return jsonResponse({ ok: true });
}

function saveSchedule(data) {
  const sheet = getOrCreateScheduleSheet();
  const scheduleDate = String(data.scheduleDate || '').trim();
  const weekday = String(data.weekday || '').trim();
  const startTime = String(data.startTime || '').trim();
  const endTime = String(data.endTime || '').trim();
  const slotMinutes = Number(data.slotMinutes) || 30;
  const capacity = Number(data.capacity) || 1;

  if ((!scheduleDate && !weekday) || !startTime || !endTime) {
    return jsonResponse({ ok: false, message: 'Horario incompleto' });
  }

  sheet.appendRow([scheduleDate, weekday, startTime, endTime, slotMinutes, capacity, 'Si']);
  return jsonResponse({ ok: true });
}

function saveBlock(data) {
  const sheet = getOrCreateBlocksSheet();
  const blockDate = String(data.blockDate || '').trim();
  const fullDay = data.fullDay === true || String(data.fullDay || '').toLowerCase() === 'true';
  const startTime = fullDay ? '' : String(data.startTime || '').trim();
  const endTime = fullDay ? '' : String(data.endTime || '').trim();
  const reason = String(data.reason || 'No disponible').trim();

  if (!blockDate || (!fullDay && (!startTime || !endTime))) {
    return jsonResponse({ ok: false, message: 'Bloqueo incompleto' });
  }

  sheet.appendRow([blockDate, fullDay ? 'Si' : 'No', startTime, endTime, reason, 'Si']);
  return jsonResponse({ ok: true });
}

function removeBlock(data) {
  const sheet = getOrCreateBlocksSheet();
  const rowNumber = Number(data.rowNumber);

  if (!rowNumber || rowNumber < 2) {
    return jsonResponse({ ok: false, message: 'Invalid rowNumber' });
  }

  sheet.getRange(rowNumber, 6).setValue('No');
  return jsonResponse({ ok: true });
}

function getActiveBlocks() {
  const sheet = getSheetByName(BLOCKS_SHEET_NAME, false);

  if (!sheet) {
    return [];
  }

  const rows = sheet.getDataRange().getValues();
  const blocks = [];

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const active = String(row[5] || 'Si').trim().toLowerCase();

    if (active === 'no') {
      continue;
    }

    blocks.push({
      rowNumber: index + 1,
      blockDate: formatDateValue(row[0]),
      fullDay: isTruthy(row[1]),
      startTime: formatTimeValue(row[2]),
      endTime: formatTimeValue(row[3]),
      reason: row[4] || 'No disponible',
      active: row[5] || 'Si',
    });
  }

  return blocks;
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

    const appointmentDate = formatDateValue(row[8]);
    const appointmentTime = formatTimeValue(row[9]);

    appointments.push({
      rowNumber: index + 1,
      createdAt: Utilities.formatDate(createdDateObject, TIMEZONE, 'dd/MM/yyyy HH:mm'),
      createdDate: Utilities.formatDate(createdDateObject, TIMEZONE, 'yyyy-MM-dd'),
      patientName: row[1] || '',
      age: row[2] || '',
      phone: row[3] || '',
      consultationType: row[4] || '',
      preferredSchedule: row[5] || [appointmentDate, appointmentTime].join(' ').trim(),
      notes: row[6] || '',
      attended: row[7] || 'No',
      appointmentDate: appointmentDate,
      appointmentTime: appointmentTime,
      reminderSent: row[10] || 'No',
      reminderSentAt: row[11]
        ? Utilities.formatDate(row[11] instanceof Date ? row[11] : new Date(row[11]), TIMEZONE, 'dd/MM/yyyy HH:mm')
        : '',
    });
  }

  return appointments;
}

function getAvailability(dateText, excludeRowNumber) {
  if (!dateText) {
    return [];
  }

  const date = parseDateOnly(dateText);

  if (!date) {
    return [];
  }

  const weekday = String(date.getDay());
  const scheduleRows = getScheduleRowsForDate(dateText, weekday);
  const booked = getBookedCounts(dateText, excludeRowNumber);
  const blocks = getBlocksForDate(dateText);
  const currentMinutes = getCurrentMinutesForDate(dateText);
  const slotsByTime = {};

  if (blocks.fullDay) {
    return [];
  }

  scheduleRows.forEach(function (schedule) {
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);
    const step = Number(schedule.slotMinutes) || 30;
    const capacity = Number(schedule.capacity) || 1;

    for (let minute = start; minute < end; minute += step) {
      const time = minutesToTime(minute);

      if (!slotsByTime[time]) {
        slotsByTime[time] = { time: time, capacity: 0 };
      }

      slotsByTime[time].capacity += capacity;
    }
  });

  return Object.keys(slotsByTime)
    .sort()
    .map(function (time) {
      const capacity = slotsByTime[time].capacity;
      const used = booked[time] || 0;
      const blocked = blocks.byTime[time] || 0;
      return {
        time: time,
        capacity: capacity,
        available: Math.max(capacity - used - blocked, 0),
      };
    })
    .filter(function (slot) {
      return slot.available > 0 && (currentMinutes === null || timeToMinutes(slot.time) > currentMinutes);
    });
}

function getCurrentMinutesForDate(dateText) {
  const now = new Date();
  const today = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd');

  if (dateText !== today) {
    return null;
  }

  return Number(Utilities.formatDate(now, TIMEZONE, 'H')) * 60 + Number(Utilities.formatDate(now, TIMEZONE, 'm'));
}

function getBlocksForDate(dateText) {
  const sheet = getSheetByName(BLOCKS_SHEET_NAME, false);
  const result = { fullDay: false, byTime: {} };

  if (!sheet) {
    return result;
  }

  const rows = sheet.getDataRange().getValues();

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const blockDate = formatDateValue(row[0]);
    const fullDay = String(row[1] || '').trim().toLowerCase();
    const startTime = formatTimeValue(row[2]);
    const endTime = formatTimeValue(row[3]);
    const active = String(row[5] || 'Si').trim().toLowerCase();

    if (active === 'no' || blockDate !== dateText) {
      continue;
    }

    if (isTruthy(fullDay)) {
      result.fullDay = true;
      return result;
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    for (let minute = start; minute < end; minute += 5) {
      result.byTime[minutesToTime(minute)] = 999;
    }
  }

  return result;
}

function getScheduleRowsForDate(dateText, weekday) {
  const sheet = getSheetByName(SCHEDULE_SHEET_NAME, false);

  if (!sheet) {
    return getDefaultScheduleRows(weekday);
  }

  const rows = sheet.getDataRange().getValues();
  const schedules = [];

  for (let index = 1; index < rows.length; index++) {
    const row = rows[index];
    const scheduleDate = formatDateValue(row[0]);
    const scheduleWeekday = String(row[1] || '').trim();
    const active = String(row[6] || 'Si').trim().toLowerCase();

    if (active === 'no') {
      continue;
    }

    if (scheduleDate && scheduleDate !== dateText) {
      continue;
    }

    if (!scheduleDate && scheduleWeekday && scheduleWeekday !== weekday) {
      continue;
    }

    schedules.push({
      startTime: formatTimeValue(row[2]),
      endTime: formatTimeValue(row[3]),
      slotMinutes: Number(row[4]) || 30,
      capacity: Number(row[5]) || 1,
    });
  }

  return schedules.length ? schedules : getDefaultScheduleRows(weekday);
}

function getDefaultScheduleRows(weekday) {
  const params = getParameters();
  const scheduleDays = String(params.scheduleDays || '1,2,3,4,5,6')
    .split(',')
    .map(function (day) {
      return day.trim();
    });

  if (scheduleDays.indexOf(String(weekday)) === -1) {
    return [];
  }

  const startTime = formatTimeValue(params.scheduleTimeStart || '08:00');
  const endTime = formatTimeValue(params.scheduleTimeEnd || '18:00');

  if (!startTime || !endTime || timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    return [];
  }

  return [
    {
      startTime: startTime,
      endTime: endTime,
      slotMinutes: Number(params.appointmentSlotMinutes) || 30,
      capacity: Number(params.appointmentCapacity) || 1,
    },
  ];
}

function getBookedCounts(dateText, excludeRowNumber) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const counts = {};

  for (let index = 1; index < rows.length; index++) {
    if (excludeRowNumber && index + 1 === excludeRowNumber) {
      continue;
    }

    const row = rows[index];
    const attended = String(row[7] || '').trim().toLowerCase();
    const appointmentDate = formatDateValue(row[8]);
    const appointmentTime = formatTimeValue(row[9]);

    if (attended === 'si' || attended === 'sí' || attended === 'yes') {
      continue;
    }

    if (appointmentDate === dateText && appointmentTime) {
      counts[appointmentTime] = (counts[appointmentTime] || 0) + 1;
    }
  }

  return counts;
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
    const value = formatParameterValue(rows[index][1]);

    if (key) {
      if (key === 'scheduleTimeStart' && params.scheduleTimeStart) {
        params.scheduleTimeEnd = value;
      } else {
        params[key] = value;
      }
    }
  }

  return params;
}

function formatParameterValue(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, 'HH:mm');
  }

  return String(value || '').trim();
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

function getOrCreateScheduleSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SCHEDULE_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SCHEDULE_SHEET_NAME);
    sheet.appendRow(['Fecha', 'DiaSemana', 'Inicio', 'Fin', 'DuracionMin', 'Cupos', 'Activo']);
  }

  return sheet;
}

function getOrCreateBlocksSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(BLOCKS_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(BLOCKS_SHEET_NAME);
    sheet.appendRow(['Fecha', 'DiaCompleto', 'Inicio', 'Fin', 'Motivo', 'Activo']);
  }

  return sheet;
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

function formatDateValue(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, 'yyyy-MM-dd');
  }

  return String(value).trim();
}

function formatTimeValue(value) {
  if (!value) {
    return '';
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, TIMEZONE, 'HH:mm');
  }

  const text = String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const isPm = /p\.?\s*m\.?/.test(text);
  const isAm = /a\.?\s*m\.?/.test(text);
  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return text;
  }

  let hours = Number(match[1]);

  if (isPm && hours < 12) {
    hours += 12;
  }

  if (isAm && hours === 12) {
    hours = 0;
  }

  return String(hours).padStart(2, '0') + ':' + match[2];
}

function parseDateOnly(dateText) {
  const parts = String(dateText || '').split('-').map(Number);

  if (parts.length !== 3 || parts.some(isNaN)) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function timeToMinutes(timeText) {
  const parts = String(timeText || '').split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

function isTruthy(value) {
  const text = String(value || '').trim().toLowerCase();
  return text === 'si' || text === 'sí' || text === 'true' || text === 'yes';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
