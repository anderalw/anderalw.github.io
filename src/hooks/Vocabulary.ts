import { useMemo } from 'react';
import { IconType } from 'react-icons';
import {
  FiActivity,
  FiCalendar,
  FiFeather,
  FiHeart,
  FiScissors,
} from 'react-icons/fi';

import { useBranding } from './Branding';
import {
  buildTerms,
  DEFAULT_VOCABULARY,
  FeatureKey,
  Terms,
} from '../utils/vocabulary';

export type { Terms } from '../utils/vocabulary';

// Termos das telas do negócio (ver utils/vocabulary)
export function useVocabulary(): Terms {
  const { branding } = useBranding();

  return useMemo(
    () => buildTerms(branding.vocabulary || DEFAULT_VOCABULARY),
    [branding.vocabulary],
  );
}

// Ícones do ramo: a tesoura é de barbearia e salão; os outros ramos têm o
// deles (marca sem logo e serviços)
const SEGMENT_ICONS: Record<string, IconType> = {
  barbershop: FiScissors,
  beauty: FiScissors,
  tattoo: FiFeather,
  physio: FiActivity,
  clinic: FiHeart,
};

export function useSegmentIcon(): IconType {
  const { branding } = useBranding();

  return SEGMENT_ICONS[branding.segment || 'barbershop'] || FiCalendar;
}

// Exemplos dos campos e textos que dependem do ramo (o que cada negócio
// atende de verdade)
interface SegmentExamples {
  service: string;
  plan: string;
  planDescription: string;
  notesHint: string;
  notesPlaceholder: string;
  cta: string;
  coverHint: string;
}

const SEGMENT_EXAMPLES: Record<string, SegmentExamples> = {
  barbershop: {
    service: 'Cabelo e barba',
    plan: 'Corte ilimitado',
    planDescription: 'Corte sempre em dia, sem pagar a cada visita.',
    notesHint: 'Preferências, alergias, estilo de corte...',
    notesPlaceholder:
      'Ex: máquina 2 nas laterais, tesoura em cima. Alergia a pomada com álcool.',
    cta: 'Pronto para o próximo corte?',
    coverHint: 'do seu espaço ou de um corte',
  },
  beauty: {
    service: 'Escova e hidratação',
    plan: 'Escova toda semana',
    planDescription: 'Cabelo sempre arrumado, sem pagar a cada visita.',
    notesHint: 'Preferências, alergias, tipo de cabelo...',
    notesPlaceholder:
      'Ex: cabelo cacheado, prefere produtos sem sulfato. Alergia a amônia.',
    cta: 'Pronto para se cuidar?',
    coverHint: 'do seu espaço ou de um trabalho',
  },
  tattoo: {
    service: 'Tatuagem pequena (até 10 cm)',
    plan: 'Retoques inclusos',
    planDescription: 'Retoques sem pagar a cada sessão.',
    notesHint: 'Preferências, alergias, estilo e projetos...',
    notesPlaceholder:
      'Ex: fechamento de braço em fine line, já fez 2 sessões. Sensível a látex.',
    cta: 'Pronto para a próxima tattoo?',
    coverHint: 'do seu estúdio ou de um trabalho',
  },
  physio: {
    service: 'Sessão de fisioterapia',
    plan: 'Pacote mensal',
    planDescription: 'Sessões da semana inclusas, sem pagar a cada visita.',
    notesHint: 'Preferências e observações de atendimento...',
    notesPlaceholder:
      'Ex: prefere horários de manhã. Evitar exercícios de impacto.',
    cta: 'Pronto para a próxima sessão?',
    coverHint: 'do seu espaço',
  },
  clinic: {
    service: 'Consulta',
    plan: 'Acompanhamento mensal',
    planDescription: 'Consultas do mês inclusas, sem pagar a cada visita.',
    notesHint: 'Preferências e observações de atendimento...',
    notesPlaceholder:
      'Ex: prefere atendimento pela manhã e lembrete por WhatsApp.',
    cta: 'Pronto para a próxima consulta?',
    coverHint: 'do seu consultório',
  },
};

export function useSegmentExamples(): SegmentExamples {
  const { branding } = useBranding();

  return (
    SEGMENT_EXAMPLES[branding.segment || 'barbershop'] ||
    SEGMENT_EXAMPLES.barbershop
  );
}

// Recursos ligados no negócio; sem a resposta da API, tudo ligado
export function useFeatures(): Record<FeatureKey, boolean> {
  const { branding } = useBranding();

  return useMemo(
    () => ({
      club: true,
      any_provider: true,
      walk_in: true,
      series: true,
      waitlist: true,
      deposit: false,
      packages: false,
      consent: false,
      ...branding.features,
    }),
    [branding.features],
  );
}
