import { useState, type FormEvent } from 'react';
import { CreateLinkRequestSchema, type CreateLinkRequest } from '@short-link/shared';
import { Textarea } from '../../primitives/Textarea';
import { Input } from '../../primitives/Input';
import { Select } from '../../primitives/Select';
import { Button } from '../../primitives/Button';
import styles from './ShortenForm.module.css';

const EXPIRY_OPTIONS = [
  { label: 'Бессрочно', value: '' },
  { label: '1 час', value: '1' },
  { label: '24 часа', value: '24' },
  { label: '7 дней', value: '168' },
  { label: '30 дней', value: '720' },
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
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    const utm =
      utmSource.trim() || utmMedium.trim() || utmCampaign.trim()
        ? {
            source: utmSource.trim() || undefined,
            medium: utmMedium.trim() || undefined,
            campaign: utmCampaign.trim() || undefined,
          }
        : undefined;

    const payload = {
      targetUrl,
      customSlug: customSlug.trim() || undefined,
      expiresInHours: expiresValue ? Number(expiresValue) : undefined,
      utm,
    };

    const parsed = CreateLinkRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'targetUrl') nextErrors.targetUrl = 'Введите корректный URL';
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
        label="Целевой URL"
        placeholder="https://example.com/very/long/path"
        value={targetUrl}
        onChange={(event) => setTargetUrl(event.target.value)}
        error={errors.targetUrl}
      />
      <Input
        label="Свой слаг (необязательно)"
        placeholder="my-link"
        value={customSlug}
        onChange={(event) => setCustomSlug(event.target.value)}
        error={errors.customSlug}
      />
      <Select label="Срок действия" value={expiresValue} onChange={setExpiresValue} options={EXPIRY_OPTIONS} />
      <p className={styles.sectionLabel}>UTM-метки (необязательно)</p>
      <Input
        label="Источник"
        placeholder="newsletter"
        value={utmSource}
        onChange={(event) => setUtmSource(event.target.value)}
      />
      <Input
        label="Канал"
        placeholder="email"
        value={utmMedium}
        onChange={(event) => setUtmMedium(event.target.value)}
      />
      <Input
        label="Кампания"
        placeholder="launch"
        value={utmCampaign}
        onChange={(event) => setUtmCampaign(event.target.value)}
      />
      <Button type="submit" variant="inverted" loading={loading} className={styles.submit}>
        Сократить
      </Button>
    </form>
  );
}
