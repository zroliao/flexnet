import * as $pb from "../protobuf";
import { FlexNet } from "../types";
import RpcHelper from "../rpc-helper";

export interface RegisterItem {
  module: string;
  callback: DispathCllback;
}

export type SubscribesItem = (data: Uint8Array) => void;
export type MethodsMapping = Map<string, RegisterItem[]>;
export type DispathCllback = (
  request: $pb.rpc.RpcMessage
) => Promise<[true | false, Uint8Array]>; // array[0] 是記錄成功或失敗

class EdgeTransport {
  //
  private _logger: any;
  private _methodsMap: MethodsMapping = new Map(); // 記錄方法要回呼的位置
  private _subscribes: Map<string, SubscribesItem> = new Map(); // 記錄訂閱通知

  constructor(logger: FlexNet.Logger) {
    this._logger = logger;
  }

  /**
   * 註冊要處理的 json-rpc 方法
   */
  register(
    /* @param */ module: string,
    /* @param */ method: string,
    /* @param */ callback: DispathCllback
  ) {
    //
    if (this._methodsMap.has(method)) {
      const once = { module, callback };
      this._methodsMap.get(method).push(once);
    } else {
      const init = [{ module, callback }];
      this._methodsMap.set(method, init);
    }
  }

  exist(method: string): boolean {
    return this._methodsMap.has(method);
  }

  /**
   * 取消要處理的 json-rpc 方法
   */
  unregister(method: string): void {
    this._methodsMap.delete(method);
  }

  /**
   * 轉發 json-rpc 到要處理的模組身上
   */
  async dispatch(
    /* @param */ message: $pb.rpc.RpcMessage,
    /* @param */ reply: (data: Uint8Array) => void
    /* RETURN */
  ): Promise<void> {
    //
    if (!this.exist(message.method)) {
      const error = { code: -32601, message: "method not found" };
      return reply(
        RpcHelper.createRpcResponseError(error, message.method, message.id)
      );
    }

    const targets = this._methodsMap.get(message.method);
    if (!targets?.[0]?.callback) {
      const error = { code: -32603, message: "method callback not found" };
      return reply(
        RpcHelper.createRpcResponseError(error, message.method, message.id)
      );
    }

    const [success, response] = await targets[0].callback(message);
    if (success === false) return reply(response);

    switch ((message as any).msgType) {
      case 3:
      case "SUBSCRIBE":
        if (!reply) return reply(response);
        this._subscribes.set(message.id, reply);
        break;
      case 4:
      case "UNSUBSCRIBE":
        this._subscribes.delete(message.id);
        break;
      default:
        break;
    }

    return reply(response);
  }

  replyTo(subId: string, data: Uint8Array) {
    if (this._subscribes.has(subId)) {
      const reply = this._subscribes.get(subId);
      return reply(data);
    }
  }

  async notify(message: $pb.rpc.RpcMessage): Promise<void> {
    if (!this.exist(message.method)) return;
    for (const d of this._methodsMap.get(message.method)) {
      try {
        d.callback(message);
      } catch (ex: any) {
        // 這裡先不在乎錯誤訊息
      }
    }
  }
}

export default EdgeTransport;
