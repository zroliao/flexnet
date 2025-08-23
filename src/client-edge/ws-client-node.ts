import * as fs from "fs";
import * as WebSocket from "ws";
import {FlexNet} from "../types";

const EventType = {
  WSOCKET_DATA: "WSOCKET_DATA",
  WSOCKET_OPEN: "WSOCKET_OPEN",
  WSOCKET_CLOSE: "WSOCKET_CLOSE",
  WSOCKET_ERROR: "WSOCKET_ERROR",
};

class WebSocketWrapper {
  private tag_: string = "[core.ws]";
  private logger_: FlexNet.Logger | Console = console;
  private report_: any;
  private ws_: WebSocket;
  private path_: FlexNet.ContextPath;
  private srvWsAddress_: string;

  constructor(
    /* @param */ srvWsAddress: string,
    /* @param */ path: FlexNet.ContextPath,
    /* @param */ logger: FlexNet.Logger,
    /* @param */ report: any
  ) {
    this.logger_ = logger || console;
    this.srvWsAddress_ = srvWsAddress;
    this.path_ = path;
    this.report_ = report;
  }

  public send(data) {
    try {
      if (this.ws_) this.ws_.send(data);
    } catch (ex) {
      this.ws_.terminate();
    }
  }

  public open() {
    if (!this.ws_) {
      if (this.srvWsAddress_.indexOf("wss://") === 0) {
        const ca = fs.readFileSync(`${this.path_.config}/core.crt`);
        this.ws_ = new WebSocket(this.srvWsAddress_, {
          ca,
          rejectUnauthorized: false,
        });
      } else {
        this.ws_ = new WebSocket(this.srvWsAddress_);
      }

      // this.ws_.binaryType = 'nodebuffer';
      this.ws_.onopen = this.onOpen.bind(this);
      this.ws_.onclose = this.onClose.bind(this);
      this.ws_.onerror = this.onError.bind(this);
      this.ws_.onmessage = this.onData.bind(this);
      this.ws_.on("ping", this.pong.bind(this));
    }
  }

  public close() {
    // this.closePing();
    if (this.ws_) {
      if (this.ws_.readyState === WebSocket.OPEN) {
        this.ws_.terminate();
        this.ws_ = null;
      } else if (this.ws_.readyState === WebSocket.CLOSED) {
        this.ws_ = null;
      } else if (this.ws_.readyState === WebSocket.CLOSING) {
        this.ws_ = null;
      }
    }
  }

  private onOpen(event: WebSocket.Event) {
    this.report_(this, { type: EventType.WSOCKET_OPEN });
  }

  private onClose(event: WebSocket.CloseEvent) {
    this.logger_.warn(
      `${this.tag_} wasClean:${event.wasClean}, code: ${event.code}, reason: ${event.reason}`
    );
    this.report_(this, { type: EventType.WSOCKET_CLOSE });
  }

  private onError(event: WebSocket.ErrorEvent) {
    this.logger_.warn(
      `${this.tag_} error:${event.error}, mssage: ${event.message}`
    );
    this.report_(this, { type: EventType.WSOCKET_ERROR, error: event });
  }

  private onData(event: WebSocket.MessageEvent) {
    this.report_(this, { type: EventType.WSOCKET_DATA, data: event.data });
  }

  private ping() {
    try {
      if (this.ws_) this.ws_.ping();
    } catch (ex: any) {
      // nothing to do
    }
  }

  private pong(ws: WebSocket, data: Buffer) {
    try {
      // this.logger_.info(`receive ping from ${this.srvWsAddress_}`);
      if (this.ws_) this.ws_.pong();
    } catch (ex: any) {
      // nothing to do
    }
  }
}

class WSClient {
  //
  private logger_: FlexNet.Logger;
  private WSC_: WebSocketWrapper | null = null;
  private protoReady_: boolean = false;
  private openCallback_: () => void;
  private dataCallback_: (data: any) => void;
  private lossCallback_: () => void;
  private isConnected_: boolean = false;
  private hbTimer_: NodeJS.Timeout;
  private maxPayload_: number = FlexNet.DEFAULT_DATA_SIZE.MAX;

  private reopenCounter_: number = 0;

  constructor(
    srvWsAddress: string,
    maxPayload: number | undefined,
    path: FlexNet.ContextPath,
    openCallback: () => void,
    dataCallback: (data: any) => void,
    lossCallback?: () => void,
    logger: any = console
  ) {
    this.logger_ = logger;
    setTimeout(async () => {
      this.protoReady_ = true;
      if (this.isConnected_ === true && openCallback) openCallback();
    }, 10);

    if (maxPayload !== undefined) {
      if (maxPayload >= FlexNet.DEFAULT_DATA_SIZE.MIN) {
        this.maxPayload_ = maxPayload;
        logger.info(`[ws.node.client] set max payload=${this.maxPayload_}`);
      }
    }

    this.openCallback_ = openCallback;
    this.lossCallback_ = lossCallback;
    this.dataCallback_ = dataCallback;
    this.WSC_ = new WebSocketWrapper(
      srvWsAddress,
      path,
      logger,
      this.handleEvent.bind(this)
    );
    this.WSC_.open();
  }

  public send(data) {
    if (this.WSC_) {
      this.WSC_.send(data);
    } else {
      throw new Error(`invalid socket instance`);
    }
  }

  //  for forcing close the peer connection
  public terminate() {
    this.WSC_.close();
    if (this.hbTimer_) {
      clearInterval(this.hbTimer_);
      this.hbTimer_ = undefined;
    }
  }

  private forwardMsg(event: any) {
    try {
      if (this.dataCallback_) this.dataCallback_(event?.data);
    } catch (err) {
      // pass
    }
  }

  private logRetry() {
    this.reopenCounter_++;
    if (this.reopenCounter_ === 1 || this.reopenCounter_ % 60 === 0) {
      this.logger_.error(
        `[ws.client.node] connection loss, retry ${this.reopenCounter_} times.`
      );
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleEvent(client: WebSocketWrapper, event: any) {
    switch (event.type) {
      case EventType.WSOCKET_DATA: {
        this.forwardMsg(event);
        break;
      }
      case EventType.WSOCKET_OPEN: {
        if (this.isConnected_ === false && this.openCallback_) {
          this.reopenCounter_ = 0;
          this.logger_.info("[ws.client.node] connection open");
          this.isConnected_ = true;
          if (this.protoReady_) this.openCallback_();
        }
        break;
      }
      case EventType.WSOCKET_ERROR:
      case EventType.WSOCKET_CLOSE: {
        if (this.isConnected_ === true && this.lossCallback_) {
          this.logger_.error("[ws.client.node] socket client close");
          this.isConnected_ = false;
          this.lossCallback_();
        }
        setTimeout(async () => {
          this.WSC_.close();
          this.logRetry();
          await this.sleep(Math.random() * 1000 + 1000);
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
