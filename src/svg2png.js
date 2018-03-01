const http = require('http');
const fs = require('fs');
const finalhandler = require('finalhandler');
const serveStatic = require('serve-static');
const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');

async function startHeadlessChrome() {
  try {
    return await chromeLauncher.launch({
      startingUrl: 'target:brank',
      chromeFlags: ['--headless', '--disable-gpu']
    });
  } catch (error) {
    console.log(error);
  }
}

function serve(path) {
  const serve = serveStatic(path);
  const server = http.createServer((req, res) => {
    const done = finalhandler(req, res);
    serve(req, res, done);
  });
  server.listen(8008);

  return server;
}

module.exports = async function main(size, path, filename) {
  const server = serve(path);
  const chrome = await startHeadlessChrome();
  const options = {
    port: chrome.port
  };

  CDP(options, async client => {
    const { Page } = client;
    try {
      await Page.enable();
      await Page.setDeviceMetricsOverride({
        width: size.width,
        height: size.height,
        deviceScaleFactor: 2,
        mobile: false
      });
      await Page.navigate({ url: `http://localhost:8008/${filename}` });
      await Page.loadEventFired();

      const { data } = await Page.captureScreenshot();
      fs.writeFileSync(
        `${path}/${filename.slice(0, -4)}.png`,
        Buffer.from(data, 'base64')
      );
    } catch (error) {
      console.log(error);
    } finally {
      // close the connection to the remote instance.
      await client.close();
      // headless chrome close
      await chrome.kill();
      server.close(err => {
        if (err) throw err;
        console.log('png exported!');
      });
    }
  }).on('error', err => {
    // cannot connect to the remote endpoint
    console.error(err);
  });
};
