import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card } from '../primitives/Card';
import { LoginForm } from '../features/auth/LoginForm';
import { useLogin } from '../features/auth/useLogin';
import { useAuth } from '../features/auth/useAuth';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const auth = useAuth();
  const { loading, submit } = useLogin();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user) navigate('/', { replace: true });
  }, [auth.user, navigate]);

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <LoginForm loading={loading} onSubmit={submit} />
      </Card>
      <p className={styles.switch}>
        Нет аккаунта? <Link to="/register">Создать</Link>
      </p>
    </div>
  );
}
