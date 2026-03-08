import { createReadStream, createWriteStream } from "fs";
import { mkdir, access } from "fs/promises";
import { createBrotliDecompress } from "zlib";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, WORKSPACE_DIR_NAME } from "../consts/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const decompressDir = async () => {
  const workspacePath = resolve(__dirname, `../../${WORKSPACE_DIR_NAME}`);
  const compressedDir = join(workspacePath, "compressed");
  const archivePath = join(compressedDir, "archive.br");
  const outputDir = join(workspacePath, "decompressed");

  try {
    await access(compressedDir);
    await access(archivePath);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    await mkdir(outputDir, { recursive: true });

    await new Promise((res, rej) => {
      const input = createReadStream(archivePath);
      const decompress = createBrotliDecompress();

      let buffer = Buffer.alloc(0);
      let currentEntry = null;

      decompress.on("data", (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);

        const processBuffer = () => {
          if (!currentEntry) {
            const newlineIndex = buffer.indexOf("\n");
            if (newlineIndex === -1) return;

            currentEntry = JSON.parse(buffer.slice(0, newlineIndex).toString());
            buffer = buffer.slice(newlineIndex + 1);
          }

          if (buffer.length >= currentEntry.size) {
            const content = buffer.slice(0, currentEntry.size);
            buffer = buffer.slice(currentEntry.size);

            const destPath = join(outputDir, currentEntry.path);
            mkdir(dirname(destPath), { recursive: true })
              .then(() => {
                const writer = createWriteStream(destPath);
                writer.write(content);
                writer.end();
              })
              .catch(rej);

            currentEntry = null;
            processBuffer();
          }
        };

        processBuffer();
      });

      decompress.on("error", rej);
      decompress.on("end", res);

      input.pipe(decompress);
    });
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
    throw new Error(ERROR_TEXT);
  }
};

await decompressDir();