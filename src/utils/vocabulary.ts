// Termos das telas, conforme o ramo do negócio (Barbeiro, Tatuador,
// Fisioterapeuta; Cliente ou Paciente; Barbearia, Estúdio, Clínica...).
// Vêm junto com a identidade (GET /settings/branding)
export interface Vocabulary {
  professional: string;
  professionals: string;
  client: string;
  clients: string;
  place: string;
  place_gender: 'f' | 'm';
  club: string;
}

export const DEFAULT_VOCABULARY: Vocabulary = {
  professional: 'Barbeiro',
  professionals: 'Barbeiros',
  client: 'Cliente',
  clients: 'Clientes',
  place: 'Barbearia',
  place_gender: 'f',
  club: 'Clube',
};

// No meio da frase: "barbeiro", mas "Dr(a)." e siglas ficam como estão
function lower(term: string): string {
  if (term.includes('.') || /^[A-ZÀ-Ú]{2}/.test(term)) return term;

  return term.charAt(0).toLowerCase() + term.slice(1);
}

function upper(term: string): string {
  return term.charAt(0).toUpperCase() + term.slice(1);
}

export interface Terms {
  // Como está nas configurações (começa com maiúscula): títulos e colunas
  Professional: string;
  Professionals: string;
  Client: string;
  Clients: string;
  Place: string;
  Club: string;
  // No meio da frase
  professional: string;
  professionals: string;
  client: string;
  clients: string;
  place: string;
  club: string;
  // "a barbearia" / "o estúdio", "da", "na", "pela"
  thePlace: string;
  ThePlace: string;
  ofPlace: string;
  inPlace: string;
  byPlace: string;
  // "o profissional" (masculino genérico)
  theProfessional: string;
}

export function buildTerms(vocabulary: Vocabulary): Terms {
  const v = { ...DEFAULT_VOCABULARY, ...vocabulary };
  const feminine = v.place_gender === 'f';
  const place = lower(v.place);

  return {
    Professional: upper(v.professional),
    Professionals: upper(v.professionals),
    Client: upper(v.client),
    Clients: upper(v.clients),
    Place: upper(v.place),
    Club: upper(v.club),
    professional: lower(v.professional),
    professionals: lower(v.professionals),
    client: lower(v.client),
    clients: lower(v.clients),
    place,
    club: lower(v.club),
    thePlace: `${feminine ? 'a' : 'o'} ${place}`,
    ThePlace: `${feminine ? 'A' : 'O'} ${place}`,
    ofPlace: `${feminine ? 'da' : 'do'} ${place}`,
    inPlace: `${feminine ? 'na' : 'no'} ${place}`,
    byPlace: `${feminine ? 'pela' : 'pelo'} ${place}`,
    theProfessional: `o ${lower(v.professional)}`,
  };
}
