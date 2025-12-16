import React, { useState } from 'react';
import { 
  Phone, 
  MapPin, 
  Star, 
  ShoppingCart, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Wifi,
  MessageSquare,
  Fax,
  Image
} from 'lucide-react';
import { useIsTouchDevice } from '../../hooks/useResponsive';

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

interface MobileNumberCardProps {
  number: AvailableNumber;
  onReserve: (phoneNumber: string) => void;
  isReserving?: boolean;
  isSelected?: boolean;
  onSelect?: (phoneNumber: string) => void;
}

const MobileNumberCard: React.FC<MobileNumberCardProps> = ({
  number,
  onReserve,
  isReserving = false,
  isSelected = false,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isTouchDevice = useIsTouchDevice();

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'voice':
        return <Phone className="w-3 h-3" />;
      case 'sms':
        return <MessageSquare className="w-3 h-3" />;
      case 'mms':
        return <Image className="w-3 h-3" />;
      case 'fax':
        return <Fax className="w-3 h-3" />;
      default:
        return <Wifi className="w-3 h-3" />;
    }
  };

  const handleCardPress = () => {
    if (isTouchDevice && onSelect) {
      onSelect(number.phoneNumber);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleReserveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReserve(number.phoneNumber);
  };

  return (
    <div 
      className={`
        border rounded-xl p-4 transition-all duration-200 
        ${isSelected ? 'border-voxlink-blue bg-blue-50' : 'border-gray-200 bg-white'}
        ${isTouchDevice ? 'active:scale-95' : 'hover:shadow-md'}
        touch-manipulation
      `}
      onClick={handleCardPress}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-charcoal truncate">
            {number.phoneNumber}
          </div>
          <div className="flex items-center text-sm text-slate mt-1">
            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{number.city}, {number.region}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-2">
          {number.score && (
            <div className="flex items-center text-amber-600">
              <Star className="w-4 h-4 mr-1 fill-current" />
              <span className="text-sm font-medium">{number.score}/5</span>
            </div>
          )}
          
          <button
            onClick={handleExpandToggle}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm">
          <span className="text-slate">Monthly: </span>
          <span className="font-semibold text-charcoal">{formatPrice(number.monthlyRate)}</span>
        </div>
        <div className="text-sm">
          <span className="text-slate">Setup: </span>
          <span className="font-semibold text-charcoal">{formatPrice(number.setupFee)}</span>
        </div>
      </div>

      {/* Features - Always visible on mobile */}
      <div className="flex flex-wrap gap-1 mb-4">
        {number.features.slice(0, 4).map((feature) => (
          <div
            key={feature}
            className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
          >
            {getFeatureIcon(feature)}
            <span className="ml-1">{feature}</span>
          </div>
        ))}
        {number.features.length > 4 && (
          <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
            +{number.features.length - 4} more
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t pt-3 mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate block">Country Code:</span>
              <span className="font-medium text-charcoal">{number.countryCode}</span>
            </div>
            <div>
              <span className="text-slate block">Area Code:</span>
              <span className="font-medium text-charcoal">{number.areaCode}</span>
            </div>
          </div>
          
          {number.features.length > 4 && (
            <div>
              <span className="text-slate text-sm block mb-2">All Features:</span>
              <div className="flex flex-wrap gap-1">
                {number.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                  >
                    {getFeatureIcon(feature)}
                    <span className="ml-1">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-slate mb-1">Total First Month Cost:</div>
            <div className="text-lg font-bold text-charcoal">
              {formatPrice(number.monthlyRate + number.setupFee)}
            </div>
            <div className="text-xs text-slate">
              Includes setup fee and first month
            </div>
          </div>
        </div>
      )}

      {/* Reserve Button */}
      <button
        onClick={handleReserveClick}
        disabled={isReserving}
        className={`
          w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all duration-200
          ${isReserving 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-voxlink-blue text-white hover:bg-blue-700 active:bg-blue-800'
          }
          touch-manipulation
          ${isTouchDevice ? 'active:scale-95' : ''}
        `}
      >
        {isReserving ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Reserving...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Reserve & Buy
          </div>
        )}
      </button>
    </div>
  );
};

export default MobileNumberCard;