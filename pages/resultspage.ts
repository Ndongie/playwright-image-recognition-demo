import { Page } from "@playwright/test";
import {logger} from "../utils/logger";
import Helpers from '../utils/helpers';
import path from "path";
import HomePage from "./homePage";

export default class ResultsPage{
    private page : Page;
    private matchedPercentLocator = ".espece .pour100esp"; // le localisateur pour le pourcentage de correspondance
    private matchedBirdName = ".espece a"; // le localisateur pour le nom commun de l'oiseau correspondent
    private alternativeImagesLocator = ".reponses img"; // le localisateur pour les images alternatives
    private alternativeNamesLocator = ".reponses a"; // le localisateur pour les noms des oiseaux alternatifs
    private homepageButtonLocator = ".accueil_id"; // le localisateur pour le bouton de la page d'accueil
    
    constructor(page: Page) {
        this.page = page;
    }

    /**
     * Method to get the matched percent from the Results Page
     * @returns the matched percent as a number
     */
    async getMatchedPercent(): Promise<number>{
        logger.info("Getting matched percent from Results Page");
        const matchedPercentString = await this.page.locator(this.matchedPercentLocator).nth(1).textContent().then(
            (text) => text ? text.split("%")[0].trim() : "");
        const matchedPercent = Number.parseFloat(matchedPercentString);
        logger.info(`Matched percent obtained: ${matchedPercent}`);
        return matchedPercent;
    }

    /**
     * method to get the matched bird name from the Results Page
     * @returns the matched bird name as a string
     */
    async getMatchedBirdName(): Promise<string>{
        logger.info("Getting matched bird name from Results Page");
        const matchedName = await this.page.locator(this.matchedBirdName).nth(0).textContent().then(
            (text) => text ? text.trim() : "");
        logger.info(`Matched name found: ${matchedName}`);
        return matchedName;
    }

    async getAlternativeImageNames(): Promise<string[]>{
        logger.info("Getting alternative bird names from Results Page");
        const alternativeNamesElements = this.page.locator(this.alternativeNamesLocator);
        const count = await alternativeNamesElements.count();
        const alternativeNames: string[] = [];
        for(let i=0; i<count; i++){
            const name = await alternativeNamesElements.nth(i).textContent().then(
                (text) => text ? text.trim() : "");
            alternativeNames.push(name);
        }
        logger.info(`Alternative bird names obtained: ${alternativeNames.join(", ")}`);
        return alternativeNames;
    }

    async captureAlternativeImagesScreenshots(imageName:string): Promise<void>{
        logger.info("Capturing screenshots of alternative images from Results Page");
        const alternativeImagesElements = this.page.locator(this.alternativeImagesLocator);
        
        const count = await alternativeImagesElements.count();
        for(let i=0; i<count; i++){
            const screenshotPath = path.join(Helpers.getProjectRootPath(), 'data', 'alternative_images', `${imageName}_${i+1}.jpeg`);
            await alternativeImagesElements.nth(i).screenshot({ 
                path: screenshotPath,
                type: 'jpeg',
                quality: 80,
                omitBackground: true,
                scale: 'css'});
            logger.info(`Captured screenshot of alternative image ${i+1}: ${screenshotPath}`);
        }
    }

    async gotoHomePage(): Promise<HomePage>{
        logger.info("Navigating to Home Page from Results Page");
        await this.page.locator(this.homepageButtonLocator).click();
        logger.info("Navigated to Home Page from Results Page");
        return new HomePage(this.page);
    }

}
