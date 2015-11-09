import PropTypes from 'proptypes';
import { render, h, Component, hooks } from 'preact';

let createElement = h;

// make className work like React's
let oldHook = hooks.vnode;

hooks.vnode = vnode => {
	if (oldHook) vnode = oldHook(vnode) || vnode;
	let { attributes } = vnode;
	if (attributes) {
		let cl = attributes.className || attributes.class;
		if (cl) {
			attributes.className = cl;
		}
	}
};

/** @TODO subclass preact's Component to do basic proptype checking. */

export { PropTypes, render, createElement, h, Component };
export default { PropTypes, render, createElement, h, Component };
