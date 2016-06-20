import path from 'path';
import fs from 'fs';
import memory from 'rollup-plugin-memory';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

let pkg = JSON.parse(fs.readFileSync('./package.json'));

let external = Object.keys(pkg.peerDependencies || {}).concat(Object.keys(pkg.dependencies || {}));

export default {
	entry: 'src/index.js',
	dest: pkg.main,
	sourceMap: path.resolve(pkg.main),
	moduleName: pkg.amdName,
	format: 'umd',
	exports: 'default',
	useStrict: false,
	external,
	globals: {
		'preact-svg': 'preactSvg'
	},
	plugins: [
		memory({
			path: 'src/index.js',
			contents: "export { default } from './index';"
		}),
		babel({
			babelrc: false,
			comments: false,
			exclude: 'node_modules/**',
			presets: [
				'es2015-minimal-rollup',
				'stage-0',
				'react'
			],
			plugins: [
				'transform-class-properties'
			]
		}),
		nodeResolve({
			jsnext: true,
			main: true,
			skip: external
		}),
		commonjs({
			include: 'node_modules/**',
			exclude: '**/*.css'
		})
	]
};
