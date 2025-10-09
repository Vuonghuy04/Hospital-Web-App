#!/usr/bin/env python3
"""
Hospital Web App - Mock Data Generator for ML Training
=====================================================

This script generates realistic mock data based on the actual database schema
and risk scoring logic from the Hospital Web Application.

Database Schema: PostgreSQL table 'user_behavior'
Target: ML model training for risk score prediction
"""

import pandas as pd
import numpy as np
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse

# === CONFIGURATION BASED ON ACTUAL SYSTEM ===

# User roles from the actual system
USER_ROLES = [
    'admin', 'manager', 'doctor', 'nurse', 
    'contractor', 'accountant', 'employee', 'guest'
]

# Actions from actual system behavior tracking
ACTIONS = [
    'user_login', 'user_logout', 'page_view_home', 'page_view_dashboard',
    'page_view_user_dashboard', 'page_view_admin_dashboard', 'page_view_medical_records',
    'page_view_financial_data', 'page_view_prescriptions', 'page_view_appointments',
    'navigate_to_admin', 'navigate_to_medical', 'navigate_to_finance',
    'click_nav_medical_header', 'click_nav_financial_header', 'click_nav_admin_header',
    'access_patient_record', 'access_financial_report', 'access_audit_log',
    'failed_login_attempt', 'password_reset_request', 'account_locked',
    'suspicious_activity_detected', 'classified_data_access', 'jit_request',
    'policy_violation', 'unauthorized_access_attempt'
]

# IP addresses for geographic diversity (realistic IP ranges)
IP_ADDRESSES = {
    'Vietnam': ['210.5.32.146', '210.5.32.147', '210.5.32.148', '27.72.59.12', '27.72.59.13'],
    'Nigeria': ['41.203.72.5', '41.203.72.6', '41.203.72.7', '105.112.96.12', '105.112.96.13'],
    'US': ['192.168.1.100', '192.168.1.101', '10.0.0.50', '10.0.0.51', '172.16.0.10'],
    'UK': ['81.2.69.142', '81.2.69.143', '81.2.69.144', '86.1.2.3', '86.1.2.4'],
    'Canada': ['24.114.123.45', '24.114.123.46', '24.114.123.47', '99.240.1.2', '99.240.1.3'],
    'Australia': ['1.128.0.1', '1.128.0.2', '1.128.0.3', '203.1.1.1', '203.1.1.2'],
    'Germany': ['84.16.230.43', '84.16.230.44', '84.16.230.45', '91.64.1.1', '91.64.1.2'],
    'France': ['82.67.166.1', '82.67.166.2', '82.67.166.3', '90.84.1.1', '90.84.1.2'],
    'Japan': ['126.1.1.1', '126.1.1.2', '126.1.1.3', '133.1.1.1', '133.1.1.2'],
    'Singapore': ['8.8.8.8', '8.8.8.9', '8.8.8.10', '103.1.1.1', '103.1.1.2'],
    'India': ['117.239.195.1', '117.239.195.2', '117.239.195.3', '106.51.1.1', '106.51.1.2'],
    'Brazil': ['177.1.1.1', '177.1.1.2', '177.1.1.3', '201.1.1.1', '201.1.1.2']
}

# Device types from user agent analysis
DEVICE_TYPES = ['desktop', 'mobile', 'tablet', 'new', 'known']

# Risk levels from actual system
RISK_LEVELS = ['low', 'medium', 'high', 'critical']

# Base risk scores by role (from risk-service.js)
BASE_RISK_SCORES = {
    'admin': 30, 'manager': 30, 'doctor': 25, 'nurse': 20,
    'contractor': 35, 'accountant': 30, 'employee': 30, 'guest': 40
}

# Risk factors (from risk-service.js)
RISK_FACTORS = {
    'FAILED_LOGIN': 15,
    'UNUSUAL_LOCATION': 10,
    'UNUSUAL_DEVICE': 10,
    'OUTSIDE_BUSINESS_HOURS': 5,
    'SENSITIVE_PAGE_ACCESS': 10,
    'SUSPICIOUS_BEHAVIOR': 20,
    'RAPID_NAVIGATION': 5,
    'MULTIPLE_FAILED_ATTEMPTS': 25,
    'CLASSIFIED_DATA_ACCESS': 45  # Sets risk to 75
}

# Sensitive pages that increase risk
SENSITIVE_PAGES = [
    '/dashboard/users/management', '/dashboard/policies',
    '/dashboard/access-control', '/dashboard/audit',
    '/dashboard/behavioral-monitoring', '/admin', '/financial-reports'
]

class HospitalDataGenerator:
    def __init__(self, num_records: int = 10000):
        self.num_records = num_records
        self.users = self._generate_users()
        
    def _generate_users(self) -> List[Dict]:
        """Generate realistic user profiles"""
        users = []
        user_count_by_role = {
            'admin': 2, 'manager': 5, 'doctor': 20, 'nurse': 30,
            'contractor': 8, 'accountant': 10, 'employee': 15, 'guest': 10
        }
        
        user_id = 1
        for role, count in user_count_by_role.items():
            for i in range(count):
                # Choose typical location and IP for this user
                typical_region = random.choice(list(IP_ADDRESSES.keys())[:6])  # More likely local regions
                typical_ip = random.choice(IP_ADDRESSES[typical_region])
                
                users.append({
                    'user_id': f"{role}_{user_id:03d}",
                    'username': f"{role}_{user_id:03d}",
                    'email': f"{role}_{user_id:03d}@hospital.com",
                    'role': role,
                    'typical_region': typical_region,
                    'typical_ip': typical_ip,
                    'typical_device': random.choice(['desktop', 'mobile']),
                    'risk_profile': random.choice(['low', 'medium', 'high'])
                })
                user_id += 1
        return users
    
    def _calculate_risk_score(self, user: Dict, action: str, hour: int, 
                            ip_address: str, device_type: str, session_period: int) -> float:
        """Calculate risk score based on actual system logic"""
        base_risk = BASE_RISK_SCORES.get(user['role'], 30)
        additional_risk = 0
        
        # Failed login
        if 'failed' in action.lower() or 'unauthorized' in action.lower():
            additional_risk += RISK_FACTORS['FAILED_LOGIN']
        
        # Unusual location (check if IP is from different region)
        if ip_address != user['typical_ip']:
            additional_risk += RISK_FACTORS['UNUSUAL_LOCATION']
        
        # Unusual device
        if device_type != user['typical_device'] or device_type == 'new':
            additional_risk += RISK_FACTORS['UNUSUAL_DEVICE']
        
        # Outside business hours (9 AM - 5 PM)
        if hour < 9 or hour > 17:
            additional_risk += RISK_FACTORS['OUTSIDE_BUSINESS_HOURS']
        
        # Sensitive page access (for non-privileged users)
        if user['role'] not in ['admin', 'manager'] and any(page in action for page in SENSITIVE_PAGES):
            additional_risk += RISK_FACTORS['SENSITIVE_PAGE_ACCESS']
        
        # Classified data access
        if 'classified' in action.lower():
            return 0.75  # Force to 75%
        
        # Suspicious behavior
        if 'suspicious' in action.lower() or 'violation' in action.lower():
            additional_risk += RISK_FACTORS['SUSPICIOUS_BEHAVIOR']
        
        # Session-based risk (long sessions might be suspicious)
        if session_period > 480:  # 8 hours
            additional_risk += RISK_FACTORS['RAPID_NAVIGATION']
        
        # User's inherent risk profile
        if user['risk_profile'] == 'high':
            additional_risk += 10
        elif user['risk_profile'] == 'medium':
            additional_risk += 5
        
        # Calculate final risk (0-1 scale)
        total_risk = base_risk + additional_risk
        return min(1.0, max(0.0, total_risk / 100.0))
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Convert risk score to risk level"""
        if risk_score >= 0.75:
            return 'critical'
        elif risk_score >= 0.5:
            return 'high'
        elif risk_score >= 0.25:
            return 'medium'
        else:
            return 'low'
    
    def _generate_realistic_patterns(self) -> List[Dict]:
        """Generate realistic user behavior patterns"""
        records = []
        
        for _ in range(self.num_records):
            user = random.choice(self.users)
            
            # Generate timestamp (last 30 days)
            timestamp = datetime.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59),
                seconds=random.randint(0, 59)
            )
            
            hour = timestamp.hour
            
            # Choose action based on user role and time
            if user['role'] in ['admin', 'manager']:
                action = random.choice([
                    'user_login', 'page_view_admin_dashboard', 'navigate_to_admin',
                    'access_audit_log', 'page_view_dashboard', 'user_logout'
                ])
            elif user['role'] in ['doctor', 'nurse']:
                action = random.choice([
                    'user_login', 'page_view_medical_records', 'access_patient_record',
                    'page_view_prescriptions', 'click_nav_medical_header', 'user_logout'
                ])
            elif user['role'] in ['contractor', 'accountant']:
                action = random.choice([
                    'user_login', 'page_view_financial_data', 'access_financial_report',
                    'click_nav_financial_header', 'user_logout'
                ])
            else:
                action = random.choice([
                    'user_login', 'page_view_home', 'page_view_dashboard', 'user_logout'
                ])
            
            # Add some suspicious activities (5% chance)
            if random.random() < 0.05:
                action = random.choice([
                    'failed_login_attempt', 'unauthorized_access_attempt',
                    'suspicious_activity_detected', 'policy_violation'
                ])
            
            # Add some classified data access (2% chance for privileged users)
            if user['role'] in ['admin', 'manager', 'doctor'] and random.random() < 0.02:
                action = 'classified_data_access'
            
            # Geographic and device selection
            if random.random() < 0.8:  # 80% chance of typical IP
                ip_address = user['typical_ip']
            else:
                # Choose random IP from any region
                random_region = random.choice(list(IP_ADDRESSES.keys()))
                ip_address = random.choice(IP_ADDRESSES[random_region])
            
            if random.random() < 0.9:  # 90% chance of typical device
                device_type = user['typical_device']
            else:
                device_type = random.choice(DEVICE_TYPES)
            
            # Session period (in minutes)
            session_period = max(1, int(np.random.lognormal(3, 1)))  # Log-normal distribution
            
            # Calculate risk score
            risk_score = self._calculate_risk_score(
                user, action, hour, ip_address, device_type, session_period
            )
            
            risk_level = self._get_risk_level(risk_score)
            
            record = {
                'username': user['username'],
                'user_id': user['user_id'],
                'email': user['email'],
                'user_role': user['role'],
                'ip_address': ip_address,  # Changed from ip_region to ip_address
                'hour': hour,
                'device_type': device_type,
                'action': action,
                'session_period': session_period,
                'risk_score': round(risk_score, 3),
                'risk_level': risk_level,
                'timestamp': timestamp.isoformat(),
                # Additional features for ML
                'is_weekend': timestamp.weekday() >= 5,
                'is_business_hours': 9 <= hour <= 17,
                'is_sensitive_action': any(page in action for page in SENSITIVE_PAGES),
                'is_failed_action': 'failed' in action.lower() or 'unauthorized' in action.lower(),
                'session_length_category': 'short' if session_period < 30 else 'medium' if session_period < 120 else 'long'
            }
            
            records.append(record)
        
        return records
    
    def generate_dataset(self, output_format: str = 'csv') -> str:
        """Generate the complete dataset"""
        print(f"🏥 Generating {self.num_records} mock records for Hospital ML training...")
        print(f"👥 Users: {len(self.users)} across {len(USER_ROLES)} roles")
        print(f"🎯 Actions: {len(ACTIONS)} different action types")
        print(f"🌍 IP Addresses: {sum(len(ips) for ips in IP_ADDRESSES.values())} unique IPs across {len(IP_ADDRESSES)} regions")
        
        records = self._generate_realistic_patterns()
        df = pd.DataFrame(records)
        
        # Add some statistics
        print(f"\n📊 Dataset Statistics:")
        print(f"   • Total records: {len(df)}")
        print(f"   • Risk distribution:")
        for level in RISK_LEVELS:
            count = len(df[df['risk_level'] == level])
            percentage = (count / len(df)) * 100
            print(f"     - {level}: {count} ({percentage:.1f}%)")
        
        print(f"   • Role distribution:")
        for role in USER_ROLES:
            count = len(df[df['user_role'] == role])
            percentage = (count / len(df)) * 100
            print(f"     - {role}: {count} ({percentage:.1f}%)")
        
        # Save dataset
        if output_format.lower() == 'csv':
            filename = f"hospital_behavior_dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            df.to_csv(filename, index=False)
            print(f"\n✅ Dataset saved as: {filename}")
        elif output_format.lower() == 'json':
            filename = f"hospital_behavior_dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            df.to_json(filename, orient='records', indent=2)
            print(f"\n✅ Dataset saved as: {filename}")
        
        return filename

def main():
    parser = argparse.ArgumentParser(description='Generate mock data for Hospital ML training')
    parser.add_argument('--records', '-r', type=int, default=10000, 
                       help='Number of records to generate (default: 10000)')
    parser.add_argument('--format', '-f', choices=['csv', 'json'], default='csv',
                       help='Output format (default: csv)')
    
    args = parser.parse_args()
    
    generator = HospitalDataGenerator(num_records=args.records)
    filename = generator.generate_dataset(output_format=args.format)
    
    print(f"\n🚀 Ready for ML training!")
    print(f"   • Features: username, user_role, ip_address, hour, device_type, action, session_period")
    print(f"   • Target: risk_score (0.0 - 1.0)")
    print(f"   • Additional features: is_weekend, is_business_hours, etc.")
    print(f"\n💡 Suggested ML models: Random Forest, XGBoost, Neural Networks")
    print(f"   • Classification task: Predict risk_level (low/medium/high/critical)")
    print(f"   • Regression task: Predict risk_score (0.0 - 1.0)")

if __name__ == "__main__":
    main()
