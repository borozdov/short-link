import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card } from '../primitives/Card';
import { RegisterForm } from '../features/auth/RegisterForm';
import { useRegister } from '../features/auth/useRegister';
import { useAuth } from '../features/auth/useAuth';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const auth = useAuth();
  const { loading, submit } = useRegister();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user) navigate('/', { replace: true });
  }, [auth.user, navigate]);

  return (
    <div className={styles.page}>
      <Card padding="lg">
        <RegisterForm loading={loading} onSubmit={submit} />
      </Card>
      <p className={styles.switch}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
