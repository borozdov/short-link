import { useEffect, useRef, useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ThemeToggle } from '../theme/ThemeToggle';
import styles from './Layout.module.css';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    function onPointerDown(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <div>
      <header className={styles.header} ref={headerRef}>
        <Link className={styles.wordmark} to="/" onClick={() => setMenuOpen(false)}>
          Borozdov Link
        </Link>
        <div className={styles.controls}>
          <nav
            id="primary-nav"
            aria-label="Основная навигация"
            className={[styles.nav, menuOpen ? styles.navOpen : undefined].filter(Boolean).join(' ')}
            onClick={() => setMenuOpen(false)}
          >
            <Link className={styles.navLink} to="/">
              Сократить ссылку
            </Link>
            <Link className={styles.navLink} to="/bulk-text">
              Массовое сокращение
            </Link>
          </nav>
          <ThemeToggle />
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((open) => !open)}
            aria-controls="primary-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {menuOpen ? <CloseIcon className={styles.menuIcon} /> : <MenuIcon className={styles.menuIcon} />}
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}
