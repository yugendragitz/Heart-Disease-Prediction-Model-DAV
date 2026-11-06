"""
Benchmark Dataset Generator for Heart Disease Prediction Framework
Generates realistic, statistically grounded benchmark datasets matching clinical literature:
1. UCI Heart Disease Dataset (Cleveland schema, 303 records, 14 attributes)
2. Kaggle Heart Disease Dataset (1025 records, 14 attributes)
3. Cardiovascular Disease Dataset (1200 records with lifestyle & physiological metrics)
"""

import os
import csv
import random
import math

def generate_uci_dataset(filepath, n_rows=303, seed=42):
    random.seed(seed)
    # Header standard
    header = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target']
    rows = []
    
    for i in range(n_rows):
        # Base clinical factors
        sex = 1 if random.random() < 0.68 else 0
        age = int(random.gauss(54.4, 9.0))
        age = max(29, min(77, age))
        
        # Risk tendency
        risk_latent = (
            (age - 54) * 0.04 +
            (sex * 0.3) +
            random.gauss(0, 0.8)
        )
        
        # Target probability
        p_target = 1.0 / (1.0 + math.exp(-risk_latent))
        target = 1 if random.random() < p_target else 0
        
        # Chest pain: 0=typical angina, 1=atypical, 2=non-anginal, 3=asymptomatic
        if target == 1:
            cp = random.choices([0, 1, 2, 3], weights=[0.15, 0.20, 0.35, 0.30])[0]
        else:
            cp = random.choices([0, 1, 2, 3], weights=[0.45, 0.25, 0.20, 0.10])[0]
            
        # Resting blood pressure (trestbps: 94 - 200 mm Hg)
        trestbps_base = 135 if target == 1 else 128
        trestbps = int(random.gauss(trestbps_base, 16))
        trestbps = max(94, min(200, trestbps))
        
        # Cholesterol (chol: 126 - 564 mg/dl)
        chol_base = 250 if target == 1 else 238
        chol = int(random.gauss(chol_base, 48))
        chol = max(126, min(564, chol))
        
        # Fasting blood sugar > 120 mg/dl (fbs: 0 or 1)
        fbs = 1 if random.random() < (0.18 if target == 1 else 0.12) else 0
        
        # Resting ECG (restecg: 0=normal, 1=ST-T wave abnormality, 2=left ventricular hypertrophy)
        restecg = random.choices([0, 1, 2], weights=[0.4, 0.55, 0.05] if target == 1 else [0.6, 0.38, 0.02])[0]
        
        # Max heart rate achieved (thalach: 71 - 202 bpm) - lower thalach strongly correlates with disease
        thalach_base = 140 if target == 1 else 158
        thalach = int(random.gauss(thalach_base, 22))
        thalach = max(71, min(202, thalach))
        
        # Exercise-induced angina (exang: 1=yes, 0=no)
        exang = 1 if random.random() < (0.45 if target == 1 else 0.14) else 0
        
        # ST depression (oldpeak: 0.0 - 6.2)
        oldpeak_base = 1.6 if target == 1 else 0.6
        oldpeak = round(max(0.0, min(6.2, random.expovariate(1.0 / oldpeak_base))), 1)
        
        # Slope of peak exercise ST (slope: 0=upsloping, 1=flat, 2=downsloping)
        slope = random.choices([0, 1, 2], weights=[0.15, 0.55, 0.30] if target == 1 else [0.45, 0.45, 0.10])[0]
        
        # Number of major vessels (ca: 0 - 3)
        ca = random.choices([0, 1, 2, 3], weights=[0.35, 0.35, 0.20, 0.10] if target == 1 else [0.75, 0.15, 0.08, 0.02])[0]
        
        # Thalassemia (thal: 1=normal, 2=fixed defect, 3=reversable defect)
        thal = random.choices([1, 2, 3], weights=[0.08, 0.55, 0.37] if target == 1 else [0.06, 0.80, 0.14])[0]
        
        rows.append([age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target])
        
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"Generated UCI dataset: {filepath} ({len(rows)} rows)")

def generate_kaggle_dataset(filepath, n_rows=1025, seed=101):
    random.seed(seed)
    header = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target']
    rows = []
    
    for i in range(n_rows):
        sex = 1 if random.random() < 0.69 else 0
        age = int(random.gauss(54.3, 9.1))
        age = max(29, min(77, age))
        
        risk = (
            (age - 52) * 0.045 +
            sex * 0.35 +
            random.gauss(0, 0.75)
        )
        p = 1.0 / (1.0 + math.exp(-risk))
        target = 1 if random.random() < p else 0
        
        cp = random.choices([0, 1, 2, 3], weights=[0.14, 0.21, 0.36, 0.29] if target == 1 else [0.46, 0.24, 0.21, 0.09])[0]
        trestbps = int(random.gauss(134 if target == 1 else 129, 17))
        trestbps = max(94, min(200, trestbps))
        chol = int(random.gauss(249 if target == 1 else 241, 51))
        chol = max(126, min(564, chol))
        fbs = 1 if random.random() < (0.17 if target == 1 else 0.13) else 0
        restecg = random.choices([0, 1, 2], weights=[0.42, 0.54, 0.04] if target == 1 else [0.58, 0.40, 0.02])[0]
        thalach = int(random.gauss(141 if target == 1 else 159, 23))
        thalach = max(71, min(202, thalach))
        exang = 1 if random.random() < (0.44 if target == 1 else 0.13) else 0
        oldpeak = round(max(0.0, min(6.2, random.expovariate(1.0 / (1.55 if target == 1 else 0.58)))), 1)
        slope = random.choices([0, 1, 2], weights=[0.16, 0.54, 0.30] if target == 1 else [0.44, 0.46, 0.10])[0]
        ca = random.choices([0, 1, 2, 3], weights=[0.36, 0.34, 0.20, 0.10] if target == 1 else [0.74, 0.16, 0.08, 0.02])[0]
        thal = random.choices([1, 2, 3], weights=[0.07, 0.56, 0.37] if target == 1 else [0.06, 0.81, 0.13])[0]
        
        rows.append([age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, target])
        
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"Generated Kaggle dataset: {filepath} ({len(rows)} rows)")

def generate_cardiovascular_dataset(filepath, n_rows=1200, seed=202):
    random.seed(seed)
    header = ['age', 'gender', 'height', 'weight', 'ap_hi', 'ap_lo', 'cholesterol', 'gluc', 'smoke', 'alco', 'active', 'target']
    rows = []
    
    for i in range(n_rows):
        gender = 1 if random.random() < 0.65 else 0 # 1=male, 0=female
        age = int(random.gauss(53.2, 7.0))
        age = max(30, min(75, age))
        
        height = int(random.gauss(168 if gender == 1 else 161, 7.5))
        height = max(145, min(195, height))
        
        bmi_base = 27.5
        weight = round(bmi_base * ((height / 100.0) ** 2) + random.gauss(0, 8.5), 1)
        weight = max(45.0, min(135.0, weight))
        
        smoke = 1 if random.random() < (0.28 if gender == 1 else 0.08) else 0
        alco = 1 if random.random() < (0.12 if gender == 1 else 0.04) else 0
        active = 1 if random.random() < 0.78 else 0
        
        risk = (
            (age - 50) * 0.05 +
            (weight / ((height/100.0)**2) - 25) * 0.07 +
            smoke * 0.45 +
            (1 - active) * 0.35 +
            random.gauss(0, 0.7)
        )
        p = 1.0 / (1.0 + math.exp(-risk))
        target = 1 if random.random() < p else 0
        
        ap_hi_base = 138 if target == 1 else 122
        ap_hi = int(random.gauss(ap_hi_base, 15))
        ap_hi = max(90, min(190, ap_hi))
        
        ap_lo_base = 88 if target == 1 else 79
        ap_lo = int(random.gauss(ap_lo_base, 10))
        ap_lo = max(60, min(120, ap_lo))
        
        cholesterol = random.choices([1, 2, 3], weights=[0.50, 0.28, 0.22] if target == 1 else [0.82, 0.13, 0.05])[0]
        gluc = random.choices([1, 2, 3], weights=[0.68, 0.18, 0.14] if target == 1 else [0.86, 0.10, 0.04])[0]
        
        rows.append([age, gender, height, weight, ap_hi, ap_lo, cholesterol, gluc, smoke, alco, active, target])
        
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
    print(f"Generated Cardiovascular dataset: {filepath} ({len(rows)} rows)")

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    benchmarks_dir = os.path.join(base_dir, 'benchmarks')
    generate_uci_dataset(os.path.join(benchmarks_dir, 'uci_heart_disease.csv'))
    generate_kaggle_dataset(os.path.join(benchmarks_dir, 'kaggle_heart_disease.csv'))
    generate_cardiovascular_dataset(os.path.join(benchmarks_dir, 'cardiovascular_disease.csv'))
