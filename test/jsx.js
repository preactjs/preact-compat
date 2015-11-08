import { expect } from 'chai';
import renderToString from 'preact-render-to-string';
import React from '../src';

describe('jsx', () => {
	it('should be exported', () => {
		let jsx = (
			<div className="foo bar" data-foo="bar">
				<span id="some_id">inner!</span>
				{ ['a', 'b'] }
			</div>
		);

		let html = renderToString(jsx);

		expect(html).to.equal('<div data-foo="bar" class="foo bar"><span id="some_id">inner!</span>ab</div>');
	});
});
