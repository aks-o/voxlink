import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Phone, 
  Star, 
  Filter,
  Loader2,
  AlertCircle,
  ShoppingCart
} from 'lucide-react';
import { numbersApi } from '@services/api';
import toast from 'react-hot-toast';

interface SearchCriteria {
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  pattern: string;
  maxMonthlyRate: string;
  maxSetupFee: string;
  features: string[];
}

interface AvailableNumber {
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  monthlyRate: number;
  setupFee: number;
  features: string[];
  score?: number;
}

const NumberSearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    countryCode: 'US',
    areaCode: '',
    city: '',
    region: '',
    pattern: '',
    maxMonthlyRate: '',
    maxSetupFee: '',
    features: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [reservingNumber, setReservingNumber] = useState<string | null>(null);

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['number-search', searchCriteria],
    queryFn: () => numbersApi.searchNumbers(searchCriteria),
    enabled: false, // Only search when user clicks search
  });

  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', searchCriteria.countryCode, searchCriteria.areaCode],
    queryFn: () => numbersApi.getSearchSuggestions({
      countryCode: searchCriteria.countryCode,
      areaCode: searchCriteria.areaCode,
    }),
    enabled: !!searchCriteria.countryCode,
  });

  const handleSearch = () => {
    if (!searchCriteria.countryCode) {
      toast.error('Please select a country');
      return;
    }
    refetch();
  };

  const handleReserveNumber = async (phoneNumber: string) => {
    setReservingNumber(phoneNumber);
    try {
      await numbersApi.reserveNumber(phoneNumber, 'current-user-id'); // Replace with actual user ID
      toast.success('Number reserved for 10 minutes');
      navigate(`/numbers/purchase/${encodeURIComponent(phoneNumber)}`);
    } catch (error) {
      toast.error('Failed to reserve number');
    } finally {
      setReservingNumber(null);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const availableFeatures = [
    { id: 'SMS', label: 'SMS' },
    { id: 'VOICE', label: 'Voice' },
    { id: 'MMS', label: 'MMS' },
    { id: 'FAX', label: 'Fax' },
  ];

  const countryOptions = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-charcoal">Search Available Numbers</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        <div className="space-y-4">
          {/* Basic Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Country
              </label>
              <select
                value={searchCriteria.countryCode}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, countryCode: e.target.value }))}
                className="input"
              >
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Area Code
              </label>
              <input
                type="text"
                placeholder="e.g., 212, 415"
                value={searchCriteria.areaCode}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, areaCode: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="e.g., New York, San Francisco"
                value={searchCriteria.city}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, city: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Number Pattern
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., *123*, 555****"
                    value={searchCriteria.pattern}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, pattern: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Max Monthly Rate
                  </label>
                  <input
                    type="number"
                    placeholder="$10.00"
                    value={searchCriteria.maxMonthlyRate}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxMonthlyRate: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Max Setup Fee
                  </label>
                  <input
                    type="number"
                    placeholder="$5.00"
                    value={searchCriteria.maxSetupFee}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxSetupFee: e.target.value }))}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Required Features
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableFeatures.map((feature) => (
                      <label key={feature.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={searchCriteria.features.includes(feature.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSearchCriteria(prev => ({
                                ...prev,
                                features: [...prev.features, feature.id]
                              }));
                            } else {
                              setSearchCriteria(prev => ({
                                ...prev,
                                features: prev.features.filter(f => f !== feature.id)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="btn-primary px-8"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search Numbers
            </button>
          </div>
        </div>
      </div>

      {/* Search Suggestions */}
      {suggestions && suggestions.data && (
        <div className="card">
          <h3 className="text-md font-medium text-charcoal mb-4">Popular Areas</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.data.popularAreas?.map((area: any) => (
              <button
                key={area.areaCode}
                onClick={() => setSearchCriteria(prev => ({ 
                  ...prev, 
                  areaCode: area.areaCode,
                  city: area.city 
                }))}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                {area.areaCode} - {area.city}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {error && (
        <div className="card">
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>Failed to search numbers. Please try again.</span>
          </div>
        </div>
      )}

      {searchResults && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-charcoal">
              Available Numbers ({searchResults.data?.numbers?.length || 0})
            </h3>
            <div className="text-sm text-slate">
              Search completed in {searchResults.data?.searchTime || '0.5'}s
            </div>
          </div>

          {searchResults.data?.numbers?.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h4 className="text-lg font-medium text-charcoal mb-2">No Numbers Found</h4>
              <p className="text-slate mb-4">
                Try adjusting your search criteria or selecting a different area.
              </p>
              {searchResults.data?.suggestions && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-charcoal">Suggested alternatives:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {searchResults.data.suggestions.map((suggestion: string) => (
                      <span key={suggestion} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {suggestion}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.data?.numbers?.map((number: AvailableNumber) => (
                <div key={number.phoneNumber} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-semibold text-charcoal">
                        {number.phoneNumber}
                      </div>
                      <div className="flex items-center text-sm text-slate mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {number.city}, {number.region}
                      </div>
                    </div>
                    {number.score && (
                      <div className="flex items-center text-amber-600">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        <span className="text-sm font-medium">{number.score}/5</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate">Monthly Rate:</span>
                      <span className="font-medium text-charcoal">
                        {formatPrice(number.monthlyRate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate">Setup Fee:</span>
                      <span className="font-medium text-charcoal">
                        {formatPrice(number.setupFee)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {number.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleReserveNumber(number.phoneNumber)}
                    disabled={reservingNumber === number.phoneNumber}
                    className="w-full btn-primary"
                  >
                    {reservingNumber === number.phoneNumber ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 mr-2" />
                    )}
                    Reserve & Buy
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NumberSearch;