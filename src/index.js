import PropTypes from 'proptypes';
import SVG from 'preact-svg';
import { render as preactRender, h, Component as PreactComponent, hooks } from 'preact';


const ELEMENTS = 'a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr circle clipPath defs ellipse g image line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan'.split(' ');

const REACT_ELEMENT_TYPE = (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) || 0xeac7;

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

/*global process*/
const DEV = typeof process!=='undefined' && process.env && process.env.NODE_ENV!=='production';

// a component that renders nothing. Used to replace components for unmountComponentAtNode.
const EmptyComponent = () => null;



// make react think we're react.
let VNode = h('').constructor;
VNode.prototype.$$typeof = REACT_ELEMENT_TYPE;

Object.defineProperty(VNode.prototype, 'type', {
	get() { return this.nodeName; },
	set(v) { this.nodeName = v; }
});

Object.defineProperty(VNode.prototype, 'props', {
	get() { return this.attributes; },
	set(v) { this.attributes = v; }
});



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
		preactRender(h(EmptyComponent), container, existing);
		return true;
	}
	return false;
}



const ARR = [];

// This API is completely unnecessary for Preact, so it's basically passthrough.
let Children = {
	map(children, fn, ctx) {
		children = Children.toArray(children);
		if (ctx && ctx!==children) fn = fn.bind(ctx);
		return children.map(fn);
	},
	forEach(children, fn, ctx) {
		children = Children.toArray(children);
		if (ctx && ctx!==children) fn = fn.bind(ctx);
		children.forEach(fn);
	},
	count(children) {
		children = Children.toArray(children);
		return children.length;
	},
	only(children) {
		children = Children.toArray(children);
		if (children.length!==1) throw new Error('Children.only() expects only one child.');
		return children[0];
	},
	toArray(children) {
		return Array.isArray && Array.isArray(children) ? children : ARR.concat(children);
	}
};


/** Track current render() component for ref assignment */
let currentComponent;


function createFactory(type) {
	return (...args) => createElement(type, ...args);
}


let DOM = {};
for (let i=ELEMENTS.length; i--; ) {
	DOM[ELEMENTS[i]] = createFactory(ELEMENTS[i]);
}


function createElement(...args) {
	let vnode = h(...args);

	if (vnode.nodeName==='svg') {
		vnode.nodeName = SVG;
	}

	applyClassName(vnode);

	let ref = vnode.attributes && vnode.attributes.ref;
	if (currentComponent && ref && typeof ref==='string') {
		vnode.attributes.ref = createStringRefProxy(ref, currentComponent);
	}

	return vnode;
}


function cloneElement(element, props, ...children) {
	return createElement(
		element.nodeName || element.type,
		extend({}, element.attributes || element.props || {}, props),
		...children
	);
}


function isValidElement(element) {
	return element && ((element instanceof VNode) || element.$$typeof===REACT_ELEMENT_TYPE);
}


function createStringRefProxy(name, component) {
	return component._refProxies[name] || (component._refProxies[name] = resolved => {
		if (component && component.refs) {
			component.refs[name] = resolved;
			if (resolved===null) {
				delete component._refProxies[name];
				component = null;
			}
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
		extend(this, obj);
		Component.call(this, props, context, BYPASS_HOOK);
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
	if (!props) return;

	// React annoyingly special-cases single children, and some react components are ridiculously strict about this.
	let c = props.children;
	if (c && c.length===1) {
		props.children = c[0];

		// but its totally still going to be an Array.
		if (props.children && typeof props.children==='object') {
			props.children.length = 1;
			props.children[0] = props.children;
		}
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

Component.prototype.isReactComponent = {}



export { DOM, PropTypes, Children, render, createClass, createFactory, createElement, cloneElement, isValidElement, findDOMNode, unmountComponentAtNode, Component };
export default { DOM, PropTypes, Children, render, createClass, createFactory, createElement, cloneElement, isValidElement, findDOMNode, unmountComponentAtNode, Component };
