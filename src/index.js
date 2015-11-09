import PropTypes from 'proptypes';
import { render, h, Component as PreactComponent, hooks } from 'preact';


const DEV = !process || !process.env || process.env.NODE_ENV!=='production';


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

	setProps(props, opts) {
		let defaultProps = this.defaultProps || this.constructor.defaultProps;
		if (defaultProps) {
			props = extend({}, defaultProps, props);
		}

		// add proptype checking
		if (DEV) {
			let propTypes = this.propTypes || this.constructor.propTypes;
			if (propTypes) {
				for (let prop in propTypes) {
					if (propTypes.hasOwnProperty(prop)) {
						let err = propTypes[prop](props, prop, this.constructor.name, 'prop');
						if (err) throw err;
					}
				}
			}
		}

		return super.setProps(props, opts);
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


export { PropTypes, render, createElement, findDOMNode, Component };
export default { PropTypes, render, createElement, findDOMNode, Component };
