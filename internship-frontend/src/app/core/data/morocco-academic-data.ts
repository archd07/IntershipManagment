export interface MoroccanUniversity {
  name: string;
  schools: string[];
}

/**
 * Non-exhaustive but representative list of Moroccan public/private
 * universities and their main schools/faculties, used to populate
 * cascading selects on student registration.
 */
export const MOROCCAN_UNIVERSITIES: MoroccanUniversity[] = [
  {
    name: 'Université Mohammed V de Rabat',
    schools: [
      'École Mohammadia d\'Ingénieurs (EMI)',
      'ENSIAS',
      'Faculté des Sciences de Rabat',
      'Faculté des Sciences Juridiques, Économiques et Sociales - Agdal',
      'ENSAM Rabat'
    ]
  },
  {
    name: 'Université Hassan II de Casablanca',
    schools: [
      'ENSAM Casablanca',
      'Faculté des Sciences Ain Chock',
      'ENCG Casablanca',
      'Faculté des Sciences Juridiques, Économiques et Sociales - Ain Sebaâ',
      'ESTC (École Supérieure de Technologie de Casablanca)'
    ]
  },
  {
    name: 'Université Cadi Ayyad de Marrakech',
    schools: [
      'ENSA Marrakech',
      'Faculté des Sciences Semlalia',
      'ENCG Marrakech',
      'FST Marrakech'
    ]
  },
  {
    name: 'Université Sidi Mohamed Ben Abdellah de Fès',
    schools: [
      'ENSA Fès',
      'FST Fès',
      'ENCG Fès',
      'Faculté des Sciences Dhar El Mahraz'
    ]
  },
  {
    name: 'Université Ibn Tofail de Kénitra',
    schools: [
      'ENSA Kénitra',
      'FST Kénitra',
      'ENCG Kénitra',
      'Faculté des Sciences de Kénitra'
    ]
  },
  {
    name: 'Université Abdelmalek Essaadi de Tétouan-Tanger',
    schools: [
      'ENSA Tanger',
      'ENCG Tanger',
      'FST Tanger',
      'Faculté des Sciences de Tétouan'
    ]
  },
  {
    name: 'Université Chouaib Doukkali d\'El Jadida',
    schools: [
      'ENSA El Jadida',
      'Faculté des Sciences d\'El Jadida',
      'ENCG El Jadida'
    ]
  },
  {
    name: 'Université Moulay Ismail de Meknès',
    schools: [
      'ENSAM Meknès',
      'ENSA Khénifra',
      'FST Errachidia',
      'Faculté des Sciences de Meknès'
    ]
  },
  {
    name: 'Université Ibn Zohr d\'Agadir',
    schools: [
      'ENSA Agadir',
      'ENCG Agadir',
      'Faculté des Sciences d\'Agadir'
    ]
  },
  {
    name: 'Université Sultan Moulay Slimane de Béni Mellal',
    schools: [
      'ENSA Khouribga',
      'FST Béni Mellal',
      'ENCG Béni Mellal'
    ]
  },
  {
    name: 'Université Mohammed Premier d\'Oujda',
    schools: [
      'ENSA Oujda',
      'ENCG Oujda',
      'Faculté des Sciences d\'Oujda'
    ]
  },
  {
    name: 'Université Hassan 1er de Settat',
    schools: [
      'ENSA Berrechid',
      'ENCG Settat',
      'Faculté des Sciences et Techniques de Settat'
    ]
  },
  {
    name: 'Université Mohammed VI Polytechnique',
    schools: [
      'École Centrale Casablanca',
      'Faculté de Médecine et de Pharmacie (UM6P)',
      'School of Computer Science (UM6P)'
    ]
  },
  {
    name: 'Université Internationale de Rabat',
    schools: [
      'École d\'Ingénierie (ESI)',
      'Business School',
      'Institut d\'Aéronautique'
    ]
  },
  {
    name: 'Al Akhawayn University Ifrane',
    schools: [
      'School of Science and Engineering',
      'School of Business Administration',
      'School of Humanities and Social Sciences'
    ]
  },
  {
    name: 'Autre',
    schools: ['Autre']
  }
];

export const ACADEMIC_LEVELS: string[] = ['Bac+1', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5'];

export function getSpecialtiesForSchool(school: string): string[] {
  if (/ENCG|Business School|Business Administration/.test(school)) {
    return ['Finance', 'Marketing', 'Audit et contrôle de gestion', 'Gestion des ressources humaines', 'Commerce international'];
  }
  if (/Faculté des Sciences Juridiques/.test(school)) {
    return ['Droit des affaires', 'Droit public', 'Économie', 'Gestion', 'Sciences politiques'];
  }
  if (/Médecine et de Pharmacie/.test(school)) {
    return ['Médecine', 'Pharmacie'];
  }
  if (/Faculté des Sciences|FST|School of Science|Faculté des Sciences et Techniques/.test(school)) {
    return ['Informatique', 'Mathématiques', 'Physique', 'Chimie', 'Biologie'];
  }
  if (/ENSIAS|School of Computer Science/.test(school)) {
    return ['Génie logiciel', 'Intelligence artificielle', 'Cybersécurité', 'Data science', 'Réseaux et systèmes'];
  }
  if (/EMI|ENSA|ENSAM|École d\'Ingénierie|École Centrale|Aéronautique|Science and Engineering/.test(school)) {
    return ['Génie informatique', 'Génie industriel', 'Génie civil', 'Génie électrique', 'Génie mécanique'];
  }
  return ['Informatique', 'Gestion', 'Économie', 'Sciences'];
}

// A small, reasonable list of academic years to choose from — the current
// one plus the one before and the two after, computed from today's date so
// it never goes stale.
export function getAcademicYearOptions(): string[] {
  const currentCalendarYear = new Date().getFullYear();
  // Académic years in Morocco run roughly Sept–June, so anytime from
  // September onward we're already "in" the year starting this calendar year.
  const startYear = new Date().getMonth() >= 8 ? currentCalendarYear : currentCalendarYear - 1;
  const years: string[] = [];
  for (let offset = -1; offset <= 2; offset++) {
    const y = startYear + offset;
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

export const ORGANIZATIONAL_ENTITIES: string[] = ['Extraction', 'Traitement', 'Administration'];

export const INTERNSHIP_TYPES: string[] = [
  'Stage d\'observation',
  'Stage d\'initiation',
  'Stage technicien',
  'PFA (Projet de Fin d\'Année)',
  'PFE (Projet de Fin d\'Études)',
  'Stage de fin de formation',
  'Stage d\'application',
  'Autre'
];
