import React, { render, createClass, createElement, cloneElement, Component, PropTypes, unstable_renderSubtreeIntoContainer } from '../src';

describe.only('Children', () => {
	it('should support identity for simple', () => {
		let context = {};
		let callback = sinon.spy(function (kid, index) {
			expect(this).to.eql(context);
			return kid;
		});

		let simpleKid = <span key="simple" />;

    // First pass children into a component to fully simulate what happens when
    // using structures that arrive from transforms.

		let instance = <div>{simpleKid}</div>;
		React.Children.forEach(instance.props.children, callback, context);
		expect(callback).to.have.been.calledWithExactly(simpleKid, 0);
		callback.reset();
		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		expect(callback).to.have.been.calledWithExactly(simpleKid, 0);
		expect(mappedChildren[0]).to.eql(<span key=".$ismple" />);
	});

	it('should treat single arrayless child as being in array', () => {
		let context = {};
		let callback = sinon.spy(function(kid, index) {
			expect(this).to.equal(context);
			return kid;
		});

		let simpleKid = <span />;
		let instance = <div>{simpleKid}</div>;
		React.Children.forEach(instance.props.children, callback, context);
		expect(callback).to.have.been.calledWithExactly(simpleKid, 0);
		callback.reset();
		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		expect(callback).to.have.been.calledWithExactly(simpleKid, 0);
		expect(mappedChildren[0]).to.eql(<span key=".0" />);
	});

	it('should treat single child in array as expected', () => {
		let context = {};
		let callback = sinon.spy(function(kid, index) {
			expect(this).to.equal(context);
			return kid;
		});

		let simpleKid = <span key="simple" />;
		let instance = <div>{[simpleKid]}</div>;
		React.Children.forEach(instance.props.children, callback, context);
		expect(callback.args[0]).to.be.eql([simpleKid, 0]);
		callback.reset();
		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );

		expect(callback.args[0]).to.be.eql([simpleKid, 0]);
		expect(mappedChildren[0]).to.eql(<span key=".$simple" />);
	});

	it('should be called for each child', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;
		let context = {};

		let callback = sinon.spy(function(kid) {
			expect(this).to.equal(context);
			return kid;
		});

		let instance = (
      <div>
      {zero}
      {one}
      {two}
      {three}
      {four}
      </div>
    );

		function assertCalls() {
			expect(callback.args[0]).to.eql([zero, 0]);
			expect(callback.args[1]).to.eql(['' /* one */, 1]);
			expect(callback.args[2]).to.eql([two, 2]);
			expect(callback.args[3]).to.eql(['' /* three */, 3]);
			expect(callback.args[4]).to.eql([four, 4]);
			callback.reset();
		}

		React.Children.forEach(instance.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		assertCalls();
		expect(mappedChildren).to.eql([
			<div key=".$keyZero" />,
			<div key=".$keyTwo" />,
			<div key=".$keyFour" />
		]);
	});

	it('should be called for each child in nested structure', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;
		let five = <div key="keyFive" />;

		let context = {};
		let callback = sinon.spy((kid) => {
			return kid;
		});

		let instance = (
      <div>
        {[[zero, one, two], [three, four], five]}
      </div>
    );

		function assertCalls() {
			expect(callback.callCount).to.equal(6);
			expect(callback.args[0]).to.eql([zero, 0]);
			expect(callback.args[1]).to.eql(['' /* one */, 1]);
			expect(callback.args[2]).to.eql([two, 2]);
			expect(callback.args[3]).to.eql(['' /* three */, 3]);
			expect(callback.args[4]).to.eql([four, 4]);
			expect(callback.args[5]).to.eql([five, 5]);
			callback.reset();
		}

		React.Children.forEach(instance.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		assertCalls();
    // will not work, as preact normalizes the children array to [a,b,c,d]
		/* expect(mappedChildren).to.eql([
			 <div key=".0:$keyZero" />,
			 <div key=".0:$keyTwo" />,
			 <div key=".1:$keyFour" />,
			 <div key=".$keyFive" />
		   ]); */
	});

	it('should retain key across two mappings', () => {
		let zeroForceKey = <div key="keyZero" />;
		let oneForceKey = <div key="keyOne" />;
		let context = {};
		let callback = sinon.spy(function(kid) {
			expect(this).to.equal(context);
			return kid;
		});

		let forcedKeys = (
        <div>
        {zeroForceKey}
      {oneForceKey}
      </div>
    );

		function assertCalls() {
			expect(callback.args[0]).to.eql([zeroForceKey, 0]);
			expect(callback.args[1]).to.eql([oneForceKey, 1]);
			callback.reset();
		}

		React.Children.forEach(forcedKeys.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      forcedKeys.props.children,
      callback,
      context,
    );
		assertCalls();
		expect(mappedChildren).to.eql([
			<div key=".$keyZero" />,
			<div key=".$keyOne" />
		]);
	});

	it.skip('should be called for each child in an iterable without keys', () => {
		let threeDivIterable = {
			'@@iterator'() {
				let i = 0;
				return {
					next() {
						if (i++ < 3) {
							return {value: <div />, done: false};
						}
						return {value: undefined, done: true};

					}
				};
			}
		};

		let context = {};
		let callback = sinon.spy(function(kid) {
			expect(this).to.equal(context);
			return kid;
		});

		let instance = (
        <div>
        {threeDivIterable}
      </div>
    );

		function assertCalls() {
			expect(callback.callCount).to.equal(3);
			expect(callback.args[0]).to.eql([<div />, 0]);
			expect(callback.args[1]).to.eql([<div />, 1]);
			expect(callback.args[2]).to.eql([<div />, 2]);
			callback.reset();
		}

		React.Children.forEach(instance.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		assertCalls();
		expect(mappedChildren).to.eql([
			<div key=".0" />,
			<div key=".1" />,
			<div key=".2" />
		]);
	});

	it.skip('should be called for each child in an iterable with keys', () => {
		let threeDivIterable = {
			'@@iterator'() {
				let i = 0;
				return {
					next() {
						if (i++ < 3) {
							return {value: <div key={'#' + i} />, done: false};
						}
						return {value: undefined, done: true};

					}
				};
			}
		};

		let context = {};
		let callback = sinon.spy(function(kid) {
			expect(this).to.equal(context);
			return kid;
		});

		let instance = (
        <div>
        {threeDivIterable}
      </div>
    );

		function assertCalls() {
			expect(callback.callCount).to.equal(3);
			expect(callback.args[0]).to.eql([<div key="#1" />, 0]);
			expect(callback.args[1]).to.eql([<div key="#2" />, 1]);
			expect(callback.args[2]).to.eql([<div key="#3" />, 2]);
			callback.reset();
		}

		React.Children.forEach(instance.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		assertCalls();
		expect(mappedChildren).to.eql([
			<div key=".$#1" />,
			<div key=".$#2" />,
			<div key=".$#3" />
		]);
	});

	it('should allow extension of native prototypes', () => {
    /*eslint-disable no-extend-native */
		String.prototype.key = 'react';
    /*eslint-enable no-extend-native */

		let instance = (
      <div>
      {'a'}
      </div>
    );

		let context = {};
		let callback = sinon.spy(function(kid) {
			expect(this).to.equal(context);
			return kid;
		});

		function assertCalls() {
			expect(callback.callCount).to.equal(1, 0);
			expect(callback.args[0]).to.eql(['a', 0]);
			callback.reset();
		}

		React.Children.forEach(instance.props.children, callback, context);
		assertCalls();

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      context,
    );
		assertCalls();
		expect(mappedChildren).to.eql(['a']);

		delete String.prototype.key;
	});

	it('should pass key to returned component', () => {
		let mapFn = function(kid, index) {
			return <div>{kid}</div>;
		};

		let simpleKid = <span key="simple" />;

		let instance = <div>{simpleKid}</div>;
		let mappedChildren = React.Children.map(instance.props.children, mapFn);

		expect(React.Children.count(mappedChildren)).to.equal(1);
		expect(mappedChildren[0]).not.to.equal(simpleKid);
		expect(mappedChildren[0].props.children).to.eql([simpleKid]);
		expect(mappedChildren[0].key).to.equal('.$simple');
	});

	it('should invoke callback with the right context', () => {
		let lastContext;
		let callback = function(kid, index) {
			lastContext = this;
			return this;
		};

    // TODO: Use an object to test, after non-object fragments has fully landed.
		let scopeTester = 'scope tester';

		let simpleKid = <span key="simple" />;
		let instance = <div>{simpleKid}</div>;
		React.Children.forEach(instance.props.children, callback, scopeTester);
		expect(lastContext).to.equal(scopeTester);

		let mappedChildren = React.Children.map(
      instance.props.children,
      callback,
      scopeTester,
    );

		expect(React.Children.count(mappedChildren)).to.equal(1);
		expect(mappedChildren[0]).to.equal(scopeTester);
	});

	it('should be called for each child', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;

		let mapped = [
			<div key="giraffe" />, // Key should be joined to obj key
			null, // Key should be added even if we don't supply it!
			<div />, // Key should be added even if not supplied!
			<span />, // Map from null to something.
			<div key="keyFour" />
		];
		let callback = sinon.spy((kid, index) => {
			return mapped[index];
		});

		let instance = (
      <div>
      {zero}
      {one}
      {two}
      {three}
      {four}
      </div>
    );

		React.Children.forEach(instance.props.children, callback);
		expect(callback.args[0]).to.eql([zero, 0]);
		expect(callback.args[1]).to.eql(['' /* one */ , 1]); // null get converted to '' from preact
		expect(callback.args[2]).to.eql([two, 2]);
		expect(callback.args[3]).to.eql(['' /* three */, 3]);
		expect(callback.args[4]).to.eql([four, 4]);
		callback.reset();

		let mappedChildren = React.Children.map(instance.props.children, callback);
		expect(callback.callCount).to.equal(5);
		expect(React.Children.count(mappedChildren)).to.equal(4);
    // Keys default to indices.
		expect([
			mappedChildren[0].key,
			mappedChildren[1].key,
			mappedChildren[2].key,
			mappedChildren[3].key
		]).to.eql(['giraffe/.$keyZero', '.$keyTwo', '.3', '.$keyFour']);

		expect(callback.args[0]).to.eql([zero, 0]);
		expect(callback.args[1]).to.eql(['' /* one */, 1]);
		expect(callback.args[2]).to.eql([two, 2]);
		expect(callback.args[3]).to.eql(['' /* three */, 3]);
		expect(callback.args[4]).to.eql([four, 4]);

		expect(mappedChildren[0]).to.eql(<div key="giraffe/.$keyZero" />);
		expect(mappedChildren[1]).to.eql(<div key=".$keyTwo" />);
		expect(mappedChildren[2]).to.eql(<span key=".3" />);
		expect(mappedChildren[3]).to.eql(<div key=".$keyFour" />);
	});

	it('should be called for each child in nested structure', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;
		let five = <div key="keyFive" />;

		let zeroMapped = <div key="giraffe" />; // Key should be overridden
		let twoMapped = <div />; // Key should be added even if not supplied!
		let fourMapped = <div key="keyFour" />;
		let fiveMapped = <div />;

		let callback = sinon.spy((kid) => {
			switch (kid) {
				case zero:
					return zeroMapped;
				case two:
					return twoMapped;
				case four:
					return fourMapped;
				case five:
					return fiveMapped;
				default:
					return kid;
			}
		});

		let frag = [[zero, one, two], [three, four], five];
		let instance = <div>{[frag]}</div>;

		React.Children.forEach(instance.props.children, callback);
		expect(callback.callCount).to.equal(6);
		expect(callback.args[0]).to.eql([zero, 0]);
		expect(callback.args[1]).to.eql(['' /* one */, 1]);
		expect(callback.args[2]).to.eql([two, 2]);
		expect(callback.args[3]).to.eql(['' /* three */, 3]);
		expect(callback.args[4]).to.eql([four, 4]);
		expect(callback.args[5]).to.eql([five, 5]);
		callback.reset();

		let mappedChildren = React.Children.map(instance.props.children, callback);
		expect(callback.callCount).to.equal(6);
		expect(callback.args[0]).to.eql([zero, 0]);
		expect(callback.args[1]).to.eql(['' /* one */, 1]);
		expect(callback.args[2]).to.eql([two, 2]);
		expect(callback.args[3]).to.eql(['' /* three */, 3]);
		expect(callback.args[4]).to.eql([four, 4]);
		expect(callback.args[5]).to.eql([five, 5]);

		expect(React.Children.count(mappedChildren)).to.equal(4);
    // Keys default to indices.

    // will not work, as preact normalizes the children array to [a,b,c,d]
		/* expect([
			mappedChildren[0].key,
			mappedChildren[1].key,
			mappedChildren[2].key,
			mappedChildren[3].key
		]).to.eql([
			'giraffe/.0:0:$keyZero',
			'.0:0:$keyTwo',
			'.0:1:$keyFour',
			'.0:$keyFive'
		]); */

		expect(mappedChildren[0]).to.eql(<div key="giraffe/.0:0:$keyZero" />);
		expect(mappedChildren[1]).to.eql(<div key=".0:0:$keyTwo" />);
		expect(mappedChildren[2]).to.eql(<div key=".0:1:$keyFour" />);
		expect(mappedChildren[3]).to.eql(<div key=".0:$keyFive" />);
	});

	it('should retain key across two mappings', () => {
		let zeroForceKey = <div key="keyZero" />;
		let oneForceKey = <div key="keyOne" />;

    // Key should be joined to object key
		let zeroForceKeyMapped = <div key="giraffe" />;
    // Key should be added even if we don't supply it!
		let oneForceKeyMapped = <div />;

		let mapFn = function(kid, index) {
			return index === 0 ? zeroForceKeyMapped : oneForceKeyMapped;
		};

		let forcedKeys = (
      <div>
      {zeroForceKey}
      {oneForceKey}
      </div>
    );

		let expectedForcedKeys = ['giraffe/.$keyZero', '.$keyOne'];
		let mappedChildrenForcedKeys = React.Children.map(
      forcedKeys.props.children,
      mapFn,
    );
		let mappedForcedKeys = mappedChildrenForcedKeys.map(c => c.key);
		expect(mappedForcedKeys).to.eql(expectedForcedKeys);

		let expectedRemappedForcedKeys = [
			'giraffe/.$giraffe/.$keyZero',
			'.$.$keyOne'
		];
		let remappedChildrenForcedKeys = React.Children.map(
      mappedChildrenForcedKeys,
      mapFn,
    );
		expect(remappedChildrenForcedKeys.map(c => c.key)).to.eql(
      expectedRemappedForcedKeys,
    );
	});

	it('should not throw if key provided is a dupe with array key', () => {
		let zero = <div />;
		let one = <div key="0" />;

		let mapFn = function() {
			return null;
		};

		let instance = (
        <div>
        {zero}
      {one}
      </div>
    );

		expect(() => {
			React.Children.map(instance.props.children, mapFn);
		}).not.to.throw();
	});

	it('should use the same key for a cloned element', () => {
		let instance = (
        <div>
        <div />
        </div>
    );

		let mapped = React.Children.map(
      instance.props.children,
      element => element,
    );

		let mappedWithClone = React.Children.map(
      instance.props.children,
      element => React.cloneElement(element)
    );

		expect(mapped[0].key).to.equal(mappedWithClone[0].key);
	});

	it('should use the same key for a cloned element with key', () => {
		let instance = (
        <div>
        <div key="unique" />
        </div>
    );

		let mapped = React.Children.map(
      instance.props.children,
      element => element
    );

		let mappedWithClone = React.Children.map(
      instance.props.children, element => React.cloneElement(element, {key: 'unique'})
    );

		expect(mapped[0].key).to.equal(mappedWithClone[0].key);
	});

	it('should return 0 for null children', () => {
		let numberOfChildren = React.Children.count(null);
		expect(numberOfChildren).to.equal(0);
	});

	it('should return 0 for undefined children', () => {
		let numberOfChildren = React.Children.count(undefined);
		expect(numberOfChildren).to.equal(0);
	});

	it('should return 1 for single child', () => {
		let simpleKid = <span key="simple" />;
		let instance = <div>{simpleKid}</div>;
		let numberOfChildren = React.Children.count(instance.props.children);
		expect(numberOfChildren).to.equal(1);
	});

	it('should count the number of children in flat structure', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;

		let instance = (
      <div>
      {zero}
      {one}
      {two}
      {three}
      {four}
      </div>
    );
		let numberOfChildren = React.Children.count(instance.props.children);
		expect(numberOfChildren).to.equal(5);
	});

	it('should count the number of children in nested structure', () => {
		let zero = <div key="keyZero" />;
		let one = null;
		let two = <div key="keyTwo" />;
		let three = null;
		let four = <div key="keyFour" />;
		let five = <div key="keyFive" />;

		let instance = (
        <div>
        {[[[zero, one, two], [three, four], five], null]}
      </div>
    );
		let numberOfChildren = React.Children.count(instance.props.children);
		expect(numberOfChildren).to.equal(7);
	});

	it('should flatten children to an array', () => {
		expect(React.Children.toArray(undefined)).to.eql([]);
		expect(React.Children.toArray(null)).to.eql([]);

		expect(React.Children.toArray(<div />).length).to.equal(1);
		expect(React.Children.toArray([<div />]).length).to.equal(1);
		expect(React.Children.toArray(<div />)[0].key).to.equal(
      React.Children.toArray([<div />])[0].key,
    );

		let flattened = React.Children.toArray([
      [<div key="apple" />, <div key="banana" />, <div key="camel" />],
      [<div key="banana" />, <div key="camel" />, <div key="deli" />]
		]);

		expect(flattened.length).to.equal(6);
		expect(flattened[1].key).to.contain('banana');
		expect(flattened[3].key).to.contain('banana');
		expect(flattened[1].key).not.to.equal(flattened[3].key);

		let reversed = React.Children.toArray([
      [<div key="camel" />, <div key="banana" />, <div key="apple" />],
      [<div key="deli" />, <div key="camel" />, <div key="banana" />]
		]);
		expect(flattened[0].key).to.equal(reversed[2].key);
		expect(flattened[1].key).to.equal(reversed[1].key);
		expect(flattened[2].key).to.equal(reversed[0].key);
		expect(flattened[3].key).to.equal(reversed[5].key);
		expect(flattened[4].key).to.equal(reversed[4].key);
		expect(flattened[5].key).to.equal(reversed[3].key);

    // null/undefined/bool are all omitted
		expect(React.Children.toArray([1, 'two', null, undefined, true])).to.eql([
			1,
			'two'
		]);
	});

	it('should escape keys', () => {
		let zero = <div key="1" />;
		let one = <div key="1=::=2" />;
		let instance = (
      <div>
      {zero}
      {one}
      </div>
    );
		let mappedChildren = React.Children.map(
      instance.props.children,
      kid => kid,
    );
		expect(mappedChildren).to.eql([
			<div key=".$1" />,
			<div key=".$1=0=2=2=02" />
		]);
	});
});
