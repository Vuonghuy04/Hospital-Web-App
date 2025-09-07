import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/MockAuthContext';
import { trackPageView } from '../../services/behaviorTracking';
import UnifiedHeader from '../../components/UnifiedHeader';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone,
  Plus,
  Edit,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Appointment {
  id: string;
  date: string;
  time: string;
  doctor: string;
  department: string;
  location: string;
  type: 'consultation' | 'follow_up' | 'procedure' | 'lab_work' | 'imaging';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

const AppointmentsPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackPageView('appointments');
  }, []);

  useEffect(() => {
    // Generate mock appointments
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        date: '2024-09-05',
        time: '10:00 AM',
        doctor: 'Dr. Sarah Johnson',
        department: 'Internal Medicine',
        location: 'Room 205, Building A',
        type: 'follow_up',
        status: 'scheduled',
        notes: 'Follow-up for blood pressure monitoring'
      },
      {
        id: '2',
        date: '2024-09-12',
        time: '2:30 PM',
        doctor: 'Dr. Michael Chen',
        department: 'Laboratory',
        location: 'Lab Suite 1, Building B',
        type: 'lab_work',
        status: 'confirmed',
        notes: 'Quarterly blood work and lipid panel'
      },
      {
        id: '3',
        date: '2024-08-28',
        time: '9:15 AM',
        doctor: 'Dr. Robert Wilson',
        department: 'Radiology',
        location: 'Imaging Center, Building C',
        type: 'imaging',
        status: 'completed',
        notes: 'Chest X-ray completed successfully'
      },
      {
        id: '4',
        date: '2024-09-20',
        time: '11:30 AM',
        doctor: 'Dr. Emily Davis',
        department: 'Cardiology',
        location: 'Room 301, Building A',
        type: 'consultation',
        status: 'scheduled',
        notes: 'Initial cardiology consultation'
      },
      {
        id: '5',
        date: '2024-08-15',
        time: '3:00 PM',
        doctor: 'Dr. Sarah Johnson',
        department: 'Internal Medicine',
        location: 'Room 205, Building A',
        type: 'consultation',
        status: 'cancelled',
        notes: 'Cancelled due to doctor emergency'
      }
    ];

    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 1000);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow_up': return 'bg-green-100 text-green-800';
      case 'procedure': return 'bg-purple-100 text-purple-800';
      case 'lab_work': return 'bg-yellow-100 text-yellow-800';
      case 'imaging': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <X className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`;
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.date) >= new Date() && ['scheduled', 'confirmed'].includes(apt.status)
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.date) < new Date() || ['completed', 'cancelled'].includes(apt.status)
  );

  return (
    <div className="min-h-screen bg-white">
      <UnifiedHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              </div>
              <p className="text-gray-600">
                Manage your healthcare appointments - Patient: {user?.username}
              </p>
            </div>
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Plus className="h-4 w-4" />
              <span>Schedule New</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-green-600">
                  {appointments.filter(apt => new Date(apt.date).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-600">
                  {appointments.filter(apt => apt.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {appointments.filter(apt => apt.status === 'cancelled').length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Appointments</h2>
            <p className="text-gray-600 mt-1">Your scheduled and confirmed appointments</p>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))
            ) : upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {appointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(appointment.type)}`}>
                            {appointment.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{appointment.doctor}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.location}</span>
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-gray-700 mt-2 text-sm">{appointment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(appointment.status)}
                        <span className={getStatusBadge(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                        <Edit className="h-4 w-4" />
                        <span>Reschedule</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No upcoming appointments</p>
                <p className="text-sm">Schedule your next appointment to maintain your health.</p>
              </div>
            )}
          </div>
        </div>

        {/* Past Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Past Appointments</h2>
            <p className="text-gray-600 mt-1">Your appointment history</p>
          </div>

          <div className="divide-y divide-gray-200">
            {pastAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      {getStatusIcon(appointment.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <span className={getStatusBadge(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                        <span>{appointment.doctor}</span>
                        <span>{appointment.department}</span>
                      </div>
                      {appointment.notes && (
                        <p className="text-gray-700 mt-2 text-sm">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Need to reschedule or have questions?</h3>
              <p className="text-sm text-blue-800 mt-1">
                Call us at (555) 123-4567 or use the patient portal to manage your appointments. 
                Admins cannot access your personal appointment details for privacy protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
