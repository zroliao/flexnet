import PPClient from "./pp-client-node";
import { FlexNet, Jrpc } from "../types";
import WebSocketSerrver from "../server/ws-server";
import { createJrpcResponseString } from "../utils/util";

const txDecoder = new TextDecoder("utf-8");

class EdgeFlexNet {
  //
  private _logger: any;
  private _ppclient: PPClient;
  private _wsServer: WebSocketSerrver;
  private _maxChunkSize: number = FlexNet.DEFAULT_DATA_SIZE.MAX;

  constructor(
    /* @param */ logger: FlexNet.Logger,
    /* @param */ baseConfig: FlexNet.BaseConfig,
    /* @param */ edgeConfig: FlexNet.EdgeConfig,
    /* @param */ path: FlexNet.ContextPath,
    /* @param */ overSSL: boolean = true
  ) {
    if (!logger) throw new Error("invalid logger instance");
    else this._logger = logger;

    // ——————————————————————————————————————————————————————

    const wsServer: WebSocketSerrver = new WebSocketSerrver(
      +baseConfig.service.port,
      this._logger,
      path,
      overSSL
    );

    wsServer.datareceive(
      baseConfig.service.port,
      this.onWebsocketMessage.bind(this)
    );

    wsServer.closebyebye(
      baseConfig.service.port,
      this.onWebsocketDestory.bind(this)
    );

    this._wsServer = wsServer;

    // ——————————————————————————————————————————————————————

    if (edgeConfig.max_payload !== undefined) {
      if (edgeConfig.max_payload >= FlexNet.DEFAULT_DATA_SIZE.MIN) {
        this._maxChunkSize = edgeConfig.max_payload;
        logger.info(`[edge.flexnet] set max payload=${this._maxChunkSize}`);
      }
    }

    this._ppclient = new PPClient(edgeConfig, this._logger);
    this._ppclient.datareceive(this.onRemotePeerMessage.bind(this));
    if (!this._ppclient.connect()) this._logger.error("pptp connect fail");
  }

  public close() {
    this._wsServer.close();
  }

  /**
   *
   */
  private async onWebsocketDestory(
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
  }

  /**
   *
   */
  private async onWebsocketMessage(
    /* @param */ buffer: Buffer,
    /* @param */ ws: any,
    /* @param */ port: number // this is wss port number
    /* RETURN */
  ): Promise<void> {
    //
    try {
      const response: string = await this.recvMessage(buffer);
      if (ws && ws.isClosed !== true) ws.enqueue(response);
    } catch (ex: any) {
      // 再確認是否要做錯誤回應
    }
  }

  /**
   *
   */
  private async onRemotePeerMessage(
    /* @param */ buffer: any,
    /* @param */ peer
    /* RETURN */
  ): Promise<void> {
    //
    try {
      const response: string = await this.recvMessage(buffer);
      peer.send(Buffer.from(response));
    } catch (ex: any) {
      // 再確認是否要做錯誤回應
    }
  }

  /**
   *
   */
  private async recvMessage(buffer: any): Promise<string> {
    //
    // FIXME: 這裡應該要實現轉拋 json-rpc 訊息到有需求的人身上
    const message: Jrpc.Request = JSON.parse(txDecoder.decode(buffer));
    return createJrpcResponseString(message.method, message.id, {
      ...message.params,
      echo: true,
    });
  }
} // -- FlexNet

export default EdgeFlexNet;
