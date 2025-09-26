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

# Import our risk prediction service
from risk_prediction_service import RiskPredictionService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize risk prediction service
risk_service = RiskPredictionService()

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

if __name__ == '__main__':
    # Check if model is trained on startup
    if not risk_service.is_trained:
        logger.warning("Model is not trained. Use /train endpoint to train the model.")
    else:
        logger.info("Model is ready for predictions")
    
    # Run the Flask app
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
