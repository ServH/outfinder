const React = require("react");
const { View } = require("react-native");

function GestureHandlerRootView(props) {
	return React.createElement(View, props, props.children);
}

function GestureDetector({ children }) {
	return children;
}

function chainable() {
	const obj = {};
	const handler = {
		get(target, prop) {
			if (prop in target) return target[prop];
			// Any method call returns the proxy for chaining
			return () => new Proxy(obj, handler);
		},
	};
	return new Proxy(obj, handler);
}

const Gesture = {
	Pan: () => chainable(),
	Tap: () => chainable(),
	Pinch: () => chainable(),
	Race: (...args) => chainable(),
	Simultaneous: (...args) => chainable(),
	Exclusive: (...args) => chainable(),
};

module.exports = {
	GestureHandlerRootView,
	GestureDetector,
	Gesture,
	Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
};
