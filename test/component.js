import { expect } from 'chai';
import renderToString from 'preact-render-to-string';
import React from '../src';

describe('components', () => {
	it('should be exported', () => {
		let props;

		class Demo extends React.Component {
			render() {
				let { a, b } = this.props;
				props = this.props;
				return <div id="demo">{ this.props.children }</div>;
			}
		}

		let html = renderToString(
			<Demo a="b" c="d">inner</Demo>
		);

		expect(props).to.exist.and.deep.equal({
			a: 'b',
			c: 'd',
			children: ['inner']
		});

		expect(html).to.equal('<div id="demo">inner</div>');
	});
});
