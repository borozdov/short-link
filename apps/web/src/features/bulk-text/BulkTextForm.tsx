import { useState, type FormEvent } from 'react';
import { BulkTextRequestSchema, type BulkTextRequest } from '@short-link/shared';
import { Textarea } from '../../primitives/Textarea';
import { Button } from '../../primitives/Button';
import styles from './BulkTextForm.module.css';

export interface BulkTextFormProps {
  loading: boolean;
  onSubmit: (payload: BulkTextRequest) => void;
}

export function BulkTextForm({ loading, onSubmit }: BulkTextFormProps) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    const parsed = BulkTextRequestSchema.safeParse({ text });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Некорректный текст');
      return;
    }

    setError(undefined);
    onSubmit(parsed.data);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Textarea
        label="Текст"
        placeholder="Вставьте текст со ссылками для сокращения…"
        rows={12}
        value={text}
        onChange={(event) => setText(event.target.value)}
        error={error}
      />
      <Button type="submit" variant="inverted" loading={loading} className={styles.submit}>
        Сократить ссылки
      </Button>
    </form>
  );
}
