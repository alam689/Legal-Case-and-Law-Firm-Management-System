import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** Node (vitest) environment-এর mock server। */
export const server = setupServer(...handlers);
