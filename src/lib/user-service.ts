const BACKEND_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5002';

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  status: string;
  riskLevel: string;
  riskScore: number;
  lastActive: string;
  totalActivities: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  highRisk: number;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hospital/users`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch users');
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getUserStats = async (): Promise<UserStats> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hospital/users/stats`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch user stats');
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0,
      highRisk: 0
    };
  }
};

export const getDashboardMetrics = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hospital/dashboard-metrics`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch dashboard metrics');
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalActivities: 0,
      highRiskEvents: 0,
      averageRiskScore: 0
    };
  }
};

export const getRecentActivities = async (limit: number = 5) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hospital/activities?limit=${limit}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to fetch activities');
    }
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};
