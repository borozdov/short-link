import { Link, Outlet } from 'react-router';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Button } from '../primitives/Button';
import { useAuth } from '../features/auth/useAuth';
import styles from './Layout.module.css';

export function Layout() {
  const { user, loading, logout } = useAuth();

  return (
    <div>
      <header className={styles.header}>
        <p className={styles.wordmark}>Borozdov Link</p>
        <div className={styles.actions}>
          <Link className={styles.navLink} to="/bulk-text">
            Bulk text
          </Link>
          {!loading &&
            (user ? (
              <>
                <Link className={styles.navLink} to="/dashboard">
                  Dashboard
                </Link>
                <Button size="sm" onClick={logout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link className={styles.navLink} to="/login">
                  Log in
                </Link>
                <Link className={styles.navLink} to="/register">
                  Register
                </Link>
              </>
            ))}
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
