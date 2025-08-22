import MainFlexNet from "./src/main";

new MainFlexNet()
  .createEdge(__dirname, 31474, {
    username: "37012eaa-4ef2-46d0-a079-855fceb13a29",
    password: "49aa53b8-f965-4312-b3fc-12d21bf66103",
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
  .then(async (context: any) => {
    console.info(`edge-server running`);
  })
  .catch((err) => {
    console.error(`[Extension] error: ${err}`);
    process.exit(1);
  });
