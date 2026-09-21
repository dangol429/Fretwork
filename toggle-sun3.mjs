import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1200, height: 400 }, deviceScaleFactor: 3 })).newPage();
await page.goto("http://localhost:4321/chord/bb-major", { waitUntil: "networkidle" });
await page.mouse.move(10, 10);
await page.locator(".theme-toggle").screenshot({ path: process.argv[2] });
await browser.close();
