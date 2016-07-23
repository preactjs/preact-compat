import renderToString from 'preact-render-to-string';
import React from '../src';

/*global sinon,expect*/

describe('components', () => {
	let scratch;

	before( () => {
		scratch = document.createElement('div');
		(document.body || document.documentElement).appendChild(scratch);
	});

	beforeEach( () => {
		scratch.innerHTML = '';
	});

	after( () => {
		scratch.parentNode.removeChild(scratch);
		scratch = null;
	});

	it('should be sane', () => {
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
			children: 'inner'
		});

		expect(html).to.equal('<div id="demo">inner</div>');
	});

	it('should alias props.children', () => {
		class Foo extends React.Component {
			render() {
				return <div>{this.props.children}</div>;
			}
		}

		let children = ['a', <span>b</span>, <b>c</b>],
			foo;

		React.render((
			<Foo ref={ c => foo=c }>
				{ children }
			</Foo>
		), scratch);

		expect(foo).to.exist.and.have.deep.property('props.children').eql(children);
	});

	describe('propTypes', () => {
		function checkPropTypes(Foo) {
			sinon.stub(console, 'error');

			React.render(<Foo />, scratch);
			expect(console.error).to.have.been.calledWithMatch({
				message: 'Required prop `func` was not specified in `Foo`.'
			});

			console.error.reset();

			React.render(<Foo func={()=>{}} />, scratch);
			expect(console.error).not.to.have.been.called;

			React.render(<Foo func={()=>{}} bool="one" />, scratch);
			expect(console.error).to.have.been.calledWithMatch({
				message: 'Invalid prop `bool` of type `string` supplied to `Foo`, expected `boolean`.'
			});

			console.error.restore();
		}

		it('should support propTypes for ES Class components', () => {
			class Foo extends React.Component {
				static propTypes = {
					func: React.PropTypes.func.isRequired,
					bool: React.PropTypes.bool
				};
				render() {
					return <div />;
				}
			}

			checkPropTypes(Foo);
		});

		it('should support propTypes for createClass components', () => {
			const Foo = React.createClass({
				propTypes: {
					func: React.PropTypes.func.isRequired,
					bool: React.PropTypes.bool
				},
				render: () => <div />
			});

			checkPropTypes(Foo);
		});

		it('should support propTypes for pure components', () => {
			function Foo() { return <div />; }
			Foo.propTypes = {
				func: React.PropTypes.func.isRequired,
				bool: React.PropTypes.bool
			};
			checkPropTypes(Foo);

			const Foo2 = () => <div />;
			Foo2.displayName = 'Foo';
			Foo2.propTypes = {
				func: React.PropTypes.func.isRequired,
				bool: React.PropTypes.bool
			};
			checkPropTypes(Foo2);
		});
	});

	describe('refs', () => {
		it('should support string refs', () => {
			let inst, innerInst;

			class Foo extends React.Component {
				constructor() {
					super();
					inst = this;
				}

				render() {
					return (
						<div ref="top">
							<h1 ref="h1">h1</h1>
							<p ref="p">
								<span ref="span">text</span>
								<Inner ref="inner" />
							</p>
						</div>
					);
				}
			}

			const Inner = React.createClass({
				render() {
					innerInst = this;
					return (
						<div className="contained" ref="contained">
							<h2 ref="inner-h2">h2</h2>
						</div>
					);
				}
			});

			React.render(<Foo />, scratch);

			expect(inst).to.exist;
			expect(inst.refs).to.be.an.object;

			expect(inst.refs).to.have.property('top', scratch.firstChild);
			expect(inst.refs).to.have.property('h1', scratch.querySelector('h1'));
			expect(inst.refs).to.have.property('p', scratch.querySelector('p'));
			expect(inst.refs).to.have.property('span', scratch.querySelector('span'));

			expect(inst.refs).to.have.property('inner', innerInst, 'ref to child component');

			expect(inst.refs).not.to.have.property('contained');
			expect(inst.refs).not.to.have.property('inner-h2');

			expect(innerInst.refs).to.have.all.keys(['contained', 'inner-h2']);
			expect(innerInst.refs).to.have.property('contained', scratch.querySelector('.contained'));
			expect(innerInst.refs).to.have.property('inner-h2', scratch.querySelector('h2'));
		});

		it('should retain support for function refs', () => {
			let ref1 = sinon.spy(),
				ref2 = sinon.spy(),
				componentRef = sinon.spy(),
				innerInst;

			class Foo extends React.Component {
				render() {
					return this.props.empty ? (<foo />) : (
						<div ref={ref1}>
							<h1 ref={ref2}>h1</h1>
							<Inner ref={componentRef} />
						</div>
					);
				}
			}

			const Inner = React.createClass({
				render() {
					innerInst = this;
					return <div />;
				}
			});

			React.render(<Foo />, scratch);

			expect(ref1).to.have.have.been.calledOnce.and.calledWith(scratch.firstChild);
			expect(ref2).to.have.have.been.calledOnce.and.calledWith(scratch.querySelector('h1'));
			expect(componentRef).to.have.been.calledOnce.and.calledWith(innerInst);

			React.render(<Foo empty />, scratch);
			// React.unmountComponentAtNode(scratch);

			expect(ref1, 'ref1').to.have.have.been.calledTwice.and.calledWith(null);
			expect(ref2, 'ref2').to.have.have.been.calledTwice.and.calledWith(null);
			expect(componentRef, 'componentRef').to.have.been.calledTwice.and.calledWith(null);
		});
	});
});
