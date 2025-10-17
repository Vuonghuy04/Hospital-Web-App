import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface JITCountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

const JITCountdownTimer: React.FC<JITCountdownTimerProps> = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds, total: difference });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onExpired) {
          onExpired();
        }
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  const isLowTime = timeLeft.total < 60000; // Less than 1 minute
  const isVeryLowTime = timeLeft.total < 30000; // Less than 30 seconds

  if (timeLeft.total <= 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium text-red-700">Access Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
      isVeryLowTime 
        ? 'bg-red-100 border-red-300' 
        : isLowTime 
        ? 'bg-yellow-100 border-yellow-300' 
        : 'bg-blue-100 border-blue-300'
    }`}>
      <Clock className={`h-4 w-4 ${
        isVeryLowTime 
          ? 'text-red-500' 
          : isLowTime 
          ? 'text-yellow-500' 
          : 'text-blue-500'
      }`} />
      <div className="flex items-center space-x-1">
        <span className={`text-sm font-mono font-medium ${
          isVeryLowTime 
            ? 'text-red-700' 
            : isLowTime 
            ? 'text-yellow-700' 
            : 'text-blue-700'
        }`}>
          {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
        <span className={`text-xs ${
          isVeryLowTime 
            ? 'text-red-600' 
            : isLowTime 
            ? 'text-yellow-600' 
            : 'text-blue-600'
        }`}>
          remaining
        </span>
      </div>
    </div>
  );
};

export default JITCountdownTimer;
