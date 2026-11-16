import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '@/App';
import { ROUTES } from '@/routes';

/** Render the whole app at a path, exactly as a visitor would see it. */
export async function renderAt(path: string) {
  await Promise.all(ROUTES.map((r) => r.preload()));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
