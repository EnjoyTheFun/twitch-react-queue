module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["react-app", { runtime: "automatic" }]
    ],
    plugins: [
      ["babel-plugin-react-compiler", {
        config: "./react-compiler.config.json"
      }]
    ]
  };
};
