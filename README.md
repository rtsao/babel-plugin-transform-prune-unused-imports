# babel-plugin-transform-prune-unused-imports

## Install

Using npm:

```
npm install babel-plugin-transform-prune-unused-imports --save-dev
```

or using yarn:

```
yarn add babel-plugin-transform-prune-unused-imports --dev
```

## Usage

### Options

By default, only `true` and `false` identifiers are considered truthy/falsy.

- `falsyExpressions` : `Array<string>` - Expressions (in addition to `false`) to be treated as falsy
- `truthyExpressions` : `Array<string>` - Expressions (in addition to `true`) to be treated as truthy

### Examples

```json
{
  "plugins": [
    [
      "transform-prune-unused-imports",
      {
        "falsyExpressions": ["process.env.NODE_ENV !=='production'"]
      }
    ]
  ]
}
```

```json
{
  "plugins": [
    [
      "transform-prune-unused-imports",
      {
        "falsyExpressions": ["__NODE__"],
        "truthyExpressions": ["__BROWSER__"]
      }
    ]
  ]
}
```

## Features

This plugin is able identify unused imports in the following scenarios:

### Unreachable conditionals

```js
import { unreachable, reachable } from "some-pkg";

if (false) {
  unreachable;
}

if (true) {
  reachable;
} else {
  unreachable;
}

true ? reachable : unreachable;

false ? unreachable : reachable;
```

### Unreachable chained logical expressions

```js
import { unreachable } from "some-pkg";

foo && false && bar && unreachable;
```

## Caveats

While this plugin works for most use cases, the static analysis is performed by this plugin is ultimately limited and won't work in some scenarios.

#### Unused assignment expressions

Currently this plugin will not prune unused imports that are assigned to variables, even if those new variables are unused. For example:

```js
import { unreachable } from "some-pkg";

const foo = unreachable;

if (false) {
  foo;
}
```
