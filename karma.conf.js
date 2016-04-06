var path = require('path');

module.exports = function(config) {
	config.set({
		frameworks: ['mocha', 'chai-sinon'],
		reporters: ['mocha'],

		browsers: ['PhantomJS'],

		files: [
			require.resolve('es5-shim'),
			'test/**/*.js'
		],

		preprocessors: {
			'test/**/*.js': ['webpack'],
			'src/**/*.js': ['webpack'],
			'**/*.js': ['sourcemap']
		},

		webpack: {
			module: {
				loaders: [
					{
						test: /\.jsx?$/,
						exclude: /node_modules/,
						loader: 'babel',
						query: {
							sourceMap: 'inline',
							presets: ['es2015-loose', 'stage-0', 'react'],
							plugins: [
								'transform-object-rest-spread'
							]
						}
					}
				]
			},
			resolve: {
				modulesDirectories: [__dirname, 'node_modules'],
				alias: {
					src: __dirname+'/src'
				}
			}
		},

		webpackMiddleware: {
			noInfo: true
		}
	});
};
