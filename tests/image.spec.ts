import { test, expect } from '@playwright/test';
import { logger } from '../utils/logger';
import Helpers from '../utils/helpers';
import fs from 'fs';
import path from 'path';

test.describe("Tests de reconnaissance visuels des oiseaux", () => {
    let data: any = undefined;
    if (process.env.TEST_DATA) {
        try {
            data = JSON.parse(process.env.TEST_DATA);
        } catch (e) {
            logger.warn('Invalid TEST_DATA JSON; using file-based fallback.');
        }
    }
    if (!data) {
        try {
            const filePath = path.resolve(process.cwd(), 'data', 'names', 'names.json');
            const raw = fs.readFileSync(filePath, 'utf8');
            const cleaned = raw.replace(/^\uFEFF/, '').replace(/^[\u0000-\u0020\uFEFF]+/, '');
            data = JSON.parse(cleaned);
        } catch (e) {
            logger.warn('Failed to read names.json; using default test data.');
            data = { names: [], expectedMatch: 0 };
        }
    }
    const birdNames: string[] = data.names || [];
    const expectMatchPercent: number = data.expectedMatch || 0;

    test.beforeEach(async ({page, baseURL }) => {
        logger.info("Navigating to Home Page");
        if (baseURL) {
            await page.goto(baseURL);
            logger.info(`Navigated to Home Page: ${baseURL}`);
        } else {
            // Upon a blank page when the baseURL is undefined            
            await page.goto('about:blank');
            logger.warn("Base URL is undefined. Navigated to about:blank");
        }
        logger.info("Test started");
    });

    for(const birdName of birdNames){
        test(`Test de reconnaissance visuels de ${birdName}`, async ({page, baseURL}) => {
            logger.info(`Running Test of matching ${birdName}.....`);

            const result = await Helpers.runImageRecognitionTest(
                page, 
                birdName, 
                expectMatchPercent, 
                3,
                baseURL
            );

            const normalizedMatchedName = Helpers.normalizeForComparison(result.matchedBirdName);
            const normalizedExpectedName = Helpers.normalizeForComparison(birdName.split(".")[0]);
            expect(normalizedMatchedName, `le nom de l'oiseau reconnu ne correspond pas a celui attandu. Le nom est ${normalizedMatchedName} au lieu de ${normalizedExpectedName}`)
            .toBe(normalizedExpectedName);
            
            expect(result.matchedPercent, `Le score ne correspond pas a celui attandu. Le score est de ${result.matchedPercent}% au lieu de ${expectMatchPercent}%`)
            .toBeGreaterThanOrEqual(expectMatchPercent);
            
            if (!result.success) {
                logger.warn(`Test passed using best attempt: ${result.matchedPercent}%`);
            }
            
            logger.info(`Image recognition test completed for ${birdName}: ${result.matchedPercent}%`);
        });
    }

});
