import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { logger } from './utils/logger';

// Read test data
function loadTestData() {
  logger.info("Reading test data....")
  const dataPath = path.resolve(__dirname, './data/names/names.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  logger.info("Test data successfully read")
  return JSON.parse(rawData);
}

async function globalSetup(config: FullConfig) {
    logger.info('Global setup started');
    
    const testData = loadTestData();
    
    // Set as environment variable
    process.env.TEST_DATA = JSON.stringify(testData);

    logger.info('Global setup completed');
}
export default globalSetup;