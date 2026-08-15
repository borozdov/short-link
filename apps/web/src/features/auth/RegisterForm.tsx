import { useState, type FormEvent } from 'react';
import { RegisterRequestSchema, type RegisterRequest } from '@short-link/shared';
import { Input } from '../../primitives/Input';
import { Button } from '../../primitives/Button';
import styles from './AuthForm.module.css';

interface FieldErrors {
  email?: string;
  password?: string;
}

export interface RegisterFormProps {
  loading: boolean;
  onSubmit: (payload: RegisterRequest) => void;
}

export function RegisterForm({ loading, onSubmit }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();

    const parsed = RegisterRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === 'email') nextErrors.email = 'Enter a valid email';
        if (issue.path[0] === 'password') nextErrors.password = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
      />
      <Button type="submit" variant="inverted" loading={loading} className={styles.submit}>
        Create account
      </Button>
    </form>
  );
}
