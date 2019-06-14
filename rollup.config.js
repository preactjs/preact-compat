import fs from 'fs';
import memory from 'rollup-plugin-memory';
import buble from 'rollup-plugin-buble';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

let pkg = JSON.parse(fs.readFileSync('./package.json'));

/**
 * The rationale behind marking dependencies as external is because they're likely to already be installed
 * in the client projects and flat bundling them is unnecessary extra code. However preact-context is very
 * new and people are less likely to be using it so we'll bundle it.
 */
let external = Object.keys(pkg.peerDependencies || {}).concat(Object.keys(pkg.dependencies || {}));

let format = process.env.FORMAT === 'es' ? 'es' : 'umd';

export default {
	input: 'src/index.js',
	output: {
		name: pkg.amdName,
		exports: format === 'es' ? null : 'default',
		file: format === 'es' ? pkg.module : pkg.main,
		format,
		globals: {
			'preact': 'preact',
			'prop-types': 'PropTypes'
		},
		sourcemap: true
	},
	external,
	strict: false,
	plugins: [
		format === 'umd' && memory({
			path: 'src/index.js',
			contents: "export { default } from './index';"
		}),
		buble({
			objectAssign: 'extend',
			namedFunctionExpressions: false
		}),
		nodeResolve({
			jsnext: true,
			main: true
		}),
		commonjs({
			include: 'node_modules/**',
			exclude: '**/*.css'
		})
	].filter(Boolean)
};
