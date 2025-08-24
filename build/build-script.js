require("shelljs/global");
env.NODE_ENV = "production";

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const webpackConfig = require("./build-target");

console.log(
  "\n" +
    "///////////////////////////////////\n" +
    "// Start Build Production \n" +
    "///////////////////////////////////\n"
);

console.log(`clean dist folder`);
rm("-rf", path.resolve(__dirname, "../dist"));
mkdir("-p", path.resolve(__dirname, "../dist"));

webpack(webpackConfig, function (err, stats) {
  if (err) throw err;
  process.stdout.write(
    stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
    }) + "\n"
  );

  // create package.json
  const selfPackage = require(__dirname + "/../package.json");

  webpackConfig.forEach((wp) => {
    const extension = { version: "1.0.0" };
    extension.version = selfPackage.version;
    extension.name = wp.name;
    const name = wp.output.path.replace(/\\/g, "/").split("/").at(-1);
    const targetPath = path.resolve(__dirname, `../dist/${name}`);
    mkdir("-p", targetPath);
    fs.writeFileSync(
      `${__dirname}/../dist/${name}/package.json`,
      JSON.stringify(extension, null, 2)
    );
  });
});
