#!/usr/bin/env python3
"""
Hospital Dataset Analysis Script
===============================

Analyze the generated mock dataset and create visualizations
for understanding data patterns before ML training.
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

def analyze_dataset(csv_file: str):
    """Comprehensive analysis of the hospital behavior dataset"""
    
    print("🏥 Hospital Behavior Dataset Analysis")
    print("=" * 50)
    
    # Load dataset
    df = pd.read_csv(csv_file)
    print(f"📊 Dataset loaded: {len(df)} records, {len(df.columns)} features")
    
    # Basic info
    print(f"\n📋 Dataset Overview:")
    print(f"   • Shape: {df.shape}")
    print(f"   • Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")
    print(f"   • Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    
    # Missing values
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\n⚠️  Missing values:")
        for col, count in missing[missing > 0].items():
            print(f"   • {col}: {count} ({count/len(df)*100:.1f}%)")
    else:
        print(f"\n✅ No missing values detected")
    
    # Risk score distribution
    print(f"\n🎯 Risk Score Analysis:")
    print(f"   • Mean: {df['risk_score'].mean():.3f}")
    print(f"   • Std:  {df['risk_score'].std():.3f}")
    print(f"   • Min:  {df['risk_score'].min():.3f}")
    print(f"   • Max:  {df['risk_score'].max():.3f}")
    
    # Risk level distribution
    print(f"\n📈 Risk Level Distribution:")
    risk_dist = df['risk_level'].value_counts()
    for level, count in risk_dist.items():
        percentage = (count / len(df)) * 100
        print(f"   • {level}: {count} ({percentage:.1f}%)")
    
    # Role-based analysis
    print(f"\n👥 Role-based Risk Analysis:")
    role_risk = df.groupby('user_role')['risk_score'].agg(['mean', 'std', 'count'])
    for role, stats in role_risk.iterrows():
        print(f"   • {role}: μ={stats['mean']:.3f}, σ={stats['std']:.3f}, n={stats['count']}")
    
    # Time-based patterns
    df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
    
    print(f"\n⏰ Time-based Risk Patterns:")
    print("   • Hourly risk (top 5 riskiest hours):")
    hourly_risk = df.groupby('hour')['risk_score'].mean().sort_values(ascending=False)
    for hour, risk in hourly_risk.head(5).items():
        print(f"     - Hour {hour:02d}: {risk:.3f}")
    
    # Action analysis
    print(f"\n🎬 Action Risk Analysis (top 10 riskiest actions):")
    action_risk = df.groupby('action')['risk_score'].agg(['mean', 'count']).sort_values('mean', ascending=False)
    for action, stats in action_risk.head(10).iterrows():
        print(f"   • {action}: μ={stats['mean']:.3f}, n={stats['count']}")
    
    # Geographic analysis
    print(f"\n🌍 Geographic Risk Analysis:")
    geo_risk = df.groupby('ip_region')['risk_score'].agg(['mean', 'count']).sort_values('mean', ascending=False)
    for region, stats in geo_risk.items():
        print(f"   • {region}: μ={stats['mean']:.3f}, n={stats['count']}")
    
    # Device type analysis
    print(f"\n📱 Device Type Risk Analysis:")
    device_risk = df.groupby('device_type')['risk_score'].agg(['mean', 'count']).sort_values('mean', ascending=False)
    for device, stats in device_risk.items():
        print(f"   • {device}: μ={stats['mean']:.3f}, n={stats['count']}")
    
    # Feature correlations
    print(f"\n🔗 Feature Correlations with Risk Score:")
    numeric_cols = ['hour', 'session_period', 'risk_score']
    if len(numeric_cols) > 1:
        corr_with_risk = df[numeric_cols].corr()['risk_score'].sort_values(ascending=False)
        for feature, corr in corr_with_risk.items():
            if feature != 'risk_score':
                print(f"   • {feature}: {corr:.3f}")
    
    # Data quality checks
    print(f"\n✅ Data Quality Checks:")
    
    # Check risk score range
    invalid_risk = df[(df['risk_score'] < 0) | (df['risk_score'] > 1)]
    print(f"   • Risk scores out of range [0,1]: {len(invalid_risk)}")
    
    # Check session periods
    invalid_session = df[df['session_period'] <= 0]
    print(f"   • Invalid session periods: {len(invalid_session)}")
    
    # Check for duplicate records
    duplicates = df.duplicated().sum()
    print(f"   • Duplicate records: {duplicates}")
    
    # Feature engineering suggestions
    print(f"\n💡 ML Feature Engineering Suggestions:")
    print("   • Time features: hour, day_of_week, is_weekend, is_business_hours")
    print("   • Categorical encoding: user_role, ip_region, device_type, action")
    print("   • Numerical features: session_period (consider log transform)")
    print("   • Binary features: is_sensitive_action, is_failed_action")
    print("   • Aggregated features: user activity patterns, historical risk")
    
    # Model suggestions
    print(f"\n🤖 ML Model Recommendations:")
    print("   📊 Classification (risk_level prediction):")
    print("     - Random Forest: Good baseline, handles categorical features")
    print("     - XGBoost: High performance, feature importance")
    print("     - Neural Network: Complex pattern detection")
    
    print("   📈 Regression (risk_score prediction):")
    print("     - Random Forest Regressor: Robust, interpretable")
    print("     - Gradient Boosting: High accuracy")
    print("     - Support Vector Regression: Good for non-linear patterns")
    
    print(f"\n🎯 Next Steps:")
    print("   1. Split data: 70% train, 15% validation, 15% test")
    print("   2. Handle categorical variables (one-hot encoding)")
    print("   3. Feature scaling for neural networks")
    print("   4. Cross-validation for model selection")
    print("   5. Feature importance analysis")
    print("   6. Model interpretability (SHAP values)")
    
    return df

def create_visualizations(df: pd.DataFrame, output_dir: str = "."):
    """Create visualizations for the dataset"""
    
    print(f"\n📊 Creating visualizations...")
    
    # Set style
    plt.style.use('seaborn-v0_8')
    fig_size = (12, 8)
    
    # 1. Risk score distribution
    plt.figure(figsize=fig_size)
    plt.hist(df['risk_score'], bins=50, alpha=0.7, color='skyblue', edgecolor='black')
    plt.axvline(df['risk_score'].mean(), color='red', linestyle='--', label=f'Mean: {df["risk_score"].mean():.3f}')
    plt.xlabel('Risk Score')
    plt.ylabel('Frequency')
    plt.title('Risk Score Distribution')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/risk_score_distribution.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 2. Risk by role
    plt.figure(figsize=fig_size)
    df.boxplot(column='risk_score', by='user_role', ax=plt.gca())
    plt.title('Risk Score by User Role')
    plt.xlabel('User Role')
    plt.ylabel('Risk Score')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f'{output_dir}/risk_by_role.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    # 3. Risk by hour
    hourly_risk = df.groupby('hour')['risk_score'].mean()
    plt.figure(figsize=fig_size)
    plt.plot(hourly_risk.index, hourly_risk.values, marker='o', linewidth=2, markersize=6)
    plt.axhspan(0.25, 0.5, alpha=0.2, color='yellow', label='Medium Risk')
    plt.axhspan(0.5, 0.75, alpha=0.2, color='orange', label='High Risk')
    plt.axhspan(0.75, 1.0, alpha=0.2, color='red', label='Critical Risk')
    plt.xlabel('Hour of Day')
    plt.ylabel('Average Risk Score')
    plt.title('Risk Score by Hour of Day')
    plt.grid(True, alpha=0.3)
    plt.legend()
    plt.tight_layout()
    plt.savefig(f'{output_dir}/risk_by_hour.png', dpi=300, bbox_inches='tight')
    plt.close()
    
    print(f"   ✅ Visualizations saved to {output_dir}/")

if __name__ == "__main__":
    import glob
    import sys
    
    # Find the most recent dataset file
    csv_files = glob.glob("hospital_behavior_dataset_*.csv")
    if not csv_files:
        print("❌ No dataset files found. Run generate_mock_data.py first.")
        sys.exit(1)
    
    latest_file = max(csv_files, key=lambda x: x.split('_')[-1])
    print(f"📂 Using dataset: {latest_file}")
    
    # Analyze dataset
    df = analyze_dataset(latest_file)
    
    # Create visualizations
    try:
        create_visualizations(df)
    except Exception as e:
        print(f"⚠️  Could not create visualizations: {e}")
        print("   (This is normal if matplotlib is not installed)")
    
    print(f"\n🎉 Analysis complete! Dataset is ready for ML training.")
