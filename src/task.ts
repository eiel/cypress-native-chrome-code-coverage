// ref https://github.com/bahmutov/cypress-native-chrome-code-coverage-example/blob/master/cypress/plugins/index.js#L131
import CDP from "chrome-remote-interface";
import v8ToIstanbul from "v8-to-istanbul";
import path from "path";
import fs from "fs";
import mkdirp from "mkdirp";
import * as Cypress from "cypress";
import {Profiler} from "inspector";

const fromRoot = path.join.bind(null, __dirname, "..", "..");
// const v8CoverageFolder = fromRoot('.v8-coverage')
const istanbulCoverageFolder = fromRoot(".nyc_output");

function log(msg: unknown) {
  console.log(msg);
}

let cdp: CDP.Client | undefined;

const makeFolder = () => {
  // if (!fs.existsSync(v8CoverageFolder)) {
  //   mkdirp.sync(v8CoverageFolder)
  // }
  if (!fs.existsSync(istanbulCoverageFolder)) {
    console.log("making folder: %s", istanbulCoverageFolder);
    mkdirp.sync(istanbulCoverageFolder);
  }
};

const convertToIstanbul = async (jsFilename: string, functionsC8coverage: Profiler.FunctionCoverage[]) => {
  // the path to the original source-file is required, as its contents are
  // used during the conversion algorithm.
  const converter = v8ToIstanbul(jsFilename);
  await converter.load(); // this is required due to the async source-map dependency.
  // provide an array of coverage information in v8 format.

  // const c8coverage = require('./.v8-coverage/coverage.json')
  // const appCoverage = c8coverage.result[0].functions
  converter.applyCoverage(functionsC8coverage);

  // output coverage information in a form that can
  // be consumed by Istanbul.
  // console.info(JSON.stringify(converter.toIstanbul(), null, 2))
  return converter.toIstanbul();
};

async function connect(port: number): Promise<CDP.Client> {
  const cdp: CDP.Client = await CDP({ port });
  log(" Connected to Chrome Debugging Protocol");

  cdp.on("disconnect", () => {
    log(" Chrome Debugging Protocol disconnected");
  });
  return cdp;
}

function cdpManager(port: number): () => Promise<CDP.Client> {
  let cdp: CDP.Client | null = null;
  return async () => {
    if (cdp) {
      return cdp;
    }
    cdp = await connect(port);
    cdp.on("disconnect", () => {
      cdp = null;
    });
    return cdp;
  }
}

type RemoteDebugPort = 'no chrome' | 'no remote debbuging port' | { type: 'port', valueE: number }

let remoteDebuggingPort: number | undefined;

function browserLaunchHandler(browser: Cypress.Browser, launchOptions: Cypress.BrowserLaunchOptions): void  {
  console.log("browser is", browser);
  if (browser.name !== "chrome") {
    return log(
      ` Warning: An unsupported browser is used, output will not be logged to console: ${browser.name}`
    );
  }

  // find how Cypress is going to control Chrome browser
  const rdpArgument = launchOptions.args.find((arg) =>
    arg.startsWith("--remote-debugging-port")
  );
  if (!rdpArgument) {
    return log(
      `Could not find launch argument that starts with --remote-debugging-port`
    );
  }
  remoteDebuggingPort = parseInt(rdpArgument.split("=")[1]);
}

const coverageTask: Cypress.Tasks = {
  async startProfile() {
    log("before test for coverage");
    if (remoteDebuggingPort) {
      cdp = await connect(remoteDebuggingPort)
      log("starting code coverage");
      const callCount = true;
      const detailed = true;

      return Promise.all([
        cdp.Profiler.enable(),
        cdp.Profiler.startPreciseCoverage({callCount, detailed}),
      ]);
    }

    return null;
  },

  saveCoverage() {
    console.log("after testI for coverage", { cdp, a: null });

    if (cdp) {
      log("stopping code coverage");
      return cdp.Profiler.takePreciseCoverage().then((c8coverage) => {
        // slice out unwanted scripts (like Cypress own specs)
        // minimatch would be better?
        const appFiles = /app\/index\.js$/;

        const filename = path.join("temp", "c8coverage.json");
        const str = JSON.stringify(c8coverage.result, null, 2) + "\n";
        fs.writeFileSync(filename, str, "utf8");

        // for now just grab results for "app.js"
        const appC8coverage = c8coverage.result.find((script) => {
          return appFiles.test(script.url);
        });
        if (!appC8coverage) {
          throw "not found target file"
        }
        return convertToIstanbul(
          "./build/index.js",
          appC8coverage.functions
        ).then((istanbulCoverage) => {
          // result.result = result.result.filter(script =>
          //   appFiles.test(script.url)
          // )
          // pathが絶対pathになっているため相対pathに変換
          const entries = Object.entries(istanbulCoverage).map(
            ([key, value]) => [key, { ...value, path: `.${value.path}` }]
          );
          const coverage = Object.fromEntries(entries);

          makeFolder();

          const filename = path.join(istanbulCoverageFolder, "out.json");
          const str = JSON.stringify(coverage, null, 2) + "\n";
          fs.writeFileSync(filename, str, "utf8");
          console.log("write out.json");

          // const filename = path.join(v8CoverageFolder, 'coverage.json')
          // fs.writeFileSync(filename, JSON.stringify(result, null, 2) + '\n')

          // const istanbulReports =
          // pti.write(result)
          // console.log('%o', appScripts[0].functions)
          // console.log('%o', istanbulReports)

          cdp?.Profiler.stopPreciseCoverage();
        });
      });
    }

    return null;
  },
};

export function bindCoverageTask(on: Cypress.PluginEvents): void {
  console.log("load covarage plugin");
  on("before:browser:launch", browserLaunchHandler);
  on("task", coverageTask);
}
