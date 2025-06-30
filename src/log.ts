import { white } from "ansis";

export class Logger {
  constructor(private readonly prefix: string) {}

  info(...logData: string[]): void {
    console.log([white.bgGreen` ${this.prefix}: `, ...logData].join(" "));
  }

  warn(...logData: string[]) {
    console.log(
      [white.bgYellow` ${this.prefix} WARNING: `, ...logData].join(" "),
    );
  }

  error(...logData: string[]) {
    console.error([white.bgRed` ${this.prefix} ERROR: `, ...logData].join(" "));
  }
}

export function createLogger(prefix: string) {
  return new Logger(prefix);
}
