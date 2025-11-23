import { Page } from "@playwright/test";
import {logger} from "../utils/logger";
import ResultsPage from "./resultspage";

export default class UploadPage{
    private page : Page;
    private previousButton = ".boutons input[type='button']";  // le localisateur du bouton precedent
    private nextButton = ".boutons input[type='submit']";  // le localisateur du bouton suivant

    constructor(page: Page) {
        this.page = page;
    }

    async gotoResultsPage():Promise<ResultsPage>{
        logger.info("Navigating to Results Page from Upload Page");
        await this.page.locator(this.nextButton).click();
        logger.info("Navigated to Results Page from Upload Page");
        return new ResultsPage(this.page);
    }

}
