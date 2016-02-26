import PropTypes from 'proptypes';
import { render as preactRender, h, Component as PreactComponent, hooks } from 'preact';


const REACT_ELEMENT_TYPE = (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) || 0xeac7;

// make react think we're react.
let VNode = h('').constructor;
VNode.prototype.$$typeof = REACT_ELEMENT_TYPE;


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


const BYPASS_HOOK = {};


const DEV = !isProd();

function isProd() {
	let prod;
	/*global process*/
	try { prod = process.env.NODE_ENV==='production'; } catch (e) {}
	return !!prod;
}


const EmptyComponent = () => null;


// proxy render() since React returns a Component reference.
function render(vnode, parent, callback) {
	let prev = parent._preactCompatRendered;
	if (prev && prev.parentNode!==parent) prev = null;
	let out = preactRender(vnode, parent, prev);
	parent._preactCompatRendered = out;
	if (typeof callback==='function') callback();
	return out && out._component;
}


function unmountComponentAtNode(container) {
	let existing = container._preactCompatRendered;
	if (existing && existing.parentNode===container) {
		preactRender(<EmptyComponent />, container, existing);
		return true;
	}
	return false;
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


/** Track current render() component for ref assignment */
let currentComponent;


function createElement(...args) {
	let vnode = h(...args);
	applyClassName(vnode);

	let ref = vnode.attributes && vnode.attributes.ref;
	if (currentComponent && ref && typeof ref==='string') {
		let fn = createStringRefProxy(ref, currentComponent);
		vnode.attributes.ref = fn;
	}

	return vnode;
}


function createStringRefProxy(name, component) {
	return component._refProxies[name] || (component._refProxies[name] = resolved => {
		component.refs[name] = resolved;
		if (resolved===null) {
			delete component._refProxies[name];
			component = null;
		}
	});
}


function applyClassName({ attributes }) {
	if (!attributes) return;
	let cl = attributes.className || attributes.class;
	if (cl) attributes.className = cl;
}


function extend(base, ...objs) {
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
}


let findDOMNode = component => component.base || component;


function F(){}

function createClass(obj) {
	let cl = function(props, context) {
		Component.call(this, props, context, BYPASS_HOOK);
		extend(this, obj);
		bindAll(this);
		newComponentHook.call(this, props, context);
	};

	if (obj.propTypes) {
		cl.propTypes = obj.propTypes;
	}
	if (obj.defaultProps) {
		cl.defaultProps = obj.defaultProps;
	}
	if (obj.getDefaultProps) {
		cl.defaultProps = obj.getDefaultProps();
	}

	F.prototype = Component.prototype;
	cl.prototype = new F();
	cl.prototype.constructor = cl;

	cl.displayName = obj.displayName || 'Component';

	return cl;
}


function bindAll(ctx) {
	/*eslint guard-for-in:0*/
	for (let i in ctx) {
		let v = ctx[i];
		if (typeof v==='function' && !v.__bound && !AUTOBIND_BLACKLIST.hasOwnProperty(i)) {
			(ctx[i] = v.bind(ctx)).__bound = true;
		}
	}
}


function callMethod(ctx, m, args) {
	if (typeof m==='string') {
		m = ctx.constructor.prototype[m];
	}
	if (typeof m==='function') {
		return m.apply(ctx, args);
	}
}

function multihook(...hooks) {
	return function(...args) {
		let ret;
		for (let i=0; i<hooks.length; i++) {
			let r = callMethod(this, hooks[i], args);
			if (r!==undefined) ret = r;
		}
		return ret;
	};
}


function newComponentHook(props, context) {
	propsHook.call(this, props, context);
	this.componentWillReceiveProps = multihook(this.componentWillReceiveProps || 'componentWillReceiveProps', propsHook);
	this.render = multihook(beforeRender, this.render || 'render', afterRender);
}


function propsHook(props) {
	// let defaultProps = this.defaultProps || this.constructor.defaultProps;
	// if (defaultProps) {
	// 	props = extend({}, defaultProps, props);
	// }

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


function beforeRender() {
	currentComponent = this;
}

function afterRender() {
	if (currentComponent===this) {
		currentComponent = null;
	}
}



class Component extends PreactComponent {
	constructor(props, context, opts) {
		super(props, context);
		this.refs = {};
		this._refProxies = {};
		if (opts!==BYPASS_HOOK) {
			newComponentHook.call(this, props, context);
		}
	}

	getDOMNode() {
		return this.base;
	}

	isMounted() {
		return !!this.base;
	}
}



export { PropTypes, Children, render, createClass, createElement, findDOMNode, unmountComponentAtNode, Component };
export default { PropTypes, Children, render, createClass, createElement, findDOMNode, unmountComponentAtNode, Component };
