import MainFlexNet from "./src/main";
import { FlexNet } from "./src/types";
import * as $pb from "./src/protobuf";
import RpcHelper from "./src/rpc-helper";
import EdgeTransport from "./src/server-edge/edge-transport";
import { clearInterval } from "timers";

let edgeTransport;

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
    edgeTransport = transport;
    transport.register("example-edge-server", "a.a.a", method111);
    transport.register("example-edge-server", "a.a.b", method112);
    transport.register("example-edge-server", "a.a.c", method113);
    console.info(`edge-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });

async function method111(
  message: $pb.rpc.RpcMessage
): Promise<[boolean, Uint8Array]> {
  //
  const response = RpcHelper.createRpcJsonResponse(
    { echo: 111 },
    message.method,
    message.id
  );
  return [true, response];
}

let subscribeTimer;
let counter = 0;

async function method112(
  message: $pb.rpc.RpcMessage
): Promise<[boolean, Uint8Array]> {
  //
  switch ((message as any).msgType) {
    case 3:
    case "SUBSCRIBE":
      subscribeTimer = setInterval(() => {
        edgeTransport.replyTo(
          message.id,
          RpcHelper.createRpcJsonNotify({ counter: ++counter }, message.method)
        );
      }, 1000);
      break;
    case 4:
    case "UNSUBSCRIBE":
      clearInterval(subscribeTimer);
      subscribeTimer = null;
      break;
    default:
      break;
  }

  const response = RpcHelper.createRpcJsonResponse(
    { echo: 112 },
    message.method,
    message.id
  );
  return [true, response];
}

async function method113(
  message: $pb.rpc.RpcMessage
): Promise<[boolean, Uint8Array]> {
  //
  const response = RpcHelper.createRpcJsonResponse(
    { echo: 112 },
    message.method,
    message.id
  );
  return [true, response];
}
