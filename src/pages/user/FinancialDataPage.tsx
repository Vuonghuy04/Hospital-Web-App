import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView, trackButtonClick } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import JITAccessGuard from '../../components/JITAccessGuard';
import { 
  DollarSign, 
  Calendar, 
  User, 
  CreditCard, 
  Receipt, 
  TrendingUp,
  Download,
  Eye,
  Lock,
  AlertTriangle
} from 'lucide-react';

interface FinancialRecord {
  id: string;
  date: string;
  type: 'payment' | 'insurance' | 'refund' | 'billing';
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

const FinancialDataPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('financial_data');
  }, []);

  useEffect(() => {
    // Generate mock financial records
    const mockRecords: FinancialRecord[] = [
      {
        id: '1',
        date: '2024-08-25',
        type: 'payment',
        amount: 150.00,
        description: 'Office visit copay',
        status: 'paid',
        method: 'Credit Card'
      },
      {
        id: '2',
        date: '2024-08-20',
        type: 'insurance',
        amount: 1200.00,
        description: 'Lab work - insurance covered',
        status: 'paid',
        method: 'Insurance'
      },
      {
        id: '3',
        date: '2024-08-15',
        type: 'billing',
        amount: 75.00,
        description: 'Prescription medication',
        status: 'paid',
        method: 'Credit Card'
      },
      {
        id: '4',
        date: '2024-08-10',
        type: 'refund',
        amount: -25.00,
        description: 'Overpayment refund',
        status: 'paid',
        method: 'Check'
      }
    ];

    setTimeout(() => {
      setRecords(mockRecords);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <CreditCard className="h-5 w-5 text-blue-500" />;
      case 'insurance': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'refund': return <Receipt className="h-5 w-5 text-purple-500" />;
      case 'billing': return <DollarSign className="h-5 w-5 text-orange-500" />;
      default: return <DollarSign className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-white">
      <UnifiedHeader />
      
      <JITAccessGuard
        resourceType="finance"
        resourceId={`financial-${user?.username}`}
        resourceName={`Financial Data for ${user?.username}`}
        requiredRole="accountant"
        requiredAction="read"
        fallbackComponent={
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h1>
              <p className="text-red-700 mb-4">
                You don't have permission to access financial data. This area is restricted to accounting personnel only.
              </p>
              <p className="text-sm text-red-600">
                If you need to access this information, please contact your administrator or request access through the JIT system.
              </p>
            </div>
          </div>
        }
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Financial Data</h1>
            </div>
            <p className="text-gray-600">
              Your billing and payment information - Patient: {user?.username}
            </p>
          </div>

          {/* Patient Info Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
                  <p className="text-gray-600">Name: {user?.firstName} {user?.lastName}</p>
                  <p className="text-gray-600">Username: {user?.username}</p>
                  <p className="text-gray-600">Email: {user?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 text-green-600 mb-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-medium">Restricted Access</span>
                </div>
                <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Financial Records List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Financial Records</h2>
              <p className="text-gray-600 mt-1">
                Showing {records.length} records - Only authorized accounting personnel can access this information
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : records.length > 0 ? (
                records.map((record) => (
                  <div key={record.id} className="p-6 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTypeIcon(record.type)}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{record.description}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(record.date).toLocaleDateString()}</span>
                            </div>
                            <div className="text-gray-500">
                              {record.method}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(record.amount)}
                          </div>
                        </div>
                        <span className={getStatusBadge(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                        <button 
                          onClick={() => {
                            trackButtonClick('view_financial_record', 'financial_data');
                          }}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => {
                            trackButtonClick('download_financial_record', 'financial_data');
                          }}
                          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No financial records found</p>
                  <p className="text-sm">Your financial records will appear here once you have billing activity.</p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900">Privacy & Security</h3>
                <p className="text-sm text-green-800 mt-1">
                  Your financial information is protected by HIPAA regulations. Only authorized accounting personnel 
                  can access this information. All financial transactions are encrypted and audited.
                </p>
              </div>
            </div>
          </div>
        </div>
      </JITAccessGuard>
    </div>
  );
};

export default FinancialDataPage;
