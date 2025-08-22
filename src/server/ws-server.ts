import { FlexNet } from "../types";
import * as uWS from "uWebSockets.js";

class JwsServer {
  //
  private port_: number;
  private logger_: any = console;
  private server_: uWS.TemplatedApp | null = null; // websocket server instance
  private datareceive_: any; // data receive callback function
  private closebyebye_: any; // client connection byebye
  private connnumbers_: any; // report websocket connection numbers

  private clients_: Set<any> = new Set(); // all of the socket client
  private queSendTimer_: any; // timer for send all package data
  private sendInterval_: number = 50; // interval for send socket data

  private SEND_CHUNK_SIZE: number = 5 * 1024 * 1024; // every time the socket to send the size of the data
  private MAX_BACKPRESSURE: number = 30 * 1024 * 1024; // maximum length of buffering (when send-buffer is fulled)
  private MAX_PAYLOAD_SIZE: number = 5 * 1024 * 1024; // maximum length of data payload
  private IDLE_TIMEOUT: number = 60; // maximum duration (sec) that no data send between server and client

  constructor(
    /* @param */ port: number,
    /* @param */ logger: any,
    /* @param */ path: FlexNet.ContextPath,
    /* @param */ overSSL: boolean = true
  ) /* RETURN */ {
    /* ****** */
    this.logger_ = logger ? logger : console;
    this.port_ = port;

    const passphrase: string = "your-passhrase";
    if (overSSL === true) {
      this.server_ = uWS.SSLApp({
        passphrase,
        key_file_name: `${path.config}/core.key`,
        cert_file_name: `${path.config}/core.crt`,
      });
    } else {
      this.server_ = uWS.App();
    }

    this.server_
      .ws("/*", {
        compression: uWS.DISABLED,
        maxPayloadLength: this.MAX_PAYLOAD_SIZE,
        maxBackpressure: this.MAX_BACKPRESSURE,
        idleTimeout: this.IDLE_TIMEOUT,
        sendPingsAutomatically: true,

        ping: this.onPing.bind(this),
        pong: this.onPong.bind(this),
        close: this.onClose.bind(this),
        upgrade: this.onUpgrade.bind(this),
        open: this.onConnection.bind(this),
        message: this.onMessage.bind(this),
      })
      .listen(port, this.onListening.bind(this));
  }

  public close() {
    // this.logger_.info(`debug> ws server, close server`);
  }

  public datareceive(port: number, callback) {
    this.datareceive_ = (buffer, ws: any) => {
      callback(buffer, ws, port);
    };
  }

  public closebyebye(port: number, callback) {
    this.closebyebye_ = (ws: any) => {
      // this.logger_.info(`debug> ws server, call byebye, ${ws.url}`);
      callback(ws, port);
    };
  }

  public sendByMethod(method: string, buffer: Uint8Array) {
    this.clients_.forEach((ws: any) => {
      if (ws.isClosed !== true) {
        if (ws.wishlist[method]) {
          ws.enqueue(buffer);
        }
      }
    });
  }

  private onListening(listenSocket: any) {
    this.queSendTimer_ = setInterval(() => {
      this.clients_.forEach((ws: any) => {
        const queueSize: number = ws.pktQueue.length;
        if (queueSize <= 0) return;
        for (let idx: number = 0; idx != queueSize; ++idx) {
          const data: Uint8Array = ws.pktQueue.shift();
          const result: number = ws.send(data, true);
          switch (result) {
            case 0:
              break; // BACKPRESSURE
            case 1:
              break; // SUCCESS
            case 3: // DROP
              ws.close();
              ws.isClosed = true;
              ws.pktQueue = [];
              break;
          }
        }
      });
    }, this.sendInterval_);
  }

  private onConnection(ws: any) {
    //
    // this.logger_.info(`debug> ws server, new connection, ${ws.url}`);
    if (!this.clients_.has(ws)) {
      //
      // extend by myself
      (ws as any).pktQueue = [];
      (ws as any).enqueue = (arr: Uint8Array) => {
        if (ws.isClosed !== true) {
          ws.pktQueue.push(arr);
        }
      };
      // extend by myself extend end

      this.clients_.add(ws);
      if (this.connnumbers_) {
        this.connnumbers_(this.clients_.size);
      }
    }
  }

  private async onMessage(
    /* @param */ ws: any,
    /* @param */ message: ArrayBuffer,
    /* @param */ isBinary: boolean
    /* RETURN */
  ): Promise<void> {
    /* ****** */
    if (!this.datareceive_) return;
    await this.datareceive_(Buffer.from(new Uint8Array(message)), ws);
  }

  private onClose(
    /* @param */ ws: any,
    /* @param */ code: number,
    /* @param */ message: ArrayBuffer
    /* RETURN */
  ): void {
    /* ****** */
    this.logger_.info(`debug> ws server, close connection, ${ws.url}`);
    ws.isClosed = true;
    this.clients_.delete(ws);
    if (this.connnumbers_) {
      this.connnumbers_(this.clients_.size);
    }

    if (this.closebyebye_) {
      this.closebyebye_(ws);
    }
  }

  private onPing(
    /* @param */ ws: any,
    /* @param */ message: ArrayBuffer
    /* RETURN */
  ): void {
    /* ****** */
  }

  private onPong(
    /* @param */ ws: WebSocket,
    /* @param */ message: ArrayBuffer
    /* RETURN */
  ): void {
    /* ****** */
  }

  private onUpgrade(
    /* @param */ res: uWS.HttpResponse,
    /* @param */ req: uWS.HttpRequest,
    /* @param */ context: uWS.us_socket_context_t
    /* RETURN */
  ) {
    /* ****** */
    res.upgrade(
      { url: req.getUrl() },
      req.getHeader("sec-websocket-key"),
      req.getHeader("sec-websocket-protocol"),
      req.getHeader("sec-websocket-extensions"),
      context
    );
  }
}

export default JwsServer;
