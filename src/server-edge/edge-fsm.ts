export default {
  id: "PPTP",
  initial: "idle",
  states: {
    idle: {
      on: { CONNECT: "connecting" },
    },
    connecting: {
      on: {
        SUCCESS: "connected",
        CLOSE: "disconnect",
        ERROR: "disconnect",
      },
    },
    connected: {
      on: {
        CLOSE: "idle",
        ERROR: "disconnect",
      },
    },
    disconnect: {
      on: {
        ERROR: "connecting",
      },
      after: {
        1000: "connecting",
      },
    },
  },
};
