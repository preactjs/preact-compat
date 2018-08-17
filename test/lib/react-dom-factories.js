import DOM from '../../lib/react-dom-factories';

describe('react-dom-factories', () => {
	it('should export .div', () => {
		expect(DOM).to.have.property('div').that.is.a('function');
	});
});
