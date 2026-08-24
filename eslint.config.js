import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "src-tauri/**"] },
  {
    files: ["src/{lib,repositories,services,stores,types}/**/*.ts"],
    extends: [tseslint.configs.recommended],
  },
);
