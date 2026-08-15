import { useId } from 'react';
import styles from './Input.module.css';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function Select({ options, value, onChange, label, error }: SelectProps) {
  const generatedId = useId();

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={generatedId}>
          {label}
        </label>
      )}
      <select
        id={generatedId}
        className={[styles.input, styles.select, error && styles.hasError].filter(Boolean).join(' ')}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
