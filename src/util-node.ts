import * as ping from "ping";

export async function pingGoogleIsConnected(): Promise<boolean> {
  return new Promise<boolean>((done) => {
    const pingCfg = { timeout: 3, extra: ["-i", "1"] };
    ping.sys.probe(
      "google.com",
      (isAlive: boolean) => {
        done(isAlive);
      },
      pingCfg
    );
  });
}
