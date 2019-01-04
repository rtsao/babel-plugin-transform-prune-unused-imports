// @flow

/*::
type PluginOpts = {
  falsyExpressions: Array<string>,
  truthyExpressions: Array<string>,
};
*/

module.exports = (
  api /*: any */,
  {
    falsyExpressions: falsyOpt = [],
    truthyExpressions: truthyOpt = []
  } /*: PluginOpts */ = {}
) => {
  const { types: t } = api;

  if (!Array.isArray(falsyOpt)) {
    throw new Error("falsyExpressions must be an array");
  }
  if (!Array.isArray(truthyOpt)) {
    throw new Error("truthyExpressions must be an array");
  }

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

  function isPathCertainlyUnreachable(path) {
    while (path) {
      if (
        path.parentPath &&
        (path.parentPath.type === "IfStatement" ||
          path.parentPath.type === "ConditionalExpression")
      ) {
        const consquent = path.parentPath.get("consequent");
        const alternate = path.parentPath.get("alternate");
        if (isFalsyPath(path.parentPath.get("test")) && consquent === path) {
          return true;
        }
        if (isTruthyPath(path.parentPath.get("test")) && alternate === path) {
          return true;
        }
      }
      // traverse chained LogicalExpressions
      // to handle cases like: `false && unknown && to_be_shaken`
      let _path = path;
      while (_path) {
        if (
          _path.type === "LogicalExpression" &&
          _path.get("operator").node === "&&"
        ) {
          if (isFalsyPath(_path.get("right"))) {
            return true;
          }
          _path = _path.get("left");
          if (isFalsyPath(_path)) {
            return true;
          }
        } else {
          break;
        }
      }

      path = path.parentPath;
    }
  }

  return {
    name: "transform",
    visitor: {
      ImportDeclaration(path /* :any */) {
        if (path.removed) {
          return;
        }
        const specifiers = path.get("specifiers");

        // Imports with no specifiers is probably specifically for side effects
        let shakeDeclaration = specifiers.length > 0;

        for (const specifier of specifiers) {
          let shakeSpecifier = true;

          const localPath = specifier.get("local");
          const localName = localPath.node.name;
          // This should not be hardcoded to React and/or improve compat with JSX transform
          if (localName === "React") {
            shakeSpecifier = false;
            shakeDeclaration = false;
            break;
          }
          const binding = localPath.scope.bindings[localName];
          if (binding) {
            const refPaths = binding.referencePaths;
            for (const path of refPaths) {
              const unreachable = isPathCertainlyUnreachable(path);
              if (!unreachable) {
                shakeSpecifier = false;
                shakeDeclaration = false;
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
