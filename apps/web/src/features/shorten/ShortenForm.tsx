import { useState, type FormEvent } from 'react';
import { CreateLinkRequestSchema, type CreateLinkRequest } from '@short-link/shared';
import { Textarea } from '../../primitives/Textarea';
import { Input } from '../../primitives/Input';
import { Select } from '../../primitives/Select';
import { Button } from '../../primitives/Button';
import styles from './ShortenForm.module.css';

const EXPIRY_OPTIONS = [
  { label: 'Never', value: '' },
  { label: '1 hour', value: '1' },
  { label: '24 hours', value: '24' },
  { label: '7 days', value: '168' },
  { label: '30 days', value: '720' },
];

interface FieldErrors {
  targetUrl?: string;
  customSlug?: string;
}

export interface ShortenFormProps {
  loading: boolean;
  onSubmit: (payload: CreateLinkRequest) => void;
}

export function ShortenForm({ loading, onSubmit }: ShortenFormProps) {
  const [targetUrl, setTargetUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [expiresValue, setExpiresValue] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    const payload = {
      targetUrl,
      customSlug: customSlug.trim() || undefined,
      expiresInHours: expiresValue ? Number(expiresValue) : undefined,
    };

    const parsed = CreateLinkRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'targetUrl') nextErrors.targetUrl = 'Enter a valid URL';
        if (issue.path[0] === 'customSlug') nextErrors.customSlug = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Textarea
        label="Target URL"
        placeholder="https://example.com/very/long/path"
        value={targetUrl}
        onChange={(event) => setTargetUrl(event.target.value)}
        error={errors.targetUrl}
      />
      <Input
        label="Custom slug (optional)"
        placeholder="my-link"
        value={customSlug}
        onChange={(event) => setCustomSlug(event.target.value)}
        error={errors.customSlug}
      />
      <Select label="Expires" value={expiresValue} onChange={setExpiresValue} options={EXPIRY_OPTIONS} />
      <Button type="submit" variant="inverted" loading={loading} className={styles.submit}>
        Shorten
      </Button>
    </form>
  );
}
