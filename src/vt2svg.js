'use strict';

const fs = require('fs');
const fetch = require('node-fetch');
const d3 = Object.assign(
  {},
  require('d3-selection'),
  require('d3-geo')
);
const jsdom = require('jsdom');
const createTasks = require('./createTasks');

module.exports = function(state) {
  const { JSDOM } = jsdom;

  const document = new JSDOM().window.document;

  const tau = 2 * Math.PI;
  const zoom = {
    view: state.viewZoom,
    tile: 16
  };
  const center = [state.lon, state.lat];
  const size = {
    width: state.width,
    height: state.height
  };

  const zoomReducer = Math.pow(2, zoom.tile - zoom.view);

  const projection = d3
    .geoMercator()
    .center(center)
    .scale(256 * Math.pow(2, zoom.view) / tau)
    .translate([size.width / 2, size.height / 2]);

  const path = d3.geoPath().projection(projection);

  const map = d3
    .select(document.body)
    .append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('width', size.width)
    .attr('height', size.height)
    .attr('viewbox', `0 0 ${size.width} ${size.height}`)
    .attr('xmin', projection.invert([0, 0])[0])
    .attr('xmax', projection.invert([size.width, size.height])[0])
    .attr('ymin', projection.invert([size.width, size.height])[1])
    .attr('ymax', projection.invert([0, 0])[1])
    .attr('scale', projection.scale())
    .style('background-color', state.backgroundColor || undefined);

  const tasks = createTasks(state.layers, size, zoom.view, projection);

  Promise.all(tasks)
    .then(data => {
      return data.filter(d => d !== undefined);
    })
    .then(data => {
      map.append('g')
        .attr('fill', 'none')
        .attr('stroke', 'silver')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .selectAll('.files')
        .data(data)
        .enter()
        .append('g')
        .attr('class', d => `files ${d.features[0].properties.class}`)
        .selectAll('path')
        .data(d => d.features)
        .enter()
        .append('path')
        .attr('d', path);
    })
    .then(() => {
      map.selectAll('.rvrcl')
          .attr('stroke', '#00add2');
      map.selectAll('.railcl')
          .selectAll('path')
          .attr('stroke', v => v.properties.snglDbl === '駅部分' ? 'pink' : 'black');
    })
    .then(() => {
      const attributionSize = {
        font: 12,
        width: 140,
        height: 18
      };
      const attribution = map.append('g');
      attribution.append('rect')
                .attr('x', size.width - attributionSize.width)
                .attr('y', size.height - attributionSize.height)
                .attr('width', attributionSize.width)
                .attr('height', attributionSize.height)
                .attr('fill', 'white')
                .attr('opacity', '0.8');
      attribution.append('text')
                .attr('x', size.width - (attributionSize.width / 2))
                .attr('y', size.height)
                .attr('dy', - (attributionSize.height - attributionSize.font) / 2)
                .attr('fill', 'black')
                .attr('font-size', `${attributionSize.font}px`)
                .attr('text-anchor', 'middle')
                .text('Data: GSI Vector Tiles');
    })
    .then(() => {
      const filename = `${state.output}.svg` ||  `./samples/map_${zoom.view}_${center[0]}_${center[1]}.svg`;

      fs.writeFile(
        `${filename}`,
        document.body.innerHTML,
        err => {
          if (err) throw err;
          console.log('save successful!');
          console.log(`Generated ${filename}!`);
        }
      );
    })
}
