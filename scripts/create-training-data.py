#!/usr/bin/env python3

import requests
import pandas as pd
import json
from datetime import datetime
import sys

def create_training_data():
    """
    Fetch behavior data from the backend API and create training CSV
    """
    try:
        print("🔄 Fetching behavior data from backend API...")
        
        # Fetch data from backend API
        response = requests.get('http://hospital-backend:5002/api/behavior-tracking?limit=1000')
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch data: {response.status_code}")
            return False
        
        data = response.json()
        records = data.get('data', [])
        
        if not records:
            print("❌ No behavior data found")
            return False
        
        print(f"✅ Found {len(records)} behavior records")
        
        # Convert to DataFrame
        df_data = []
        for record in records:
            # Infer device type
            user_agent = record.get('user_agent', '')
            if 'mobile' in user_agent.lower() or 'android' in user_agent.lower() or 'iphone' in user_agent.lower():
                device_type = 'mobile'
            elif 'tablet' in user_agent.lower() or 'ipad' in user_agent.lower():
                device_type = 'tablet'
            else:
                device_type = 'desktop'
            
            # Get primary role
            roles = record.get('roles', [])
            user_role = roles[0] if roles and len(roles) > 0 else 'employee'
            
            df_data.append({
                'username': record.get('username', ''),
                'user_id': record.get('user_id', ''),
                'email': record.get('email', ''),
                'user_role': user_role,
                'ip_address': record.get('ip_address', ''),
                'device_type': device_type,
                'timestamp': record.get('timestamp', ''),
                'action': record.get('action', ''),
                'session_id': record.get('session_id', ''),
                'session_period': record.get('session_period', 30)
            })
        
        # Create DataFrame
        df = pd.DataFrame(df_data)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        filename = f'hospital_behavior_dataset_{timestamp}.csv'
        
        # Save CSV
        df.to_csv(filename, index=False)
        print(f"✅ Training data saved to: {filename}")
        print(f"📊 Shape: {df.shape}")
        
        # Print some statistics
        print("\n📈 Data Statistics:")
        print(f"Users: {df['username'].nunique()}")
        print(f"Actions: {df['action'].nunique()}")
        print(f"Roles: {df['user_role'].value_counts().to_dict()}")
        print(f"Device Types: {df['device_type'].value_counts().to_dict()}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error creating training data: {e}")
        return False

def retrain_model(csv_file):
    """
    Retrain the ML model using the generated CSV data
    """
    try:
        print(f"🤖 Retraining model with {csv_file}...")
        
        # Import the risk prediction service
        from risk_prediction_service import RiskPredictionService
        
        # Create service instance
        service = RiskPredictionService()
        
        # Train the model
        service.train_model(csv_file)
        
        print("✅ Model training completed!")
        
        # Test with a sample prediction
        sample_data = {
            'username': 'admin',
            'user_id': 'admin', 
            'email': 'admin@hospital.com',
            'user_role': 'manager',
            'ip_address': '192.168.1.100',
            'device_type': 'desktop',
            'timestamp': datetime.now().isoformat(),
            'action': 'page_view_unified_admin_dashboard',
            'session_id': 'test_session',
            'session_period': 60
        }
        
        risk_score = service.predict_single_record(sample_data)
        risk_level = service.calculate_risk_level(risk_score)
        
        print(f"🧪 Test prediction - Risk Score: {risk_score:.3f}, Risk Level: {risk_level}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error retraining model: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Starting ML model retraining process...")
    
    # Step 1: Create training data
    csv_file = create_training_data()
    if not csv_file:
        print("💥 Failed to create training data")
        sys.exit(1)
    
    # Step 2: Retrain model
    if retrain_model(csv_file):
        print("🎉 ML model successfully retrained!")
        print("🔄 The model should now provide diverse risk scores")
    else:
        print("💥 Failed to retrain model")
        sys.exit(1)
