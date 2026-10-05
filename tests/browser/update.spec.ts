import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
const current = JSON.parse(fs.readFileSync("public/data/current.json", "utf8"));
const base = path.join("public", current.base);
const cities = JSON.parse(fs.readFileSync(path.join(base, "municipalities.json"), "utf8")) as {id:string;uf:string;capital:boolean}[];
const root = process.env.TEST_SUBPATH ?? "";
for (const uf of ["BA", "MG", "PR", "SP"]) {
  test(`atualizacao publica lideres confirmados na capital de ${uf}`, async ({ page, request }) => {
    const city = cities.find(c => c.uf === uf && c.capital)!;
    const pointer = await request.get(root + "/data/current.json");
    expect(pointer.ok()).toBe(true);
    expect((await pointer.json()).version).toBe(current.version);
    await page.goto(root + "/municipios/" + city.id);
    await expect(page.locator(".leader-card")).toHaveCount(2);
    await expect(page.getByRole("heading", {name:"Confirmação de eleitos pendente"})).toHaveCount(0);
    const details = JSON.parse(fs.readFileSync(path.join(base, "municipalities", city.id + ".json"), "utf8"));
    for (const office of ["6", "7"]) {
      expect(["unique", "tie"]).toContain(details.leaders[office].status);
      for (const leader of details.leaders[office].leaders) {
        await expect(page.locator(".leader-person h3").filter({hasText:leader.name})).toBeVisible();
      }
    }
    await expect(page.getByText(/Ver ranking completo|TOP 5 DEPUTADOS|TOP 10 DEPUTADOS/i)).toHaveCount(0);
  });
}
