import type { CreateLinkResponse } from '@short-link/shared';
import { Input } from '../../primitives/Input';
import { CopyButton } from '../../primitives/CopyButton';
import { QRPreview } from '../../primitives/QRPreview';
import styles from './ShortenResult.module.css';

export interface ShortenResultProps {
  result: CreateLinkResponse;
}

export function ShortenResult({ result }: ShortenResultProps) {
  // Task 2 turns this into a real link once /s/:secretToken exists.
  const statsUrl = `${window.location.origin}/s/${result.secretToken}`;

  return (
    <div className={styles.result}>
      <div>
        <p className={styles.note}>Short link</p>
        <div className={styles.row}>
          <Input readOnly monospace value={result.shortUrl} />
          <CopyButton value={result.shortUrl} />
        </div>
      </div>

      <QRPreview svgUrl={result.qrUrl} pngUrl={`${result.qrUrl}?format=png`} alt={`QR code for ${result.shortUrl}`} />

      <div>
        <p className={styles.note}>Stats link — keep it secret</p>
        <div className={styles.row}>
          <Input readOnly monospace value={statsUrl} />
          <CopyButton value={statsUrl} />
        </div>
      </div>
    </div>
  );
}
