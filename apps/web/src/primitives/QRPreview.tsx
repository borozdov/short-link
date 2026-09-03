import { reachGoal } from '../analytics/metrika';
import styles from './QRPreview.module.css';

export interface QRPreviewProps {
  svgUrl: string;
  pngUrl: string;
  alt?: string;
}

export function QRPreview({ svgUrl, pngUrl, alt = 'QR-код' }: QRPreviewProps) {
  return (
    <div className={styles.wrapper}>
      <img className={styles.image} src={svgUrl} alt={alt} width={160} height={160} />
      <div className={styles.links}>
        <a className={styles.link} href={svgUrl} download onClick={() => reachGoal('qr_download_svg')}>
          SVG
        </a>
        <a className={styles.link} href={pngUrl} download onClick={() => reachGoal('qr_download_png')}>
          PNG
        </a>
      </div>
    </div>
  );
}
