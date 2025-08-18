import {ContextPath} from '../context';
import NodeWSMP from '../ws-client-node';

interface Logger {
  info: (str: any) => void;
  error: (str: any) => void;
  warn: (str: any) => void;
  debug: (str: any) => void;
}

interface Config {
  host: string;
  max_payload?: number;
}

class WSClient {

  // * /////////////////////////////////////////////////
  // * Private
  // * /////////////////////////////////////////////////

  private initialized_: boolean = false;

  private config_: Config | null = null;
  private logger_: Logger | any = console;
  private client_: NodeWSMP | null = null;

  private connected_: boolean = false;
  private subscriber_: ((err?: Error) => void)[] = [];

  // * /////////////////////////////////////////////////
  // * Constructor
  // * /////////////////////////////////////////////////

  constructor(logger: Logger | any, config: Config, path: ContextPath) {

    this.config_ = config;
    this.logger_ = logger;

    const onOpen = () => {
      this.logger_.info(`[plugin.wsmpc] connected, ${this.config_.host}`);
      this.connected_ = true;
      this.notifyStateChange();
    };
    const onLoss = () => {
      this.logger_.error(`[plugin.wsmpc] disconnect, ${this.config_.host}`);
      this.connected_ = false;
      this.notifyStateChange(new Error('disconnect'));
    };

    this.client_ = new NodeWSMP(this.config_.host, this.config_.max_payload, path, onOpen, onLoss, this.logger_);
    this.logger_.info(`[plugin.wsmpc] create ${this.config_.host}`);

    this.initialized_ = true;
  }

  // * /////////////////////////////////////////////////
  // * Public Interface
  // * /////////////////////////////////////////////////

  public instance(): NodeWSMP {
    return this.client_;
  }

  public connected() {
    return this.connected_;
  }

  public subscribe(callback: (err?: Error) => void): boolean {
    if (!callback) return false;
    this.subscriber_.push(callback);
    setTimeout(() => {
      if (this.connected()) callback();
      else callback(new Error('disconnect'));
    }, 50);
  }

  public cancel(callback: (err?: Error) => void): void {
    const pos: number = this.subscriber_.findIndex((fn: (err?: Error) => void) => {
      return fn === callback;
    });
    this.subscriber_.splice(pos, 1);
  }

  // * /////////////////////////////////////////////////
  // * Private Function
  // * /////////////////////////////////////////////////

  private notifyStateChange(err?: any) {
    this.subscriber_.forEach((callback: (err: any) => void) => {
      callback(err);
    });
  }
}

export default WSClient;
