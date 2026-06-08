import { Component } from '@angular/core';

interface AppointmentForm {
  patientName: string;
  age: string | number;
  phone: string;
  consultationType: string;
  preferredSchedule: string;
  notes: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly title = 'Clinica Den';
  readonly whatsappNumber = '50494000741';

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

  readonly services = [
    'Revision dental preventiva',
    'Limpieza y profilaxis',
    'Ortodoncia estetica',
    'Blanqueamiento dental',
    'Implantes y rehabilitacion',
    'Odontopediatria',
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

  readonly consultationTypes = [
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

  openWhatsappAppointment(): void {
    const patientName = String(this.appointment.patientName).trim();
    const age = String(this.appointment.age).trim();
    const phone = String(this.appointment.phone).trim();
    const preferredSchedule = String(this.appointment.preferredSchedule).trim();
    const notes = String(this.appointment.notes).trim();

    const message = [
      'Hola Clinica Den, quiero agendar una cita.',
      '',
      `Nombre del paciente: ${patientName}`,
      `Edad: ${age}`,
      `Telefono de contacto: ${phone || 'No indicado'}`,
      `Tipo de consulta: ${this.appointment.consultationType}`,
      `Horario preferido: ${preferredSchedule || 'No indicado'}`,
      `Detalle de la consulta: ${notes || 'No indicado'}`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener');
  }
}
