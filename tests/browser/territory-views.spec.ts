import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { Candidate, CandidateDetail, Municipality } from "../../lib/types";
const root = process.env.TEST_SUBPATH ?? "";
const snapshot = JSON.parse(fs.readFileSync("public/data/current.json", "utf8"));
const read = (file: string) => JSON.parse(fs.readFileSync(path.join("public", snapshot.base, file), "utf8"));
const cities: Municipality[] = read("municipalities.json");
const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
for (const office of [6, 7, 8]) {
  test(`Cidades inclui todos os votados do cargo ${office}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    const section = office === 6 ? "deputados-federais" : "deputados-estaduais";
    const city = cities.find(c => c.uf === (office === 8 ? "DF" : "AC") && c.capital)!;
    await page.goto(root + "/" + section);
    await expect(page.getByRole("link", {name:"Cidades",exact:true})).toBeVisible();
    await page.getByRole("link", {name:"Cidades",exact:true}).click();
    await page.getByRole("combobox", {name:"Estado",exact:true}).selectOption(city.uf);
    await page.getByLabel("Pesquisar município").fill(city.name);
    await page.locator(".city-options").getByRole("link", {name:city.name + " / " + city.uf,exact:true}).click();
    await expect(page.locator("h1")).toHaveText(city.name + " / " + city.uf);
    const expected: Candidate[] = read("municipal-votes/" + city.id + ".json").results[office].candidates;
    expect(expected.some(c => !c.elected)).toBe(true);
    await expect(page.locator(".city-votes .result-count")).toContainText(fmt(expected.length) + " candidatos");
    while (await page.getByRole("button", {name:/Ver mais \(/}).isVisible()) await page.getByRole("button", {name:/Ver mais \(/}).click();
    await expect(page.locator("tbody tr")).toHaveCount(expected.length);
    expect(await page.locator("tbody td:nth-child(4) strong").allTextContents()).toEqual(expected.map(c => fmt(c.votes)));
    expect(await page.locator("tbody td:first-child").allTextContents()).toEqual(expected.map(c => String(c.rank)));
    const other = expected.find(c => !c.elected)!;
    await page.getByLabel("Candidato ou partido").fill(other.name);
    await expect(page.locator("tbody")).toContainText(other.status);
    await expect(page.locator("tbody tr").filter({hasText:other.number}).locator("td").first()).toHaveText(String(other.rank));
    await expect(page.locator("tbody").getByRole("link",{name:other.name,exact:true})).toHaveCount(0);
    await page.getByLabel("Candidato ou partido").fill("");
    await page.getByRole("combobox",{name:"Situação eleitoral",exact:true}).selectOption("elected");
    await expect(page.locator(".city-votes .result-count")).toContainText(fmt(expected.filter(c => c.elected).length) + " candidatos");
    await page.getByRole("combobox",{name:"Situação eleitoral",exact:true}).selectOption("all");
    await page.reload();
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await page.screenshot({path:`test-results/cidades-${office}.png`,fullPage:true});
    if (office === 7) {
      await page.setViewportSize({width:390,height:844});
      expect(await page.locator("body").evaluate(el => el.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({path:"test-results/cidades-mobile.png",fullPage:true});
      await page.getByRole("columnheader",{name:"Posição",exact:true}).scrollIntoViewIfNeeded();
      await page.locator(".table-wrap").evaluate(el => {el.scrollLeft = el.scrollWidth;});
      await expect(page.getByRole("columnheader",{name:"Situação",exact:true})).toBeInViewport();
    }
    expect(errors).toEqual([]);
  });
}
test("Deputados reúne votação e liderança", async ({page}) => {
  const candidates: Candidate[] = read("candidates.json");
  const d: CandidateDetail = candidates.filter(c => c.office === 7 && c.elected).map(c => read("candidates/" + c.id + ".json")).find(d => d.receivedCount > d.leaderCount + d.tiedCount);
  await page.goto(root + "/deputados-estaduais");
  await page.getByLabel("Parlamentar ou partido").fill(d.candidate.name);
  await page.getByRole("link",{name:d.candidate.name,exact:true}).click();
  await expect(page.locator("h1")).toHaveText(d.candidate.name);
  await expect(page.locator(".result-count")).toContainText(fmt(d.receivedCount) + " cidades");
  const filter = page.getByRole("checkbox",{name:"Somente cidades onde liderou"});
  await expect(filter).not.toBeChecked();
  await filter.check();
  await expect(page).toHaveURL(/\/liderancas$/);
  await expect(page.locator(".result-count")).toContainText(fmt(d.leaderCount + d.tiedCount) + " cidades");
  await filter.uncheck();
  await expect(page).toHaveURL(/\/votos$/);
  await expect(page.locator(".result-count")).toContainText(fmt(d.receivedCount) + " cidades");
  await expect(page.getByRole("img",{name:"Mapa territorial de " + d.candidate.name})).toBeVisible();
  await page.screenshot({path:"test-results/deputados-unificado.png",fullPage:true});
});

test("filtro de liderança preserva empate real", async ({page}) => {
  const audit = JSON.parse(fs.readFileSync("docs/independent-audit.json","utf8"));
  const tie = audit.ties[0];
  const city = cities.find(c => c.id === tie.city)!;
  await page.goto(root + "/deputados/" + tie.leaders[0] + "/liderancas");
  await page.getByLabel("Pesquisar cidade").fill(city.name);
  await expect(page.locator("tbody")).toContainText("1º · Empate");
  await expect(page.getByRole("checkbox",{name:"Somente cidades onde liderou"})).toBeChecked();
});
