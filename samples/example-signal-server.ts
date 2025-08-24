import MainFlexNet from "../src/main";

new MainFlexNet()
  .createSignal(__dirname, 31473)
  .then(async (context: any) => {
    console.info(`signal-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });
