import React from 'react';

import { PageTabs, PageTab } from '../ui';
import { useVocabulary } from '../../hooks/Vocabulary';

// Abas que juntam telas da mesma área num item só do menu
const AREAS = {
  team: [
    { to: '/admin/usuarios', label: 'Usuários' },
    { to: '/admin/perfis', label: 'Perfis de acesso' },
    // O nome vem do vocabulário (Barbeiros, Tatuadores...)
    { to: '/admin/profissionais', label: 'professionals' },
  ],
  catalog: [
    { to: '/admin/servicos', label: 'Serviços' },
    { to: '/admin/motivos-bloqueio', label: 'Motivos de bloqueio' },
  ],
};

interface AreaTabsProps {
  area: keyof typeof AREAS;
}

const AreaTabs: React.FC<AreaTabsProps> = ({ area }) => {
  const terms = useVocabulary();

  return (
    <PageTabs aria-label="Seções">
      {AREAS[area].map(item => (
        <PageTab key={item.to} to={item.to} exact>
          {item.label === 'professionals' ? terms.Professionals : item.label}
        </PageTab>
      ))}
    </PageTabs>
  );
};

export default AreaTabs;
