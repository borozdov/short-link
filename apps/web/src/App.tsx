import { ThemeProvider } from './theme/ThemeProvider';
import { ThemeToggle } from './theme/ThemeToggle';

export function App() {
  return (
    <ThemeProvider>
      <header style={{ padding: 16 }}>
        <ThemeToggle />
      </header>
    </ThemeProvider>
  );
}
