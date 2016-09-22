import React, { render, createClass, createElement, cloneElement, Component, PropTypes } from '../src';

describe('preact-compat', () => {
	describe('render()', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('render')
				.that.is.a('function')
				.that.equals(render);
		});

		it('should replace isomorphic content', () => {
			let ce = (type) => document.createElement(type);
			let Text = (text) => document.createTextNode(text);
			let root = ce('div');
			let initialChild = ce('div');
			initialChild.appendChild(Text('initial content'));
			root.appendChild(initialChild);

			render(<div>dynamic content</div>, root);
			expect(root)
				.to.have.property('textContent')
				.that.is.a('string')
				.that.equals('dynamic content');
		});

		it('should remove extra elements', () => {
			let ce = (type) => document.createElement(type);
			let Text = (text) => document.createTextNode(text);
			let root = ce('div');

			let c1 = ce('div');
			c1.appendChild(Text('isomorphic content'));
			root.appendChild(c1);

			let c2 = ce('div');
			c2.appendChild(Text('extra content'));
			root.appendChild(c2);

			render(<div>dynamic content</div>, root);
			expect(root)
				.to.have.property('textContent')
				.that.is.a('string')
				.that.equals('dynamic content');
		});

		it('should remove text nodes', () => {
			let ce = (type) => document.createElement(type);
			let Text = (text) => document.createTextNode(text);
			let root = ce('div');

			root.appendChild(Text('Text Content in the root'));
			root.appendChild(Text('More Text Content'));

			render(<div>dynamic content</div>, root);
			expect(root)
			.to.have.property('textContent')
			.that.is.a('string')
			.that.equals('dynamic content');
		});

	});


	describe('createClass()', () => {
		it('should be exported', () => {
			expect(React)
				.to.have.property('createClass')
				.that.is.a('function')
				.that.equals(createClass);
		});

		it('should create a Component', () => {
			let specState = { something: 1 };
			let spec = {
				foo: 'bar',
				getInitialState() {
					return specState;
				},
				method: sinon.spy()
			};
			const C = createClass(spec);
			let inst = new C();
			expect(inst).to.have.property('foo', 'bar');
			expect(inst).to.have.property('state', specState);
			expect(inst).to.have.property('method').that.is.a('function');
			expect(inst).to.be.an.instanceof(Component);
			inst.method('a','b');
			expect(spec.method)
				.to.have.been.calledOnce
				.and.calledOn(inst)
				.and.calledWithExactly('a', 'b');
		});

		it('should not bind blacklisted methods', () => {
			let constructor = () => {};
			let render = () => null;
			const C = createClass({
				constructor,
				render
			});
			let c = new C();
			expect(c).to.have.property('constructor').that.equals(constructor);
			expect(c).to.have.property('render').not.with.property('__bound');
		});

		it('should copy statics', () => {
			let def = {
				statics: {
					foo: 'bar',
					baz() {}
				}
			};
			let c = createClass(def);
			expect(c).to.have.property('foo', def.statics.foo);
			expect(c).to.have.property('baz', def.statics.baz);
		});

		it('should support mixins', () => {
			let def = {
				mixins: [
					{
						foo: sinon.spy(),
						bar: sinon.spy()
					},
					{
						bar: sinon.spy(),
						componentWillMount: sinon.spy(),
						render: 'nothing here'
					},
					{
						componentWillMount: sinon.spy()
					}
				],
				foo: sinon.spy(),
				componentWillMount: sinon.spy(),
				render: sinon.stub().returns(null)
			};
			let C = createClass(def);
			let inst = new C();

			inst.foo();
			expect(def.foo).to.have.been.calledOnce;
			expect(def.mixins[0].foo).to.have.been.calledOnce.and.calledBefore(def.foo);

			inst.bar();
			expect(def.mixins[0].bar).to.have.been.calledOnce;
			expect(def.mixins[1].bar).to.have.been.calledOnce.and.calledAfter(def.mixins[0].bar);

			let props = {},
				state = {};
			inst.componentWillMount(props, state);
			expect(def.mixins[1].componentWillMount)
				.to.have.been.calledOnce
				.and.calledWithExactly(props, state);
			expect(def.mixins[2].componentWillMount)
				.to.have.been.calledOnce
				.and.calledWithExactly(props, state)
				.and.calledAfter(def.mixins[1].componentWillMount);

			expect(inst.render(props, state)).to.equal(null);
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

	describe('cloneElement', () => {
		it('should clone elements', () => {
			let element = <foo a="b" c="d">a<span>b</span></foo>;
			expect(cloneElement(element)).to.eql(element);
		});
	});
});
