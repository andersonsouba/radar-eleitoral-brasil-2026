import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { City, Municipality } from "../../lib/types";
const root = process.env.TEST_SUBPATH ?? "";
const current = JSON.parse(fs.readFileSync("public/data/current.json", "utf8"));
const base = path.join("public", current.base);
const read = (p: string) =>
  JSON.parse(fs.readFileSync(path.join(base, p), "utf8"));
const municipalities = read("municipalities.json") as Municipality[];
const allCities = fs
  .readdirSync(path.join(base, "municipalities"))
  .map((f) => read("municipalities/" + f) as City);
const known = allCities.find(
  (c) =>
    c.leaders["6"].status === "unique" &&
    (c.leaders["7"] ?? c.leaders["8"]).status === "unique",
)!;
const tie = allCities.find((c) =>
  Object.values(c.leaders).some(
    (l: unknown) => (l as { status: string }).status === "tie",
  ),
)!;
const candidate = known.leaders["6"].leaders[0];
const routes = [
  "/",
  "/estados",
  "/estados/AC",
  "/municipios",
  "/deputados-estaduais",
  "/deputados-federais",
  "/senado",
  "/governadores",
  "/presidente",
  "/partidos",
  "/metodologia",
];
for (const route of routes)
  test("abre " + route, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(root + route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("Carregando dados locais…")).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
test("municipio mostra exatamente um eleito por cargo", async ({ page }) => {
  await page.goto(root + "/municipios/" + known.id);
  const cards = page.locator(".leader-card");
  await expect(cards).toHaveCount(2);
  for (const c of [
    known.leaders["7"] ?? known.leaders["8"],
    known.leaders["6"],
  ]) {
    await expect(
      page.locator(".leader-person h3").filter({ hasText: c.leaders[0].name }),
    ).toBeVisible();
  }
  await expect(page.locator(".leader-person")).toHaveCount(2);
  await expect(
    page.getByText(/Ver ranking completo|TOP 5 DEPUTADOS|TOP 10 DEPUTADOS/i),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/municipio.png", fullPage: true });
});
test("empate real e preservado na ficha", async ({ page }) => {
  expect(tie).toBeTruthy();
  await page.goto(root + "/municipios/" + tie.id);
  await expect(page.getByText(/Empate real:/)).toBeVisible();
  const expected = Object.values(tie.leaders).reduce(
    (n: number, l: unknown) => n + (l as { leaders: unknown[] }).leaders.length,
    0,
  );
  await expect(page.locator(".leader-person")).toHaveCount(expected);
});
test("pendencia oficial nao vira vencedor local", async ({ page }) => {
  const pending = allCities.find(
    (c) =>
      c.leaders["6"].status === "pending" &&
      (c.leaders["7"] ?? c.leaders["8"]).status === "pending",
  );
  test.skip(!pending, "A coleta atual não possui mais municípios com ambos os cargos pendentes");
  await page.goto(root + "/municipios/" + pending!.id);
  await expect(
    page.getByRole("heading", { name: "Confirmação de eleitos pendente" }),
  ).toHaveCount(2);
  await expect(page.locator(".leader-person")).toHaveCount(0);
});
test("busca sem acento navega para cidade real", async ({ page }) => {
  await page.goto(root + "/municipios/AC");
  await page.getByLabel("Município", { exact: true }).fill("rio branco");
  await page
    .locator(".search-results")
    .getByRole("link")
    .filter({ hasText: "RIO BRANCO" })
    .click();
  await expect(page.locator("h1")).toHaveText("RIO BRANCO / AC");
});
test("estado abre deputado e cidades lideres", async ({ page }) => {
  await page.goto(root + "/deputados/" + candidate.id);
  await expect(page.locator("h1")).toHaveText(candidate.name);
  await expect(
    page.getByRole("button", { name: "Liderança entre eleitos", exact: true }),
  ).toHaveClass(/selected/);
  await page
    .getByRole("button", { name: "Votos absolutos", exact: true })
    .click();
  await expect(page.locator("tbody tr").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Percentual local", exact: true })
    .click();
  await expect(
    page.getByText("maior participação local", { exact: false }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/deputado.png", fullPage: true });
});
test("partidos separam representacao e votacao", async ({ page }) => {
  await page.goto(root + "/partidos");
  await expect(
    page.getByRole("columnheader", { name: "Municípios líderes", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("AC");
  await page.locator(".party-button").first().click();
  await expect(
    page.getByRole("heading", { name: /cidades lideradas/ }),
  ).toBeVisible();
});
test("mobile navegacao e ficha sem overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(root + "/");
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("navigation")
    .getByRole("link", { name: "Municípios", exact: true })
    .click();
  await expect(page.locator("h1")).toContainText("cidade");
  await page.goto(root + "/municipios/" + known.id);
  await expect(page.locator(".leader-person")).toHaveCount(2);
  expect(
    await page
      .locator("body")
      .evaluate((el) => el.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
});
test("home mapa nacional real e screenshot", async ({ page }) => {
  await page.goto(root + "/");
  await expect(page.locator(".map-state")).toHaveCount(27);
  await page.screenshot({ path: "test-results/home.png", fullPage: true });
  expect(municipalities.length).toBe(current.municipalities);
});
