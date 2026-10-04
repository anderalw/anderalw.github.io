import React from 'react';

import { PageTabs, PageTab } from '../ui';

// Abas que juntam telas da mesma área num item só do menu
const AREAS = {
  team: [
    { to: '/admin/usuarios', label: 'Usuários' },
    { to: '/admin/perfis', label: 'Perfis de acesso' },
    { to: '/admin/barbeiros', label: 'Barbeiros' },
  ],
  catalog: [
    { to: '/admin/servicos', label: 'Serviços' },
    { to: '/admin/motivos-bloqueio', label: 'Motivos de bloqueio' },
  ],
};

interface AreaTabsProps {
  area: keyof typeof AREAS;
}

const AreaTabs: React.FC<AreaTabsProps> = ({ area }) => (
  <PageTabs aria-label="Seções">
    {AREAS[area].map(item => (
      <PageTab key={item.to} to={item.to} exact>
        {item.label}
      </PageTab>
    ))}
  </PageTabs>
);

export default AreaTabs;
