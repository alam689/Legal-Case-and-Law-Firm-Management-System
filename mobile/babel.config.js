/**
 * Babel — অ্যাপে শুধু `babel-preset-expo`, test-এ একটি বাড়তি plugin।
 *
 * `@caseflow/i18n`-এর chunk loader `import()` ব্যবহার করে (route-এর সাথে
 * lazy locale, docs/05 §12)। Metro সেটি নিজেই সামলায়, কিন্তু Jest-এর
 * CommonJS runtime পারে না — "A dynamic import callback was invoked
 * without --experimental-vm-modules"। তাই test-এ `import()` কে
 * `Promise.resolve(require())`-এ নামিয়ে আনা হয়।
 *
 * শুধু `env.test`-এ, তাই আসল bundle-এ code splitting অক্ষত থাকে।
 */
module.exports = function babelConfig(api) {
  api.cache.using(() => process.env.NODE_ENV);

  return {
    presets: ['babel-preset-expo'],
    env: {
      test: { plugins: ['babel-plugin-dynamic-import-node'] },
    },
  };
};
