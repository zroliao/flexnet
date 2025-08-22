import * as $pb from "../protobuf";

const txEncoder = new TextEncoder();
const txDecoder = new TextDecoder("utf-8");

class JsonRpcHelper {
  //
  private _jsonrpc: string = "2.0";

  createRpcMessage(message: $pb.rpc.IRpcMessage): Uint8Array {
    const err: string | null = $pb.rpc.RpcMessage.verify(message);
    if (err) throw new Error(`invalid RpcMessage, ${err}`);
    const rpc: $pb.rpc.RpcMessage = $pb.rpc.RpcMessage.create(message);
    return $pb.rpc.RpcMessage.encode(rpc).finish();
  }

  createByteRpcMessage(
    /* @param */ data: Uint8Array,
    /* @param */ msgType: $pb.rpc.MessageType,
    /* @param */ method: string,
    /* @param */ id: string
    /* RETURN */
  ): Uint8Array {
    //
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.BYTES,
      data,
      isChunked: false,
      chunkIndex: 1,
      totalChunks: 1,
      chunkId: "TBD",
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType,
      method,
      id,
      params,
    });
  }

  createJsonRpcMessage(
    /* @param */ data: any,
    /* @param */ msgType: $pb.rpc.MessageType,
    /* @param */ method: string,
    /* @param */ id: string
    /* RETURN */
  ): Uint8Array {
    const params: $pb.rpc.IParamWrapper = {
      type: $pb.rpc.ParamType.JSON,
      data: Buffer.from(txEncoder.encode(JSON.stringify(data)).buffer),
      isChunked: false,
      chunkIndex: 1,
      totalChunks: 1,
      chunkId: "TBD",
    };

    return this.createRpcMessage({
      jsonrpc: this._jsonrpc,
      msgType,
      method,
      id,
      params,
    });
  }
}

const helper = new JsonRpcHelper();
export default helper;
