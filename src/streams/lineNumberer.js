import { Transform, pipeline } from "stream";
import { promisify } from "util";

const pipelineAsync = promisify(pipeline);

const lineNumberer = async () => {
  let lineNumber = 1;
  let buffer = "";

  const transform = new Transform({
    transform(chunk, _encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        this.push(`${lineNumber++} | ${line}\n`);
      }

      callback();
    },
    flush(callback) {
      if (buffer.length > 0) {
        this.push(`${lineNumber} | ${buffer}\n`);
      }
      callback();
    },
  });

  await pipelineAsync(process.stdin, transform, process.stdout);
};

await lineNumberer();