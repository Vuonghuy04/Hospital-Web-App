#!/usr/bin/env python3
"""
Advanced Behavior Profiler
===========================

This module provides advanced behavior profiling capabilities using machine learning
to build comprehensive user profiles, detect anomalies, and provide behavioral insights.
"""

import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BehaviorProfiler:
    """
    Advanced behavior profiler that creates detailed user profiles and detects anomalies
    """
    
    def __init__(self):
        self.user_profiles = {}
        self.role_baselines = {}
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.cluster_model = KMeans(n_clusters=5, random_state=42)
        self.is_trained = False
        
        # Role-specific behavioral expectations
        self.role_expectations = {
            'doctor': {
                'typical_actions': ['access_patient_record', 'view_lab_results', 'create_prescription', 'update_diagnosis'],
                'peak_hours': list(range(8, 18)),  # 8 AM to 6 PM
                'risk_threshold': 0.4,
                'session_duration': {'min': 30, 'max': 180},
                'action_velocity': {'min': 2, 'max': 20}  # actions per hour
            },
            'nurse': {
                'typical_actions': ['update_patient_care', 'view_patient_record', 'medication_administration', 'vital_signs'],
                'peak_hours': list(range(6, 24)),  # 6 AM to midnight (shift work)
                'risk_threshold': 0.3,
                'session_duration': {'min': 15, 'max': 480},
                'action_velocity': {'min': 5, 'max': 30}
            },
            'admin': {
                'typical_actions': ['user_management', 'system_monitoring', 'audit_review', 'configuration_change'],
                'peak_hours': list(range(9, 17)),  # 9 AM to 5 PM
                'risk_threshold': 0.5,
                'session_duration': {'min': 60, 'max': 240},
                'action_velocity': {'min': 1, 'max': 15}
            },
            'manager': {
                'typical_actions': ['dashboard_view', 'report_generation', 'staff_management', 'analytics_review'],
                'peak_hours': list(range(9, 17)),
                'risk_threshold': 0.4,
                'session_duration': {'min': 45, 'max': 180},
                'action_velocity': {'min': 2, 'max': 12}
            },
            'user': {
                'typical_actions': ['view_appointment', 'view_records', 'update_profile', 'message_doctor'],
                'peak_hours': list(range(8, 21)),  # 8 AM to 9 PM
                'risk_threshold': 0.2,
                'session_duration': {'min': 5, 'max': 60},
                'action_velocity': {'min': 1, 'max': 10}
            }
        }
    
    def create_user_profile(self, user_data: pd.DataFrame) -> Dict:
        """
        Create a comprehensive behavior profile for a user
        """
        if user_data.empty:
            return {}
        
        user_id = user_data['username'].iloc[0]
        user_role = user_data['user_role'].iloc[0]
        
        logger.info(f"Creating behavior profile for user: {user_id}")
        
        # Basic statistics
        profile = {
            'user_id': user_id,
            'role': user_role,
            'profile_created': datetime.now().isoformat(),
            'data_points': len(user_data),
            'baseline_established': len(user_data) >= 50,  # Need minimum data for baseline
        }
        
        # Temporal patterns
        profile['temporal_patterns'] = self._analyze_temporal_patterns(user_data)
        
        # Action patterns
        profile['action_patterns'] = self._analyze_action_patterns(user_data)
        
        # Session patterns
        profile['session_patterns'] = self._analyze_session_patterns(user_data)
        
        # Risk patterns
        profile['risk_patterns'] = self._analyze_risk_patterns(user_data)
        
        # Peer comparison
        profile['peer_analysis'] = self._compare_with_peers(user_data, user_role)
        
        # Anomaly history
        profile['anomaly_history'] = self._analyze_anomaly_history(user_data)
        
        # Behavioral consistency
        profile['consistency_score'] = self._calculate_consistency_score(user_data, user_role)
        
        # Store profile
        self.user_profiles[user_id] = profile
        
        return profile
    
    def _analyze_temporal_patterns(self, user_data: pd.DataFrame) -> Dict:
        """
        Analyze temporal behavior patterns
        """
        # Convert timestamp to datetime if it's not already
        if 'timestamp' in user_data.columns:
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            user_data['hour'] = user_data['timestamp'].dt.hour
            user_data['day_of_week'] = user_data['timestamp'].dt.dayofweek
        
        patterns = {}
        
        # Hour distribution
        if 'hour' in user_data.columns:
            hour_counts = user_data['hour'].value_counts().sort_index()
            patterns['hourly_distribution'] = hour_counts.to_dict()
            patterns['peak_hours'] = hour_counts.nlargest(4).index.tolist()
            patterns['active_hours'] = hour_counts[hour_counts > hour_counts.mean()].index.tolist()
        
        # Day of week distribution
        if 'day_of_week' in user_data.columns:
            dow_counts = user_data['day_of_week'].value_counts().sort_index()
            patterns['daily_distribution'] = dow_counts.to_dict()
            patterns['most_active_days'] = dow_counts.nlargest(3).index.tolist()
        
        # Weekend vs weekday activity
        if 'is_weekend' in user_data.columns:
            weekend_activity = user_data['is_weekend'].mean()
            patterns['weekend_activity_ratio'] = float(weekend_activity)
        
        # Business hours activity
        if 'is_business_hours' in user_data.columns:
            business_hours_activity = user_data['is_business_hours'].mean()
            patterns['business_hours_ratio'] = float(business_hours_activity)
        
        return patterns
    
    def _analyze_action_patterns(self, user_data: pd.DataFrame) -> Dict:
        """
        Analyze action behavior patterns
        """
        patterns = {}
        
        if 'action' in user_data.columns:
            # Action frequency
            action_counts = user_data['action'].value_counts()
            patterns['action_frequency'] = action_counts.head(10).to_dict()
            patterns['unique_actions'] = int(user_data['action'].nunique())
            patterns['most_common_action'] = action_counts.index[0] if len(action_counts) > 0 else None
            
            # Action diversity (entropy)
            action_probs = action_counts / len(user_data)
            patterns['action_diversity'] = float(-np.sum(action_probs * np.log2(action_probs + 1e-10)))
            
            # Sensitive actions
            sensitive_keywords = ['admin', 'delete', 'export', 'audit', 'config']
            sensitive_actions = user_data[user_data['action'].str.contains('|'.join(sensitive_keywords), case=False, na=False)]
            patterns['sensitive_action_ratio'] = len(sensitive_actions) / len(user_data)
            
            # Failed actions
            if 'is_failed_action' in user_data.columns:
                patterns['failure_rate'] = float(user_data['is_failed_action'].mean())
        
        return patterns
    
    def _analyze_session_patterns(self, user_data: pd.DataFrame) -> Dict:
        """
        Analyze session behavior patterns
        """
        patterns = {}
        
        if 'session_period' in user_data.columns:
            session_data = user_data['session_period']
            patterns['avg_session_duration'] = float(session_data.mean())
            patterns['median_session_duration'] = float(session_data.median())
            patterns['max_session_duration'] = float(session_data.max())
            patterns['session_duration_std'] = float(session_data.std())
        
        if 'session_length_category' in user_data.columns:
            session_categories = user_data['session_length_category'].value_counts()
            patterns['session_length_distribution'] = session_categories.to_dict()
        
        # Actions per session (approximate)
        if 'session_period' in user_data.columns and len(user_data) > 0:
            # Group by session periods to estimate actions per session
            session_groups = user_data.groupby('session_period').size()
            patterns['avg_actions_per_session'] = float(session_groups.mean())
            patterns['max_actions_per_session'] = int(session_groups.max())
        
        return patterns
    
    def _analyze_risk_patterns(self, user_data: pd.DataFrame) -> Dict:
        """
        Analyze risk behavior patterns
        """
        patterns = {}
        
        if 'risk_score' in user_data.columns:
            risk_data = user_data['risk_score']
            patterns['avg_risk_score'] = float(risk_data.mean())
            patterns['max_risk_score'] = float(risk_data.max())
            patterns['risk_score_std'] = float(risk_data.std())
            
            # Risk level distribution
            if 'risk_level' in user_data.columns:
                risk_levels = user_data['risk_level'].value_counts()
                patterns['risk_level_distribution'] = risk_levels.to_dict()
                patterns['high_risk_ratio'] = float((user_data['risk_level'] == 'high').mean())
        
        # Time-based risk patterns
        if 'timestamp' in user_data.columns and 'risk_score' in user_data.columns:
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            user_data['hour'] = user_data['timestamp'].dt.hour
            
            # Risk by hour
            hourly_risk = user_data.groupby('hour')['risk_score'].mean()
            patterns['hourly_risk_pattern'] = hourly_risk.to_dict()
            patterns['highest_risk_hours'] = hourly_risk.nlargest(3).index.tolist()
        
        return patterns
    
    def _compare_with_peers(self, user_data: pd.DataFrame, user_role: str) -> Dict:
        """
        Compare user behavior with role-based peers
        """
        analysis = {
            'role': user_role,
            'peer_group_size': 0,  # Would be calculated from actual peer data
            'consistency_with_role': 0.0,
            'outlier_score': 0.0,
            'risk_percentile': 50.0
        }
        
        # Get role expectations
        role_exp = self.role_expectations.get(user_role, {})
        if not role_exp:
            return analysis
        
        # Compare with role expectations
        consistency_factors = []
        
        # Temporal consistency
        if 'hour' in user_data.columns:
            user_hours = set(user_data['hour'].unique())
            expected_hours = set(role_exp.get('peak_hours', []))
            if expected_hours:
                temporal_consistency = len(user_hours.intersection(expected_hours)) / len(expected_hours)
                consistency_factors.append(temporal_consistency)
        
        # Action consistency
        if 'action' in user_data.columns:
            user_actions = set(user_data['action'].unique())
            expected_actions = set(role_exp.get('typical_actions', []))
            if expected_actions:
                action_consistency = len([action for action in user_actions 
                                        if any(exp in action for exp in expected_actions)]) / len(expected_actions)
                consistency_factors.append(action_consistency)
        
        # Risk consistency
        if 'risk_score' in user_data.columns:
            avg_risk = user_data['risk_score'].mean()
            expected_risk = role_exp.get('risk_threshold', 0.3)
            risk_consistency = 1 - abs(avg_risk - expected_risk) / expected_risk
            consistency_factors.append(max(0, risk_consistency))
        
        # Calculate overall consistency
        if consistency_factors:
            analysis['consistency_with_role'] = float(np.mean(consistency_factors))
            analysis['outlier_score'] = 1 - analysis['consistency_with_role']
        
        return analysis
    
    def _analyze_anomaly_history(self, user_data: pd.DataFrame) -> Dict:
        """
        Analyze historical anomalies
        """
        history = {
            'total_anomalies': 0,
            'anomaly_rate': 0.0,
            'anomaly_types': {},
            'recent_anomalies': []
        }
        
        # This would analyze actual anomaly data if available
        # For now, we'll estimate based on risk scores and patterns
        
        if 'risk_score' in user_data.columns:
            high_risk_threshold = 0.7
            high_risk_events = user_data[user_data['risk_score'] > high_risk_threshold]
            
            history['total_anomalies'] = len(high_risk_events)
            history['anomaly_rate'] = len(high_risk_events) / len(user_data) if len(user_data) > 0 else 0
            
            # Recent anomalies (last 7 days)
            if 'timestamp' in user_data.columns:
                user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
                recent_cutoff = datetime.now() - timedelta(days=7)
                recent_anomalies = high_risk_events[high_risk_events['timestamp'] > recent_cutoff]
                history['recent_anomalies'] = len(recent_anomalies)
        
        return history
    
    def _calculate_consistency_score(self, user_data: pd.DataFrame, user_role: str) -> float:
        """
        Calculate behavioral consistency score
        """
        if len(user_data) < 10:  # Not enough data
            return 0.5
        
        consistency_factors = []
        
        # Temporal consistency (how consistent are the activity hours)
        if 'hour' in user_data.columns:
            hour_std = user_data['hour'].std()
            temporal_consistency = 1 / (1 + hour_std / 12)  # Normalize by max possible std
            consistency_factors.append(temporal_consistency)
        
        # Action consistency (how repetitive are the actions)
        if 'action' in user_data.columns:
            action_counts = user_data['action'].value_counts()
            action_entropy = -np.sum((action_counts / len(user_data)) * np.log2(action_counts / len(user_data) + 1e-10))
            max_entropy = np.log2(len(action_counts))
            action_consistency = 1 - (action_entropy / max_entropy) if max_entropy > 0 else 1
            consistency_factors.append(action_consistency)
        
        # Risk consistency (how stable is the risk profile)
        if 'risk_score' in user_data.columns:
            risk_std = user_data['risk_score'].std()
            risk_consistency = 1 / (1 + risk_std)  # Lower std = higher consistency
            consistency_factors.append(risk_consistency)
        
        # Session consistency
        if 'session_period' in user_data.columns:
            session_std = user_data['session_period'].std()
            session_consistency = 1 / (1 + session_std / 60)  # Normalize by hour
            consistency_factors.append(session_consistency)
        
        return float(np.mean(consistency_factors)) if consistency_factors else 0.5
    
    def detect_behavioral_anomalies(self, user_data: pd.DataFrame, user_profile: Dict = None) -> List[Dict]:
        """
        Detect behavioral anomalies for a user
        """
        anomalies = []
        
        if len(user_data) == 0:
            return anomalies
        
        # Get user profile if not provided
        if user_profile is None:
            user_id = user_data['username'].iloc[0]
            user_profile = self.user_profiles.get(user_id, {})
        
        # Temporal anomalies
        temporal_anomalies = self._detect_temporal_anomalies(user_data, user_profile)
        anomalies.extend(temporal_anomalies)
        
        # Volume anomalies
        volume_anomalies = self._detect_volume_anomalies(user_data, user_profile)
        anomalies.extend(volume_anomalies)
        
        # Sequence anomalies
        sequence_anomalies = self._detect_sequence_anomalies(user_data, user_profile)
        anomalies.extend(sequence_anomalies)
        
        # Risk anomalies
        risk_anomalies = self._detect_risk_anomalies(user_data, user_profile)
        anomalies.extend(risk_anomalies)
        
        return anomalies
    
    def _detect_temporal_anomalies(self, user_data: pd.DataFrame, user_profile: Dict) -> List[Dict]:
        """
        Detect temporal behavioral anomalies
        """
        anomalies = []
        
        if 'hour' not in user_data.columns or not user_profile:
            return anomalies
        
        # Get expected active hours from profile
        temporal_patterns = user_profile.get('temporal_patterns', {})
        active_hours = set(temporal_patterns.get('active_hours', []))
        
        if not active_hours:
            return anomalies
        
        # Check for activity outside normal hours
        recent_data = user_data.tail(10)  # Last 10 actions
        for _, row in recent_data.iterrows():
            if row['hour'] not in active_hours:
                anomalies.append({
                    'type': 'temporal',
                    'severity': 'medium',
                    'description': f"Activity at unusual hour: {row['hour']}:00",
                    'timestamp': row.get('timestamp', ''),
                    'confidence': 0.7,
                    'context': {
                        'actual_hour': int(row['hour']),
                        'expected_hours': list(active_hours)
                    }
                })
        
        return anomalies
    
    def _detect_volume_anomalies(self, user_data: pd.DataFrame, user_profile: Dict) -> List[Dict]:
        """
        Detect volume-based anomalies
        """
        anomalies = []
        
        if len(user_data) < 5:
            return anomalies
        
        # Check for unusual session duration
        if 'session_period' in user_data.columns:
            session_patterns = user_profile.get('session_patterns', {})
            avg_session = session_patterns.get('avg_session_duration', 60)
            
            recent_sessions = user_data['session_period'].tail(5)
            for session_duration in recent_sessions:
                if session_duration > avg_session * 3:  # 3x longer than average
                    anomalies.append({
                        'type': 'volume',
                        'severity': 'medium',
                        'description': f"Unusually long session: {session_duration} minutes",
                        'confidence': 0.8,
                        'context': {
                            'actual_duration': float(session_duration),
                            'expected_avg': float(avg_session)
                        }
                    })
        
        # Check for high action frequency
        if 'timestamp' in user_data.columns:
            user_data['timestamp'] = pd.to_datetime(user_data['timestamp'])
            recent_hour = user_data[user_data['timestamp'] > (datetime.now() - timedelta(hours=1))]
            
            if len(recent_hour) > 50:  # More than 50 actions in an hour
                anomalies.append({
                    'type': 'volume',
                    'severity': 'high',
                    'description': f"High action frequency: {len(recent_hour)} actions in last hour",
                    'confidence': 0.9,
                    'context': {
                        'action_count': len(recent_hour),
                        'time_window': '1 hour'
                    }
                })
        
        return anomalies
    
    def _detect_sequence_anomalies(self, user_data: pd.DataFrame, user_profile: Dict) -> List[Dict]:
        """
        Detect sequence-based anomalies
        """
        anomalies = []
        
        if 'action' not in user_data.columns or len(user_data) < 5:
            return anomalies
        
        # Get common action patterns from profile
        action_patterns = user_profile.get('action_patterns', {})
        common_actions = set(action_patterns.get('action_frequency', {}).keys())
        
        if not common_actions:
            return anomalies
        
        # Check recent actions against common patterns
        recent_actions = user_data['action'].tail(5).tolist()
        unusual_actions = [action for action in recent_actions if action not in common_actions]
        
        if len(unusual_actions) > 2:  # More than 2 unusual actions in recent sequence
            anomalies.append({
                'type': 'sequence',
                'severity': 'medium',
                'description': f"Unusual action sequence detected",
                'confidence': 0.6,
                'context': {
                    'unusual_actions': unusual_actions,
                    'recent_sequence': recent_actions
                }
            })
        
        return anomalies
    
    def _detect_risk_anomalies(self, user_data: pd.DataFrame, user_profile: Dict) -> List[Dict]:
        """
        Detect risk-based anomalies
        """
        anomalies = []
        
        if 'risk_score' not in user_data.columns:
            return anomalies
        
        # Get risk patterns from profile
        risk_patterns = user_profile.get('risk_patterns', {})
        avg_risk = risk_patterns.get('avg_risk_score', 0.3)
        risk_std = risk_patterns.get('risk_score_std', 0.1)
        
        # Check for risk spikes
        recent_risks = user_data['risk_score'].tail(5)
        for risk_score in recent_risks:
            if risk_score > avg_risk + (2 * risk_std):  # 2 standard deviations above average
                anomalies.append({
                    'type': 'risk',
                    'severity': 'high' if risk_score > 0.8 else 'medium',
                    'description': f"Risk score spike: {risk_score:.2f}",
                    'confidence': 0.85,
                    'context': {
                        'actual_risk': float(risk_score),
                        'expected_avg': float(avg_risk),
                        'threshold': float(avg_risk + (2 * risk_std))
                    }
                })
        
        return anomalies
    
    def generate_profile_insights(self, user_id: str) -> Dict:
        """
        Generate actionable insights from user behavior profile
        """
        profile = self.user_profiles.get(user_id, {})
        if not profile:
            return {'error': 'Profile not found'}
        
        insights = {
            'user_id': user_id,
            'profile_health': 'good',
            'recommendations': [],
            'security_alerts': [],
            'optimization_suggestions': []
        }
        
        # Analyze profile health
        consistency_score = profile.get('consistency_score', 0.5)
        if consistency_score < 0.3:
            insights['profile_health'] = 'poor'
            insights['recommendations'].append("User behavior is highly inconsistent. Consider additional monitoring.")
        elif consistency_score < 0.6:
            insights['profile_health'] = 'fair'
            insights['recommendations'].append("User behavior shows some inconsistencies. Monitor for patterns.")
        
        # Security insights
        risk_patterns = profile.get('risk_patterns', {})
        high_risk_ratio = risk_patterns.get('high_risk_ratio', 0)
        if high_risk_ratio > 0.2:
            insights['security_alerts'].append(f"High risk activity ratio: {high_risk_ratio:.1%}")
        
        # Peer comparison insights
        peer_analysis = profile.get('peer_analysis', {})
        outlier_score = peer_analysis.get('outlier_score', 0)
        if outlier_score > 0.7:
            insights['security_alerts'].append("User behavior significantly differs from role peers")
        
        # Optimization suggestions
        temporal_patterns = profile.get('temporal_patterns', {})
        business_hours_ratio = temporal_patterns.get('business_hours_ratio', 0.5)
        if business_hours_ratio < 0.3:
            insights['optimization_suggestions'].append("Consider restricting off-hours access")
        
        return insights
    
    def save_profile(self, user_id: str, filepath: str = None):
        """
        Save user profile to file
        """
        if user_id not in self.user_profiles:
            logger.error(f"Profile not found for user: {user_id}")
            return False
        
        if filepath is None:
            filepath = f"../data/profiles/{user_id}_profile.pkl"
        
        try:
            with open(filepath, 'wb') as f:
                pickle.dump(self.user_profiles[user_id], f)
            logger.info(f"Profile saved for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to save profile for {user_id}: {e}")
            return False
    
    def load_profile(self, user_id: str, filepath: str = None):
        """
        Load user profile from file
        """
        if filepath is None:
            filepath = f"../data/profiles/{user_id}_profile.pkl"
        
        try:
            with open(filepath, 'rb') as f:
                self.user_profiles[user_id] = pickle.load(f)
            logger.info(f"Profile loaded for user: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to load profile for {user_id}: {e}")
            return False

# Example usage and testing
if __name__ == "__main__":
    # Initialize profiler
    profiler = BehaviorProfiler()
    
    # Load sample data (you would replace this with actual data loading)
    try:
        sample_data = pd.read_csv("hospital_behavior_dataset_20250920_161714.csv")
        
        # Create profiles for a few users
        users = sample_data['username'].unique()[:5]  # First 5 users
        
        for user in users:
            user_data = sample_data[sample_data['username'] == user]
            profile = profiler.create_user_profile(user_data)
            
            print(f"\n=== Profile for {user} ===")
            print(f"Role: {profile.get('role', 'unknown')}")
            print(f"Data points: {profile.get('data_points', 0)}")
            print(f"Consistency score: {profile.get('consistency_score', 0):.2f}")
            
            # Detect anomalies
            anomalies = profiler.detect_behavioral_anomalies(user_data, profile)
            print(f"Anomalies detected: {len(anomalies)}")
            
            # Generate insights
            insights = profiler.generate_profile_insights(user)
            print(f"Profile health: {insights.get('profile_health', 'unknown')}")
            
            if len(anomalies) > 0:
                print("Recent anomalies:")
                for anomaly in anomalies[:3]:  # Show first 3
                    print(f"  - {anomaly['type']}: {anomaly['description']}")
    
    except FileNotFoundError:
        print("Sample data file not found. Please ensure the CSV file is available.")
    except Exception as e:
        print(f"Error running example: {e}")
