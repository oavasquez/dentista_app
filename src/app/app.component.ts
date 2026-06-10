import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface AppointmentForm {
  patientName: string;
  age: string | number;
  phone: string;
  consultationType: string;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
}

interface SheetAppointment {
  rowNumber: number;
  createdAt: string;
  createdDate?: string;
  patientName: string;
  age: string;
  phone: string;
  consultationType: string;
  preferredSchedule: string;
  appointmentDate?: string;
  appointmentTime?: string;
  originalAppointmentDate?: string;
  originalAppointmentTime?: string;
  notes: string;
  attended: string;
  reminderSent?: string;
  reminderSentAt?: string;
}

interface SiteConfig {
  clinicName: string;
  clinicSubtitle: string;
  whatsappNumber: string;
  displayPhone: string;
  address: string;
  schedule: string;
  heroTitle: string;
  heroText: string;
  doctorAccessKey: string;
  scheduleTimeStart: string;
  scheduleTimeEnd: string;
  appointmentSlotMinutes: string | number;
  appointmentCapacity: string | number;
  scheduleDays: string;
}

interface ServiceItem {
  name: string;
  description: string;
}

interface DoctorItem {
  name: string;
  role: string;
}

interface AvailableSlot {
  time: string;
  available: number;
  capacity: number;
}

interface BlockItem {
  rowNumber: number;
  blockDate: string;
  fullDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
  active: string;
}

interface ScheduleForm {
  scheduleDate: string;
  weekday: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  capacity: number;
}

interface BlockForm {
  blockDate: string;
  fullDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
}

type AppointmentFilterMode = 'all' | 'today' | 'tomorrow' | 'date' | 'range';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  readonly title = 'Clinica dental Fuentes';
  readonly sheetEndpoint =
    'https://script.google.com/macros/s/AKfycbzws-oG3J33vg6Py_9X06Kw_Gcspl4XjTLxP0r1JKs_6N_lXyhfqBUslYtK3I0R_cRMhw/exec';
  isSubmitting = false;
  formMessage = '';
  doctorAppointments: SheetAppointment[] = [];
  isLoadingAppointments = false;
  doctorMessage = '';
  isViewReady = false;
  hasLoadedConfig = false;
  hasLoadedDoctorModuleData = false;
  showDoctorModule = false;
  showDoctorLogin = false;
  showAppointmentOnly = false;
  doctorPassword = '';
  doctorLoginMessage = '';
  minAppointmentDate = '';
  availableSlots: AvailableSlot[] = [];
  availabilityMessage = '';
  isLoadingAvailability = false;
  scheduleMessage = '';
  isSavingSchedule = false;
  blockMessage = '';
  isSavingBlock = false;
  settingsMessage = '';
  isSavingSettings = false;
  activeBlocks: BlockItem[] = [];
  isLoadingBlocks = false;
  rescheduleSlots: Record<number, AvailableSlot[]> = {};
  rescheduleMessages: Record<number, string> = {};
  loadingRescheduleSlots: Record<number, boolean> = {};
  appointmentFilterMode: AppointmentFilterMode = 'today';
  appointmentFilterDate = '';
  appointmentFilterStartDate = '';
  appointmentFilterEndDate = '';
  readonly weekDays = [
    { value: '', label: 'Solo fecha especifica' },
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miercoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sabado' },
    { value: '0', label: 'Domingo' },
  ];
  siteConfig: SiteConfig = {
    clinicName: 'Clinica dental Fuentes',
    clinicSubtitle: 'Clinica dental',
    whatsappNumber: '50494000741',
    displayPhone: '9400-0741',
    address: 'Col. Medica, Tegucigalpa',
    schedule: 'Lunes a sabado: 8:00 am - 6:00 pm',
    heroTitle: 'Donde tu sonrisa vuelve a sentirse natural.',
    heroText:
      'Diagnostico digital, tratamientos preventivos y especialistas para cada etapa de tu cuidado dental.',
    doctorAccessKey: 'doctor',
    scheduleTimeStart: '08:00',
    scheduleTimeEnd: '17:00',
    appointmentSlotMinutes: 60,
    appointmentCapacity: 1,
    scheduleDays: '1,2,3,4,5,6',
  };

  constructor(private readonly http: HttpClient) {}

  readonly stats = [
    { value: '98%', label: 'satisfaccion' },
    { value: '24/7', label: 'emergencias' },
    { value: '+4.8', label: 'valoracion' },
    { value: '+10', label: 'anos de experiencia' },
  ];

  readonly steps = [
    'Evaluacion inicial y diagnostico digital',
    'Plan de tratamiento personalizado',
    'Atencion clinica segura y seguimiento',
  ];

  services: ServiceItem[] = [
    {
      name: 'Revision dental preventiva',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
    {
      name: 'Limpieza y profilaxis',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
    {
      name: 'Ortodoncia estetica',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
    {
      name: 'Blanqueamiento dental',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
    {
      name: 'Implantes y rehabilitacion',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
    {
      name: 'Odontopediatria',
      description: 'Atencion con protocolos clinicos, tecnologia actual y seguimiento cercano.',
    },
  ];

  doctors: DoctorItem[] = [
  
  ];

  readonly articles = [
    'Como cuidar tus encias entre consultas',
    'Senales tempranas de caries que no debes ignorar',
    'Beneficios de una limpieza dental profesional',
  ];

  consultationTypes = [
    'Evaluacion general',
    'Limpieza dental',
    'Dolor o emergencia',
    'Ortodoncia',
    'Blanqueamiento',
    'Implantes',
    'Consulta infantil',
  ];

  appointment: AppointmentForm = {
    patientName: '',
    age: '',
    phone: '',
    consultationType: 'Evaluacion general',
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
  };

  scheduleForm: ScheduleForm = {
    scheduleDate: '',
    weekday: '',
    startTime: '08:00',
    endTime: '17:00',
    slotMinutes: 30,
    capacity: 1,
  };

  blockForm: BlockForm = {
    blockDate: '',
    fullDay: false,
    startTime: '08:00',
    endTime: '17:00',
    reason: 'No disponible',
  };

  ngOnInit(): void {
    this.minAppointmentDate = this.toDateInputValue(new Date());
    this.appointment.appointmentDate = this.minAppointmentDate;
    this.resolveViewMode();
    this.loadSiteConfig();
    this.loadAvailability();
  }

  @HostListener('window:hashchange')
  onHashChange(): void {
    this.resolveViewMode();
  }

  get isValidAgeValue(): boolean {
    return this.isValidAge(String(this.appointment.age).trim());
  }

  get isValidPhoneValue(): boolean {
    return this.isValidPhone(String(this.appointment.phone).trim());
  }

  get filteredDoctorAppointments(): SheetAppointment[] {
    return this.doctorAppointments.filter((appointment) => {
      const appointmentDate = appointment.appointmentDate || appointment.createdDate || '';

      if (this.appointmentFilterMode === 'all') {
        return true;
      }

      if (!appointmentDate) {
        return false;
      }

      if (this.appointmentFilterMode === 'today') {
        return appointmentDate === this.toDateInputValue(new Date());
      }

      if (this.appointmentFilterMode === 'tomorrow') {
        return appointmentDate === this.getRelativeDateInputValue(1);
      }

      if (this.appointmentFilterMode === 'date') {
        return !this.appointmentFilterDate || appointmentDate === this.appointmentFilterDate;
      }

      const startDate = this.appointmentFilterStartDate || '0000-01-01';
      const endDate = this.appointmentFilterEndDate || '9999-12-31';
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  setAppointmentFilter(mode: AppointmentFilterMode): void {
    this.appointmentFilterMode = mode;

    if (mode === 'date' && !this.appointmentFilterDate) {
      this.appointmentFilterDate = this.toDateInputValue(new Date());
    }

    if (mode === 'range') {
      this.appointmentFilterStartDate = this.appointmentFilterStartDate || this.toDateInputValue(new Date());
      this.appointmentFilterEndDate = this.appointmentFilterEndDate || this.getRelativeDateInputValue(7);
    }
  }

  isReminderSent(appointment: SheetAppointment): boolean {
    const value = String(appointment.reminderSent || '').trim().toLowerCase();
    return value === 'si' || value === 'sí' || value === 'yes';
  }

  formatDateDisplay(dateText?: string): string {
    if (!dateText) {
      return '';
    }

    const parts = String(dateText).split('-');

    if (parts.length !== 3) {
      return dateText;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  formatTimeDisplay(timeText?: string): string {
    if (!timeText) {
      return '';
    }

    const match = String(timeText).match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
      return timeText;
    }

    const hours = Number(match[1]);
    const minutes = match[2];
    const period = hours >= 12 ? 'p.m.' : 'a.m.';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${period}`;
  }

  formatAppointmentSchedule(appointment: SheetAppointment): string {
    const date = this.formatDateDisplay(appointment.appointmentDate);
    const time = this.formatTimeDisplay(appointment.appointmentTime);

    if (date && time) {
      return `${date} ${time}`;
    }

    return appointment.preferredSchedule || 'Sin horario';
  }

  formatDateTimeDisplay(dateTimeText?: string): string {
    if (!dateTimeText) {
      return '';
    }

    const text = String(dateTimeText).trim();
    const localMatch = text.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);

    if (localMatch) {
      return `${localMatch[1]}/${localMatch[2]}/${localMatch[3]} ${this.formatTimeDisplay(
        `${localMatch[4]}:${localMatch[5]}`,
      )}`;
    }

    const date = new Date(text);

    if (Number.isNaN(date.getTime())) {
      return text;
    }

    return `${this.formatDateDisplay(this.toDateInputValue(date))} ${this.formatTimeDisplay(
      `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
    )}`;
  }

  openWhatsappAppointment(): void {
    const patientName = String(this.appointment.patientName).trim();
    const age = String(this.appointment.age).trim();
    const phone = String(this.appointment.phone).trim();
    const appointmentDate = String(this.appointment.appointmentDate).trim();
    const appointmentTime = String(this.appointment.appointmentTime).trim();
    const notes = String(this.appointment.notes).trim();

    if (!this.isValidAge(age) || !this.isValidPhone(phone) || !appointmentDate || !appointmentTime) {
      this.formMessage =
        'Revisa edad, telefono, fecha y hora. El telefono debe tener formato 9544-5810.';
      return;
    }

    const message = [
      `Hola ${this.siteConfig.clinicName}, quiero agendar una cita.`,
      '',
      `Nombre del paciente: ${patientName}`,
      `Edad: ${age}`,
      `Telefono de contacto: ${phone || 'No indicado'}`,
      `Tipo de consulta: ${this.appointment.consultationType}`,
      `Fecha solicitada: ${this.formatDateDisplay(appointmentDate)}`,
      `Hora solicitada: ${this.formatTimeDisplay(appointmentTime)}`,
      `Detalle de la consulta: ${notes || 'No indicado'}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${this.siteConfig.whatsappNumber}?text=${encodeURIComponent(
      message,
    )}`;
    const payload = {
      patientName,
      age,
      phone,
      consultationType: this.appointment.consultationType,
      preferredSchedule: `${appointmentDate} ${appointmentTime}`,
      appointmentDate,
      appointmentTime,
      notes,
    };

    this.isSubmitting = true;
    this.formMessage = 'Registrando solicitud...';

    this.http
      .post(this.sheetEndpoint, JSON.stringify(payload), {
        headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
        responseType: 'text',
      })
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.formMessage = 'Solicitud registrada. Abriendo WhatsApp...';
          this.loadPendingAppointments();
          window.open(whatsappUrl, '_blank', 'noopener');
        },
        error: () => {
          this.isSubmitting = false;
          this.formMessage =
            'No se pudo confirmar el registro en Sheets, pero abriremos WhatsApp para continuar.';
          window.open(whatsappUrl, '_blank', 'noopener');
        },
      });
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
    this.appointment.phone = formatted;
    input.value = formatted;
  }

  loadAvailability(): void {
    const date = this.appointment.appointmentDate;
    this.appointment.appointmentTime = '';
    this.availableSlots = [];

    if (!date) {
      this.availabilityMessage = 'Selecciona una fecha para consultar cupos.';
      return;
    }

    this.isLoadingAvailability = true;
    this.availabilityMessage = 'Consultando cupos disponibles...';

    this.http
      .get(`${this.sheetEndpoint}?action=availability&date=${encodeURIComponent(date)}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (rawResponse) => {
          const response = this.parseAvailabilityResponse(rawResponse);
          this.isLoadingAvailability = false;

          if (response.error) {
            this.availabilityMessage = `Error al consultar cupos: ${response.error}`;
            return;
          }

          this.availableSlots = this.filterPastSlotsForToday(response.slots || [], date);
          this.availabilityMessage = this.availableSlots.length
            ? `${this.availableSlots.length} horario(s) disponible(s).`
            : 'No hay cupos disponibles para esta fecha.';
        },
        error: () => {
          this.isLoadingAvailability = false;
          this.availabilityMessage = 'No se pudieron consultar los cupos disponibles.';
        },
      });
  }

  loadSiteConfig(): void {
    this.http.get(`${this.sheetEndpoint}?action=config`, { responseType: 'text' }).subscribe({
      next: (rawResponse) => {
        const response = this.parseConfigResponse(rawResponse);

        if (response.config) {
          this.siteConfig = { ...this.siteConfig, ...response.config };
        }

        if (response.services?.length) {
          this.services = response.services;
        }

        if (response.consultationTypes?.length) {
          this.consultationTypes = response.consultationTypes;
          this.appointment.consultationType = this.consultationTypes[0];
        }

        if (response.doctors?.length) {
          this.doctors = response.doctors;
        }

        this.hasLoadedConfig = true;
        this.resolveViewMode();
      },
      error: () => {
        this.hasLoadedConfig = true;
        this.resolveViewMode();
      },
    });
  }

  private resolveViewMode(): void {
    const accessKey = new URLSearchParams(window.location.search).get('access');
    const route = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    const wantsDoctorAccess = Boolean(accessKey) || route === 'doctor';
    const savedDoctorAccess = sessionStorage.getItem('doctorAccessGranted') === 'true';
    this.showDoctorModule = wantsDoctorAccess && savedDoctorAccess;
    this.showDoctorLogin = wantsDoctorAccess && !this.showDoctorModule;
    this.showAppointmentOnly =
      !this.showDoctorModule && !this.showDoctorLogin && (route === 'cita' || route === 'agendar');
    this.isViewReady = true;

    if (this.showDoctorModule && !this.hasLoadedDoctorModuleData) {
      this.hasLoadedDoctorModuleData = true;
      this.loadPendingAppointments();
      this.loadActiveBlocks();
    }

    if (!this.showDoctorModule) {
      this.hasLoadedDoctorModuleData = false;
    }
  }

  unlockDoctorModule(): void {
    if (!this.hasLoadedConfig) {
      this.doctorLoginMessage = 'Cargando configuracion de acceso...';
      return;
    }

    if (this.doctorPassword.trim() !== this.siteConfig.doctorAccessKey) {
      this.doctorLoginMessage = 'Contrasena incorrecta.';
      return;
    }

    sessionStorage.setItem('doctorAccessGranted', 'true');
    this.doctorPassword = '';
    this.doctorLoginMessage = '';
    this.showDoctorLogin = false;
    this.showDoctorModule = true;

    if (!window.location.hash.includes('doctor')) {
      window.location.hash = 'doctor';
    }

    if (!this.hasLoadedDoctorModuleData) {
      this.hasLoadedDoctorModuleData = true;
      this.loadPendingAppointments();
      this.loadActiveBlocks();
    }
  }

  lockDoctorModule(): void {
    sessionStorage.removeItem('doctorAccessGranted');
    this.showDoctorModule = false;
    this.showDoctorLogin = true;
    this.hasLoadedDoctorModuleData = false;
    this.doctorAppointments = [];
    this.activeBlocks = [];
  }

  loadPendingAppointments(): void {
    this.isLoadingAppointments = true;
    this.doctorMessage = 'Cargando citas pendientes...';

    this.http
      .get(`${this.sheetEndpoint}?action=pending`, { responseType: 'text' })
      .subscribe({
        next: (rawResponse) => {
          const response = this.parseSheetResponse(rawResponse);

          if (response.error) {
            this.doctorAppointments = [];
            this.isLoadingAppointments = false;
            this.doctorMessage = `Error en Apps Script: ${response.error}`;
            return;
          }

          if (!Array.isArray(response.appointments)) {
            this.doctorAppointments = [];
            this.isLoadingAppointments = false;
            this.doctorMessage =
              'El endpoint responde, pero no devolvio appointments. Publica una nueva version del Apps Script.';
            return;
          }

          this.doctorAppointments = response.appointments.map((appointment) => ({
            ...appointment,
            originalAppointmentDate: appointment.appointmentDate,
            originalAppointmentTime: appointment.appointmentTime,
          }));
          this.rescheduleSlots = {};
          this.rescheduleMessages = {};
          this.loadingRescheduleSlots = {};
          this.doctorAppointments.forEach((appointment) => {
            if (appointment.appointmentDate) {
              this.loadRescheduleAvailability(appointment);
            }
          });
          this.isLoadingAppointments = false;
          this.doctorMessage = this.doctorAppointments.length
            ? `${this.doctorAppointments.length} cita(s) pendiente(s).`
            : 'No hay citas pendientes.';
        },
        error: () => {
          this.isLoadingAppointments = false;
          this.doctorMessage =
            'No se pudieron cargar las citas. Revisa que el Apps Script este actualizado y publicado.';
        },
      });
  }

  markAppointmentAttended(appointment: SheetAppointment): void {
    this.doctorMessage = 'Actualizando cita...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({ action: 'markAttended', rowNumber: appointment.rowNumber }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: () => {
          this.doctorAppointments = this.doctorAppointments.filter(
            (item) => item.rowNumber !== appointment.rowNumber,
          );
          this.doctorMessage = 'Cita marcada como atendida.';
        },
        error: () => {
          this.doctorMessage =
            'No se pudo marcar como atendida. Verifica los permisos del Apps Script.';
        },
      });
  }

  sendAppointmentReminder(appointment: SheetAppointment): void {
    const whatsappNumber = this.normalizeWhatsappNumber(appointment.phone);

    if (!whatsappNumber) {
      this.doctorMessage = 'La cita no tiene un telefono valido para enviar recordatorio.';
      return;
    }

    const appointmentDate = appointment.appointmentDate || 'la fecha programada';
    const appointmentTime = appointment.appointmentTime || '';
    const message = [
      `Hola ${appointment.patientName}.`,
      '',
      `Le saludamos de ${this.siteConfig.clinicName}. Le recordamos que tiene una cita dental programada para el ${this.formatDateDisplay(appointmentDate)} a las ${this.formatTimeDisplay(appointmentTime) || appointment.preferredSchedule || 'la hora programada'}.`,
      '',
      'Por favor confirmenos por este medio si podra asistir en la fecha y hora establecida. Si necesita reprogramar, con gusto le ayudamos.',
      '',
      `Gracias por confiar en ${this.siteConfig.clinicName}.`,
    ].join('\n');
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank', 'noopener');
    appointment.reminderSent = 'Si';
    appointment.reminderSentAt = 'Enviado ahora';
    this.doctorMessage = 'Recordatorio abierto en WhatsApp.';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({ action: 'markReminderSent', rowNumber: appointment.rowNumber }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        error: () => {
          this.doctorMessage =
            'Se abrio WhatsApp, pero no se pudo guardar el estado del recordatorio en Sheets.';
        },
      });
  }

  scheduleAppointmentAgain(appointment: SheetAppointment): void {
    const appointmentDate = String(appointment.appointmentDate || '').trim();
    const appointmentTime = String(appointment.appointmentTime || '').trim();
    const whatsappNumber = this.normalizeWhatsappNumber(appointment.phone);

    if (!appointmentDate || !appointmentTime) {
      this.doctorMessage = 'Selecciona fecha y hora para agendar nuevamente.';
      return;
    }

    if (
      appointmentDate === appointment.originalAppointmentDate &&
      appointmentTime === appointment.originalAppointmentTime
    ) {
      this.doctorMessage = 'Selecciona una fecha u hora diferente para la segunda cita.';
      return;
    }

    const payload = {
      patientName: appointment.patientName,
      age: appointment.age,
      phone: appointment.phone,
      consultationType: appointment.consultationType,
      preferredSchedule: `${appointmentDate} ${appointmentTime}`,
      appointmentDate,
      appointmentTime,
      notes: `Segunda cita / seguimiento. Cita anterior: ${
        appointment.originalAppointmentDate || 'sin fecha'
      } ${this.formatTimeDisplay(appointment.originalAppointmentTime)}`.trim(),
    };

    this.doctorMessage = 'Registrando segunda cita...';

    this.http
      .post(this.sheetEndpoint, JSON.stringify(payload), {
        headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
        responseType: 'text',
      })
      .subscribe({
        next: () => {
          this.doctorMessage = 'Segunda cita registrada. Abriendo WhatsApp...';
          this.loadPendingAppointments();
          this.loadAvailability();

          if (whatsappNumber) {
            const message = [
              `Hola ${appointment.patientName}.`,
              '',
              `Le saludamos de ${this.siteConfig.clinicName}. Hemos agendado su siguiente cita dental para el ${this.formatDateDisplay(appointmentDate)} a las ${this.formatTimeDisplay(appointmentTime)}.`,
              '',
              'Si necesita realizar algun cambio, puede responder a este mensaje y con gusto le ayudamos.',
              '',
              `Gracias por confiar en ${this.siteConfig.clinicName}.`,
            ].join('\n');
            window.open(
              `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
              '_blank',
              'noopener',
            );
          }
        },
        error: () => {
          this.doctorMessage = 'No se pudo registrar la segunda cita.';
        },
      });
  }

  saveWorkSchedule(): void {
    if (!this.scheduleForm.scheduleDate && !this.scheduleForm.weekday) {
      this.scheduleMessage = 'Selecciona una fecha especifica o un dia de la semana.';
      return;
    }

    this.isSavingSchedule = true;
    this.scheduleMessage = 'Guardando horario...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({ action: 'saveSchedule', ...this.scheduleForm }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: () => {
          this.isSavingSchedule = false;
          this.scheduleMessage = 'Horario guardado. Los pacientes ya podran ver esos cupos.';
        },
        error: () => {
          this.isSavingSchedule = false;
          this.scheduleMessage = 'No se pudo guardar el horario.';
        },
      });
  }

  saveUnavailableBlock(): void {
    if (!this.blockForm.blockDate) {
      this.blockMessage = 'Selecciona la fecha que no estara disponible.';
      return;
    }

    if (!this.blockForm.fullDay && (!this.blockForm.startTime || !this.blockForm.endTime)) {
      this.blockMessage = 'Selecciona hora de inicio y fin para el bloqueo.';
      return;
    }

    this.isSavingBlock = true;
    this.blockMessage = 'Guardando bloqueo...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({ action: 'saveBlock', ...this.blockForm }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: () => {
          this.isSavingBlock = false;
          this.blockMessage = 'Bloqueo guardado. Ese horario ya no aparecera como cupo.';
          this.loadActiveBlocks();
          this.loadAvailability();
        },
        error: () => {
          this.isSavingBlock = false;
          this.blockMessage = 'No se pudo guardar el bloqueo.';
        },
      });
  }

  addDoctor(): void {
    this.doctors = [...this.doctors, { name: '', role: '' }];
  }

  removeDoctor(index: number): void {
    this.doctors = this.doctors.filter((_, itemIndex) => itemIndex !== index);
  }

  saveSiteSettings(): void {
    const doctors = this.doctors
      .map((doctor) => ({
        name: doctor.name.trim(),
        role: doctor.role.trim(),
      }))
      .filter((doctor) => doctor.name || doctor.role);
    const config = {
      clinicName: this.siteConfig.clinicName.trim(),
      clinicSubtitle: this.siteConfig.clinicSubtitle.trim(),
      whatsappNumber: String(this.siteConfig.whatsappNumber || '').replace(/\D/g, ''),
      displayPhone: this.siteConfig.displayPhone.trim(),
      address: this.siteConfig.address.trim(),
      schedule: this.siteConfig.schedule.trim(),
      doctorAccessKey: this.siteConfig.doctorAccessKey.trim(),
      scheduleTimeStart: this.siteConfig.scheduleTimeStart,
      scheduleTimeEnd: this.siteConfig.scheduleTimeEnd,
      appointmentSlotMinutes: Number(this.siteConfig.appointmentSlotMinutes) || 60,
      appointmentCapacity: Number(this.siteConfig.appointmentCapacity) || 1,
      scheduleDays: this.siteConfig.scheduleDays.trim(),
    };

    this.isSavingSettings = true;
    this.settingsMessage = 'Guardando configuracion...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({
          action: 'saveSiteSettings',
          config,
          doctors,
        }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: (rawResponse) => {
          const response = this.parseBasicResponse(rawResponse);
          this.isSavingSettings = false;

          if (response.error || response.ok === false) {
            this.settingsMessage = response.error || response.message || 'No se pudo guardar.';
            return;
          }

          this.doctors = doctors.length ? doctors : this.doctors;
          this.siteConfig = { ...this.siteConfig, ...config };
          this.settingsMessage = 'Configuracion guardada.';
          this.loadAvailability();
        },
        error: () => {
          this.isSavingSettings = false;
          this.settingsMessage = 'No se pudo guardar la configuracion.';
        },
      });
  }

  loadActiveBlocks(): void {
    this.isLoadingBlocks = true;
    this.blockMessage = this.blockMessage || 'Cargando bloqueos activos...';

    this.http.get(`${this.sheetEndpoint}?action=blocks`, { responseType: 'text' }).subscribe({
      next: (rawResponse) => {
        const response = this.parseBlocksResponse(rawResponse);
        this.isLoadingBlocks = false;

        if (response.error) {
          this.activeBlocks = [];
          this.blockMessage = `Error al cargar bloqueos: ${response.error}`;
          return;
        }

        this.activeBlocks = response.blocks || [];

        if (!this.blockMessage || this.blockMessage === 'Cargando bloqueos activos...') {
          this.blockMessage = this.activeBlocks.length
            ? `${this.activeBlocks.length} bloqueo(s) activo(s).`
            : 'No hay bloqueos activos.';
        }
      },
      error: () => {
        this.isLoadingBlocks = false;
        this.blockMessage =
          'No se pudieron cargar los bloqueos. Publica la version actualizada del Apps Script.';
      },
    });
  }

  removeBlock(block: BlockItem): void {
    this.blockMessage = 'Quitando bloqueo...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({ action: 'removeBlock', rowNumber: block.rowNumber }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: (rawResponse) => {
          const response = this.parseBasicResponse(rawResponse);

          if (response.error || response.ok === false) {
            this.blockMessage = response.error || response.message || 'No se pudo quitar el bloqueo.';
            return;
          }

          this.activeBlocks = this.activeBlocks.filter((item) => item.rowNumber !== block.rowNumber);
          this.blockMessage = 'Bloqueo quitado. Ese horario vuelve a estar disponible.';
          this.loadAvailability();
        },
        error: () => {
          this.blockMessage = 'No se pudo quitar el bloqueo.';
        },
      });
  }

  rescheduleAppointment(appointment: SheetAppointment): void {
    if (!appointment.appointmentDate || !appointment.appointmentTime) {
      this.doctorMessage = 'Selecciona nueva fecha y hora para reprogramar.';
      return;
    }

    this.doctorMessage = 'Reprogramando cita...';

    this.http
      .post(
        this.sheetEndpoint,
        JSON.stringify({
          action: 'reschedule',
          rowNumber: appointment.rowNumber,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
        }),
        {
          headers: new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' }),
          responseType: 'text',
        },
      )
      .subscribe({
        next: () => {
          appointment.preferredSchedule = `${appointment.appointmentDate} ${appointment.appointmentTime}`;
          this.doctorMessage = 'Cita reprogramada.';
          this.loadRescheduleAvailability(appointment);
          this.loadAvailability();
        },
        error: () => {
          this.doctorMessage = 'No se pudo reprogramar la cita.';
        },
      });
  }

  loadRescheduleAvailability(appointment: SheetAppointment, resetTime = false): void {
    const date = String(appointment.appointmentDate || '').trim();

    if (resetTime) {
      appointment.appointmentTime = '';
    }

    if (!resetTime && this.loadingRescheduleSlots[appointment.rowNumber]) {
      return;
    }

    if (
      !resetTime &&
      (this.rescheduleSlots[appointment.rowNumber] || []).length &&
      this.rescheduleMessages[appointment.rowNumber]
    ) {
      return;
    }

    if (!date) {
      this.rescheduleSlots[appointment.rowNumber] = [];
      this.rescheduleMessages[appointment.rowNumber] = 'Selecciona una fecha para ver cupos.';
      return;
    }

    this.loadingRescheduleSlots[appointment.rowNumber] = true;
    this.rescheduleMessages[appointment.rowNumber] = 'Consultando cupos...';

    this.http
      .get(
        `${this.sheetEndpoint}?action=availability&date=${encodeURIComponent(
          date,
        )}&excludeRow=${encodeURIComponent(String(appointment.rowNumber))}`,
        { responseType: 'text' },
      )
      .subscribe({
        next: (rawResponse) => {
          const response = this.parseAvailabilityResponse(rawResponse);
          this.loadingRescheduleSlots[appointment.rowNumber] = false;

          if (response.error) {
            this.rescheduleSlots[appointment.rowNumber] = [];
            this.rescheduleMessages[appointment.rowNumber] = `Error: ${response.error}`;
            return;
          }

          this.rescheduleSlots[appointment.rowNumber] = response.slots || [];
          this.rescheduleMessages[appointment.rowNumber] = this.rescheduleSlots[appointment.rowNumber]
            .length
            ? `${this.rescheduleSlots[appointment.rowNumber].length} horario(s) disponible(s).`
            : 'No hay cupos para esa fecha.';
        },
        error: () => {
          this.loadingRescheduleSlots[appointment.rowNumber] = false;
          this.rescheduleSlots[appointment.rowNumber] = [];
          this.rescheduleMessages[appointment.rowNumber] = 'No se pudieron consultar los cupos.';
        },
      });
  }

  private parseSheetResponse(rawResponse: string): {
    appointments?: SheetAppointment[];
    error?: string;
  } {
    try {
      return JSON.parse(rawResponse) as { appointments?: SheetAppointment[]; error?: string };
    } catch {
      return {};
    }
  }

  private parseAvailabilityResponse(rawResponse: string): {
    slots?: AvailableSlot[];
    error?: string;
  } {
    try {
      return JSON.parse(rawResponse) as { slots?: AvailableSlot[]; error?: string };
    } catch {
      return {};
    }
  }

  private parseBlocksResponse(rawResponse: string): {
    blocks?: BlockItem[];
    error?: string;
  } {
    try {
      return JSON.parse(rawResponse) as { blocks?: BlockItem[]; error?: string };
    } catch {
      return {};
    }
  }

  private parseBasicResponse(rawResponse: string): {
    ok?: boolean;
    message?: string;
    error?: string;
  } {
    try {
      return JSON.parse(rawResponse) as { ok?: boolean; message?: string; error?: string };
    } catch {
      return {};
    }
  }

  private isValidAge(age: string): boolean {
    const numericAge = Number(age);
    return Number.isInteger(numericAge) && numericAge >= 1 && numericAge <= 120;
  }

  private isValidPhone(phone: string): boolean {
    return /^\d{4}-\d{4}$/.test(phone);
  }

  private filterPastSlotsForToday(slots: AvailableSlot[], dateText: string): AvailableSlot[] {
    const today = this.toDateInputValue(new Date());

    if (dateText !== today) {
      return slots;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.filter((slot) => this.timeToMinutes(slot.time) > currentMinutes);
  }

  private timeToMinutes(timeText: string): number {
    const [hours = '0', minutes = '0'] = String(timeText || '').split(':');
    return Number(hours) * 60 + Number(minutes);
  }

  private normalizeWhatsappNumber(phone: string): string {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 8) {
      return `504${digits}`;
    }

    if (digits.length === 11 && digits.startsWith('504')) {
      return digits;
    }

    return '';
  }

  private toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getRelativeDateInputValue(daysFromToday: number): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromToday);
    return this.toDateInputValue(date);
  }

  private parseConfigResponse(rawResponse: string): {
    config?: Partial<SiteConfig>;
    services?: ServiceItem[];
    consultationTypes?: string[];
    doctors?: DoctorItem[];
  } {
    try {
      return JSON.parse(rawResponse) as {
        config?: Partial<SiteConfig>;
        services?: ServiceItem[];
        consultationTypes?: string[];
        doctors?: DoctorItem[];
      };
    } catch {
      return {};
    }
  }
}
