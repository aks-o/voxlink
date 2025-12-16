import React, { useState, useEffect } from 'react';
import { TrendingDown, Calculator, Globe } from 'lucide-react';

interface ComparisonData {
    eventType: string;
    duration?: number;
    quantity?: number;
    comparison: {
        region: string;
        currency: string;
        cost: {
            unitCost: number;
            totalCost: number;
            formattedCost: string;
        };
    }[];
}

const PricingComparison: React.FC = () => {
    const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
    const [selectedScenario, setSelectedScenario] = useState('OUTBOUND_CALL');
    const [loading, setLoading] = useState(false);

    const scenarios = [
        { id: 'OUTBOUND_CALL', name: '2-minute outbound call', duration: 120, quantity: 1 },
        { id: 'SMS_SENT', name: '10 SMS messages', quantity: 10 },
        { id: 'MONTHLY_SUBSCRIPTION', name: 'Monthly subscription', quantity: 1 },
        { id: 'BUSINESS_USAGE', name: 'Typical business usage (500 min + 100 SMS)', duration: 30000, quantity: 100 }
    ];

    useEffect(() => {
        fetchComparison();
    }, [selectedScenario]);

    const fetchComparison = async () => {
        setLoading(true);
        try {
            const scenario = scenarios.find(s => s.id === selectedScenario);
            if (!scenario) return;

            const params = new URLSearchParams({
                eventType: scenario.id,
                ...(scenario.duration && { duration: scenario.duration.toString() }),
                quantity: scenario.quantity.toString()
            });

            const response = await fetch(`/api/pricing/compare?${params}`);
            if (response.ok) {
                const data = await response.json();
                setComparisonData(data);
            } else {
                // Fallback to mock data
                setMockComparisonData(scenario);
            }
        } catch (error) {
            console.error('Failed to fetch comparison:', error);
            const scenario = scenarios.find(s => s.id === selectedScenario);
            if (scenario) setMockComparisonData(scenario);
        } finally {
            setLoading(false);
        }
    };

    const setMockComparisonData = (scenario: any) => {
        const mockData: ComparisonData = {
            eventType: scenario.id,
            duration: scenario.duration,
            quantity: scenario.quantity,
            comparison: []
        };

        switch (scenario.id) {
            case 'OUTBOUND_CALL':
                mockData.comparison = [
                    {
                        region: 'IN',
                        currency: 'INR',
                        cost: {
                            unitCost: 0.75,
                            totalCost: 1.50,
                            formattedCost: '₹1.50'
                        }
                    },
                    {
                        region: 'US',
                        currency: 'USD',
                        cost: {
                            unitCost: 0.03,
                            totalCost: 0.06,
                            formattedCost: '$0.06'
                        }
                    }
                ];
                break;

            case 'SMS_SENT':
                mockData.comparison = [
                    {
                        region: 'IN',
                        currency: 'INR',
                        cost: {
                            unitCost: 0.25,
                            totalCost: 2.50,
                            formattedCost: '₹2.50'
                        }
                    },
                    {
                        region: 'US',
                        currency: 'USD',
                        cost: {
                            unitCost: 0.02,
                            totalCost: 0.20,
                            formattedCost: '$0.20'
                        }
                    }
                ];
                break;

            case 'MONTHLY_SUBSCRIPTION':
                mockData.comparison = [
                    {
                        region: 'IN',
                        currency: 'INR',
                        cost: {
                            unitCost: 199,
                            totalCost: 199,
                            formattedCost: '₹199'
                        }
                    },
                    {
                        region: 'US',
                        currency: 'USD',
                        cost: {
                            unitCost: 10,
                            totalCost: 10,
                            formattedCost: '$10'
                        }
                    }
                ];
                break;

            case 'BUSINESS_USAGE':
                mockData.comparison = [
                    {
                        region: 'IN',
                        currency: 'INR',
                        cost: {
                            unitCost: 0,
                            totalCost: 574, // ₹199 base + ₹375 for 500 min + ₹25 for 100 SMS
                            formattedCost: '₹574'
                        }
                    },
                    {
                        region: 'US',
                        currency: 'USD',
                        cost: {
                            unitCost: 0,
                            totalCost: 27, // $10 base + $15 for 500 min + $2 for 100 SMS
                            formattedCost: '$27'
                        }
                    }
                ];
                break;
        }

        setComparisonData(mockData);
    };

    const calculateSavings = () => {
        if (!comparisonData || comparisonData.comparison.length < 2) return null;

        const indiaData = comparisonData.comparison.find(c => c.region === 'IN');
        const usData = comparisonData.comparison.find(c => c.region === 'US');

        if (!indiaData || !usData) return null;

        // Convert to same currency for comparison (using approximate exchange rate)
        const exchangeRate = 83; // 1 USD = 83 INR (approximate)
        const indiaCostInUSD = indiaData.cost.totalCost / exchangeRate;
        const usCostInUSD = usData.cost.totalCost;

        const savingsPercent = ((usCostInUSD - indiaCostInUSD) / usCostInUSD * 100);
        const savingsAmount = usCostInUSD - indiaCostInUSD;

        return {
            savingsPercent: Math.max(0, savingsPercent),
            savingsAmount: Math.max(0, savingsAmount),
            isIndiaMoreAffordable: indiaCostInUSD < usCostInUSD
        };
    };

    const savings = calculateSavings();

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
                <Calculator className="h-6 w-6 text-blue-600 mr-3" />
                <h2 className="text-xl font-bold text-gray-900">Pricing Comparison</h2>
            </div>

            {/* Scenario Selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare pricing for:
                </label>
                <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : comparisonData ? (
                <div className="space-y-6">
                    {/* Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {comparisonData.comparison.map((item) => (
                            <div
                                key={item.region}
                                className={`p-4 rounded-lg border-2 ${item.region === 'IN'
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-gray-200 bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                        <Globe className="h-4 w-4 mr-2 text-gray-600" />
                                        <span className="font-medium text-gray-900">
                                            {item.region === 'IN' ? 'India' : 'United States'}
                                        </span>
                                    </div>
                                    {item.region === 'IN' && (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                            Recommended
                                        </span>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {item.cost.formattedCost}
                                </div>
                                {item.cost.unitCost > 0 && (
                                    <div className="text-sm text-gray-600 mt-1">
                                        {item.cost.unitCost.toFixed(2)} {item.currency} per unit
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Savings Information */}
                    {savings && savings.isIndiaMoreAffordable && (
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                                <TrendingDown className="h-6 w-6 text-green-600 mr-3" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Cost Savings with India Pricing
                                </h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {savings.savingsPercent.toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Less expensive</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        ${savings.savingsAmount.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600">Savings per usage</div>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-4 text-center">
                                By choosing VoxLink's India pricing, you save significantly compared to US-based providers
                                while getting the same professional features and quality.
                            </p>
                        </div>
                    )}

                    {/* Usage Breakdown */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Usage Details:</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Event Type:</span>
                                <span className="font-medium">{comparisonData.eventType.replace('_', ' ')}</span>
                            </div>
                            {comparisonData.duration && (
                                <div className="flex justify-between">
                                    <span>Duration:</span>
                                    <span className="font-medium">{Math.ceil(comparisonData.duration / 60)} minutes</span>
                                </div>
                            )}
                            {comparisonData.quantity && comparisonData.quantity > 1 && (
                                <div className="flex justify-between">
                                    <span>Quantity:</span>
                                    <span className="font-medium">{comparisonData.quantity}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center">
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                            Get Started with India Pricing
                        </button>
                        <p className="text-sm text-gray-600 mt-2">
                            No setup fees • Start in minutes • Cancel anytime
                        </p>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8 text-gray-500">
                    Failed to load comparison data
                </div>
            )}
        </div>
    );
};

export default PricingComparison;