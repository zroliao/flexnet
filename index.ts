import * as Assert from "assert";
import * as extension from "./src/main";
import WsClientNode from "./src/ws-client-node";
import { createJrpcRequestString } from "./src/util";

process.env.NODE_ENV = "developer";

// * NOTE: for test we don't need to use SSL connection here
// * ==========================================================================================
extension.default.disableSSLConnection();

extension.default
  .install(__dirname, [31474])
  .then(async (context) => {
    context.log.info("[Extension] Running...");

    // * Test with SSL connection for websocket client
    // * on windows, setup flexnet.com into your C:\Windows\System32\drivers\etc\hosts file.
    // * ==========================================================================================
    // const client1: any = new WsClientNode('wss://flexnet.com:31474', undefined, context.path, async () => {/* */});
    // const client2: any = new WsClientNode('wss://flexnet.com:31474', undefined, context.path, async () => {/* */});

    // * Ttest for non ssl connection
    // * ==========================================================================================
    const client1: any = new WsClientNode(
      "ws://localhost:31474",
      undefined,
      context.path,
      async () => {
        console.log(`31474 open`);
      },
      async (data: any) => {
        console.log(data.toString());
      },
      async () => {
        console.log(`31474 close`);
      }
    );

    // * ////////////////////////////////////////////////////
    // * test runner
    // * ////////////////////////////////////////////////////

    setTimeout(async () => {
      client1.send(createJrpcRequestString("basic.server.echo", { test: 1 }));
      setTimeout(() => {
        console.info("all done");
        process.exit(0);
      }, 10000);
    }, 1000);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err.stack}`);
  });
