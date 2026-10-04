import React from 'react';
import styled from 'styled-components';

import { useBranding } from '../../hooks/Branding';
import { useSegmentIcon } from '../../hooks/Vocabulary';
import { colors, radius } from '../../styles/theme';

// Logo do negócio (ou o ícone do ramo, sem logo), no tamanho do quadrado
const Logo = styled.img<{ size: number }>`
  display: block;
  height: ${props => props.size}px;
  max-width: ${props => props.size * 2}px;
  flex-shrink: 0;
  border-radius: ${radius.sm};
  object-fit: contain;
`;

const Icon = styled.span<{ size: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border-radius: ${radius.md};
  background: ${colors.primary};
  color: ${colors.onPrimary};

  svg {
    width: ${props => Math.round(props.size * 0.55)}px;
    height: ${props => Math.round(props.size * 0.55)}px;
  }
`;

// Nome longo: corta com reticências em vez de quebrar o menu
export const BrandName = styled.strong`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface BrandMarkProps {
  size?: number;
}

// Só o símbolo; o nome fica com quem usa (cada lugar tem o seu estilo)
const BrandMark: React.FC<BrandMarkProps> = ({ size = 30 }) => {
  const { branding } = useBranding();
  const SegmentIcon = useSegmentIcon();

  if (branding.logo_url) {
    return <Logo src={branding.logo_url} alt="" size={size} />;
  }

  return (
    <Icon size={size}>
      <SegmentIcon />
    </Icon>
  );
};

export default BrandMark;
