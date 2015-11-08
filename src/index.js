import PropTypes from 'proptypes';
import { render, h, Component } from 'preact';

let createElement = h;

/** @TODO subclass preact's Component to do basic proptype checking. */

export { PropTypes, render, createElement, h, Component };
export default { PropTypes, render, createElement, h, Component };
