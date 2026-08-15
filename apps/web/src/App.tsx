import { BrowserRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './primitives/ToastProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { Layout } from './routes/Layout';
import { RequireAuth } from './routes/RequireAuth';
import { routesConfig } from './routes/routes.config';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                {routesConfig.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={route.protected ? <RequireAuth>{route.element}</RequireAuth> : route.element}
                  />
                ))}
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
