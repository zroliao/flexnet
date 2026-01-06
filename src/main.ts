import * as fs from "fs";
import ini from "./utils/Ini";
import log from "electron-log";
import * as mkdirp from "mkdirp";
import { FlexNet } from "./types";
import EdgeFlexNet from "./server-edge";
import SignalFlexNext from "./server-signal";
import EdgeTransport from "./server-edge/edge-transport";

class MainFlexNet {
  //
  private _configPath: string;
  private _wssPort: number;
  private _overSSL: boolean = true;

  constructor(overSSL: boolean = false) {
    this._overSSL = overSSL;
  }

  public async createSignal(
    /* @param */ rootDir: string,
    /* @param */ edgePort: number,
    /* @param */ done?: (x: FlexNet.Context) => void
    /* RETURN */
  ): Promise<FlexNet.Context> {
    //
    const ctx: FlexNet.Context = await this.install(rootDir, edgePort);
    new SignalFlexNext(ctx.log, this.getConfig(), ctx.path, this._overSSL);
    if (done) done(ctx);
    return ctx;
  }

  public async createEdge(
    /* @param */ rootDir: string,
    /* @param */ edgePort: number,
    /* @param */ edgeConfig: FlexNet.EdgeConfig,
    /* @param */ done?: ([cts, transport]: [
      FlexNet.Context,
      EdgeTransport
    ]) => void
    /* RETURN */
  ): Promise<[FlexNet.Context, EdgeTransport]> {
    //
    const context: FlexNet.Context = await this.install(rootDir, edgePort);
    const transport: EdgeTransport = new EdgeTransport(log);
    new EdgeFlexNet(
      context,
      transport,
      this.getConfig(),
      edgeConfig,
      this._overSSL
    );
    if (done) done([context, transport]);
    return [context, transport];
  }

  public async remove(done?: () => void): Promise<void> {
    if (done) done();
  }

  private async install(
    /* @param */ rootDir: string,
    /* @param */ edgePort: number
    /* RETURN */
  ): Promise<FlexNet.Context> {
    //
    if (!edgePort) throw new Error("invalid port number");
    this._wssPort = edgePort;

    const root: string = rootDir.replace(/\\/g, "/");
    const path: FlexNet.ContextPath = {
      root,
      logger: `${root}/log`,
      config: `${root}/config`,
    };

    mkdirp.sync(path.logger);
    mkdirp.sync(path.config);

    this._configPath = path.config;
    const baseConfig: FlexNet.BaseConfig = this.getConfig();
    log.transports.console.level = baseConfig.logger.level;
    log.transports.console.format =
      "{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}";
    log.transports.file.level = baseConfig.logger.level;
    log.transports.file.format = baseConfig.logger.format;
    log.transports.file.maxSize = baseConfig.logger.maxSize;
    log.transports.file.file = `${path.logger}/core.${baseConfig.service.port}.log`;

    const ctx: FlexNet.Context = {
      path,
      log: {
        error: (str: string) => log.error(`%c${str}`, `color: red`),
        warn: (str: string) => log.warn(`%c${str}`, `color: yellow`),
        info: (str: string) => log.info(str),
        debug: (str: string) => log.debug(`%c${str}`, `color: blue`),
        log: (str: string) => log.log(str),
      },
    };

    return ctx;
  }

  private getConfig(): FlexNet.BaseConfig {
    const filePath = `${this._configPath}/core.${this._wssPort[0]}.ini`;
    if (!fs.existsSync(filePath)) return this.defaultConfig();
    return ini.parse(fs.readFileSync(filePath, "utf-8"));
  }

  private defaultConfig(): FlexNet.BaseConfig {
    return {
      version: 1,
      logger: {
        level: "info",
        format: "{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}",
        maxSize: 10 * 1024 * 1024,
      },
      service: {
        port: this._wssPort,
      },
    };
  }
}

export default MainFlexNet;
