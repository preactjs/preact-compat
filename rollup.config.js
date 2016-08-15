import fs from 'fs';
import memory from 'rollup-plugin-memory';
import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

let pkg = JSON.parse(fs.readFileSync('./package.json'));

let external = Object.keys(pkg.peerDependencies || {}).concat(Object.keys(pkg.dependencies || {}));

export default {
	entry: 'src/index.js',
	sourceMap: true,
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
				['es2015', { loose:true, modules:false }],
				'stage-0'
			],
			plugins: [
				['transform-react-jsx', {pragma:'h'}]
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
	],
	targets: [
		{ dest: pkg.main, format: 'umd', moduleName: pkg.amdName },
		{ dest: pkg.module, format: 'es' }
	]
};
