// @flow

const pluginTester = require("babel-plugin-tester").default;
const plugin = require("../index.js");

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/vanilla"
});

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/jsx",
  babelOptions: {
    plugins: ["@babel/plugin-syntax-jsx"]
  }
});

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/ignored-modules",
  pluginOptions: {
    ignoredModules: ["some-ignored-package"]
  }
});

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/browser-env",
  pluginOptions: {
    falsyExpressions: ["__NODE__"],
    truthyExpressions: ["__BROWSER__"]
  }
});

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/production-node-env",
  pluginOptions: {
    falsyExpressions: ["process.env.NODE_ENV !== 'production'"]
  }
});
