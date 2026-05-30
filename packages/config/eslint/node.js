import globals from "globals";
import base from "./base.js";

/** Base config plus Node.js globals — for backend services and node packages. */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
];
