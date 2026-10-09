import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import type { Candidate, CandidateDetail } from "../../lib/types";

const root = process.env.TEST_SUBPATH ?? "";
const snapshot = JSON.parse(fs.readFileSync("public/data/current.json", "utf8"));
const base = path.join("public", snapshot.base);
const candidates: Candidate[] = JSON.parse(fs.readFileSync(path.join(base, "candidates.json"), "utf8"));
const detail = (id: string): CandidateDetail => JSON.parse(fs.readFileSync(path.join(base, "candidates", id + ".json"), "utf8"));
const number = (n: number) => new Intl.NumberFormat("pt-BR").format(n);

for (const office of [6, 7]) {
  const d = candidates.filter(c => c.office === office && c.elected).map(c => detail(c.id)).find(d =>
    d.cities.some(m => m.votes === 0) && d.cities.some(m => m.votes > 0 && !m.leader))!;
  test(`sidebar → duas visoes → cidades com votos do cargo ${office}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(root + "/");
    await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", {
      name: office === 6 ? "Deputados Federais" : "Deputados Estaduais", exact: true,
    }).click();
    await expect(page.locator("h1")).toHaveText(office === 6 ? "Deputados Federais" : "Deputados Estaduais e Distritais");
    await page.getByRole("combobox", { name: "Estado", exact: true }).selectOption(d.candidate.uf);
    await page.getByLabel("Parlamentar ou partido").fill(d.candidate.name);
    await page.getByRole("button", { name: "Onde recebeu votos", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Estado", exact: true })).toHaveValue(d.candidate.uf);
    await page.getByRole("link", { name: d.candidate.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/deputados/${d.candidate.id}/votos$`));
    await expect(page.getByRole("button", { name: "Onde recebeu votos", exact: true })).toHaveAttribute("aria-pressed", "true");
    const expected = d.cities.filter(m => m.votes > 0).sort((a,b) => b.votes-a.votes || a.name.localeCompare(b.name,"pt-BR"));
    await expect(page.locator(".result-count")).toContainText(number(expected.length) + " cidades");
    while (await page.getByRole("button", { name: "Ver mais cidades" }).isVisible()) {
      await page.getByRole("button", { name: "Ver mais cidades" }).click();
    }
    await expect(page.locator("tbody tr")).toHaveCount(expected.length);
    expect(await page.locator("tbody tr td:first-child").allTextContents()).toEqual(expected.map(m => m.name));
    expect(await page.locator("tbody tr td:nth-child(2)").allTextContents()).toEqual(expected.map(m => number(m.votes)));
    const nonLeader = expected.find(m => !m.leader)!;
    await page.getByLabel("Pesquisar cidade").fill(nonLeader.name);
    await expect(page.locator("tbody").getByRole("link", { name: nonLeader.name, exact: true })).toBeVisible();
    await page.getByLabel("Pesquisar cidade").fill(d.cities.find(m => m.votes === 0)!.name);
    await expect(page.getByRole("heading", { name: "Nenhuma cidade nesta seleção" })).toBeVisible();
    await page.getByLabel("Pesquisar cidade").fill("");
    await page.getByRole("combobox", {name:"Ordenar cidades",exact:true}).selectOption("percent");
    const byPercent = [...expected].sort((a,b) => (b.percent ?? -1)-(a.percent ?? -1) || b.votes-a.votes || a.name.localeCompare(b.name,"pt-BR"));
    await expect(page.locator("tbody tr td:first-child").first()).toHaveText(byPercent[0].name);
    await page.reload();
    await expect(page.getByRole("button", { name: "Onde recebeu votos", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("img", {name:"Mapa territorial de " + d.candidate.name})).toBeVisible();
    await page.screenshot({ path: `test-results/territorio-${office}-desktop.png`, fullPage: true });
    await page.getByRole("button", { name: "Onde liderou", exact: true }).click();
    await expect(page.locator(".result-count")).toContainText(number(d.cities.filter(m => m.leader && m.votes > 0).length) + " cidades");
    await page.getByLabel("Pesquisar cidade").fill(nonLeader.name);
    await expect(page.getByRole("heading", { name: "Nenhuma cidade nesta seleção" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("distrital sem lideranca pode ter votos; mobile e navegacao municipal", async ({ page }) => {
  const d = candidates.filter(c => c.office === 8 && c.elected).map(c => detail(c.id)).find(d => d.receivedCount > 0 && d.leaderCount === 0 && d.tiedCount === 0)!;
  await page.setViewportSize({width:390,height:844});
  await page.goto(root + "/deputados-estaduais");
  await page.getByRole("combobox", {name:"Estado",exact:true}).selectOption("DF");
  await page.getByLabel("Parlamentar ou partido").fill(d.candidate.name);
  await page.getByRole("button", {name:"Onde recebeu votos",exact:true}).click();
  await page.getByRole("link", {name:d.candidate.name,exact:true}).click();
  await expect(page.locator("h1")).toHaveText(d.candidate.name);
  await expect(page.getByRole("button", {name:"Onde recebeu votos",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(page.getByRole("img", {name:"Mapa territorial de " + d.candidate.name})).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.screenshot({path:"test-results/territorio-mobile.png",fullPage:true});
  const overflow = await page.locator("body").evaluate(el => ({
    width: el.scrollWidth, viewport: window.innerWidth,
    elements: Array.from(el.querySelectorAll("*"))
      .filter(e => e.getBoundingClientRect().right > window.innerWidth + 1)
      .slice(0, 12).map(e => ({tag:e.tagName, className:e.className, width:e.getBoundingClientRect().width})),
  }));
  expect(overflow.width, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewport);
  await page.getByRole("button", {name:"Onde liderou",exact:true}).click();
  await expect(page.getByRole("heading", {name:"Nenhuma cidade nesta seleção"})).toBeVisible();
  await page.getByRole("button", {name:"Onde recebeu votos",exact:true}).click();
  await page.locator("tbody a").click();
  await expect(page.locator(".leader-card")).toHaveCount(2);
});

test("empates continuam liderancas e Senado preserva consulta de votos", async ({ page }) => {
  const audit=JSON.parse(fs.readFileSync("docs/independent-audit.json","utf8"));
  const d=detail(audit.ties[0].leaders[0]);
  const city=d.cities.find(m=>m.id===audit.ties[0].city)!;
  await page.goto(root+"/deputados/"+d.candidate.id);
  await page.getByLabel("Pesquisar cidade").fill(city.name);
  await expect(page.locator("tbody")).toContainText("1º · Empate");
  const senator=candidates.find(c=>c.office===5 && c.elected)!;
  await page.goto(root+"/deputados/"+senator.id);
  await expect(page.getByRole("button",{name:"Onde liderou",exact:true})).toHaveCount(0);
  await expect(page.locator("tbody tr").first()).toBeVisible();
});
