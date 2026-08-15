import { Outlet } from 'react-router';
import { ThemeToggle } from '../theme/ThemeToggle';
import styles from './Layout.module.css';

export function Layout() {
  return (
    <div>
      <header className={styles.header}>
        <p className={styles.wordmark}>Borozdov Link</p>
        <ThemeToggle />
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
