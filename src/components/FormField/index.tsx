import React, { InputHTMLAttributes, useEffect, useRef } from 'react';
import { useField } from '@unform/core';

import { Container, ErrorText } from './styles';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  // Texto de ajuda abaixo do campo; o erro de validação toma o lugar dele
  hint?: string;
  // Formata o valor enquanto digita (ex: telefone)
  mask?(value: string): string;
}

// Campo do unform no estilo do painel: rótulo em cima e o erro embaixo, num
// espaço já reservado para o formulário não pular ao validar
const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  hint,
  mask,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { fieldName, defaultValue, error, registerField, clearError } =
    useField(name);

  useEffect(() => {
    registerField({
      name: fieldName,
      ref: inputRef.current,
      path: 'value',
    });
  }, [fieldName, registerField]);

  const messageId = `${fieldName}-message`;

  return (
    <Container hasError={!!error}>
      <span>{label}</span>
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={messageId}
        onChange={event => {
          if (mask) {
            // O unform lê o valor direto do input: a máscara vai nele
            // eslint-disable-next-line no-param-reassign
            event.target.value = mask(event.target.value);
          }

          if (error) clearError();
        }}
        {...rest}
      />
      <ErrorText id={messageId} hasError={!!error}>
        {error || hint}
      </ErrorText>
    </Container>
  );
};

export default FormField;
