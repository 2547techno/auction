import Module from "node:module";

export const require = Module.createRequire(import.meta.url);
