import readline from "readline";

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> ",
  });

  const COMMANDS = {
    uptime: () => console.log(`Uptime: ${process.uptime().toFixed(2)}s`),
    cwd: () => console.log(process.cwd()),
    date: () => console.log(new Date().toISOString()),
    exit: () => {
      console.log("Goodbye!");
      process.exit(0);
    },
  };

  rl.prompt();

  rl.on("line", (line) => {
    const command = line.trim();

    if (COMMANDS[command]) {
      COMMANDS[command]();
    } else {
      console.log("Unknown command");
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log("Goodbye!");
    process.exit(0);
  });
};

interactive();
