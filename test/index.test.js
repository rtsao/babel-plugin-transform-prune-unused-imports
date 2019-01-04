// @flow

const pluginTester = require("babel-plugin-tester");
const plugin = require("../index.js");

pluginTester({
  plugin: plugin,
  fixtures: __dirname + "/fixtures/vanilla"
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
