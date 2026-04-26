"use strict";

const { spawnSync } = require("node:child_process");

function runNodeScript(scriptPath, args = [], options = {}) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: options.cwd,
    encoding: options.encoding ?? "utf8",
    timeout: options.timeout,
    windowsHide: true,
  });
}

module.exports = {
  runNodeScript,
};
