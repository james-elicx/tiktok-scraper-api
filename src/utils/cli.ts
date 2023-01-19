/**
 * Show the program's help menu.
 *
 * @param args The arguments that are available
 */
const helpMenu = (args: Arg[]) => {
  console.log();
  console.log('TikTok Scraper v1.0.0');
  console.log();
  console.log('Available arguments:');
  console.log();
  args.forEach((arg) => {
    console.log(`  ${arg.name} - ${arg.desc}`);
    console.log(`    --${arg.key}, -${arg.alternativeKey} <${arg.placeholder}>`);
  });
  console.log();
};

/**
 * Show an error message for an invalid argument.
 *
 * @param arg The argument that was invalid
 * @param args All arguments that are available
 */
const showArgError = (arg: Arg, args: Arg[]) => {
  helpMenu(args);

  console.log();
  console.log('Invalid argument usage:');
  console.log();
  console.log(`  ${arg.name} - ${arg.desc}`);
  console.log(`    --${arg.key}, -${arg.alternativeKey} <${arg.placeholder}>`);
  console.log();
  console.log(`  Please specify a ${arg.type} value for <${arg.placeholder}>`);
  console.log();

  process.exit(1);
};

export type Arg = {
  type: 'text' | 'number' | 'boolean';
  entry: boolean;
  required: boolean;
  key: string;
  alternativeKey: string;
  placeholder: string;
  name: string;
  desc: string;
  needs?: string[];
};

/**
 * Parse the program's command-line arguments.
 *
 * @param args The arguments that are available
 * @returns The parsed arguments
 */
export const parseArgs = (args: Arg[]) => {
  const rawArgs = process.argv;
  const parsedArgs: Record<string, string | number | boolean> = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const argKey = rawArgs[i];
    const foundArg = args.find((a) => `--${a.key}` === argKey || `-${a.alternativeKey}` === argKey);

    if (foundArg) {
      const nextArg = rawArgs[i + 1];

      if (foundArg.entry) {
        parsedArgs['_entry'] = foundArg.key;
      }

      switch (foundArg.type) {
        case 'text': {
          if (!nextArg || nextArg.length === 0) {
            showArgError(foundArg, args);
            process.exit(1);
          }

          parsedArgs[foundArg.key] = nextArg;
          i++;
          break;
        }
        case 'number': {
          if (!nextArg || nextArg.length === 0 || Number.isNaN(Number(nextArg))) {
            showArgError(foundArg, args);
            process.exit(1);
          }

          parsedArgs[foundArg.key] = Number(nextArg);
          i++;
          break;
        }
        case 'boolean': {
          parsedArgs[foundArg.key] = true;
          break;
        }
        default: {
          throw new Error(`Invalid argument type: ${foundArg.type}`);
        }
      }
    }
  }

  args.forEach((arg) => {
    if (arg.required && !parsedArgs[arg.key]) {
      showArgError(arg, args);
      process.exit(1);
    }

    if (parsedArgs[arg.key]) {
      arg.needs?.forEach((need) => {
        if (!parsedArgs[need]) {
          showArgError(args.find((a) => a.key === need) ?? arg, args);
          process.exit(1);
        }
      });
    }
  });

  return parsedArgs;
};

/** Command-line interface methods. */
export const cli = {
  /** Show the help menu. */
  helpMenu,
  /** Show an argument error. */
  showArgError,
  /** Parse command-line arguments. */
  parseArgs,
};
