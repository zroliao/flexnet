import core from "./src/main";
core.disableSSLConnection();
core
  .install(__dirname, 31473)
  .then(async (context: any) => {
    console.info(`signal-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });
