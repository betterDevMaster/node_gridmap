const sharp = require('sharp');

const DEFAULT_PATH = process.cwd();

sharp(DEFAULT_PATH+'/html/images/land-low.jpg')
  .png()
  .tile({
    size: 512
  })
  .toFile(DEFAULT_PATH+'/tiles/output.dz', function(err, info) {
    // output.dzi is the Deep Zoom XML definition
    // output_files contains 512x512 tiles grouped by zoom level
  });