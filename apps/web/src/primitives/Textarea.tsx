import { useId, type TextareaHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  monospace?: boolean;
}

export function Textarea({ label, error, monospace, id, className, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={textareaId}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={[
          styles.input,
          styles.textarea,
          monospace && styles.monospace,
          error && styles.hasError,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
