import type { NextConfig } from "next";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
if (basePath && !/^\/[a-zA-Z0-9-]+$/.test(basePath)) {
  throw new Error("NEXT_PUBLIC_BASE_PATH deve ser um caminho simples, como /dashpolitico");
}
const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  basePath,
  output: "standalone",
};
export default config;
