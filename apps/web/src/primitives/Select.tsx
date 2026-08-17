import { useEffect, useId, useRef, useState, type KeyboardEvent, type UIEvent } from 'react';
import styles from './Select.module.css';

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
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const current = options[selectedIndex];

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const highlightedEl = panelRef.current?.children[highlighted] as HTMLElement | undefined;
    highlightedEl?.scrollIntoView({ block: 'nearest' });
    updateScrollFade();
  }, [open, highlighted]);

  function updateScrollFade(): void {
    const el = panelRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 0);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 1);
  }

  function handlePanelScroll(_event: UIEvent<HTMLUListElement>): void {
    updateScrollFade();
  }

  function openPanel(): void {
    setHighlighted(selectedIndex);
    setOpen(true);
  }

  function closePanel(): void {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function selectOption(index: number): void {
    const option = options[index];
    if (option) onChange(option.value);
    closePanel();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openPanel();
      return;
    }

    if (!open) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlighted((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlighted((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        setHighlighted(0);
        break;
      case 'End':
        event.preventDefault();
        setHighlighted(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectOption(highlighted);
        break;
      case 'Escape':
        event.preventDefault();
        closePanel();
        break;
    }
  }

  const listboxId = `${generatedId}-listbox`;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={generatedId}>
          {label}
        </label>
      )}
      <div className={styles.wrapper} ref={rootRef}>
        <button
          ref={triggerRef}
          id={generatedId}
          type="button"
          className={[styles.trigger, open && styles.open, error && styles.hasError].filter(Boolean).join(' ')}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-invalid={Boolean(error)}
          onClick={() => (open ? closePanel() : openPanel())}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={styles.value}>{current?.label}</span>
          <svg
            className={styles.chevron}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {open && (
          <div className={styles.panelWrapper}>
            <ul
              className={styles.panel}
              role="listbox"
              id={listboxId}
              tabIndex={-1}
              ref={panelRef}
              onScroll={handlePanelScroll}
            >
              {options.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={[
                    styles.option,
                    index === highlighted && styles.highlighted,
                    option.value === value && styles.selected,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => selectOption(index)}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <svg
                      className={styles.check}
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
            <div className={[styles.fade, styles.fadeTop, canScrollUp && styles.visible].filter(Boolean).join(' ')} />
            <div
              className={[styles.fade, styles.fadeBottom, canScrollDown && styles.visible].filter(Boolean).join(' ')}
            />
          </div>
        )}
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
