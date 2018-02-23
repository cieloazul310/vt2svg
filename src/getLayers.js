const tileSet = {
  rdcl: {
    url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_rdcl/{z}/{x}/{y}.geojson',
    zoom: 16
  },
  railcl: {
    url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_railcl/{z}/{x}/{y}.geojson',
    zoom: 16
  },
  rvrcl: {
    url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_rvrcl/{z}/{x}/{y}.geojson',
    zoom: 16
  },
  fgd: {
    url: 'https://cyberjapandata.gsi.go.jp/xyz/experimental_fgd/{z}/{x}/{y}.geojson',
    zoom: 18
  }
};

module.exports = function(str) {
  const layers = str.split(',');
  return layers.map(str => tileSet[str]);
};
