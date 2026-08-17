import { RouterProvider } from 'react-router-dom';

import { AuthProvider } from '@/shared/auth/AuthProvider';

import { QueryProvider } from './providers/QueryProvider';
import { createAppRouter } from './routes';

const router = createAppRouter();

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryProvider>
  );
}
