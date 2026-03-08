import { Transform, pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

const filter = async () => {
  const args = process.argv.slice(2);
  const patternIndex = args.indexOf("--pattern");
  const pattern = patternIndex !== -1 ? args[patternIndex + 1] : "";

  let buffer = "";

  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(`${line}\n`);
        }
      }

      callback();
    },
    flush(callback) {
      if (buffer.length > 0 && buffer.includes(pattern)) {
        this.push(`${buffer}\n`);
      }
      callback();
    },
  });

  await pipelineAsync(process.stdin, transform, process.stdout);
};

await filter();