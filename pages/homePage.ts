import { Page } from "@playwright/test";
import {logger} from "../utils/logger";
import Helpers from '../utils/helpers';
import UploadPage from "./uploadPage";

export default class HomePage {
    private page : Page; 

    private imageUploadInput = ".drop_prompt"; // le localisateur pour l'input de téléchargement d'image
    private nextButton = ".boutons input";  // le localisateur du bouton suivant

    // constructeru de l'objet HomePage
    constructor(page: Page) {
        this.page = page;
    }

    async uploadImage(birdName: string, imagePath:string): Promise<void>{
        logger.info(`Uploading image for the bird: ${birdName}`);
        const imageFile = await Helpers.getImageByNama(birdName, imagePath);

        if (!imageFile || !imageFile.path) {
            throw new Error(`Image not found for bird: ${birdName}`);
        }

        await this.page.waitForSelector(this.imageUploadInput); 
        await this.page.locator(this.imageUploadInput).click();

        const fileInputs = await this.page.$$('input[type="file"]');
        if (fileInputs.length > 0) {
            // Use the first file input found
            await this.page.setInputFiles('input[type="file"]', imageFile.path);
        } else {
            // try the original element
            await this.page.locator(this.imageUploadInput).setInputFiles(imageFile.path);
        }

        logger.info(`Image uploaded for the bird: ${birdName}`);
    }

    async gotoUploadPage(): Promise<UploadPage>{ 
        logger.info("Navigating to Upload Page from Home Page");
        await this.page.locator(this.nextButton).click();
        logger.info("Navigated to Upload Page from Home Page");
        return new UploadPage(this.page);
    }
}
