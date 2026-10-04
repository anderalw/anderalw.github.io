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
import { buildTerms, DEFAULT_VOCABULARY, Terms } from '../utils/vocabulary';

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
