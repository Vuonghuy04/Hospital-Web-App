#!/usr/bin/env python3
"""
Python ML Service for Risk Prediction
=====================================

A Flask-based API service that provides risk score predictions
for the Hospital Web Application using the trained Isolation Forest model.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import logging
import os
import sys
from datetime import datetime

# Import our services
from risk_prediction_service import RiskPredictionService
from behavior_profiler import BehaviorProfiler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize services
risk_service = RiskPredictionService()
behavior_profiler = BehaviorProfiler()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Python ML Service',
        'model_trained': risk_service.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/single', methods=['POST'])
def predict_single():
    """
    Predict risk score for a single record
    
    Expected input:
    {
        "username": "user123",
        "user_id": "user_123",
        "email": "user@hospital.com",
        "user_role": "nurse",
        "ip_address": "192.168.1.100",
        "device_type": "mobile",
        "timestamp": "2025-09-22T14:30:00",
        "action": "patient_record_access",
        "session_id": "sess_123",
        "session_period": 45
    }
    """
    try:
        if not risk_service.is_trained:
            return jsonify({
                'error': 'Model is not trained',
                'message': 'Please train the model first using /train endpoint'
            }), 400
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['username', 'user_id', 'action', 'timestamp']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Set default values for optional fields
        defaults = {
            'user_role': 'employee',
            'ip_address': 'unknown',
            'device_type': 'desktop',
            'session_period': 30,
            'session_id': 'unknown'
        }
        
        for key, value in defaults.items():
            if key not in data:
                data[key] = value
        
        # Predict risk score
        risk_score = risk_service.predict_single_record(data)
        risk_level = risk_service.calculate_risk_level(risk_score)
        
        return jsonify({
            'risk_score': round(risk_score, 3),
            'risk_level': risk_level,
            'timestamp': datetime.now().isoformat(),
            'input_data': data
        })
        
    except Exception as e:
        logger.error(f"Error in single prediction: {e}")
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict risk scores for multiple records
    
    Expected input:
    {
        "records": [
            {
                "username": "user123",
                "user_id": "user_123",
                ...
            },
            ...
        ]
    }
    """
    try:
        if not risk_service.is_trained:
            return jsonify({
                'error': 'Model is not trained',
                'message': 'Please train the model first using /train endpoint'
            }), 400
        
        data = request.get_json()
        if not data or 'records' not in data:
            return jsonify({'error': 'No records provided'}), 400
        
        records = data['records']
        if not isinstance(records, list) or len(records) == 0:
            return jsonify({'error': 'Records must be a non-empty list'}), 400
        
        # Convert to DataFrame
        df = pd.DataFrame(records)
        
        # Predict risk scores
        risk_scores = risk_service.predict_risk_scores(df)
        
        # Prepare results
        results = []
        for i, (_, record) in enumerate(df.iterrows()):
            risk_score = risk_scores[i] if i < len(risk_scores) else 0.5
            risk_level = risk_service.calculate_risk_level(risk_score)
            
            results.append({
                'index': i,
                'risk_score': round(risk_score, 3),
                'risk_level': risk_level,
                'record': record.to_dict()
            })
        
        return jsonify({
            'predictions': results,
            'total_records': len(results),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in batch prediction: {e}")
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e)
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """
    Train the model using the latest dataset
    """
    try:
        # Find latest dataset
        import glob
        csv_files = glob.glob("hospital_behavior_dataset_*.csv")
        
        if not csv_files:
            return jsonify({
                'error': 'No training data found',
                'message': 'Please ensure dataset files are available'
            }), 400
        
        latest_file = max(csv_files, key=lambda x: x.split('_')[-1])
        
        # Train model
        risk_service.train_model(latest_file)
        
        return jsonify({
            'message': 'Model trained successfully',
            'dataset_file': latest_file,
            'model_trained': risk_service.is_trained,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error training model: {e}")
        return jsonify({
            'error': 'Training failed',
            'message': str(e)
        }), 500

@app.route('/model/status', methods=['GET'])
def model_status():
    """
    Get model status and information
    """
    return jsonify({
        'is_trained': risk_service.is_trained,
        'available_encoders': list(risk_service.label_encoders.keys()),
        'model_path': risk_service.model_path,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/database', methods=['POST'])
def predict_database_records():
    """
    Predict risk scores for records from database
    This endpoint expects the Node.js backend to provide the records
    """
    try:
        if not risk_service.is_trained:
            return jsonify({
                'error': 'Model is not trained',
                'message': 'Please train the model first'
            }), 400
        
        data = request.get_json()
        if not data or 'records' not in data:
            return jsonify({'error': 'No records provided'}), 400
        
        records = data['records']
        
        # Process each record
        predictions = []
        for record in records:
            try:
                # Add timestamp if not present
                if 'timestamp' not in record:
                    record['timestamp'] = datetime.now().isoformat()
                
                risk_score = risk_service.predict_single_record(record)
                risk_level = risk_service.calculate_risk_level(risk_score)
                
                predictions.append({
                    'id': record.get('id'),
                    'username': record.get('username'),
                    'user_id': record.get('user_id'),
                    'risk_score': round(risk_score, 3),
                    'risk_level': risk_level,
                    'updated_at': datetime.now().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Error predicting for record {record.get('id', 'unknown')}: {e}")
                predictions.append({
                    'id': record.get('id'),
                    'username': record.get('username'),
                    'user_id': record.get('user_id'),
                    'risk_score': 0.5,  # Default risk score
                    'risk_level': 'medium',
                    'error': str(e),
                    'updated_at': datetime.now().isoformat()
                })
        
        return jsonify({
            'predictions': predictions,
            'total_processed': len(predictions),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in database prediction: {e}")
        return jsonify({
            'error': 'Database prediction failed',
            'message': str(e)
        }), 500

# =============================================================================
# BEHAVIOR PROFILING ENDPOINTS
# =============================================================================

@app.route('/behavior-profile/create', methods=['POST'])
def create_behavior_profile():
    """
    Create comprehensive behavior profile from user data
    """
    try:
        data = request.get_json()
        if not data or 'user_id' not in data or 'behavior_data' not in data:
            return jsonify({'error': 'Missing required fields: user_id, behavior_data'}), 400
        
        user_id = data['user_id']
        behavior_data = data['behavior_data']
        
        # Convert to DataFrame
        df = pd.DataFrame(behavior_data)
        
        # Create comprehensive profile
        profile = behavior_profiler.create_user_profile(df)
        
        logger.info(f"Created behavior profile for user: {user_id}")
        
        return jsonify({
            'message': 'Behavior profile created successfully',
            'user_id': user_id,
            'profile': profile,
            'data_points': len(df),
            'baseline_established': profile.get('baseline_established', False)
        })
        
    except Exception as e:
        logger.error(f"Error creating behavior profile: {str(e)}")
        return jsonify({'error': f'Failed to create profile: {str(e)}'}), 500

@app.route('/behavior-profile/train-models', methods=['POST'])
def train_behavior_models():
    """
    Train behavior analysis models with collected data
    """
    try:
        data = request.get_json() or {}
        dataset_path = data.get('dataset_path', 'hospital_behavior_dataset_20250920_161714.csv')
        
        logger.info(f"Starting model training with dataset: {dataset_path}")
        
        # Load dataset
        try:
            df = pd.read_csv(dataset_path)
            logger.info(f"Loaded dataset with {len(df)} records")
        except FileNotFoundError:
            return jsonify({'error': f'Dataset file not found: {dataset_path}'}), 404
        
        # Train models
        training_results = {}
        
        # Train Isolation Forest for anomaly detection
        logger.info("Training Isolation Forest model...")
        try:
            risk_service.train_model(df)
            training_results['isolation_forest'] = {
                'status': 'success',
                'model_trained': risk_service.is_trained,
                'data_points': len(df)
            }
            logger.info("Isolation Forest model trained successfully")
        except Exception as e:
            training_results['isolation_forest'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Train behavior profiling models
        logger.info("Training behavior profiling models...")
        try:
            users = df['username'].unique()[:20]  # Train on first 20 users
            profiles_created = 0
            
            for user in users:
                user_data = df[df['username'] == user]
                if len(user_data) >= 5:  # Minimum data requirement
                    profile = behavior_profiler.create_user_profile(user_data)
                    profiles_created += 1
            
            training_results['behavior_profiler'] = {
                'status': 'success',
                'profiles_created': profiles_created,
                'users_analyzed': len(users)
            }
            logger.info(f"Behavior profiler trained with {profiles_created} profiles")
        except Exception as e:
            training_results['behavior_profiler'] = {
                'status': 'error',
                'error': str(e)
            }
        
        return jsonify({
            'message': 'Model training completed',
            'training_results': training_results,
            'dataset_info': {
                'records': len(df),
                'users': df['username'].nunique(),
                'date_range': {
                    'start': df['timestamp'].min() if 'timestamp' in df.columns else None,
                    'end': df['timestamp'].max() if 'timestamp' in df.columns else None
                }
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error training models: {str(e)}")
        return jsonify({'error': f'Failed to train models: {str(e)}'}), 500

@app.route('/behavior-profile/predict-risk', methods=['POST'])
def predict_behavioral_risk():
    """
    Advanced risk prediction combining multiple models
    """
    try:
        data = request.get_json()
        if not data or 'user_data' not in data:
            return jsonify({'error': 'Missing required field: user_data'}), 400
        
        user_data = data['user_data']
        username = user_data.get('username')
        
        # Multi-model risk prediction
        risk_predictions = {}
        
        # 1. Traditional ML model prediction
        if risk_service.is_trained and 'recent_actions' in user_data:
            try:
                df = pd.DataFrame(user_data['recent_actions'])
                ml_prediction = risk_service.predict(df)
                risk_predictions['ml_model'] = {
                    'risk_scores': ml_prediction.get('risk_scores', []),
                    'average_risk': float(np.mean(ml_prediction.get('risk_scores', [0.5]))),
                    'model_confidence': 0.8
                }
            except Exception as e:
                risk_predictions['ml_model'] = {'error': str(e)}
        
        # 2. Behavior profile-based prediction
        if 'recent_actions' in user_data:
            try:
                df = pd.DataFrame(user_data['recent_actions'])
                anomalies = behavior_profiler.detect_behavioral_anomalies(df)
                
                # Calculate risk based on anomalies
                anomaly_risk = 0
                for anomaly in anomalies:
                    severity_weights = {'low': 0.1, 'medium': 0.3, 'high': 0.6, 'critical': 1.0}
                    anomaly_risk += severity_weights.get(anomaly.get('severity', 'low'), 0.1)
                
                behavioral_risk = min(anomaly_risk / 2.0, 1.0)  # Normalize to 0-1
                
                risk_predictions['behavioral_model'] = {
                    'risk_score': behavioral_risk,
                    'anomaly_count': len(anomalies),
                    'high_severity_anomalies': len([a for a in anomalies if a.get('severity') in ['high', 'critical']]),
                    'model_confidence': 0.9
                }
            except Exception as e:
                risk_predictions['behavioral_model'] = {'error': str(e)}
        
        # 3. Combined ensemble prediction
        ensemble_risk = 0
        confidence_sum = 0
        
        if 'ml_model' in risk_predictions and 'error' not in risk_predictions['ml_model']:
            ml_risk = risk_predictions['ml_model']['average_risk']
            ml_confidence = risk_predictions['ml_model']['model_confidence']
            ensemble_risk += ml_risk * ml_confidence
            confidence_sum += ml_confidence
        
        if 'behavioral_model' in risk_predictions and 'error' not in risk_predictions['behavioral_model']:
            behavioral_risk = risk_predictions['behavioral_model']['risk_score']
            behavioral_confidence = risk_predictions['behavioral_model']['model_confidence']
            ensemble_risk += behavioral_risk * behavioral_confidence
            confidence_sum += behavioral_confidence
        
        final_risk = ensemble_risk / confidence_sum if confidence_sum > 0 else 0.5
        
        # Risk level classification
        risk_level = 'low'
        if final_risk > 0.7:
            risk_level = 'critical'
        elif final_risk > 0.5:
            risk_level = 'high'
        elif final_risk > 0.3:
            risk_level = 'medium'
        
        return jsonify({
            'username': username,
            'prediction_results': {
                'final_risk_score': float(final_risk),
                'risk_level': risk_level,
                'confidence': float(confidence_sum / 2) if confidence_sum > 0 else 0.5,
                'individual_predictions': risk_predictions
            },
            'recommendations': [
                'Monitor user activity closely' if final_risk > 0.7 else 'Continue normal monitoring',
                'Review recent anomalies' if risk_predictions.get('behavioral_model', {}).get('anomaly_count', 0) > 3 else 'No immediate anomalies',
                'Consider additional authentication' if final_risk > 0.8 else 'Standard authentication sufficient'
            ],
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error predicting behavioral risk: {str(e)}")
        return jsonify({'error': f'Failed to predict risk: {str(e)}'}), 500

if __name__ == '__main__':
    # Check if model is trained on startup
    if not risk_service.is_trained:
        logger.warning("Model is not trained. Use /train endpoint to train the model.")
    else:
        logger.info("Model is ready for predictions")
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
