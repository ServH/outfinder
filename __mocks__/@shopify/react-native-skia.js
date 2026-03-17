const React = require("react");
const { View } = require("react-native");

const NOOP = () => {};
const ID = (t) => t;

function createSkiaComponent(name) {
	const component = function SkiaComponent(props) {
		return React.createElement(View, { testID: `skia-${name}`, ...props }, props.children);
	};
	component.displayName = name;
	return component;
}

module.exports = {
	Canvas: function Canvas(props) {
		return React.createElement(View, { testID: "skia-canvas", ...props }, props.children);
	},
	Image: createSkiaComponent("Image"),
	Fill: createSkiaComponent("Fill"),
	ColorMatrix: createSkiaComponent("ColorMatrix"),
	RadialGradient: createSkiaComponent("RadialGradient"),
	RoundedRect: createSkiaComponent("RoundedRect"),
	Shadow: createSkiaComponent("Shadow"),
	useImage: jest.fn(() => ({ width: () => 1024, height: () => 1024 })),
	vec: (x, y) => ({ x, y }),
};
