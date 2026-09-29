import { AxiosError } from 'axios';

// Corpo que a API devolve em erros de negócio e de validação dos campos
interface ApiErrorBody {
  status?: string;
  message?: unknown;
}

// Devolve a mensagem da API (erro de negócio ou campo inválido), que já vem
// em português, ou o texto genérico para os outros casos (falha de rede,
// erro interno)
export default function getApiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  const response = (err as AxiosError<ApiErrorBody>)?.response;

  if (
    response &&
    response.status < 500 &&
    response.data?.status === 'error' &&
    typeof response.data.message === 'string'
  ) {
    return response.data.message;
  }

  return fallback;
}
