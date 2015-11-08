import { expect } from 'chai';
import React, { render, createElement, Component, PropTypes } from '../src';

describe('pReact-compat', () => {
	describe('render()', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('render')
				.that.is.a('function')
				.that.equals(render);
		});
	});

	describe('createElement()', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('createElement')
				.that.is.a('function')
				.that.equals(createElement);
		});
	});

	describe('Component', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('Component')
				.that.is.a('function')
				.that.equals(Component);
		});
	});

	describe('PropTypes', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('PropTypes')
				.that.is.an('object')
				.that.equals(PropTypes);
		});
	});
});
