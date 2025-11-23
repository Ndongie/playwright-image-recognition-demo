// global-teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Global teardown started');
  console.log('Global teardown completed');
}

export default globalTeardown;
