const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")

const sourcePath = path.resolve("./src")
const outputPath = path.resolve("./www")

module.exports = () => {
  console.log("=================================")
  console.log(`STARTING PLAYGROUND`)
  console.log("=================================")

  return {
    mode: "development",
    devServer: {
      contentBase: outputPath,
      compress: true,
      port: 3001,
      historyApiFallback: true,
      writeToDisk: true,
    },
    entry: {
      app: path.join(sourcePath, "index.tsx"),
    },
    output: {
      filename: "[name].js",
      path: outputPath,
      publicPath: "/",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".scss"], // search for files ending with these extensions when importing
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader", // compile typescript
        },
        {
          test: /\.(jpg|ttf|svg|woff2?|eot|png|mp4|mp3)$/, // add extensions for new file types here
          use: {
            loader: "file-loader", // copy files to proxy and update paths to be absolute
            options: {
              name: "[name].[ext]",
              outputPath: "assets/",
              publicPath: "/assets",
            },
          },
        },
        {
          test: /\.s?css$/,
          use: [
            "style-loader",
            "css-loader", // turn url() and @import calls into require
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [require("autoprefixer")],
                },
              },
            },
            "sass-loader", // compile sass
          ],
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: "javascript/auto",
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: `API Hooks Playground - testing only`,
        template: path.join(sourcePath, "index.html.ejs"),
        files: {
          js: ["[name].js"],
          css: ["[name].css"],
          chunks: {
            head: {
              css: "[name].css",
            },
            main: {
              entry: "[name].js",
            },
          },
        },
      }),
    ],
    devtool: "eval",
  }
}
