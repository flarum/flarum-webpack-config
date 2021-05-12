const fs = require('fs');
const path = require('path');

export default function (options = {}) {
  return {
    // Set up entry points for each of the forum + admin apps, but only
    // if they exist.
    entry: (function () {
      const entries = {};

      for (const app of ['forum', 'admin']) {
        const file = path.resolve(process.cwd(), app + '.js');
        if (fs.existsSync(file)) {
          entries[app] = file;
        }
      }

      return entries;
    })(),

    module: {
      rules: [
        {
          test: /\.js$/,
          use: [
            {
              loader: path.resolve(__dirname, './autoExportLoader.js'),
            },
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      loose: true,
                    },
                  ],
                  ['@babel/preset-react'],
                ],
                plugins: [
                  ['@babel/plugin-transform-runtime', { useESModules: true }],
                  ['@babel/plugin-proposal-class-properties', { loose: true }],
                  ['@babel/plugin-proposal-private-methods', { loose: true }],
                  ['@babel/plugin-transform-react-jsx', { pragma: 'm' }],
                ],
              },
            }
          ]
        },
      ],
    },

    output: {
      path: path.resolve(process.cwd(), 'dist'),
      library: 'module.exports',
      libraryTarget: 'assign',
      devtoolNamespace: require(path.resolve(process.cwd(), 'package.json')).name,
    },

    externals: [
      {
        jquery: 'jQuery',
      },

      function ({ context, request }, cb) {
        let namespace;
        let id;
        let matches;
        if ((matches = /^flarum\/(.+)$/.exec(request))) {
          namespace = 'core';
          id = matches[1];
        } else if ((matches = /^ext:([^\/]+)\/(?:flarum-(?:ext-)?)?([^\/]+)(?:\/(.+))?$/.exec(request))) {
          namespace = `${matches[1]}-${matches[2]}`;
          id = matches[3];
        } else {
          return cb();
        }

        return cb(null, `window.flreg.get('${namespace}', '${id}')`);
      },
    ],

    devtool: 'source-map',
  };
};
