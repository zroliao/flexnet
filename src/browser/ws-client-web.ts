const EventType = {
  WSOCKET_DATA: "WSOCKET_DATA",
  WSOCKET_OPEN: "WSOCKET_OPEN",
  WSOCKET_CLOSE: "WSOCKET_CLOSE",
  WSOCKET_ERROR: "WSOCKET_ERROR",
};

class WebSocketWrapper {
  private ws_: WebSocket;
  private report_: any;
  private srvWsAddress_: string;

  constructor(srvWsAddress: string, report: any) {
    this.srvWsAddress_ = srvWsAddress;
    this.report_ = report;
  }

  public send(data) {
    if (this.ws_) this.ws_.send(data);
  }

  public open() {
    if (!this.ws_) {
      this.ws_ = new WebSocket(this.srvWsAddress_);
      this.ws_.binaryType = "arraybuffer";
      this.ws_.onopen = this.onOpen.bind(this);
      this.ws_.onclose = this.onClose.bind(this);
      this.ws_.onerror = this.onError.bind(this);
      this.ws_.onmessage = this.onData.bind(this);
    }
  }

  public close() {
    if (this.ws_) {
      if (this.ws_.readyState === WebSocket.OPEN) {
        this.ws_.close();
        this.ws_ = null;
      } else if (this.ws_.readyState === WebSocket.CLOSED) {
        this.ws_ = null;
      } else if (this.ws_.readyState === WebSocket.CLOSING) {
        this.ws_ = null;
      }
    }
  }

  private onOpen() {
    this.report_(this, { type: EventType.WSOCKET_OPEN });
  }

  private onClose() {
    this.report_(this, { type: EventType.WSOCKET_CLOSE });
  }

  private onError(err: any) {
    this.report_(this, { type: EventType.WSOCKET_ERROR, error: err });
  }

  private onData(recvEvent: any) {
    this.report_(this, { type: EventType.WSOCKET_DATA, data: recvEvent.data });
  }
}

class WSClient {
  private WSC_: WebSocketWrapper | null = null;
  private openCallback_: () => void;
  private dataCallback_: (data: any) => void;
  private lossCallback_: () => void;
  private isConnected_: boolean = false;

  constructor(
    srvWsAddress: string,
    openCallback: () => void,
    dataCallback: (data: any) => void,
    lossCallback?: () => void
  ) {
    this.openCallback_ = openCallback;
    this.dataCallback_ = dataCallback;
    this.lossCallback_ = lossCallback;
    this.WSC_ = new WebSocketWrapper(srvWsAddress, this.handleEvent.bind(this));
    this.WSC_.open();
  }

  //  for forcing close the peer connection
  public terminate() {
    this.WSC_.close();
  }

  public send(data) {
    if (!this.WSC_) throw new Error(`peer connection not exist`);
    this.WSC_.send(data);
  }

  private forwardMsg(event: any) {
    try {
      if (this.dataCallback_) this.dataCallback_(event?.data);
    } catch (err) {
      // pass
    }
  }

  private handleEvent(client: WebSocketWrapper, event: any) {
    switch (event.type) {
      case EventType.WSOCKET_DATA: {
        this.forwardMsg(event);
        break;
      }
      case EventType.WSOCKET_OPEN: {
        if (this.isConnected_ === false && this.openCallback_) {
          console.info("[ws.client-web] socket client open");
          this.isConnected_ = true;
          this.openCallback_();
        }
        break;
      }
      case EventType.WSOCKET_ERROR:
      case EventType.WSOCKET_CLOSE: {
        if (this.isConnected_ === true && this.lossCallback_) {
          console.error("[ws.client-web] socket client close");
          this.isConnected_ = false;
          this.lossCallback_();
        }
        setTimeout(() => {
          this.WSC_.close();
          this.WSC_.open();
        }, 1000);
        break;
      }
      default: {
        break;
      }
    }
  }
}

export default WSClient;
