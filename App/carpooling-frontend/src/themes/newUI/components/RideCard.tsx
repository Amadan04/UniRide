import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, Star, DollarSign } from 'lucide-react';
import { CleanCard } from './CleanCard';
import { CleanButton } from './CleanButton';

interface RideCardProps {
  ride: {
    id?: string;
    driverName: string;
    driverRating: number;
    driverGender?: string;
    driverUniversity?: string;
    pickup: string;
    destination: string;
    date: string;
    time: string;
    seatsAvailable: number;
    cost: number;
    pickupType?: 'single' | 'multi' | 'both';
  };
  onJoin?: () => void;
  onViewDetails?: () => void;
  tag?: {
    label: string;
    color: 'red' | 'yellow' | 'green';
  };
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onJoin, onViewDetails, tag }) => {
  const tagColors = {
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-teal-50 border-teal-200 text-teal-700',
  };

  return (
    <CleanCard hoverable padding="lg" className="h-full flex flex-col">
      {/* Tags */}
      {tag && (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium mb-3 ${tagColors[tag.color]} w-fit`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {tag.label}
        </div>
      )}

      {/* Driver Info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3
            onClick={onViewDetails}
            className="text-lg font-semibold text-gray-900 hover:text-teal-600 cursor-pointer transition-colors"
          >
            {ride.driverName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{ride.driverRating.toFixed(1)}</span>
            </div>
            {ride.driverGender && (
              <span className="text-xs text-gray-500 capitalize">
                • {ride.driverGender}
              </span>
            )}
          </div>
          {ride.driverUniversity && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              🎓 {ride.driverUniversity}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-teal-600">{ride.cost} BHD</div>
          <div className="text-xs text-gray-500">per seat</div>
        </div>
      </div>

      {/* Route Info */}
      <div className="space-y-2.5 mb-4 flex-1">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="text-sm font-medium text-gray-900">{ride.pickup}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-500">To</p>
            <p className="text-sm font-medium text-gray-900">{ride.destination}</p>
          </div>
        </div>
      </div>

      {/* DateTime & Seats */}
      <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">{ride.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">{ride.time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-600">{ride.seatsAvailable} left</span>
        </div>
      </div>

      {/* Action Button */}
      <CleanButton
        variant="primary"
        fullWidth
        onClick={onJoin}
        disabled={ride.seatsAvailable <= 0}
      >
        {ride.seatsAvailable <= 0 ? 'Ride Full' : 'Join Ride'}
      </CleanButton>
    </CleanCard>
  );
};