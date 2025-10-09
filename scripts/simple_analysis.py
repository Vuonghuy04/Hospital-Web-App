#!/usr/bin/env python3
"""
Simple Hospital Dataset Analysis (No External Dependencies)
===========================================================
"""

import pandas as pd
import json
from datetime import datetime

def analyze_dataset(csv_file: str):
    """Simple analysis of the hospital behavior dataset"""
    
    print("🏥 Hospital Behavior Dataset Analysis")
    print("=" * 50)
    
    # Load dataset
    df = pd.read_csv(csv_file)
    print(f"📊 Dataset loaded: {len(df)} records, {len(df.columns)} features")
    
    # Show first few records
    print(f"\n📋 Sample Records:")
    print(df.head(3).to_string())
    
    # Basic statistics
    print(f"\n📈 Risk Score Statistics:")
    print(f"   • Mean: {df['risk_score'].mean():.3f}")
    print(f"   • Std:  {df['risk_score'].std():.3f}")
    print(f"   • Min:  {df['risk_score'].min():.3f}")
    print(f"   • Max:  {df['risk_score'].max():.3f}")
    print(f"   • 25%:  {df['risk_score'].quantile(0.25):.3f}")
    print(f"   • 50%:  {df['risk_score'].quantile(0.50):.3f}")
    print(f"   • 75%:  {df['risk_score'].quantile(0.75):.3f}")
    
    # Risk level distribution
    print(f"\n🎯 Risk Level Distribution:")
    risk_counts = df['risk_level'].value_counts()
    for level, count in risk_counts.items():
        percentage = (count / len(df)) * 100
        print(f"   • {level}: {count} ({percentage:.1f}%)")
    
    # Role distribution
    print(f"\n👥 User Role Distribution:")
    role_counts = df['user_role'].value_counts()
    for role, count in role_counts.items():
        percentage = (count / len(df)) * 100
        print(f"   • {role}: {count} ({percentage:.1f}%)")
    
    # Action analysis
    print(f"\n🎬 Top 10 Most Common Actions:")
    action_counts = df['action'].value_counts()
    for i, (action, count) in enumerate(action_counts.head(10).items()):
        percentage = (count / len(df)) * 100
        print(f"   {i+1}. {action}: {count} ({percentage:.1f}%)")
    
    # IP Address distribution (top 10)
    print(f"\n🌍 IP Address Distribution (Top 10):")
    ip_counts = df['ip_address'].value_counts()
    for ip, count in ip_counts.head(10).items():
        percentage = (count / len(df)) * 100
        print(f"   • {ip}: {count} ({percentage:.1f}%)")
    
    # Device type distribution
    print(f"\n📱 Device Type Distribution:")
    device_counts = df['device_type'].value_counts()
    for device, count in device_counts.items():
        percentage = (count / len(df)) * 100
        print(f"   • {device}: {count} ({percentage:.1f}%)")
    
    # Risk by role
    print(f"\n📊 Average Risk Score by Role:")
    role_risk = df.groupby('user_role')['risk_score'].agg(['mean', 'count']).sort_values('mean', ascending=False)
    for role, stats in role_risk.iterrows():
        print(f"   • {role}: {stats['mean']:.3f} (n={stats['count']})")
    
    # High risk analysis
    high_risk = df[df['risk_level'].isin(['high', 'critical'])]
    print(f"\n⚠️  High Risk Analysis ({len(high_risk)} records):")
    if len(high_risk) > 0:
        print("   Top high-risk actions:")
        high_risk_actions = high_risk['action'].value_counts()
        for action, count in high_risk_actions.head(5).items():
            print(f"     - {action}: {count}")
        
        print("   High-risk roles:")
        high_risk_roles = high_risk['user_role'].value_counts()
        for role, count in high_risk_roles.head(5).items():
            print(f"     - {role}: {count}")
    
    # Feature summary for ML
    print(f"\n🤖 ML Feature Summary:")
    print(f"   • Categorical features: user_role, ip_address, device_type, action, risk_level")
    print(f"   • Numerical features: hour, session_period, risk_score")
    print(f"   • Binary features: is_weekend, is_business_hours, is_sensitive_action, is_failed_action")
    print(f"   • Target variable: risk_score (regression) or risk_level (classification)")
    
    return df

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
    
    print(f"\n🎉 Analysis complete! Dataset is ready for ML training.")
    print(f"💡 Recommended ML approach:")
    print(f"   1. Classification: Predict risk_level (4 classes)")
    print(f"   2. Regression: Predict risk_score (continuous 0-1)")
    print(f"   3. Use Random Forest or XGBoost for baseline models")
    print(f"   4. Feature importance analysis to understand key risk factors")
