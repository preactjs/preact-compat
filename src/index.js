import PropTypes from 'proptypes';
import { render as preactRender, cloneElement as preactCloneElement, h, Component as PreactComponent, options } from 'preact';

const version = '15.1.0'; // trick libraries to think we are react

const ELEMENTS = 'a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption cite code col colgroup data datalist dd del details dfn dialog div dl dt em embed fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins kbd keygen label legend li link main map mark menu menuitem meta meter nav noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small source span strong style sub summary sup table tbody td textarea tfoot th thead time title tr track u ul var video wbr circle clipPath defs ellipse g image line linearGradient mask path pattern polygon polyline radialGradient rect stop svg text tspan'.split(' ');

const REACT_ELEMENT_TYPE = (typeof Symbol === 'function' && Symbol.for && Symbol.for('react.element')) || 0xeac7;

// don't autobind these methods since they already have guaranteed context.
const AUTOBIND_BLACKLIST = {
	constructor: 1,
	render: 1,
	shouldComponentUpdate: 1,
	componentWillReceiveProps: 1,
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
	set(v) { this.nodeName = v; },
	configurable:true
});

Object.defineProperty(VNode.prototype, 'props', {
	get() { return this.attributes; },
	set(v) { this.attributes = v; },
	configurable:true
});


let oldVnodeHook = options.vnode || EmptyComponent;
options.vnode = vnode => {
	let a = vnode.attributes;
	if (!a) a = vnode.attributes = {};
	// clone if needed (fixes #105):
	if (Object.isExtensible && !Object.isExtensible(a)) {
		a = extend({}, a, true);
	}
	a.children = vnode.children;
	oldVnodeHook(vnode);
};



// proxy render() since React returns a Component reference.
function render(vnode, parent, callback) {
	let prev = parent._preactCompatRendered;
	if (prev && prev.parentNode!==parent) prev = null;
	let out = preactRender(vnode, parent, prev);
	parent._preactCompatRendered = out;
	if (typeof callback==='function') callback();
	return out && out._component || out.base;
}


class ContextProvider {
	getChildContext() {
		return this.props.context;
	}
	render(props) {
		return props.children[0];
	}
}

function renderSubtreeIntoContainer(parentComponent, vnode, container, callback) {
	let c = render((
		<ContextProvider context={parentComponent.context}>
			{vnode}
		</ContextProvider>
	), container);
	if (callback) callback(c);
	return c;
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
	return createElement.bind(null, type);
}


let DOM = {};
for (let i=ELEMENTS.length; i--; ) {
	DOM[ELEMENTS[i]] = createFactory(ELEMENTS[i]);
}

function upgradeToVNodes(arr, offset) {
	for (let i=offset || 0; i<arr.length; i++) {
		let obj = arr[i];
		if (Array.isArray(obj)) {
			upgradeToVNodes(obj);
		}
		else if (obj && typeof obj==='object' && !isValidElement(obj) && ((obj.props && obj.type) || (obj.attributes && obj.nodeName) || obj.children)) {
			arr[i] = createElement(obj.type || obj.nodeName, obj.props || obj.attributes, obj.children);
		}
	}
}

function isStatelessComponent(c) {
	return typeof c==='function' && !(c.prototype && c.prototype.render);
}


const COMPONENT_WRAPPER_KEY = typeof Symbol!=='undefined' ? Symbol.for('__preactCompatWrapper') : '__preactCompatWrapper';

// wraps stateless functional components in a PropTypes validator
function wrapStatelessComponent(WrappedComponent) {
	return function StatelessComponent(props, context) {
		propsHook.call(WrappedComponent, props, context);
		return WrappedComponent(props, context);
	};
}


function statelessComponentHook(Ctor) {
	let Wrapped = Ctor[COMPONENT_WRAPPER_KEY];
	if (Wrapped) return Wrapped===true ? Ctor : Wrapped;

	Wrapped = wrapStatelessComponent(Ctor);

	Object.defineProperty(Wrapped, COMPONENT_WRAPPER_KEY, { configurable:true, value:true });
	Wrapped.displayName = Ctor.displayName;
	Wrapped.propTypes = Ctor.propTypes;
	Wrapped.defaultProps = Ctor.defaultProps;

	Object.defineProperty(Ctor, COMPONENT_WRAPPER_KEY, { configurable:true, value:Wrapped });

	return Wrapped;
}


function createElement(...args) {
	upgradeToVNodes(args, 2);
	let vnode = h(...args);

	applyClassName(vnode);

	if (isStatelessComponent(vnode.nodeName)) {
		vnode.nodeName = statelessComponentHook(vnode.nodeName);
	}

	let ref = vnode.attributes && vnode.attributes.ref,
		type = ref && typeof ref;
	if (currentComponent && (type==='string' || type==='number')) {
		vnode.attributes.ref = createStringRefProxy(ref, currentComponent);
	}

	applyEventNormalization(vnode);

	return vnode;
}


function cloneElement(element, props, ...children) {
	let node = h(
		element.nodeName || element.type,
		element.attributes || element.props,
		element.children || element.props.children
	);
	return preactCloneElement(node, props, ...children);
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


function applyEventNormalization({ nodeName, attributes }) {
	if (!attributes || typeof nodeName!=='string') return;
	let props = {};
	for (let i in attributes) {
		props[i.toLowerCase()] = i;
	}
	if (props.onchange) {
		nodeName = nodeName.toLowerCase();
		let attr = nodeName==='select' ? 'onchange' : 'oninput';
		if (nodeName==='input' && String(attributes.type).toLowerCase()==='checkbox') attr = 'onclick';
		attributes[props[attr] || attr] = multihook(attributes[props[attr]], attributes[props.onchange]);
	}
}


function applyClassName({ attributes }) {
	if (!attributes) return;
	let cl = attributes.className || attributes.class;
	if (cl) attributes.className = cl;
}


function extend(base, props, all) {
	for (let key in props) {
		if (all===true || props[key]!=null) {
			base[key] = props[key];
		}
	}
	return base;
}


let findDOMNode = component => component && component.base || component;


function F(){}

function createClass(obj) {
	let mixins = obj.mixins && collateMixins(obj.mixins);

	function cl(props, context) {
		extend(this, obj);
		if (mixins) applyMixins(this, mixins);
		Component.call(this, props, context, BYPASS_HOOK);
		bindAll(this);
		newComponentHook.call(this, props, context);
	}

	if (obj.statics) {
		extend(cl, obj.statics);
	}
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


// Flatten an Array of mixins to a map of method name to mixin implementations
function collateMixins(mixins) {
	let keyed = {};
	for (let i=0; i<mixins.length; i++) {
		let mixin = mixins[i];
		for (let key in mixin) {
			if (mixin.hasOwnProperty(key) && typeof mixin[key]==='function') {
				(keyed[key] || (keyed[key]=[])).push(mixin[key]);
			}
		}
	}
	return keyed;
}


// apply a mapping of Arrays of mixin methods to a component instance
function applyMixins(inst, mixins) {
	for (let key in mixins) if (mixins.hasOwnProperty(key)) {
		inst[key] = multihook(...mixins[key].concat(inst[key] || key));
	}
}


function bindAll(ctx) {
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

function multihook() {
	let hooks = arguments;
	return function() {
		let ret;
		for (let i=0; i<hooks.length; i++) {
			let r = callMethod(this, hooks[i], arguments);
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


function propsHook(props, context) {
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
		let ctor = typeof this==='function' ? this : this.constructor,
			propTypes = this.propTypes || ctor.propTypes;
		if (propTypes) {
			for (let prop in propTypes) {
				if (propTypes.hasOwnProperty(prop) && typeof propTypes[prop]==='function') {
					const displayName = this.displayName || ctor.name;
					let err = propTypes[prop](props, prop, displayName, 'prop');
					if (err) console.error(new Error(err.message || err));
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



function Component(props, context, opts) {
	PreactComponent.call(this, props, context);
	this.refs = {};
	this._refProxies = {};
	if (opts!==BYPASS_HOOK) {
		newComponentHook.call(this, props, context);
	}
}
Component.prototype = new PreactComponent();
extend(Component.prototype, {
	constructor: Component,

	isReactComponent: {},

	getDOMNode() {
		return this.base;
	},

	isMounted() {
		return !!this.base;
	}
});



export {
	version,
	DOM,
	PropTypes,
	Children,
	render,
	createClass,
	createFactory,
	createElement,
	cloneElement,
	isValidElement,
	findDOMNode,
	unmountComponentAtNode,
	Component,
	renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer
};

export default {
	version,
	DOM,
	PropTypes,
	Children,
	render,
	createClass,
	createFactory,
	createElement,
	cloneElement,
	isValidElement,
	findDOMNode,
	unmountComponentAtNode,
	Component,
	unstable_renderSubtreeIntoContainer: renderSubtreeIntoContainer
};
