import * as $pb from "../protobuf";

class RpcHelper {
  //
  private _jsonrpc: string = "2.0";

  fetchRpcJsonData(message: $pb.rpc.RpcMessage) {
    const params: $pb.rpc.IParamWrapper = message.toJSON().params;
    if ((params as any).type !== "JSON") {
      throw new Error("fetchRpcJsonData fail, type is not JSON");
    } else {
      return JSON.parse(params.data);
    }
  }

  fetchRpcByteData(message: $pb.rpc.RpcMessage) {
    const params: $pb.rpc.IParamWrapper = message.toJSON().params;
    if ((params as any).type !== "BYTES") {
      throw new Error("fetchRpcJsonData fail, type is not BYTES");
    } else {
      return params.byte;
    }
  }

  decodeRpcMessage(data: any): $pb.rpc.RpcMessage {
    return $pb.rpc.RpcMessage.decode(data);
  }

  createRpcMessage(message: $pb.rpc.IRpcMessage): Uint8Array {
    const err: string | null = $pb.rpc.RpcMessage.verify(message);
    if (err) throw new Error(`invalid RpcMessage, ${err}`);
    const rpc: $pb.rpc.RpcMessage = $pb.rpc.RpcMessage.create(message);
    return $pb.rpc.RpcMessage.encode(rpc).finish();
  }

  createRpcByteNotify(
    /* @param */ byte: Uint8Array,
    /* @param */ method: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.BYTES,
      byte,
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.NOTIFY,
      method,
      params,
    });
  }

  createRpcByteRequest(
    /* @param */ byte: Uint8Array,
    /* @param */ method: string,
    /* @param */ id: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.BYTES,
      byte,
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.REQUEST,
      method,
      id,
      params,
    });
  }

  createRpcResponseError(
    /* @param */ error: { code: number; message: string },
    /* @param */ method: string,
    /* @param */ id: string
    /* RETURN */
  ): Uint8Array {
    //
    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.RESPONSE,
      method,
      id,
      error,
    });
  }

  createRpcByteResponse(
    /* @param */ byte: Uint8Array,
    /* @param */ method: string,
    /* @param */ id: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const result: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.BYTES,
      byte,
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.RESPONSE,
      method,
      id,
      result,
    });
  }

  createRpcJsonRequest(
    /* @param */ json: object,
    /* @param */ method: string,
    /* @param */ id: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: JSON.stringify(json),
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.REQUEST,
      method,
      id,
      params,
    });
  }

  createRpcJsonResponse(
    /* @param */ json: object,
    /* @param */ method: string,
    /* @param */ id: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const result: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: JSON.stringify(json),
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.RESPONSE,
      method,
      id,
      result,
    });
  }

  createRpcSubscribe(
    /* @param */ json: object,
    /* @param */ method: string,
    /* @param */ id: string
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: JSON.stringify(json),
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.SUBSCRIBE,
      method,
      id,
      params,
    });
  }

  createRpcUnsubscribe(
    /* @param */ json: object,
    /* @param */ method: string,
    /* @param */ id: string
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: JSON.stringify(json),
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.UNSUBSCRIBE,
      method,
      id,
      params,
    });
  }

  createRpcJsonNotify(
    /* @param */ json: object,
    /* @param */ method: string,
    /* @param */ isChunked: boolean = false,
    /* @param */ chunkIndex: number = 1,
    /* @param */ totalChunks: number = 1,
    /* @param */ chunkId: string = "TBD"
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: JSON.stringify(json),
      isChunked,
      chunkIndex,
      totalChunks,
      chunkId,
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType: $pb.rpc.MessageType.NOTIFY,
      method,
      params,
    });
  }
}

const helper = new RpcHelper();
export default helper;
