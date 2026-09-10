import { readFile, writeFile } from "node:fs/promises";

const frontendRoot = new URL("./", import.meta.url);
const distRoot = new URL("./dist/", frontendRoot);
const appScriptRoot = new URL("../app-script/", frontendRoot);

const distIndex = await readFile(new URL("./index.html", distRoot), "utf8");
let appsScriptIndex = distIndex.replace(
  /\s*<link rel="icon"[^>]*>/i,
  ""
);

appsScriptIndex = await inlineStylesheets(appsScriptIndex);
appsScriptIndex = await inlineScripts(appsScriptIndex);

await writeFile(
  new URL("./index.html", appScriptRoot),
  appsScriptIndex,
  "utf8"
);

async function inlineStylesheets(html) {
  const stylesheetPattern = /<link([^>]+)href="([^"]+\.css)"([^>]*)>/gi;
  const matches = [...html.matchAll(stylesheetPattern)];

  for (const match of matches) {
    const stylesheetPath = new URL(match[2], distRoot);
    const stylesheet = await readFile(stylesheetPath, "utf8");
    html = html.replace(match[0], () => `<style>${stylesheet}</style>`);
  }

  return html;
}

async function inlineScripts(html) {
  const scriptPattern = /<script([^>]+)src="([^"]+\.js)"([^>]*)><\/script>/gi;
  const matches = [...html.matchAll(scriptPattern)];

  for (const match of matches) {
    const scriptPath = new URL(match[2], distRoot);
    const script = await readFile(scriptPath, "utf8");
    html = html.replace(match[0], () => `<script type="module">${script}</script>`);
  }

  return html;
}