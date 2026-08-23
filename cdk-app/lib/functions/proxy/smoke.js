import fs from 'fs';
import path from 'path';
import { handler } from './index.js';

const smoke = () => {
  const event = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'event.json'), 'utf-8'));
  return handler(event);
};

smoke();
