const path = require("path");
const { merge } = require("lodash");
const logger = require("./logger.js");
const getFreePorts = require("./free-port.js");

const defaultConfig = {
  removeTemp: true,
  emulateMedia: "screen",
};

const run = async incomingConfigs => {
  for (let i = 0 ; i < incomingConfigs.length ; i++ ) {
    const incomingConfig = incomingConfigs[i]
    const [docsifyRendererPort, docsifyLiveReloadPort] = await getFreePorts();
    const preBuildedConfig = merge(defaultConfig, incomingConfig);

    //logger.info("Build with settings:");
    //console.log(JSON.stringify(preBuildedConfig, null, 2));
    //console.log("\n");

    const config = merge(preBuildedConfig, {
      docsifyRendererPort,
      docsifyLiveReloadPort,
    });

    const { combineMarkdowns } = require("./markdown-combine.js")(config);
    const { closeProcess, prepareEnv, cleanUp } = require("./utils.js")(config);
    const { createRoadMap } = require("./contents-builder.js")(config);
    const { runDocsifyRenderer } = require("./docsify-server.js")(config);
    const { htmlToPdf } = require("./render.js")(config);

    try {
      await cleanUp();
      await prepareEnv();
      const roadMap = await createRoadMap();
      await combineMarkdowns(roadMap);

      runDocsifyRenderer();
      await htmlToPdf();

      logger.success(path.resolve(config.pathToPublic));
    } catch (error) {
      logger.err("run error", error);
    } finally {
      if (i === incomingConfigs.length -1 ) closeProcess(0);
    }
  }
};

module.exports = run;
