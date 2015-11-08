# preact-compat

[![NPM](http://img.shields.io/npm/v/preact-compat.svg?style=flat)](https://www.npmjs.org/package/preact-compat)
[![travis-ci](https://travis-ci.org/developit/preact-compat.svg)](https://travis-ci.org/developit/preact-compat)


This module is a compatibility layer that makes react-based modules work with [preact], without any code changes.

It provides the same exports as `react` and `react-dom`, meaning you can use your build tool of choice to drop it in where React is being depended on.


---


## Why?

> _... or really, "why [preact]"?_

React is a great library and a great concept, and has a large community of module authors creating high-quality components.
However, these components are tightly coupled to React through the use of generic package imports _([example][1])_.

[Preact] is a tiny _(3kb)_ implementation of the core value of React, and maintains a nearly identical API.
With a shim like this in place, it is possible to use other React-like libraries like Preact, without forking modules just to change their imports.

There are better long-term ways to solve the coupling issue, like using factory functions that accept **named** generic methods _(not just React DI)_,
as [suggested by Eric Elliot][2]. However, since the React community has already authored so many modules in a more explicitly coupled manner, it's worth
having a simple short-term solution for those who would like to liberate themselves from library lock-in.

---


## Usage with Webpack

Using `preact-compat` with Webpack is easy.

All you have to do is add an alias for `react` and `react-dom`:

```js
{
	// ...
	modules: {
		alias: {
			'react': 'preact-compat',
			'react-dom': 'preact-compat'
		}
	}
	// ...
}
```

... with that in place, existing React modules should work nicely:

```js
import React, { Component } from 'react';
import { render } from 'react-dom';

class Foo extends Component {
	render() {
		let { a, b, children } = this.props;
		return <div {...{a,b}}>{ children }</div>;
	}
}

render(<Foo a="a" b="b">test</Foo>, document.body);
```


---


## License

[MIT]


[preact]: https://github.com/developit/preact
[MIT]: http://choosealicense.com/licenses/mit
[1]: https://github.com/developit/preact-toolbox/blob/master/components/app/index.jsx#L1
[2]: https://gist.github.com/ericelliott/7e05747b891673eb704b
