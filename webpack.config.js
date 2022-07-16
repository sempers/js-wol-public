var path = require("path");
var webpack = require("webpack");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
	entry: "./client/src/main.js",
    output: {
		path: path.resolve(__dirname, "./client/public/app2"),
        publicPath: "./app2/",
		filename: 'build.js'
	},
	watch: true,
	watchOptions: {
		aggregateTimeout: 200,
		poll: 1000,
	},
	externals: {
		$: "jQuery",
		_: "_",
		firebase: "firebase",
		moment: "moment",
		toastr: "toastr",
		d3: "d3",
		UAParser: "UAParser",
		csv: "csv",
	},	
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: "vue-loader",
				options: {
					loaders: {
						less: "vue-style-loader!css-loader!less-loader",
					},
				},
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: "babel-loader",
					options: {
						plugins: ["@babel/plugin-proposal-optional-chaining"],
						presets: ["@babel/preset-env"],
					},
				},
			},
			{
				test: /\.css$/,
				use: ["vue-style-loader", "css-loader"],
			},
			{
				test: /\.less$/,
				use: ["vue-style-loader", "css-loader", "less-loader"],
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				loader: "file-loader",
				options: {
					outputPath: "img",
					esModule: false,
					name: "[name].[ext]",
				},
			},
		],
	},
	resolve: { alias: { vue: "vue/dist/vue.esm.js" } },
	//devtool: "source-map",
	plugins: [
		new webpack.LoaderOptionsPlugin({
            minimize: false
        })
	],
};
