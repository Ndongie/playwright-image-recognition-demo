import {logger} from "../utils/logger";
import HomePage from "../pages/homePage";
import UploadPage from '../pages/uploadPage';
import ResultsPage from '../pages/resultspage';
import ExternalSitePage from '../pages/externalSite';
import path from "path";
import fs from "fs";
import { Page } from '@playwright/test';

interface ImageFile {
  name: string;
  path: string;
  size: number;
}

interface TestAttemptResult {
  success: boolean;
  matchedPercent: number;
  matchedBirdName: string;
}

interface DownloadImageOptions {
  outputDir: string;
  fileName?: string;
  timeout?: number;
}

export default class Helpers{
    private static newName: string;
    /**
     * Method to get an image from a directory based on its name
     * @param imageName The name of the image
     * @param imagesDirectory The directory of the images
     * @returns an ImageFile object if found, null otherwise
     */
    static async getImageByNama(imageName: string, imagesDirectory: string): Promise<ImageFile | null> {
        logger.info(`Searching for image with name: ${imageName} from directory: ${imagesDirectory}`);
        try {
            const imagePath = path.join(imagesDirectory, imageName);

            // Check if image exists
            await fs.promises.access(imagePath);
            const stats = await fs.promises.stat(imagePath);
            logger.info(`${stats.isFile} : ${this.isImageFile(imageName)} `);
            if (!stats.isFile() || !this.isImageFile(imageName)) {
                logger.info("Image not found");
                return null;
            }
            
            logger.info("Image found");
            return {
                name: imageName,
                path: imagePath,
                size: stats.size
            };
        } catch (error) {
            logger.info("Image not found: ", error);
            return null;
        }
    }

    /**
     * Method to check if a file is an an image file
     * @param filename 
     * @returns boolean true if image file and false if not an an image file
     */
    private static isImageFile(filename: string): boolean {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
        const extension = path.extname(filename).toLowerCase();
        return imageExtensions.includes(extension);
    }

    static getProjectRootPath(): string {
        return path.resolve(__dirname, '../');
    }

    /**
     * method normalize string before comparison
     * @param str 
     * @returns 
     */
    static normalizeForComparison(str: string) {
        return str
            .toLocaleLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[_\s]/g, ' '); // Normalize underscores and spaces
    }

    /**
     * Custom method to run image recognition test with retries
     * @param page 
     * @param birdName 
     * @param expectMatchPercent 
     * @param maxRetries 
     * @param baseURL 
     * @returns a TestAttemptResult object with success status, matched percent and matched bird name
     */
    static async runImageRecognitionTest(
        page: Page, 
        birdName: string, 
        expectMatchPercent: number, 
        maxRetries: number,
        baseURL: string | undefined = undefined
    ) : Promise<TestAttemptResult> {
        let homepage: HomePage = new HomePage(page);
        let resultsPage: ResultsPage = undefined as any;
        let currentImage:string;
        let imageDirectory: string;
        let bestMatchPercent = 0;
        let bestMatchedBirdName = '';
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            logger.info(`Attempt ${attempt + 1} for ${birdName}`);
            
            try {
                this.newName = `${this.normalizeForComparison(birdName).split(".")[0].split(" ").join("_")}_${Date.now()}_${attempt}.jpg`;
                currentImage  =  attempt === 0
                    ? birdName
                    : (await Helpers.getAlternativeImages(birdName, page, attempt));

                imageDirectory  =  attempt === 0
                    ? path.join(this.getProjectRootPath(), 'data', 'images')
                    : path.join(this.getProjectRootPath(), 'data', 'alternative_images');    
 
                await homepage.uploadImage(currentImage, imageDirectory);
                const uploadPage: UploadPage = await homepage.gotoUploadPage();
                resultsPage = await uploadPage.gotoResultsPage();
                const matchedPercent: number = await resultsPage.getMatchedPercent();
                const matchedBirdName: string = await resultsPage.getMatchedBirdName();

                // Update best result
                if (matchedPercent > bestMatchPercent) {
                    bestMatchPercent = matchedPercent;
                    bestMatchedBirdName = matchedBirdName;
                }

                // Check success criteria
                const normalizedBirdName = Helpers.normalizeForComparison(birdName.split(".")[0]);
                const normalizedMatchedName = Helpers.normalizeForComparison(matchedBirdName);
                const nameMatches = normalizedBirdName === normalizedMatchedName;

                if(nameMatches){
                        logger.info(`Bird names match: ${normalizedBirdName} == ${normalizedMatchedName}`);
                    }
                    else{
                        logger.warn(`Bird names do not match: ${normalizedBirdName} != ${normalizedMatchedName}. Check if you provided the correct bird name`);
                }                   
                
                if (nameMatches && matchedPercent >= expectMatchPercent) {
                    logger.info(`Success on attempt ${attempt + 1}, matched percent: ${matchedPercent}%`);

                    try {
                        // Replace the old image with the new one
                        logger.info("Replacing the old test image with a better one");
                        const originPath = path.join(this.getProjectRootPath(), 'data', 'alternative_images', `${this.newName}`);
                        const targetPath = path.join(this.getProjectRootPath(), 'data', 'images', birdName);
                        fs.copyFileSync(originPath, targetPath);
                        logger.info("Old image successfully replaced");
                    } catch (error) {
                        logger.error("Failed to replace the old test image: ", error);
                    }

                    return { success: true, matchedPercent, matchedBirdName };
                }

                logger.warn(`Attempt ${attempt + 1} insufficient: ${matchedPercent}%`);
                homepage = await resultsPage.gotoHomePage(); // go back to home for next attempt
                
            } catch (error) {
                logger.error(`Attempt ${attempt + 1} failed: ${error}`);
                homepage = await resultsPage.gotoHomePage();
            }
        }
        
        return { 
            success: false, 
            matchedPercent: bestMatchPercent, 
            matchedBirdName: bestMatchedBirdName 
        };
    }

    static async getAlternativeImages(birdName: string, page:Page, attempt:number): Promise<string> {
        logger.info(`Getting alternative images for bird: ${birdName}`);
        const data = JSON.parse(process.env.TEST_DATA!);

        try {
            //Open external site and search for bird images on a new window
            //Use evaluate to open new window via JavaScript
            logger.info("Creating new context")
            const context = page.context();
            const newPage = await context.newPage();
            logger.info("New context successfully created")

            const externalSitePage = new ExternalSitePage(newPage);
            await externalSitePage.navigateToExternalSite(data.imageSite);
            await externalSitePage.searchAndDownloadBirdImages(
                this.normalizeForComparison(birdName), this.newName, attempt);

            // Close external tab and return to original
            await newPage.close();
            await page.bringToFront();

            logger.info(`Alternative image obtained: ${this.newName}`);
            return this.newName;
        } catch (error) {
            logger.error(`Failed to get alternative images for bird: ${birdName}, error: ${error}`);
            throw error;
        }
        
    }

    static async downloadImageByLocator(
    page: Page, 
    locator: string, 
    options: DownloadImageOptions, 
    attempts:number
    ): Promise<string> {
        const {
            outputDir,
            fileName = `image-${Date.now()}.jpg`,
            timeout = 30000
        } = options;

        logger.info(`Downloading image using locator: ${locator} to directory: ${outputDir}`);

        // Validate and create output directory
        if (!outputDir || typeof outputDir !== 'string') {
            throw new Error('Output directory is required and must be a string');
        }

        // Create output directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
            console.log(`Created directory: ${outputDir}`);
        }

        // Ensure the directory is writable
        try {
            fs.accessSync(outputDir, fs.constants.W_OK);
        } catch (error) {
            throw new Error(`Directory ${outputDir} is not writable`);
        }

        const outputPath = path.join(outputDir, fileName);
        try {
            // Wait for the element to be present and visible
            const elementLocator = page.locator(locator).nth(attempts - 1);
            await elementLocator.waitFor({ state: 'attached', timeout });
            
            // Get the image URL from the src attribute
            const imageUrl = await elementLocator.getAttribute('src');
            
            if (!imageUrl) {
                throw new Error(`No 'src' attribute found for locator: ${locator}`);
            }

            // Handle relative URLs
            const fullImageUrl = imageUrl.startsWith('http') 
            ? imageUrl 
            : new URL(imageUrl, page.url()).toString();

            console.log(`Downloading image from: ${fullImageUrl}`);

            // Download the image with timeout
            const response = await page.request.get(fullImageUrl, { timeout });
            
            if (!response.ok()) {
                throw new Error(`Failed to download image: ${response.status()} ${response.statusText()}`);
            }

            // Get content type and validate it's an image
            const contentType = response.headers()['content-type'];
            if (!contentType?.startsWith('image/')) {
                throw new Error(`Expected image content type, got: ${contentType}`);
            }

            // Get the image buffer and save to file
            const imageBuffer = await response.body();
            fs.writeFileSync(outputPath, imageBuffer);

            // Verify the file was written
            if (!fs.existsSync(outputPath)) {
                throw new Error(`Failed to save image to: ${outputPath}`);
            }

            const stats = fs.statSync(outputPath);
            logger.info(`Image successfully saved to: ${outputPath} (${stats.size} bytes)`);

            return outputPath;

        } catch (error: any) {
            // Clean up partially downloaded file if it exists
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            throw new Error(`Failed to download image using locator "${locator}": ${error?.message ?? String(error)}`);
        }
    }
    
}
