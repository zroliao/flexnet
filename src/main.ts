import Context, {
  ContextPath,
  GeoIP,
  Logger,
  PptpOption,
  SignalOption,
} from "./context";
import log, { LogLevel } from "electron-log";
import * as mkdirp from "mkdirp";
import * as fs from "fs";
import FlexNet from "./main-server";
import ini from "./Ini";

import PluginWsc from "./plugin-wsc/index";
import collectGeoIpInfo from "./collect-info";
import { pingGoogleIsConnected } from "./util-node";

interface PluginWscOption {
  host: string;
}

interface ConfigData {
  version: number;
  logger: {
    level: LogLevel;
    format: string;
    maxSize: number;
  };
  extension: {
    core: {
      port: number[];
      geoip?: GeoIP;
      pptp?: PptpOption;
      signal?: SignalOption;
      server: number;
    };
  };
  plugin: {
    wsc: {};
  };
}

class MainService {
  private configPath: string;
  private wssPort_: number[];
  private overSSL: boolean = true;

  public disableSSLConnection() {
    this.overSSL = false;
  }

  public async install(
    /* @param */ rootDir: string,
    /* @param */ port: number | number[],
    /* @param */ done?: (x: Context) => void
    /* RETURN */
  ): Promise<Context> {
    //
    if (!port) throw new Error("invalid port number");

    if (Array.isArray(port)) this.wssPort_ = port;
    else this.wssPort_ = [port];

    const root: string = rootDir.replace(/\\/g, "/");
    const path: ContextPath = {
      root,
      temp: `${root}/temp`,
      logger: `${root}/log`,
      config: `${root}/config`,
      extension: `${root}/extension`,
    };

    mkdirp.sync(path.temp);
    mkdirp.sync(path.logger);
    mkdirp.sync(path.config);
    mkdirp.sync(path.extension);

    this.configPath = path.config;
    const config: ConfigData = this.getConfig();
    log.transports.console.level = config.logger.level;
    log.transports.console.format =
      "{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}";
    log.transports.file.level = config.logger.level;
    log.transports.file.format = config.logger.format;
    log.transports.file.maxSize = config.logger.maxSize;
    log.transports.file.file = `${path.logger}/core.${config.extension.core.port}.log`;

    await this.processUpgradeConfig(config, log);

    const executeCollectGeoIP = async () => {
      log.info("[core] start collect edge information");
      const geoip: GeoIP | null = await collectGeoIpInfo();
      if (geoip !== null && config?.extension?.core) {
        config.extension.core.geoip = geoip;
        this.setConfig(config);
      } else {
        log.warn("[core] collect edge information fail");
      }
      log.info("[core] finish collect edge information");
    };

    if (await pingGoogleIsConnected()) {
      if (config?.extension?.core?.geoip !== undefined) {
        setTimeout(async () => {
          await executeCollectGeoIP();
        }, 1000);
      } else {
        await executeCollectGeoIP();
      }
    }

    new FlexNet(
      /* @param1 */ log,
      /* @param2 */ config.extension.core,
      /* @param3 */ path,
      /* @param4 */ this.overSSL
    );

    const ctx: Context = {
      log: {
        error: (str: string) => log.error(`%c${str}`, `color: red`),
        warn: (str: string) => log.warn(`%c${str}`, `color: yellow`),
        info: (str: string) => log.info(str),
        debug: (str: string) => log.debug(`%c${str}`, `color: blue`),
        log: (str: string) => log.log(str),
      },
      path,
      utils: {},
      getConfig: this.getConfig.bind(this),
      setConfig: this.setConfig.bind(this),
    };

    this.addPlugin(ctx, PluginWsc, "wsc");

    if (done) done(ctx);
    return ctx;
  }

  public async remove(done?: () => void): Promise<void> {
    if (done) done();
  }

  // * /////////////////////////////////////////////////////
  // * Private
  // * /////////////////////////////////////////////////////

  private async processUpgradeConfig(config: ConfigData, logger: Logger) {
    switch (config.version) {
      case undefined:
        config.logger.format = "{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}";
        config.version = 1;
        break;
      case 1:
        if (!config?.plugin) config.plugin = { wsc: {} } as any;
        if (!config?.plugin?.wsc) config.plugin.wsc = {} as any;
        config.version = 2;
        break;
      default:
        config.extension.core.port = this.wssPort_;
        this.setConfig(config);
        return;
    }

    this.setConfig(config);
    return await this.processUpgradeConfig(config, logger);
  }

  private getConfig(): ConfigData {
    const filePath = `${this.configPath}/core.${this.wssPort_[0]}.ini`;
    if (fs.existsSync(filePath))
      return ini.parse(fs.readFileSync(filePath, "utf-8"));

    let json = this.defaultConfigFormat();
    json = this.attachPluginConfig(json);
    return this.setConfig(json);
  }

  private attachPluginConfig(config: any) {
    config.plugin = {
      wsc: {},
    };
    return config;
  }

  private defaultConfigFormat() {
    return {
      version: 1,
      logger: {
        level: "info",
        format: "{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {text}",
        maxSize: 10 * 1024 * 1024,
      },
      extension: {
        core: {
          port: this.wssPort_,
          server: 0,
          pptp: {
            enable: false,
            peer_id: "pptp://",
            signal_server: "",
            ice_servers: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
            max_message_size: 308224,
            port_range_begin: 1024,
            port_range_end: 65535,
            mtu: 1200,
          },
        },
      },
    };
  }

  private setConfig(newConfig: any) {
    const iniCfgPath = `${this.configPath}/core.${this.wssPort_[0]}.ini`;
    const iniData = ini.stringify(newConfig);
    fs.writeFileSync(iniCfgPath, iniData);
    return newConfig;
  }

  private async addPlugin(ctx: Context, instance: any, name: string) {
    switch (name) {
      case "wsc": {
        const cfg = ctx.getConfig();
        if (cfg.plugin && cfg.plugin.wsc) {
          Object.keys(cfg.plugin.wsc).forEach((item: string) => {
            if (!ctx.utils[name]) ctx.utils[name] = {};
            ctx.utils[name][item] = new instance(
              ctx.log,
              cfg.plugin.wsc[item],
              ctx.path
            );
          });
        }
        break;
      }
      default: {
        break;
      }
    }
  }
}

export default new MainService();
