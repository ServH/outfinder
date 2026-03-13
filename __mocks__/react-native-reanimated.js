const { View, Text, Image, Animated } = require("react-native");

const NOOP = () => {};
const ID = (t) => t;
const IMMEDIATE_CB = (callback) => callback();

const Reanimated = {
	useSharedValue: (init) => ({ value: init }),
	useAnimatedStyle: IMMEDIATE_CB,
	useAnimatedProps: IMMEDIATE_CB,
	useDerivedValue: (processor) => ({ value: processor() }),
	useAnimatedRef: () => ({ current: null }),
	useAnimatedReaction: NOOP,
	useAnimatedScrollHandler: () => NOOP,
	withSpring: (toValue, _config, callback) => {
		callback?.(true);
		return toValue;
	},
	withTiming: (toValue, _config, callback) => {
		callback?.(true);
		return toValue;
	},
	withDelay: (_delay, anim) => anim,
	withRepeat: ID,
	withSequence: () => 0,
	withDecay: (_config, callback) => {
		callback?.(true);
		return 0;
	},
	cancelAnimation: NOOP,
	runOnJS: ID,
	runOnUI: ID,
	createWorkletRuntime: NOOP,
	makeMutable: ID,
	measure: () => ({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 }),
	scrollTo: NOOP,
	interpolate: NOOP,
	Extrapolation: { CLAMP: "clamp", EXTEND: "extend", IDENTITY: "identity" },
	Easing: {
		linear: ID,
		ease: ID,
		quad: ID,
		cubic: ID,
		poly: ID,
		sin: ID,
		circle: ID,
		exp: ID,
		elastic: ID,
		back: ID,
		bounce: ID,
		bezier: () => ID,
		in: ID,
		out: ID,
		inOut: ID,
	},
	enableLayoutAnimations: NOOP,
	createAnimatedComponent: ID,
	ReduceMotion: { System: "system", Always: "always", Never: "never" },
	SensorType: {},
	IOSReferenceFrame: {},
	InterfaceOrientation: {},
	KeyboardState: {},
};

module.exports = {
	__esModule: true,
	...Reanimated,
	default: {
		View,
		Text,
		Image,
		ScrollView: Animated.ScrollView,
		FlatList: Animated.FlatList,
		createAnimatedComponent: ID,
	},
};
