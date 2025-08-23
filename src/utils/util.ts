import { Snowflake } from "@theinternetfolks/snowflake";

export function uuid() {
  return Snowflake.generate();
}
