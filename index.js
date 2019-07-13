const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

const plugins = [new FriendlyErrorsPlugin()];

if (process.env.NODE_ENV === 'production') {
    plugins.push(
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: '"production"',
            },
        }),
        new webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            compress: {
                warnings: false,
            },
        }),
        new webpack.LoaderOptionsPlugin({
            minimize: true,
        })
    );
}

if (process.argv.includes('--analyze')) {
    plugins.push(new (require('webpack-bundle-analyzer')).BundleAnalyzerPlugin());
}

module.exports = (options = {}) => {
    const cwd = process.cwd();
    const tsLoaderOptions = Object.assign(
        {},
        {
            baseUrl: cwd,
            typeRoots: [`${cwd}/node_modules/@types/`],
        },
        options.ts || {}
    );

    return {
        devtool: 'source-map',

        watchOptions: {
            aggregateTimeout: 300,
            poll: 1000,
        },

        // Set up entry points for each of the forum + admin apps, but only
        // if they exist.
        entry: (function() {
            const entries = {};

            for (const app of ['forum', 'admin']) {
                const file = path.resolve(process.cwd(), app + '.js');
                if (fs.existsSync(file)) {
                    entries[app] = file;
                }
            }

            return entries;
        })(),

        output: {
            path: path.resolve(process.cwd(), './dist'),
            publicPath: '/dist/',
            library: 'module.exports',
            libraryTarget: 'assign',
            devtoolNamespace: require(path.resolve(process.cwd(), 'package.json')).name,
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    // exclude: /node_modules/,
                    options: {
                        configFile: `${__dirname}/tsconfig.json`,
                        compilerOptions: tsLoaderOptions,
                    },
                },
                {
                    enforce: 'pre',
                    test: /\.js$/,
                    loader: 'source-map-loader',
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules\/(?!babel-runtime)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        modules: false,
                                        loose: true,
                                        targets: {
                                            browsers: ['> 1%', 'last 2 versions', 'not ie <= 8', 'ie >= 11'],
                                        },
                                    },
                                ],
                                ['@babel/preset-react'],
                            ],
                            plugins: [
                                ['@babel/plugin-transform-runtime', { useESModules: true }],
                                ['@babel/plugin-proposal-class-properties'],
                                ['@babel/plugin-transform-react-jsx', { pragma: 'm' }],
                                ['@babel/plugin-transform-object-assign'],
                                ['@babel/plugin-syntax-dynamic-import'],
                            ],
                        },
                    },
                },
            ],
        },

        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.json'],
        },

        externals: [
            {
                jquery: 'jQuery',
                mithril: 'm',
            },

            (function() {
                const externals = {};

                if (options.useExtensions) {
                    for (const extension of options.useExtensions) {
                        externals['@' + extension] = externals['@' + extension + '/forum'] = externals['@' + extension + '/admin'] =
                            "flarum.extensions['" + extension + "']";
                    }
                }

                return externals;
            })(),

            // Support importing old-style core modules.
            function(context, request, callback) {
                const matches = /^flarum\/(.+?)(?:\/(.+))?$/.exec(request);

                if (matches) {
                    const lib = matches[2] ? `flarum.core.compat['${matches[2]}']` : 'flarum.core.compat';

                    return callback(null, `root ${lib}`);
                }

                callback();
            },
        ],

        plugins,
    };
};
