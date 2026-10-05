"use client";
import { useEffect, useState } from "react";
export const fmt = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("pt-BR").format(n);
export const pct = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(n) + "%";
export const date = (s: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(s));
export const officeName = (n: number) =>
  ({
    1: "Presidente",
    3: "Governador",
    5: "Senado",
    6: "Deputado Federal",
    7: "Deputado Estadual",
    8: "Deputado Distrital",
  })[n] ?? "Cargo";
export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export function useResource<T>(path: string | null) {
  const [result, setResult] = useState<{
    path: string;
    data?: T;
    error?: string;
  }>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    fetch(path, {
      signal: controller.signal,
      cache: path.includes("/snapshots/") ? "force-cache" : "no-store",
    })
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            r.status === 404
              ? "Base ainda não disponível."
              : "Não foi possível carregar os dados locais.",
          );
        return r.json() as Promise<T>;
      })
      .then((data) => setResult({ path, data }))
      .catch((e) => {
        if (e.name !== "AbortError") setResult({ path, error: e.message });
      });
    return () => controller.abort();
  }, [path]);
  return result?.path === path
    ? { data: result.data, error: result.error, loading: false }
    : { data: undefined, error: undefined, loading: true };
}
