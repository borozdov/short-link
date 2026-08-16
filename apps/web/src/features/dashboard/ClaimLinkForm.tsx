import { useState, type FormEvent } from 'react';
import { ClaimLinkRequestSchema, type ClaimLinkRequest } from '@short-link/shared';
import { Input } from '../../primitives/Input';
import { Button } from '../../primitives/Button';
import styles from './ClaimLinkForm.module.css';

export interface ClaimLinkFormProps {
  loading: boolean;
  onSubmit: (payload: ClaimLinkRequest) => void;
}

export function ClaimLinkForm({ loading, onSubmit }: ClaimLinkFormProps) {
  const [secretToken, setSecretToken] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    const parsed = ClaimLinkRequestSchema.safeParse({ secretToken });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Введите секретный токен');
      return;
    }

    setError(undefined);
    onSubmit(parsed.data);
    setSecretToken('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Секретный токен"
        placeholder="Вставьте секретный токен ссылки"
        monospace
        value={secretToken}
        onChange={(event) => setSecretToken(event.target.value)}
        error={error}
      />
      <Button type="submit" variant="inverted" loading={loading} className={styles.submit}>
        Забрать ссылку
      </Button>
    </form>
  );
}
