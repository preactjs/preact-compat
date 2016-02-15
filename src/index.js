import PropTypes from 'proptypes';
import { render as preactRender, h, Component as PreactComponent, hooks } from 'preact';


// don't autobind these methods since they already have guaranteed context.
const AUTOBIND_BLACKLIST = {
	constructor: 1,
	render: 1,
	shouldComponentUpdate: 1,
	componentWillRecieveProps: 1,
	componentWillUpdate: 1,
	componentDidUpdate: 1,
	componentWillMount: 1,
	componentDidMount: 1,
	componentWillUnmount: 1,
	componentDidUnmount: 1
};


const DEV = !isProd();

function isProd() {
	let prod;
	try { prod = process.env.NODE_ENV==='production'; } catch(e) {}
	return !!prod;
}


// proxy render() since React returns a Component reference.
function render(vnode, parent, callback) {
	let out = preactRender(vnode, parent);
	if (typeof callback==='function') callback();
	return out && out._component;
}


// This API is completely unnecessary for Preact, so it's basically passthrough.
let Children = {
	map(children, fn, ctx) {
		if (ctx && ctx!==children) fn = fn.bind(ctx);
		return children.map(fn);
	},
	forEach(children, fn, ctx) {
		if (ctx && ctx!==children) fn = fn.bind(ctx);
		children.forEach(fn);
	},
	count(children) {
		return children.length;
	},
	only(children) {
		if (children.length!==1) throw new Error('Children.only() expects only one child.');
		return children[0];
	},
	toArray(children) {
		return children;
	}
};


let createElement = (...args) => {
	let vnode = h(...args);
	applyClassName(vnode);
	return vnode;
};


let applyClassName = ({ attributes }) => {
	if (!attributes) return;
	let cl = attributes.className || attributes.class;
	if (cl) attributes.className = cl;
};


let extend = (base, ...objs) => {
	for (let i=0; i<objs.length; i++) {
		for (let key in objs[i]) {
			if (objs[i].hasOwnProperty(key)) {
				let v = objs[i][key];
				if (v!==null && v!==undefined) {
					base[key] = v;
				}
			}
		}
	}
	return base;
};


let findDOMNode = component => component.base || component;


function F(){}

let createClass = obj => {
	let cl = function() {
		Component.call(this);
		extend(this, obj);
		bindAll(this);
	};
	F.prototype = Component.prototype;
	cl.prototype = new F();
	cl.prototype.constructor = cl;
	return cl;
};

let bindAll = ctx => {
	for (let i in ctx) {
		let v = ctx[i];
		if (typeof v==='function' && !v.__bound && !AUTOBIND_BLACKLIST.hasOwnProperty(i)) {
			(ctx[i] = v.bind(ctx)).__bound = true;
		}
	}
};


class Component extends PreactComponent {
	constructor(...args) {
		super(...args);
		this._stateUpdateCallbacks = [];
	}

	getDOMNode() {
		return this.base;
	}

	setState(state, callback) {
		super.setState(state);
		if (typeof callback==='function') {
			this._stateUpdateCallbacks.push(callback);
			callback();
		}
	}

	componentWillReceiveProps(props) {
		let defaultProps = this.defaultProps || this.constructor.defaultProps;
		if (defaultProps) {
			props = extend({}, defaultProps, props);
		}

		// add proptype checking
		if (DEV) {
			let propTypes = this.propTypes || this.constructor.propTypes;
			if (propTypes) {
				for (let prop in propTypes) {
					if (propTypes.hasOwnProperty(prop) && typeof propTypes[prop]==='function') {
						let err = propTypes[prop](props, prop, this.constructor.name, 'prop');
						if (err) throw err;
					}
				}
			}
		}
	}

	_render(...args) {
		let ret = super._render(...args);

		if (this.props.ref && this.base.getAttribute('ref')!==this.props.ref) {
			this.base.setAttribute('ref', this.props.ref);
		}

		// add refs
		let refs = this.base.querySelectorAll('[ref]');
		this.refs = {};
		for (let i=refs.length; i--; ) {
			this.refs[refs[i].getAttribute('ref')] = refs[i]._component || refs[i];
		}

		let cb = this._stateUpdateCallbacks;
		if (cb) {
			this._stateUpdateCallbacks = [];
			for (let i=0; i<cb.length; i++) cb[i]();
		}

		return ret;
	}
}


export { PropTypes, Children, render, createClass, createElement, findDOMNode, Component };
export default { PropTypes, Children, render, createClass, createElement, findDOMNode, Component };
