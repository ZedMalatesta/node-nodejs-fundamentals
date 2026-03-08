import { createReadStream, createWriteStream } from "fs";
import { readdir, mkdir, access } from "fs/promises";
import { createBrotliCompress } from "zlib";
import { join, relative, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { ERROR_TEXT, WORKSPACE_DIR_NAME } from "../consts/consts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compressDir = async () => {
  const workspacePath = resolve(__dirname, `../../${WORKSPACE_DIR_NAME}`);
  const sourceDir = join(workspacePath, "toCompress");
  const outputDir = join(workspacePath, "compressed");
  const archivePath = join(outputDir, "archive.br");

  try {
    await access(sourceDir);
  } catch {
    throw new Error(ERROR_TEXT);
  }

  try {
    await mkdir(outputDir, { recursive: true });

    const items = await readdir(sourceDir, { recursive: true, withFileTypes: true });
    const files = items
      .filter((item) => item.isFile())
      .map((item) => join(item.parentPath, item.name));

    const compress = createBrotliCompress();
    const output = createWriteStream(archivePath);

    compress.pipe(output);

    for (const filePath of files) {
      const relPath = relative(sourceDir, filePath).replaceAll("\\", "/");
      const readStream = createReadStream(filePath);
      const chunks = [];

      await new Promise((res, rej) => {
        readStream.on("data", (chunk) => chunks.push(chunk));
        readStream.on("error", rej);
        readStream.on("end", () => {
          const content = Buffer.concat(chunks);
          const header = Buffer.from(
            JSON.stringify({ path: relPath, size: content.byteLength }) + "\n"
          );
          compress.write(header);
          compress.write(content);
          res();
        });
      });
    }

    await new Promise((res, rej) => {
      output.on("finish", res);
      output.on("error", rej);
      compress.end();
    });
  } catch (err) {
    if (err.message === ERROR_TEXT) throw err;
    throw new Error(ERROR_TEXT);
  }
};

await compressDir();