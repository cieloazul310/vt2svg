const fs = require('fs');
const fetch = require('node-fetch');
const d3 = Object.assign(
  {},
  require('d3-selection'),
  require('d3-geo'),
  require('d3-tile')
);
const jsdom = require('jsdom');

export default function(
  width = 600,
  height = 400,
  lon = 140.475,
  lat = 36.375,
  viewZoom = 16,
  tileset
) {
  const { JSDOM } = jsdom;

  const document = new JSDOM().window.document;

  const tau = 2 * Math.PI;
  const zoom = {
    view: viewZoom,
    tile: 16
  };
  const center = [lon, lat];
  const size = {
    width: width,
    height: height
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
    .attr('xmin', projection.invert([0, 0])[0])
    .attr('xmax', projection.invert([size.width, size.height])[0])
    .attr('ymin', projection.invert([size.width, size.height])[1])
    .attr('ymax', projection.invert([0, 0])[1])
    .attr('scale', projection.scale());

  const tiles = d3
    .tile()
    .size([size.width * zoomReducer, size.height * zoomReducer])
    .scale(projection.scale() * tau * zoomReducer)
    .translate(
      projection([0, 0]).map(function(d) {
        return d * zoomReducer;
      })
    )();

  const fetchJSON = url => {
    return fetch(url)
      .then(response => response.json())
      .catch(() => undefined);
  };

  const rdcls = tiles.map(obj =>
    fetchJSON(
      `https://cyberjapandata.gsi.go.jp/xyz/experimental_rdcl/${obj.z}/${
        obj.x
      }/${obj.y}.geojson`
    )
  );

  const railcls = tiles.map(obj =>
    fetchJSON(
      `https://cyberjapandata.gsi.go.jp/xyz/experimental_railcl/${obj.z}/${
        obj.x
      }/${obj.y}.geojson`
    )
  );

  const tasks = [...rdcls, ...railcls];

  Promise.all(tasks)
    .then(data => {
      return data.filter(d => d !== undefined);
    })
    .then(data => {
      map
        .selectAll('.files')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'files')
        .selectAll('path')
        .data(d => d.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke', 'silver')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round');
    })
    .then(() => {
      fs.writeFile(
        `./dist/${zoom.view}_${center[0]}_${center[1]}.svg`,
        document.body.innerHTML,
        err => {
          if (err) throw err;
          console.log('save successful!');
        }
      );
    });
}
