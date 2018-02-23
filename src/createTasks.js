const d3tile = require('d3-tile');
const fetch = require('node-fetch');
const getLayers = require('./getLayers');

module.exports = function createTasks(layerState, size, viewZoom, projection) {
  const tasks = [];
  const tau = 2 * Math.PI;
  const layers = getLayers(layerState);
  for (let i = 0; i < layers.length; i++) {
    const { zoom, url } = layers[i];
    const zoomReducer = Math.pow(2, zoom - viewZoom);

    const tiles = d3tile.tile()
      .size([size.width * zoomReducer, size.height * zoomReducer])
      .scale(projection.scale() * tau * zoomReducer)
      .translate(
        projection([0, 0]).map(d => d * zoomReducer)
      )();
    const [baseURL, format] = url.split('{z}/{x}/{y}');
    const task = tiles.map(obj =>  fetchJSON(`${baseURL}${obj.z}/${obj.x}/${obj.y}${format}`));

    tasks.push(...task);
  }
  return tasks;
}

function fetchJSON(url) {
  return fetch(url)
    .then(response => response.json())
    .catch(() => undefined);
};
