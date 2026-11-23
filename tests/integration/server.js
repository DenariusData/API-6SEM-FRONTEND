import { setupServer } from 'msw/node';

export const API = 'http://localhost:8000/api';

export const server = setupServer();
