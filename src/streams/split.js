import { createReadStream, createWriteStream } from "fs";
import { Transform, pipeline } from "stream";
import { promisify } from "util";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pipelineAsync = promisify(pipeline);

const split = async () => {
  const args = process.argv.slice(2);
  const linesIndex = args.indexOf("--lines");
  const maxLines = linesIndex !== -1 ? Number(args[linesIndex + 1]) : 10;

  const sourcePath = resolve(__dirname, "../../source.txt");

  let chunkIndex = 1;
  let lineCount = 0;
  let currentWriter = createWriteStream(resolve(__dirname, `../../chunk_${chunkIndex}.txt`));
  let buffer = "";

  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        currentWriter.write(`${line}\n`);
        lineCount++;

        if (lineCount >= maxLines) {
          currentWriter.end();
          chunkIndex++;
          lineCount = 0;
          currentWriter = createWriteStream(resolve(__dirname, `../../chunk_${chunkIndex}.txt`));
        }
      }

      callback();
    },
    flush(callback) {
      if (buffer.length > 0) {
        currentWriter.write(buffer);
      }
      currentWriter.end();
      callback();
    },
  });

  await pipelineAsync(createReadStream(sourcePath), transform);
};

await split();