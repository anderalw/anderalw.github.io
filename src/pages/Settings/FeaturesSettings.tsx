import React, { useState } from 'react';
import styled from 'styled-components';

import api from '../../services/api';
import { useToast } from '../../hooks/Toast';
import { useBranding } from '../../hooks/Branding';
import { useFeatures } from '../../hooks/Vocabulary';
import getApiErrorMessage from '../../utils/getApiErrorMessage';
import { FEATURES, FeatureKey } from '../../utils/vocabulary';
import { colors } from '../../styles/theme';
import { Card, CardHeader, Badge } from '../../components/ui';

const List = styled.ul`
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border-top: 1px solid ${colors.border};
  }

  li:first-child {
    border-top: 0;
  }

  li > div {
    flex: 1;
    min-width: 0;
  }

  strong {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: ${colors.text};
  }

  small {
    font-size: 13px;
    color: ${colors.textMuted};
  }
`;

// Chave liga/desliga
const Switch = styled.button<{ on: boolean }>`
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 22px;
  border: 0;
  border-radius: 999px;
  background: ${props => (props.on ? colors.primary : colors.borderStrong)};
  transition: background-color 0.15s;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => (props.on ? '21px' : '3px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    transition: left 0.15s;
  }

  &:disabled {
    opacity: 0.5;
  }
`;

// O que o negócio usa: vem ligado conforme o ramo e o admin pode mudar
const FeaturesSettings: React.FC = () => {
  const { addToast } = useToast();
  const { branding, setBranding } = useBranding();
  const features = useFeatures();
  const [saving, setSaving] = useState<FeatureKey | null>(null);

  const toggle = async (key: FeatureKey): Promise<void> => {
    setSaving(key);

    try {
      const response = await api.put('/settings/features', {
        [key]: !features[key],
      });

      setBranding({
        features: response.data.features,
        feature_defaults: response.data.feature_defaults,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Não foi possível salvar',
        description: getApiErrorMessage(err, 'Tente novamente.'),
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card style={{ marginTop: 24 }}>
      <CardHeader>
        <div>
          <h2>Recursos</h2>
          <p>O que aparece no sistema e no site. Vem conforme o ramo.</p>
        </div>
        {branding.segment_name && (
          <Badge tone="neutral">{branding.segment_name}</Badge>
        )}
      </CardHeader>
      <List>
        {FEATURES.map(item => {
          const standard = branding.feature_defaults?.[item.key];
          const changed =
            standard !== undefined && standard !== features[item.key];

          return (
            <li key={item.key}>
              <div>
                <strong>{item.label}</strong>
                <small>
                  {item.description}
                  {changed && ' · diferente do padrão do ramo'}
                </small>
              </div>
              <Switch
                type="button"
                role="switch"
                aria-checked={features[item.key]}
                aria-label={item.label}
                on={features[item.key]}
                disabled={saving !== null}
                onClick={() => toggle(item.key)}
              />
            </li>
          );
        })}
      </List>
    </Card>
  );
};

export default FeaturesSettings;
