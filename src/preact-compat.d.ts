declare module "preact-compat" {

	import {
		VNode,
		Component,
	} from 'preact';

	const version: string;
	function unmountComponentAtNode(container: HTMLElement): boolean;
	function createPortal(vnode: VNode, container: HTMLElement): JSX.Element;
	function findDOMNode(component: Component | null | undefined): HTMLElement | null;

	// reuse exported types from preact.d.ts when possible
	// see https://github.com/developit/preact/blob/master/src/preact.js
	// and https://github.com/developit/preact/blob/master/src/preact.d.ts
	export {
		// version,
		// DOM,
		// PropTypes,
		// Children,
		render,
		// createClass,
		// createPortal,
		// createFactory,
		// createElement,
		cloneElement,
		// createRef,
		// isValidElement,
		// findDOMNode,
		// unmountComponentAtNode,
		Component,
		// PureComponent,
		// renderSubtreeIntoContainer as unstable_renderSubtreeIntoContainer,
		// unstable_batchedUpdates,
		// extend as __spread,
	} from 'preact';

	// and add ours
	export {
		version,
		unmountComponentAtNode,
		createPortal,
		findDOMNode,
	};

	const preactCompat: typeof preact & {
		version: typeof version,
		unmountComponentAtNode: typeof unmountComponentAtNode,
		createPortal: typeof createPortal,
		findDOMNode: typeof findDOMNode,
	};

	export default preactCompat;
}
