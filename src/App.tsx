import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ROUTES } from './routes';

function PageFallback() {
  return (
    <div className="page min-h-[70vh] pt-10" role="status" aria-label="Loading page">
      <div className="reaction-line w-40" />
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<r.Component />} />
          ))}
        </Routes>
      </Suspense>
    </Layout>
  );
}
