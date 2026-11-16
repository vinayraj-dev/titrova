import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter, matchPath } from 'react-router-dom';
import { App } from './App';
import { isSingleFile } from './data/site';
import { NOT_FOUND, ROUTES } from './routes';
import './styles/index.css';

const root = document.getElementById('root')!;

async function boot() {
  if (isSingleFile) {
    // Single-file preview: everything is already in this file and there is no URL routing.
    await Promise.all(ROUTES.map((r) => r.preload()));
    createRoot(root).render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    return;
  }

  // Load the current page's code before the first render so hydration matches the prerendered HTML.
  const current = ROUTES.find((r) => r.path !== '*' && matchPath({ path: r.path, end: true }, window.location.pathname)) ?? NOT_FOUND;
  await current.preload();

  const app = (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  // Hydrate only when the prerendered HTML is for this exact page; otherwise render fresh.
  const prerenderedFor = root.dataset.page;
  const wanted = current === NOT_FOUND ? '/404' : current.path;
  if (root.firstElementChild && prerenderedFor === wanted) {
    hydrateRoot(root, app);
  } else {
    root.textContent = '';
    createRoot(root).render(app);
  }
}

boot();
