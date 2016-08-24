import path from 'path';
import fs from 'fs';
import memory from 'rollup-plugin-memory';
import buble from 'rollup-plugin-buble';
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
		buble({
			objectAssign: 'extend'
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
