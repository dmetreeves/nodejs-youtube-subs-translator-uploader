import puppeteer from 'puppeteer';

async function puppeteerNewTempPage(callback) {
    return puppeteerNewTempSession((session) => {
        return puppeteerSessionNewTempPage(session, callback)
    });
}

async function puppeteerSessionNewTempPage(session, callback) {
    const page = await session.newPage();
    console.log('new puppeteer page created');
    await callback(page);
    await page.close();
    console.log('puppeteer page closed');
}

async function puppeteerNewTempSession(callback) {
    const session = await puppeteer.launch({
        headless: true,
        devtools: false,
        args: [
            '--disable-canvas-aa', // Disable antialiasing on 2d canvas
            '--disable-2d-canvas-clip-aa', // Disable antialiasing on 2d canvas clips
            '--disable-gl-drawing-for-tests', // BEST OPTION EVER! Disables GL drawing operations which produce pixel output. With this the GL output will not be correct but tests will run faster.
            '--disable-dev-shm-usage', // ???
            '--no-zygote', // wtf does that mean ?
            '--use-gl=swiftshader', // better cpu usage with --use-gl=desktop rather than --use-gl=swiftshader, still needs more testing.
            '--enable-webgl',
            '--hide-scrollbars',
            '--mute-audio',
            '--no-first-run',
            '--disable-infobars',
            '--disable-breakpad',
            '--window-size=1280,1024', // see defaultViewport
            '--user-data-dir=/app/chromeData', // created in index.js, guess cache folder ends up inside too.
            '--no-sandbox', // meh but better resource comsuption
            '--disable-setuid-sandbox' // same
        ],
        defaultViewport:  {
            width: 1280,
            height: 1024
        }
    });
    console.log('puppeteer session launched');
    try {
        await callback(session);
    } catch(e) {
        console.error(e);
    }
    await session.close();
    console.log('puppeteer session closed');
}

export { puppeteerNewTempPage, puppeteerSessionNewTempPage, puppeteerNewTempSession }