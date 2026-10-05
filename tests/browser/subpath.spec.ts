import { test, expect } from "@playwright/test";
test.skip(!process.env.TEST_SUBPATH, "Use TEST_SUBPATH para validar o build com subdiretorio");
const root = process.env.TEST_SUBPATH ?? "/dashpolitico";
test("publicacao em subdiretorio preserva dados, mapas e navegacao", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", e => failures.push(e.message));
  page.on("response", r => { if(r.status() >= 400 && r.url().includes(new URL(page.url()).host)) failures.push(r.url()); });
  await page.goto(root);
  await expect(page.locator("h1")).toContainText("RADAR ELEITORAL BRASIL");
  await expect(page.getByRole("img", { name: "Mapa interativo dos 27 estados do Brasil" }).locator("a")).toHaveCount(27);
  const mapLink = page.locator(`a[href="${root}/estados/AC"]`).first();
  await expect(mapLink).toBeVisible();
  await mapLink.click();
  await expect(page).toHaveURL(new RegExp(root + "/estados/AC$"));
  await expect(page.locator("h1")).toContainText(/acre/i);
  await page.goto(root + "/municipios/AC-01007");
  await expect(page.locator(".leader-card")).toHaveCount(2);
  await expect(page.locator(".leader-person")).toHaveCount(2);
  await page.locator(".leader-person a").first().click();
  await expect(page).toHaveURL(new RegExp(root + "/deputados/"));
  await expect(page.locator("h1")).toBeVisible();
  expect(failures).toEqual([]);
});

