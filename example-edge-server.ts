import MainFlexNet from "./src/main";
import { FlexNet } from "./src/types";
import * as $pb from "./src/protobuf";
import RpcHelper from "./src/rpc-helper";
import EdgeTransport from "./src/server-edge/edge-transport";

new MainFlexNet()
  .createEdge(__dirname, 31474, {
    username: "specific-your-username",
    password: "specific-your-password",
    peer_id: "pptp://edge-server/31474",
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
  .then(async ([context, transport]: [FlexNet.Context, EdgeTransport]) => {
    transport.register("example-edge-server", "a.a.a", method111);
    transport.register("example-edge-server", "a.a.b", method112);
    console.info(`edge-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });

async function method111(message: $pb.rpc.RpcMessage): Promise<Uint8Array> {
  return RpcHelper.createRpcJsonResponse(
    { echo: 111 },
    message.method,
    message.id
  );
}

async function method112(message: $pb.rpc.RpcMessage): Promise<Uint8Array> {
  return RpcHelper.createRpcJsonResponse(
    { echo: 112 },
    message.method,
    message.id
  );
}
