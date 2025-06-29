
import React from 'react';
import { CheckCircle, Loader2, AlertCircle, Clock } from 'lucide-react';

export const getStatusIcon = (status: 'idle' | 'loading' | 'success' | 'error') => {
  switch (status) {
    case 'loading':
      return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
};
