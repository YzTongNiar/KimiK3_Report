import { pathToFileURL } from "node:url";
const {chromium}=await import(pathToFileURL("C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs").href);
const browser=await chromium.launch({headless:true}); const page=await browser.newPage();
const resp=await page.goto("https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js",{waitUntil:"domcontentloaded",timeout:20000}); console.log("status="+resp?.status()); console.log("len="+(await page.content()).length); await browser.close();
