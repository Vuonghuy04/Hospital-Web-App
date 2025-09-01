import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView, trackRecordAccess, trackButtonClick } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import { 
  FileText, 
  Calendar, 
  User, 
  Heart, 
  Thermometer, 
  Activity,
  Download,
  Eye,
  Lock
} from 'lucide-react';

interface MedicalRecord {
  id: string;
  date: string;
  type: 'consultation' | 'lab_result' | 'prescription' | 'imaging' | 'surgery';
  title: string;
  doctor: string;
  summary: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const MedicalRecordsPage = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('medical_records');
  }, []);

  useEffect(() => {
    // Generate mock medical records
    const mockRecords: MedicalRecord[] = [
      {
        id: '1',
        date: '2024-08-25',
        type: 'consultation',
        title: 'Annual Physical Examination',
        doctor: 'Dr. Sarah Johnson',
        summary: 'Routine checkup - all vitals normal, blood pressure 120/80, weight stable.',
        status: 'completed'
      },
      {
        id: '2',
        date: '2024-08-20',
        type: 'lab_result',
        title: 'Blood Work - Complete Panel',
        doctor: 'Dr. Michael Chen',
        summary: 'Complete blood count, lipid panel, glucose levels - all within normal ranges.',
        status: 'completed'
      },
      {
        id: '3',
        date: '2024-08-15',
        type: 'prescription',
        title: 'Medication Renewal',
        doctor: 'Dr. Sarah Johnson',
        summary: 'Renewed prescription for blood pressure medication - Lisinopril 10mg daily.',
        status: 'completed'
      },
      {
        id: '4',
        date: '2024-08-10',
        type: 'imaging',
        title: 'Chest X-Ray',
        doctor: 'Dr. Robert Wilson',
        summary: 'Chest X-ray ordered due to persistent cough - results show clear lungs.',
        status: 'completed'
      },
      {
        id: '5',
        date: '2024-09-05',
        type: 'consultation',
        title: 'Follow-up Appointment',
        doctor: 'Dr. Sarah Johnson',
        summary: 'Scheduled follow-up to review recent lab results and medication effectiveness.',
        status: 'pending'
      }
    ];

    setTimeout(() => {
      setRecords(mockRecords);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <User className="h-5 w-5 text-blue-500" />;
      case 'lab_result': return <Activity className="h-5 w-5 text-green-500" />;
      case 'prescription': return <Heart className="h-5 w-5 text-red-500" />;
      case 'imaging': return <Eye className="h-5 w-5 text-purple-500" />;
      case 'surgery': return <Thermometer className="h-5 w-5 text-orange-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          </div>
          <p className="text-gray-600">
            Your complete medical history and health records - Patient: {user?.username}
          </p>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
                <p className="text-gray-600">Name: {user?.firstName} {user?.lastName}</p>
                <p className="text-gray-600">Username: {user?.username}</p>
                <p className="text-gray-600">Email: {user?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-green-600 mb-2">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">HIPAA Protected</span>
              </div>
              <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Medical Records</h2>
            <p className="text-gray-600 mt-1">
              Showing {records.length} records - Only you and your healthcare providers can access this information
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
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
                <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getTypeIcon(record.type)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{record.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(record.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{record.doctor}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 mt-2">{record.summary}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={getStatusBadge(record.status)}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                      <button 
                        onClick={() => {
                          trackRecordAccess(`consultation-${consultation.id}`);
                          trackButtonClick('view_consultation', 'medical_records');
                        }}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button 
                        onClick={() => {
                          trackButtonClick('download_consultation', 'medical_records');
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
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No medical records found</p>
                <p className="text-sm">Your medical records will appear here once you have appointments or procedures.</p>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Privacy & Security</h3>
              <p className="text-sm text-blue-800 mt-1">
                Your medical records are protected by HIPAA regulations. Only you and authorized healthcare providers 
                can access this information. Administrators cannot view your personal medical records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalRecordsPage;
