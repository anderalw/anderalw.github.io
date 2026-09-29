import React, { useEffect, useState } from 'react';
import {
  FiArrowRight,
  FiCalendar,
  FiClock,
  FiInstagram,
  FiLock,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';
import { useBranding } from '../../hooks/Branding';
import { formatPrice } from '../../utils/money';
import { formatDuration } from '../../utils/duration';
import { formatPhone, whatsappHref } from '../../utils/phone';
import BrandMark from '../../components/BrandMark';
import ThemeToggle from '../../components/ThemeToggle';
import defaultCover from '../../assets/sign-in-background.png';

import {
  Page,
  Header,
  Brand,
  Nav,
  HeaderActions,
  PrimaryLink,
  GhostLink,
  Hero,
  HeroActions,
  OutlineAnchor,
  TodayBadge,
  Section,
  SectionTitle,
  ServiceGrid,
  ServiceCard,
  About,
  TeamGrid,
  Member,
  InfoGrid,
  InfoCard,
  Hours,
  Contacts,
  Closing,
  Footer,
  Skeleton,
} from './styles';

interface Site {
  tagline: string;
  about: string;
  address: string;
  whatsapp: string;
  instagram: string;
  cover_url: string | null;
  services: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price_cents: number;
  }>;
  team: Array<{ id: string; name: string; avatar_url: string | null }>;
  hours: Array<{ day_of_week: number; open: string; close: string } | null>;
}

// Segunda a domingo (os índices da API começam no domingo)
const WEEK = [
  { index: 1, label: 'Segunda' },
  { index: 2, label: 'Terça' },
  { index: 3, label: 'Quarta' },
  { index: 4, label: 'Quinta' },
  { index: 5, label: 'Sexta' },
  { index: 6, label: 'Sábado' },
  { index: 0, label: 'Domingo' },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);

  return (
    parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')
  ).toUpperCase();
}

// "Aberto agora até 20:00", "Abre hoje às 09:00" ou "Fechado hoje"
function todayStatus(
  hours: Site['hours'],
): { open: boolean; text: string } | null {
  const now = new Date();
  const today = hours[now.getDay()];

  if (!today) return { open: false, text: 'Fechado hoje' };

  const time = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes(),
  ).padStart(2, '0')}`;

  if (time < today.open) {
    return { open: false, text: `Abre hoje às ${today.open}` };
  }

  if (time < today.close) {
    return { open: true, text: `Aberto agora · até ${today.close}` };
  }

  return { open: false, text: 'Fechado agora' };
}

// Site da barbearia: capa, serviços, equipe, horários e contato, com o
// que o admin configura e os dados do próprio sistema
const Landing: React.FC = () => {
  const { role } = useAuth();
  const { branding } = useBranding();
  const [site, setSite] = useState<Site | null>(null);

  useEffect(() => {
    api
      .get<Site>('/site')
      .then(response => setSite(response.data))
      .catch(() => {
        // Sem a API, a página mostra só o básico (nome e botões)
      });
  }, []);

  // Cliente já logado vai direto para o agendamento
  const bookTo = role === 'client' ? '/agendar' : '/cliente/login';
  const whatsapp = site?.whatsapp
    ? whatsappHref(
        site.whatsapp,
        `Olá! Vim pelo site da ${branding.name} e gostaria de agendar um horário.`,
      )
    : null;
  const status = site ? todayStatus(site.hours) : null;
  const todayIndex = new Date().getDay();
  const mapsLink = site?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${branding.name}, ${site.address}`,
      )}`
    : null;

  return (
    <Page>
      <Header>
        <div>
          <Brand href="#inicio">
            <BrandMark size={34} />
            <strong>{branding.name}</strong>
          </Brand>

          <Nav aria-label="Seções">
            <a href="#servicos">Serviços</a>
            {site && site.team.length > 0 && <a href="#equipe">Equipe</a>}
            <a href="#contato">Horários e contato</a>
          </Nav>

          <HeaderActions>
            <ThemeToggle />
            {role === 'provider' && (
              <GhostLink to="/dashboard">Ir para a agenda</GhostLink>
            )}
            {role === 'client' && (
              <GhostLink to="/meus-agendamentos">Meus agendamentos</GhostLink>
            )}
            {!role && <GhostLink to="/cliente/login">Entrar</GhostLink>}
            <PrimaryLink to={bookTo}>
              <FiCalendar />
              Agendar
            </PrimaryLink>
          </HeaderActions>
        </div>
      </Header>

      <Hero id="inicio" image={site?.cover_url || defaultCover}>
        <div>
          {status && <TodayBadge open={status.open}>{status.text}</TodayBadge>}
          <h1>{branding.name}</h1>
          <p>{site ? site.tagline : ' '}</p>
          <HeroActions>
            <PrimaryLink to={bookTo} $large>
              <FiCalendar />
              Agendar horário
            </PrimaryLink>
            {whatsapp && (
              <OutlineAnchor
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaWhatsapp />
                Chamar no WhatsApp
              </OutlineAnchor>
            )}
          </HeroActions>
        </div>
      </Hero>

      <Section id="servicos">
        <div>
          <SectionTitle>
            <span>Serviços</span>
            <h2>O que fazemos</h2>
            <p>Escolha o serviço e agende online, sem fila e sem ligação.</p>
          </SectionTitle>

          <ServiceGrid>
            {!site && [1, 2, 3].map(key => <Skeleton key={key} height={132} />)}
            {site?.services.map(service => (
              <ServiceCard key={service.id} to={bookTo}>
                <strong>{service.name}</strong>
                <small>{formatDuration(service.duration_minutes)}</small>
                <footer>
                  <b>{formatPrice(service.price_cents)}</b>
                  <span>
                    Agendar
                    <FiArrowRight />
                  </span>
                </footer>
              </ServiceCard>
            ))}
          </ServiceGrid>
        </div>
      </Section>

      {site && site.about && (
        <Section alt>
          <div>
            <SectionTitle>
              <span>Sobre nós</span>
              <h2>{`Conheça a ${branding.name}`}</h2>
            </SectionTitle>
            <About>{site.about}</About>
          </div>
        </Section>
      )}

      {site && site.team.length > 0 && (
        <Section id="equipe" alt={!site.about}>
          <div>
            <SectionTitle>
              <span>Equipe</span>
              <h2>Quem vai cuidar de você</h2>
            </SectionTitle>
            <TeamGrid>
              {site.team.map(member => (
                <Member key={member.id}>
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt="" />
                  ) : (
                    <span className="initials" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                  )}
                  <strong>{member.name}</strong>
                  <small>Barbeiro</small>
                </Member>
              ))}
            </TeamGrid>
          </div>
        </Section>
      )}

      <Section id="contato">
        <div>
          <SectionTitle>
            <span>Visite a gente</span>
            <h2>Horários e contato</h2>
          </SectionTitle>

          <InfoGrid>
            <InfoCard>
              <h3>
                <FiClock />
                Horário de funcionamento
              </h3>
              <Hours>
                {WEEK.map(day => {
                  const hours = site?.hours[day.index];
                  const classes = [
                    day.index === todayIndex ? 'today' : '',
                    site && !hours ? 'closed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <li key={day.index} className={classes}>
                      <span>
                        {day.label}
                        {day.index === todayIndex && ' (hoje)'}
                      </span>
                      <span>
                        {!site && '–'}
                        {site && hours && `${hours.open} às ${hours.close}`}
                        {site && !hours && 'Fechado'}
                      </span>
                    </li>
                  );
                })}
              </Hours>
            </InfoCard>

            <InfoCard>
              <h3>
                <FiMapPin />
                Onde estamos
              </h3>
              <Contacts>
                {site?.address && (
                  <li>
                    <FiMapPin />
                    <span>
                      {site.address}
                      {mapsLink && (
                        <small>
                          <a
                            href={mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver no mapa
                          </a>
                        </small>
                      )}
                    </span>
                  </li>
                )}
                {site?.whatsapp && whatsapp && (
                  <li>
                    <FaWhatsapp />
                    <span>
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {formatPhone(site.whatsapp)}
                      </a>
                      <small>WhatsApp</small>
                    </span>
                  </li>
                )}
                {site?.whatsapp && (
                  <li>
                    <FiPhone />
                    <span>
                      <a href={`tel:${site.whatsapp}`}>
                        {formatPhone(site.whatsapp)}
                      </a>
                      <small>Telefone</small>
                    </span>
                  </li>
                )}
                {site?.instagram && (
                  <li>
                    <FiInstagram />
                    <span>
                      <a
                        href={`https://instagram.com/${site.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`@${site.instagram}`}
                      </a>
                      <small>Instagram</small>
                    </span>
                  </li>
                )}
                {site && !site.address && !site.whatsapp && !site.instagram && (
                  <li>
                    <FiCalendar />
                    <span>
                      Agende online pelo botão acima.
                      <small>
                        Os contatos aparecem aqui quando cadastrados.
                      </small>
                    </span>
                  </li>
                )}
              </Contacts>
            </InfoCard>
          </InfoGrid>
        </div>
      </Section>

      <Closing>
        <div>
          <div>
            <h2>Pronto para o próximo corte?</h2>
            <p>Escolha o horário que funciona para você, em poucos cliques.</p>
          </div>
          <PrimaryLink to={bookTo} $large>
            Agendar agora
          </PrimaryLink>
        </div>
      </Closing>

      <Footer>
        <div>
          <span>{`© ${new Date().getFullYear()} ${branding.name}`}</span>
          <GhostLink to="/barbeiro" style={{ display: 'inline-flex' }}>
            <FiLock />
            Área da equipe
          </GhostLink>
        </div>
      </Footer>
    </Page>
  );
};

export default Landing;
