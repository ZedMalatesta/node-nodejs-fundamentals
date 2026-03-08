import { spawn } from "child_process";

const execCommand = () => {
  const command = process.argv[2];
  const [cmd, ...args] = command.split(" ");

  const child = spawn(cmd, args, {
    env: process.env,
    shell: true,
  });

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
};

execCommand();