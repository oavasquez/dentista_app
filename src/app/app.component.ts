import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly title = 'Clinica Den';

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
}
