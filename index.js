var through = require('through2');
var stylecow = require('stylecow');
var gutil = require('gulp-util');
var applySourceMap = require('vinyl-sourcemaps-apply');
var PluginError = gutil.PluginError;
var path = require('path');

module.exports = function (config) {

  if (config.support) {
      stylecow.minSupport(config.support);
  }

  if (config.plugins) {
      config.plugins.forEach(function (plugin) {
          stylecow.loadPlugin(plugin);
      });
  }

  if (config.modules) {
      config.modules.forEach(function (module) {
          stylecow.loadNpmModule(module);
      });
  }

  function transform(file, enc, cb) {
    if (file.isNull()) return cb(null, file); 
    if (file.isStream()) return cb(new PluginError('gulp-stylecow', 'Streaming not supported'));

    stylecow.cwd(path.dirname(file.path));

    var css = stylecow.parseFile(file.path);
      
    stylecow.run(css);

    var code = new stylecow.Coder(css, {
      sourceMap: file.map,
      file: file.output,
      style: config.code
    });

    if (file.output) {
      code.save();
    }

    if (code.map && file.sourceMap) {
      code.map.file = file.sourceMap.file;
      applySourceMap(file, code.map);
    }

    file.contents = new Buffer(code.code);
    cb(null, file);
  }

  return through.obj(transform);
};
