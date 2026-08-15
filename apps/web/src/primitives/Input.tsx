import { useId, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  monospace?: boolean;
}

export function Input({ label, error, monospace, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, monospace && styles.monospace, error && styles.hasError, className]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
