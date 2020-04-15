// @flow

/*::
type PluginOpts = {
  falsyExpressions: Array<string>,
  truthyExpressions: Array<string>,
  ignoredModules: Array<string>,
};
*/

module.exports = (
  api /*: any */,
  {
    falsyExpressions: falsyOpt = [],
    truthyExpressions: truthyOpt = [],
    ignoredModules: modulesArr = []
  } /*: PluginOpts */ = {}
) => {
  const { types: t } = api;

  if (!Array.isArray(falsyOpt)) {
    throw new Error("falsyExpressions must be an array");
  }
  if (!Array.isArray(truthyOpt)) {
    throw new Error("truthyExpressions must be an array");
  }

  const ignoredModules = new Set(modulesArr);

  function stringToExpression(expr) {
    if (typeof expr !== "string") {
      expr = String(expr);
    }
    try {
      const {
        program: { body }
      } = api.parse(expr);

      if (body.length !== 1) {
        throw new Error();
      }
      const [statement] = body;
      if (!t.isExpressionStatement(statement)) {
        throw new Error();
      }
      return statement.expression;
    } catch (err) {
      throw new Error(`Failed to parse "${expr}" as a valid expression`);
    }
  }

  const falsyExpressions = [
    t.booleanLiteral(false),
    ...falsyOpt.map(stringToExpression)
  ];

  const truthyExpressions = [
    t.booleanLiteral(true),
    ...truthyOpt.map(stringToExpression)
  ];

  function isFalsyPath(path) {
    return falsyExpressions.some(falsy =>
      t.isNodesEquivalent(path.node, falsy)
    );
  }

  function isTruthyPath(path) {
    return truthyExpressions.some(truthy =>
      t.isNodesEquivalent(path.node, truthy)
    );
  }

  function isCertainlyFalsyExpression(path) {
    // traverse chained LogicalExpressions
    // to handle cases like: `false && unknown && to_be_shaken`
    let _path = path;
    while (_path) {
      if (
        _path.type === "LogicalExpression" &&
        _path.get("operator").node === "&&"
      ) {
        if (isCertainlyFalsyExpression(_path.get("right"))) {
          return true;
        }
        _path = _path.get("left");
        if (isCertainlyFalsyExpression(_path)) {
          return true;
        }
      } else {
        break;
      }
    }

    if (isFalsyPath(_path)) {
      return true;
    }
  }

  function isPathCertainlyUnreachable(path) {
    while (path) {
      if (
        path.parentPath &&
        (path.parentPath.type === "IfStatement" ||
          path.parentPath.type === "ConditionalExpression")
      ) {
        const consequent = path.parentPath.get("consequent");
        const alternate = path.parentPath.get("alternate");
        const test = path.parentPath.get("test");

        if (consequent === path && isCertainlyFalsyExpression(test)) {
          return true;
        }
        if (alternate === path && isTruthyPath(test)) {
          return true;
        }
      }

      if (isCertainlyFalsyExpression(path)) {
        return true;
      }

      path = path.parentPath;
    }
  }

  return {
    name: "babel-plugin-transform-prune-unused-imports",
    visitor: {
      ImportDeclaration(path /* :any */) {
        if (path.removed) {
          return;
        }
        const specifiers = path.get("specifiers");

        // Imports with no specifiers is probably specifically for side effects
        let shakeDeclaration = specifiers.length > 0;

        const moduleName = path.node.source.value;
        if (ignoredModules.has(moduleName)) {
          return;
        }

        for (const specifier of specifiers) {
          let shakeSpecifier = true;

          const localPath = specifier.get("local");
          const localName = localPath.node.name;
          const binding = localPath.scope.bindings[localName];
          if (binding) {
            const refPaths = binding.referencePaths;

            if (refPaths.length === 0) {
              // If no references exist, then this specifier is almost certainly
              // being imported for side effects.
              shakeSpecifier = false;
              shakeDeclaration = false;
            } else {
              for (const path of refPaths) {
                const unreachable = isPathCertainlyUnreachable(path);
                if (!unreachable) {
                  shakeSpecifier = false;
                  shakeDeclaration = false;
                }
              }
            }
          } else {
            // If binding doesn't exist, then this is an indication the import was
            // added by a plugin (rather existing than the original source code)
            // To be conservative, don't shake in this case.
            shakeSpecifier = false;
            shakeDeclaration = false;
          }
          if (shakeSpecifier) {
            specifier.remove();
          }
        }

        if (shakeDeclaration) {
          path.remove();
        }
      }
    }
  };
};
