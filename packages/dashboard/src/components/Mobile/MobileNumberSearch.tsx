import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Sliders,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useIsMobile, useIsTouchDevice } from '../../hooks/useResponsive';
import MobileNumberCard from './MobileNumberCard';

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

interface MobileNumberSearchProps {
  onSearch: (criteria: SearchCriteria) => void;
  onReserveNumber: (phoneNumber: string) => void;
  searchResults?: AvailableNumber[];
  isLoading?: boolean;
  error?: string;
  reservingNumber?: string;
}

const MobileNumberSearch: React.FC<MobileNumberSearchProps> = ({
  onSearch,
  onReserveNumber,
  searchResults = [],
  isLoading = false,
  error,
  reservingNumber,
}) => {
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
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const availableFeatures = [
    { id: 'SMS', label: 'SMS' },
    { id: 'VOICE', label: 'Voice' },
    { id: 'MMS', label: 'MMS' },
    { id: 'FAX', label: 'Fax' },
  ];

  const popularAreaCodes = {
    US: ['212', '213', '415', '617', '312', '702'],
    CA: ['416', '514', '604', '403'],
    IN: ['11', '22', '33', '44', '80', '40'], // Delhi, Mumbai, Kolkata, Chennai, Bangalore, Hyderabad
    GB: ['20', '121', '161', '113', '117', '131'], // London, Birmingham, Manchester, Leeds, Bristol, Edinburgh
    AU: ['2', '3', '7', '8'], // Sydney, Melbourne, Brisbane, Adelaide
    DE: ['30', '40', '89', '69', '221', '711'], // Berlin, Hamburg, Munich, Frankfurt, Cologne, Stuttgart
    FR: ['1', '2', '3', '4', '5'], // Paris, Northwest, Northeast, Southeast, Southwest
    JP: ['3', '6', '52', '75', '92'], // Tokyo, Osaka, Nagoya, Kyoto, Fukuoka
    SG: ['6'], // Singapore
    NL: ['20', '70', '30', '40', '50'], // Amsterdam, The Hague, Utrecht, Rotterdam, Eindhoven
    SE: ['8', '31', '40', '11', '13'], // Stockholm, Gothenburg, Malmö, Norrköping, Linköping
    CH: ['44', '61', '31', '21', '22'], // Zurich, Basel, Bern, Lausanne, Geneva
    BE: ['2', '3', '4', '9'], // Brussels, Antwerp, Liège, Ghent
    IT: ['6', '2', '81', '55', '51'], // Rome, Milan, Naples, Florence, Bologna
    ES: ['91', '93', '95', '96', '98'], // Madrid, Barcelona, Seville, Valencia, Bilbao
    BR: ['11', '21', '31', '41', '51'], // São Paulo, Rio de Janeiro, Belo Horizonte, Curitiba, Porto Alegre
    MX: ['55', '33', '81', '222', '228'], // Mexico City, Guadalajara, Monterrey, Puebla, Veracruz
    AR: ['11', '351', '261', '341', '221'], // Buenos Aires, Córdoba, Mendoza, Rosario, La Plata
    CL: ['2', '32', '41', '51', '61'], // Santiago, Valparaíso, Concepción, La Serena, Punta Arenas
    ZA: ['11', '21', '31', '41', '51'], // Johannesburg, Cape Town, Durban, Port Elizabeth, Bloemfontein
    GB: ['20', '121', '131'],
    AU: ['2', '3', '7', '8'],
  };

  useEffect(() => {
    // Auto-focus search input on mobile when component mounts
    if (isMobile && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const handleQuickSearch = () => {
    if (quickSearch.trim()) {
      // Parse quick search for area code or city
      const isAreaCode = /^\d{3}$/.test(quickSearch.trim());
      if (isAreaCode) {
        setSearchCriteria(prev => ({ ...prev, areaCode: quickSearch.trim() }));
      } else {
        setSearchCriteria(prev => ({ ...prev, city: quickSearch.trim() }));
      }
    }
    onSearch(searchCriteria);
  };

  const handleAreaCodeSelect = (areaCode: string) => {
    setSearchCriteria(prev => ({ ...prev, areaCode }));
    onSearch({ ...searchCriteria, areaCode });
  };

  const handleFeatureToggle = (featureId: string) => {
    setSearchCriteria(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleNumberSelect = (phoneNumber: string) => {
    setSelectedNumbers(prev => 
      prev.includes(phoneNumber)
        ? prev.filter(n => n !== phoneNumber)
        : [...prev, phoneNumber]
    );
  };

  const clearFilters = () => {
    setSearchCriteria({
      countryCode: 'US',
      areaCode: '',
      city: '',
      region: '',
      pattern: '',
      maxMonthlyRate: '',
      maxSetupFee: '',
      features: [],
    });
    setQuickSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Search Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Area code or city..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
            />
            {quickSearch && (
              <button
                onClick={() => setQuickSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              p-3 rounded-lg border transition-colors touch-manipulation
              ${showFilters 
                ? 'bg-voxlink-blue text-white border-voxlink-blue' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleQuickSearch}
            disabled={isLoading}
            className="px-4 py-3 bg-voxlink-blue text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>

      {/* Country & Popular Area Codes */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={searchCriteria.countryCode}
            onChange={(e) => setSearchCriteria(prev => ({ ...prev, countryCode: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
          >
            {countryOptions.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Popular Area Codes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Popular Area Codes
          </label>
          <div className="flex flex-wrap gap-2">
            {popularAreaCodes[searchCriteria.countryCode as keyof typeof popularAreaCodes]?.map((areaCode) => (
              <button
                key={areaCode}
                onClick={() => handleAreaCodeSelect(areaCode)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation
                  ${searchCriteria.areaCode === areaCode
                    ? 'bg-voxlink-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {areaCode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Advanced Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-voxlink-blue hover:text-blue-700"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area Code
              </label>
              <input
                type="text"
                placeholder="e.g., 212, 415"
                value={searchCriteria.areaCode}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, areaCode: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                placeholder="e.g., New York, San Francisco"
                value={searchCriteria.city}
                onChange={(e) => setSearchCriteria(prev => ({ ...prev, city: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Monthly Rate
                </label>
                <input
                  type="number"
                  placeholder="$10.00"
                  value={searchCriteria.maxMonthlyRate}
                  onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxMonthlyRate: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Setup Fee
                </label>
                <input
                  type="number"
                  placeholder="$5.00"
                  value={searchCriteria.maxSetupFee}
                  onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxSetupFee: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Features
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableFeatures.map((feature) => (
                  <label key={feature.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={searchCriteria.features.includes(feature.id)}
                      onChange={() => handleFeatureToggle(feature.id)}
                      className="mr-3 w-4 h-4 text-voxlink-blue focus:ring-voxlink-blue border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{feature.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSearch(searchCriteria)}
            disabled={isLoading}
            className="w-full py-3 bg-voxlink-blue text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 touch-manipulation"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </div>
            ) : (
              'Apply Filters'
            )}
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Search Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Numbers ({searchResults.length})
            </h3>
            {selectedNumbers.length > 0 && (
              <span className="text-sm text-voxlink-blue">
                {selectedNumbers.length} selected
              </span>
            )}
          </div>

          <div className="space-y-3">
            {searchResults.map((number) => (
              <MobileNumberCard
                key={number.phoneNumber}
                number={number}
                onReserve={onReserveNumber}
                isReserving={reservingNumber === number.phoneNumber}
                isSelected={selectedNumbers.includes(number.phoneNumber)}
                onSelect={handleNumberSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && !isLoading && !error && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Search for Numbers
          </h3>
          <p className="text-gray-500 mb-6">
            Enter an area code or city to find available phone numbers.
          </p>
        </div>
      )}
    </div>
  );
};

export default MobileNumberSearch;