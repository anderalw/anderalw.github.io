import { brandColor } from '../hooks/Branding';

// Avatar com as iniciais do nome (na cor da barbearia), para quem ainda não
// enviou foto
export default function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=28262e&color=${brandColor().slice(1)}`;
}
