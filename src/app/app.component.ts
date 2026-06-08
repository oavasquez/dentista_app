import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface AppointmentForm {
  patientName: string;
  age: string | number;
  phone: string;
  consultationType: string;
  preferredSchedule: string;
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
  notes: string;
  attended: string;
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
}

interface ServiceItem {
  name: string;
  description: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  readonly title = 'Clinica Den';
  readonly sheetEndpoint =
    'https://script.google.com/macros/s/AKfycbzws-oG3J33vg6Py_9X06Kw_Gcspl4XjTLxP0r1JKs_6N_lXyhfqBUslYtK3I0R_cRMhw/exec';
  isSubmitting = false;
  formMessage = '';
  doctorAppointments: SheetAppointment[] = [];
  isLoadingAppointments = false;
  doctorMessage = '';
  showDoctorModule = false;
  siteConfig: SiteConfig = {
    clinicName: 'Clinica Den',
    clinicSubtitle: 'Salud dental integral',
    whatsappNumber: '50494000741',
    displayPhone: '9400-0741',
    address: 'Col. Medica, Tegucigalpa',
    schedule: 'Lunes a sabado: 8:00 am - 6:00 pm',
    heroTitle: 'Donde tu sonrisa vuelve a sentirse natural.',
    heroText:
      'Diagnostico digital, tratamientos preventivos y especialistas para cada etapa de tu cuidado dental.',
    doctorAccessKey: 'doctor',
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

  readonly doctors = [
    { name: 'Dra. Monica Rivera', role: 'Odontologia integral' },
    { name: 'Dr. Javier Molina', role: 'Endodoncia' },
    { name: 'Dra. Karla Fuentes', role: 'Ortodoncia' },
    { name: 'Dr. Andres Cruz', role: 'Implantologia' },
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
    preferredSchedule: '',
    notes: '',
  };

  ngOnInit(): void {
    this.loadSiteConfig();
  }

  openWhatsappAppointment(): void {
    const patientName = String(this.appointment.patientName).trim();
    const age = String(this.appointment.age).trim();
    const phone = String(this.appointment.phone).trim();
    const preferredSchedule = String(this.appointment.preferredSchedule).trim();
    const notes = String(this.appointment.notes).trim();

    const message = [
      `Hola ${this.siteConfig.clinicName}, quiero agendar una cita.`,
      '',
      `Nombre del paciente: ${patientName}`,
      `Edad: ${age}`,
      `Telefono de contacto: ${phone || 'No indicado'}`,
      `Tipo de consulta: ${this.appointment.consultationType}`,
      `Horario preferido: ${preferredSchedule || 'No indicado'}`,
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
      preferredSchedule,
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

        this.resolveDoctorAccess();
      },
      error: () => {
        this.resolveDoctorAccess();
      },
    });
  }

  private resolveDoctorAccess(): void {
    const accessKey = new URLSearchParams(window.location.search).get('access');
    this.showDoctorModule = accessKey === this.siteConfig.doctorAccessKey;

    if (this.showDoctorModule) {
      this.loadPendingAppointments();
    }
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

          this.doctorAppointments = response.appointments;
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

  private parseConfigResponse(rawResponse: string): {
    config?: Partial<SiteConfig>;
    services?: ServiceItem[];
    consultationTypes?: string[];
  } {
    try {
      return JSON.parse(rawResponse) as {
        config?: Partial<SiteConfig>;
        services?: ServiceItem[];
        consultationTypes?: string[];
      };
    } catch {
      return {};
    }
  }
}
