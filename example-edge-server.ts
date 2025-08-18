import core from "./src/main";
core.disableSSLConnection();
core
  .install(__dirname, 31474)
  .then(async (context: any) => {
    console.info(`edge-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });
