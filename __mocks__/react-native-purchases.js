const mockCustomerInfo = {
	entitlements: {
		active: {},
	},
};

const mockOfferings = {
	current: {
		availablePackages: [
			{
				product: {
					priceString: "€0.99",
				},
			},
		],
	},
};

const Purchases = {
	configure: jest.fn(),
	getCustomerInfo: jest.fn().mockResolvedValue(mockCustomerInfo),
	getOfferings: jest.fn().mockResolvedValue(mockOfferings),
	purchasePackage: jest.fn().mockResolvedValue({
		customerInfo: mockCustomerInfo,
	}),
	restorePurchases: jest.fn().mockResolvedValue(mockCustomerInfo),
};

module.exports = {
	__esModule: true,
	default: Purchases,
	mockCustomerInfo,
	mockOfferings,
};
