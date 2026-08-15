import { BrowserRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './primitives/ToastProvider';
import { Layout } from './routes/Layout';
import { routesConfig } from './routes/routes.config';

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {routesConfig.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
