import styles from './QRPreview.module.css';

export interface QRPreviewProps {
  svgUrl: string;
  pngUrl: string;
  alt?: string;
}

export function QRPreview({ svgUrl, pngUrl, alt = 'QR code' }: QRPreviewProps) {
  return (
    <div className={styles.wrapper}>
      <img className={styles.image} src={svgUrl} alt={alt} width={160} height={160} />
      <div className={styles.links}>
        <a className={styles.link} href={svgUrl} download>
          SVG
        </a>
        <a className={styles.link} href={pngUrl} download>
          PNG
        </a>
      </div>
    </div>
  );
}
