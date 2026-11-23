// Allow slow input acknowledgements from software Chromium when suites share a four-core host.
const f = require(process.cwd() + '/games/healing-game/tests/cat-models-fixture.cjs');
const fresh = f.fresh;
f.fresh = async (...args) => {
  const test = await fresh(...args);
  test.page.setDefaultTimeout(60000);
  test.page.setDefaultNavigationTimeout(90000);
  return test;
};
