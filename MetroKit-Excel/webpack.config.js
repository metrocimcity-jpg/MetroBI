"use strict";

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const devCerts = require("office-addin-dev-certs");

async function httpsOptions() {
    const https = await devCerts.getHttpsServerOptions();
    return { ca: https.ca, key: https.key, cert: https.cert };
}

module.exports = async (env, options) => {
    return {
        devtool: "source-map",
        entry: {
            taskpane: "./src/taskpane.ts",
            content: "./src/content.ts",
            commands: "./src/commands.ts"
        },
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "[name].js",
            clean: true
        },
        resolve: {
            extensions: [".ts", ".js"],
            fallback: {
                fs: false,
                path: false,
                crypto: false
            }
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    exclude: /node_modules/,
                    use: "ts-loader"
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env.NODE_DEBUG": JSON.stringify(false)
            }),
            new HtmlWebpackPlugin({
                filename: "taskpane.html",
                template: "./src/taskpane.html",
                chunks: ["taskpane"]
            }),
            new HtmlWebpackPlugin({
                filename: "content.html",
                template: "./src/content.html",
                chunks: ["content"]
            }),
            new HtmlWebpackPlugin({
                filename: "commands.html",
                template: "./src/commands.html",
                chunks: ["commands"]
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: "assets", to: "assets" },
                    { from: "manifest.xml", to: "manifest.xml" },
                    { from: "manifest-content.xml", to: "manifest-content.xml" }
                ]
            })
        ],
        performance: {
            hints: false
        },
        optimization: {
            runtimeChunk: false
        },
        devServer: {
            static: {
                directory: path.resolve(__dirname, "dist")
            },
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            allowedHosts: "all",
            server: {
                type: "https",
                options: env.WEBPACK_BUILD || options.https !== undefined
                    ? options.https
                    : await httpsOptions()
            },
            port: Number(process.env.npm_package_config_dev_server_port) || 3000,
            hot: true,
            historyApiFallback: true
        }
    };
};
