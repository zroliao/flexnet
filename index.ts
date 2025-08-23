import * as Assert from "assert";
import FlexNet from "./src/main";
import { uuid } from "./src/utils/util";
import RpcHelper from "./src/rpc-helper";
import WsClientNode from "./src/ws-client-node";

process.env.NODE_ENV = "developer";

new FlexNet()
  .createEdge(__dirname, 31474, {
    username: "specific-your-username",
    password: "specific-your-password",
    peer_id: "pptp://edge-server/31475",
    signal_server: "ws://localhost:31473",
    ice_servers: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun3.l.google.com:19302",
      "stun:stun4.l.google.com:19302",
    ],
    max_message_size: 308224,
    port_range_begin: 1024,
    port_range_end: 65535,
    mtu: 1200,
  })
  .then(async (context) => {
    context.log.info("[Extension] Running...");
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
      const method = "basic.server.echo";
      const params = { test: 1 };
      const request = RpcHelper.createRpcJsonRequest(params, method, uuid());
      client1.send(request);
      setTimeout(() => {
        console.info("all done");
        process.exit(0);
      }, 10000);
    }, 1000);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err.stack}`);
  });
