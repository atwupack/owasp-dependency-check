/**
 * This file is based on the extract-zip package (see https://github.com/max-mapper/extract-zip)
 * The original code has been migrated to TypeScript, and the dependency get-stream has been removed.
 * The dependency yauzl has been updated to the latest version.
 */

import { createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable, pipeline as nodePipeline } from "node:stream";
import { promisify } from "node:util";
import yauzl, { Entry, ZipFile } from "yauzl";
import { ensureError } from "./misc.js";
import { Response } from "undici";

const openZip = promisify(yauzl.open) as (
  zipPath: string,
  options: { lazyEntries: true },
) => Promise<ZipFile>;

const pipeline = promisify(nodePipeline) as (
  source: Readable,
  destination: NodeJS.WritableStream,
) => Promise<void>;

export interface ExtractOptions {
  dir: string;
  defaultDirMode?: string | number;
  defaultFileMode?: string | number;
  onEntry?: (entry: Entry, zipfile: ZipFile) => void;
}

class Extractor {
  private zipfile!: ZipFile;
  private canceled = false;

  constructor(
    private readonly zipPath: string,
    private readonly opts: ExtractOptions,
  ) {}

  async extract(): Promise<void> {
    this.zipfile = await openZip(this.zipPath, { lazyEntries: true });
    this.canceled = false;

    return new Promise<void>((resolve, reject) => {
      this.zipfile.on("error", (error: Error) => {
        this.canceled = true;
        reject(error);
      });

      this.zipfile.readEntry();

      this.zipfile.on("close", () => {
        if (!this.canceled) {
          resolve();
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.zipfile.on("entry", async (entry: Entry) => {
        /* istanbul ignore if */
        if (this.canceled) {
          return;
        }

        if (entry.fileName.startsWith("__MACOSX/")) {
          this.zipfile.readEntry();
          return;
        }

        const destDir = path.dirname(path.join(this.opts.dir, entry.fileName));

        try {
          await fs.mkdir(destDir, { recursive: true });

          const canonicalDestDir = await fs.realpath(destDir);
          const relativeDestDir = path.relative(
            this.opts.dir,
            canonicalDestDir,
          );

          if (relativeDestDir.split(path.sep).includes("..")) {
            throw new Error(
              `Out of bound path "${canonicalDestDir}" found while processing file ${entry.fileName}`,
            );
          }

          await this.extractEntry(entry);
          this.zipfile.readEntry();
        } catch (error) {
          this.canceled = true;
          this.zipfile.close();
          reject(ensureError(error));
        }
      });
    });
  }

  private async extractEntry(entry: Entry): Promise<void> {
    /* istanbul ignore if */
    if (this.canceled) {
      return;
    }

    if (this.opts.onEntry) {
      this.opts.onEntry(entry, this.zipfile);
    }

    const dest = path.join(this.opts.dir, entry.fileName);

    const mode = (entry.externalFileAttributes >> 16) & 0xffff;
    const IFMT = 0o170000;
    const IFDIR = 0o040000;
    const IFLNK = 0o120000;

    const symlink = (mode & IFMT) === IFLNK;
    let isDir = (mode & IFMT) === IFDIR;

    if (!isDir && entry.fileName.endsWith("/")) {
      isDir = true;
    }

    const madeBy = entry.versionMadeBy >> 8;
    if (!isDir) {
      isDir = madeBy === 0 && entry.externalFileAttributes === 16;
    }

    const procMode = this.getExtractedMode(mode, isDir) & 0o777;
    const destDir = isDir ? dest : path.dirname(dest);

    const mkdirOptions: { recursive: true; mode?: number } = {
      recursive: true,
    };
    if (isDir) {
      mkdirOptions.mode = procMode;
    }

    await fs.mkdir(destDir, mkdirOptions);

    if (isDir) {
      return;
    }

    const openReadStream = promisify(
      this.zipfile.openReadStream.bind(this.zipfile),
    ) as (entry: Entry) => Promise<Readable>;

    const readStream = await openReadStream(entry);

    if (symlink) {
      const link = await new Response(readStream).text();
      await fs.symlink(link, dest);
      return;
    }

    await pipeline(readStream, createWriteStream(dest, { mode: procMode }));
  }

  private getExtractedMode(entryMode: number, isDir: boolean): number {
    let mode = entryMode;

    if (mode === 0) {
      if (isDir) {
        if (this.opts.defaultDirMode !== undefined) {
          mode = Number.parseInt(String(this.opts.defaultDirMode), 10);
        }

        if (!mode) {
          mode = 0o755;
        }
      } else {
        if (this.opts.defaultFileMode !== undefined) {
          mode = Number.parseInt(String(this.opts.defaultFileMode), 10);
        }

        if (!mode) {
          mode = 0o644;
        }
      }
    }

    return mode;
  }
}

export default async function extract(
  zipPath: string,
  opts: ExtractOptions,
): Promise<void> {
  if (!path.isAbsolute(opts.dir)) {
    throw new Error("Target directory is expected to be absolute");
  }

  await fs.mkdir(opts.dir, { recursive: true });
  opts.dir = await fs.realpath(opts.dir);

  return new Extractor(zipPath, opts).extract();
}
