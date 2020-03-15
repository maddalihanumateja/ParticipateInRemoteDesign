const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const args = process.argv.slice(2);
const https = args[2] === '--https' && args[3] === 'true';

module.exports = {
    devtool: 'eval',
    entry: {
        index:'./src/js/index.js'
    },
    output: {
        path: path.resolve(__dirname, '/dist'),
        publicPath: '/dist',
        hashDigestLength: 5,
        // filename: `zoom-meeting-${buildVersion}-[name]-[chunkhash].min.js`,
        filename: '[name].min.js'
    },
    module: {
        rules: [
            {
                test: /.\/src\/js\/\.jsx?$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            },
            {
                test: /.\/src\/css\/\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /.\/src\/img\/\.(jpg|png|svg)$/,
                loader: 'url-loader?limit=500000'
            },
            {
                test: /.\/src\/fonts\/\.(ttf|eot|woff|woff2|svg)$/,
                loader: 'url-loader?limit=50000'
            },
            {
                test: /.\/src\/css\/\.scss$/,
                loader: 'style!css!sass'
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    externals: {
        'babel-polyfill': 'babel-polyfill',
        react: 'React',
        'react-dom': 'ReactDOM',
        redux: 'Redux',
        'redux-thunk': 'ReduxThunk',
        lodash: {
            commonjs: 'lodash',
            amd: 'lodash',
            root: '_',
            var: '_'
        }
    },
    context: __dirname,
    target: 'web',
    devServer: {
        contentBase: './dist',
    },
    mode: 'development',
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            'process.env.BABEL_ENV': JSON.stringify('development')
        })
    ],
};
