# @sentinel/config

Shared developer tooling for the monorepo. Not published; consumed via
`workspace:*`.

## Exports

| Specifier                            | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| `@sentinel/config/eslint-base`       | Flat ESLint base (TS, no-`any`, prettier)|
| `@sentinel/config/eslint-node`       | Base + Node globals                      |
| `@sentinel/config/eslint-next`       | Base + browser globals + Next rules      |
| `@sentinel/config/prettier`          | Prettier config object                   |
| `@sentinel/config/tsconfig/base.json`| Strict base tsconfig                     |
| `@sentinel/config/tsconfig/node.json`| Node service tsconfig                    |
| `@sentinel/config/tsconfig/nextjs.json` | Next.js app tsconfig                  |

## Usage

`eslint.config.mjs`:

```js
import config from "@sentinel/config/eslint-node";
export default config;
```

`tsconfig.json`:

```json
{ "extends": "@sentinel/config/tsconfig/node.json", "include": ["src"] }
```
