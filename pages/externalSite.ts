import { Page } from "@playwright/test";
import {logger} from "../utils/logger";
import Helpers from '../utils/helpers';
import path from "path";

export default class ExternalSitePage{
    private page : Page;
    private searchInputLocator = '#term'; // locator for search field
    private imageTabLocator = "//div[@class='gsc-tabsArea']/div[2]"; // locator for images tab
    private imageResultsLocator = ".gs-image-thumbnail-box img"; // locator for image results

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToExternalSite(url: string): Promise<void>{
        logger.info(`Navigating to external site: ${url}`);
        await this.page.goto(url);
        logger.info(`Navigated to external site: ${url}`);
    }
    
    async searchAndDownloadBirdImages(birdName: string, newName: string, attempts: number): Promise<string>{      
        const normalizeName = birdName.split(".")[0];
        logger.info(`Searching for bird: ${normalizeName} on external site`);
        await this.page.fill(this.searchInputLocator, normalizeName);
        await this.page.press(this.searchInputLocator, 'Enter');
        await this.page.waitForSelector(this.imageTabLocator);
        await this.page.click(this.imageTabLocator);
        await this.page.waitForSelector(this.imageResultsLocator);
        const imageElements = this.page.locator(this.imageResultsLocator);
        const count = await imageElements.count();
        logger.info(`Found ${count} images for bird: ${normalizeName} on external site`);

        const outputDir = path.join(Helpers.getProjectRootPath(), 'data', 'alternative_images');
        const result = await Helpers.downloadImageByLocator(
            this.page, 
            this.imageResultsLocator, 
            {
                outputDir: outputDir,
                fileName: newName,
                timeout: 60000
            },
            attempts
        );

        logger.info(`Downloaded images for bird: ${birdName} to ${outputDir}`);
        return result;
    }

    async getBirdName(attempts: number): Promise<string>{
        logger.info("Getting alternative bird names from External Site Page");
        const birdName = await this.page.locator(this.imageResultsLocator).nth(attempts - 1).getAttribute('alt').then(   
            (text) => text ? text.trim() : "");
        logger.info(`Alternative bird name obtained: ${birdName}`);
        return birdName;
    }
}