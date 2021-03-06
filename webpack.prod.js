const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

const port = process.env.PORT || 8080;

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: `${__dirname}/public`,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[local]'
              }
            }
          },
          {
            loader: 'sass-loader',
            options: {
              includePaths: [`${__dirname}/src/scss`],
              data: `@import 'variables';`
            }
          }
        ]
      },
      {
        test: /\.(svg|jpg|png)$/,
        use: {
          loader: 'url-loader',
          options: {
            limit: 25000
          }
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico'
    }),
    new DefinePlugin({
      FetchUrl: JSON.stringify('/api/todos')
    })
  ],
  devtool: 'inline-source-map',
  devServer: {
    host: 'localhost',
    port,
    open: true,
    historyApiFallback: true,
    hot: true,
    inline: true
  }
};
