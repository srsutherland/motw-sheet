import { chromium } from 'playwright-core';

// Browser tests drive an installed browser (no download): Edge by default,
// or set TEST_BROWSER=chrome. The app's URL comes from run.mjs.
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:5199/motw-sheet/';

const launch = () => chromium.launch({ channel: process.env.TEST_BROWSER ?? 'msedge', headless: true });

// A page that records console errors and uncaught exceptions into `errors`.
const watchedPage = async (context, errors) => {
    const page = await context.newPage();
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    return page;
};

export { BASE, launch, watchedPage };
