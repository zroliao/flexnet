import * as $protobuf from "protobufjs";
/** Namespace rpc. */
export namespace rpc {

    /** ParamType enum. */
    enum ParamType {
        JSON = 0,
        BYTES = 1
    }

    /** MessageType enum. */
    enum MessageType {
        REQUEST = 0,
        RESPONSE = 1,
        NOTIFY = 2,
        SUBSCRIBE = 3,
        UNSUBSCRIBE = 4
    }

    /** Properties of a ParamWrapper. */
    interface IParamWrapper {

        /** ParamWrapper type */
        type?: (rpc.ParamType|null);

        /** ParamWrapper data */
        data?: (Uint8Array|null);

        /** ParamWrapper isChunked */
        isChunked?: (boolean|null);

        /** ParamWrapper chunkIndex */
        chunkIndex?: (number|null);

        /** ParamWrapper totalChunks */
        totalChunks?: (number|null);

        /** ParamWrapper chunkId */
        chunkId?: (string|null);
    }

    /** Represents a ParamWrapper. */
    class ParamWrapper implements IParamWrapper {

        /**
         * Constructs a new ParamWrapper.
         * @param [properties] Properties to set
         */
        constructor(properties?: rpc.IParamWrapper);

        /** ParamWrapper type. */
        public type: rpc.ParamType;

        /** ParamWrapper data. */
        public data: Uint8Array;

        /** ParamWrapper isChunked. */
        public isChunked: boolean;

        /** ParamWrapper chunkIndex. */
        public chunkIndex: number;

        /** ParamWrapper totalChunks. */
        public totalChunks: number;

        /** ParamWrapper chunkId. */
        public chunkId: string;

        /**
         * Creates a new ParamWrapper instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ParamWrapper instance
         */
        public static create(properties?: rpc.IParamWrapper): rpc.ParamWrapper;

        /**
         * Encodes the specified ParamWrapper message. Does not implicitly {@link rpc.ParamWrapper.verify|verify} messages.
         * @param message ParamWrapper message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rpc.IParamWrapper, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ParamWrapper message, length delimited. Does not implicitly {@link rpc.ParamWrapper.verify|verify} messages.
         * @param message ParamWrapper message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rpc.IParamWrapper, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ParamWrapper message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ParamWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rpc.ParamWrapper;

        /**
         * Decodes a ParamWrapper message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ParamWrapper
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rpc.ParamWrapper;

        /**
         * Verifies a ParamWrapper message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ParamWrapper message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ParamWrapper
         */
        public static fromObject(object: { [k: string]: any }): rpc.ParamWrapper;

        /**
         * Creates a plain object from a ParamWrapper message. Also converts values to other types if specified.
         * @param message ParamWrapper
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rpc.ParamWrapper, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ParamWrapper to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }

    /** Properties of a RpcMessage. */
    interface IRpcMessage {

        /** RpcMessage jsonrpc */
        jsonrpc?: (string|null);

        /** RpcMessage msgType */
        msgType?: (rpc.MessageType|null);

        /** RpcMessage method */
        method?: (string|null);

        /** RpcMessage id */
        id?: (string|null);

        /** RpcMessage params */
        params?: (rpc.IParamWrapper|null);

        /** RpcMessage result */
        result?: (rpc.IParamWrapper|null);

        /** RpcMessage error */
        error?: (string|null);
    }

    /** Represents a RpcMessage. */
    class RpcMessage implements IRpcMessage {

        /**
         * Constructs a new RpcMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: rpc.IRpcMessage);

        /** RpcMessage jsonrpc. */
        public jsonrpc: string;

        /** RpcMessage msgType. */
        public msgType: rpc.MessageType;

        /** RpcMessage method. */
        public method: string;

        /** RpcMessage id. */
        public id: string;

        /** RpcMessage params. */
        public params?: (rpc.IParamWrapper|null);

        /** RpcMessage result. */
        public result?: (rpc.IParamWrapper|null);

        /** RpcMessage error. */
        public error: string;

        /**
         * Creates a new RpcMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns RpcMessage instance
         */
        public static create(properties?: rpc.IRpcMessage): rpc.RpcMessage;

        /**
         * Encodes the specified RpcMessage message. Does not implicitly {@link rpc.RpcMessage.verify|verify} messages.
         * @param message RpcMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: rpc.IRpcMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified RpcMessage message, length delimited. Does not implicitly {@link rpc.RpcMessage.verify|verify} messages.
         * @param message RpcMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: rpc.IRpcMessage, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a RpcMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns RpcMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): rpc.RpcMessage;

        /**
         * Decodes a RpcMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns RpcMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): rpc.RpcMessage;

        /**
         * Verifies a RpcMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a RpcMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns RpcMessage
         */
        public static fromObject(object: { [k: string]: any }): rpc.RpcMessage;

        /**
         * Creates a plain object from a RpcMessage message. Also converts values to other types if specified.
         * @param message RpcMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: rpc.RpcMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this RpcMessage to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };
    }
}
