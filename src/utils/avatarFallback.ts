// Avatar com as iniciais do nome, para quem ainda não enviou foto
export default function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=28262e&color=ff9000`;
}
