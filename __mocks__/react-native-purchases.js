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

const PURCHASES_ERROR_CODE = {
	PURCHASE_CANCELLED_ERROR: "PURCHASE_CANCELLED_ERROR",
	NETWORK_ERROR: "NETWORK_ERROR",
	STORE_PROBLEM_ERROR: "STORE_PROBLEM_ERROR",
	PURCHASE_NOT_ALLOWED_ERROR: "PURCHASE_NOT_ALLOWED_ERROR",
	PURCHASE_INVALID_ERROR: "PURCHASE_INVALID_ERROR",
	PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR:
		"PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR",
};

module.exports = {
	__esModule: true,
	default: Purchases,
	PURCHASES_ERROR_CODE,
	mockCustomerInfo,
	mockOfferings,
};
