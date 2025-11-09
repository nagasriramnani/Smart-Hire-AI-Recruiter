import os
import joblib
import numpy as np
from typing import List, Dict, Any
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), '../../models')
MODEL_PATH = os.path.join(MODEL_DIR, 'ranker_model.pkl')
VECTORIZER_PATH = os.path.join(MODEL_DIR, 'vectorizer.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')

class RankingService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.scaler = None
        self.load_model()
    
    def load_model(self):
        """Load trained model from disk"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                logger.info("Model loaded successfully")
            else:
                logger.warning("Model file not found, will use fallback ranking")
                
            if os.path.exists(VECTORIZER_PATH):
                self.vectorizer = joblib.load(VECTORIZER_PATH)
                logger.info("Vectorizer loaded successfully")
                
            if os.path.exists(SCALER_PATH):
                self.scaler = joblib.load(SCALER_PATH)
                logger.info("Scaler loaded successfully")
                
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            self.model = None
    
    def is_model_loaded(self) -> bool:
        """Check if model is loaded"""
        return self.model is not None
    
    def extract_features(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> Dict[str, float]:
        """
        Extract features from candidate and job data
        """
        features = {}
        
        # Get candidate data
        candidate_data = candidate.get('data', {})
        job_requirements = job.get('requirements', {})
        job_description = job.get('description', '').lower()
        job_title = job.get('title', '').lower()
        
        # Feature 1: Experience years (from form or estimate)
        experience_str = candidate_data.get('Years of Experience', '0')
        if isinstance(experience_str, str):
            if '10+' in experience_str or '15+' in experience_str or '20+' in experience_str:
                features['experience_years'] = 15
            elif '-' in experience_str:
                # Handle range like "3-5"
                parts = experience_str.split('-')
                try:
                    features['experience_years'] = (float(parts[0]) + float(parts[1])) / 2
                except:
                    features['experience_years'] = float(parts[0])
            else:
                try:
                    features['experience_years'] = float(experience_str.replace('+', ''))
                except:
                    features['experience_years'] = 0
        else:
            features['experience_years'] = float(experience_str)
        
        # Feature 2: Response completeness
        total_fields = len(candidate_data)
        filled_fields = sum(1 for v in candidate_data.values() if v and str(v).strip())
        features['completeness'] = filled_fields / total_fields if total_fields > 0 else 0
        
        # Feature 3: Text quality (length and detail of responses)
        text_responses = [str(v) for v in candidate_data.values() if isinstance(v, str) and len(str(v)) > 10]
        if text_responses:
            avg_length = np.mean([len(text) for text in text_responses])
            features['response_quality'] = min(avg_length / 200, 1.0)  # Normalize to 0-1
        else:
            features['response_quality'] = 0
        
        # Feature 4: Skills matching (check if candidate mentions relevant skills)
        skills_keywords = ['python', 'javascript', 'react', 'node', 'sql', 'aws', 'docker', 
                          'typescript', 'vue', 'angular', 'java', 'c++', 'golang', 'rust',
                          'kubernetes', 'mongodb', 'postgresql', 'redis', 'graphql', 'api',
                          'machine learning', 'ai', 'data', 'frontend', 'backend', 'fullstack']
        
        candidate_text = ' '.join([str(v).lower() for v in candidate_data.values()])
        job_text = f"{job_title} {job_description}"
        
        # Count skill matches
        candidate_skills = [skill for skill in skills_keywords if skill in candidate_text]
        job_skills = [skill for skill in skills_keywords if skill in job_text]
        
        if job_skills:
            matching_skills = set(candidate_skills) & set(job_skills)
            features['skills_match'] = len(matching_skills) / max(len(job_skills), 1)
        else:
            features['skills_match'] = 0.5  # Neutral if no clear job skills
        
        # Feature 5: Education level (basic heuristic)
        education_text = str(candidate_data.get('Education', '')).lower()
        if 'phd' in education_text or 'doctorate' in education_text:
            features['education_level'] = 1.0
        elif 'master' in education_text or 'ms' in education_text or 'mba' in education_text:
            features['education_level'] = 0.8
        elif 'bachelor' in education_text or 'bs' in education_text or 'ba' in education_text:
            features['education_level'] = 0.6
        elif 'associate' in education_text:
            features['education_level'] = 0.4
        else:
            features['education_level'] = 0.2
        
        # Feature 6: Motivation/Why (text quality)
        why_text = str(candidate_data.get('Why do you want to work here?', ''))
        features['motivation_quality'] = min(len(why_text) / 150, 1.0) if why_text else 0
        
        return features
    
    def calculate_match_score(self, candidate: Dict[str, Any], job: Dict[str, Any]) -> float:
        """
        Calculate match score using features (0-100 scale)
        """
        features = self.extract_features(candidate, job)
        
        # Weighted scoring - all normalized to 0-100 scale
        # Base scores out of 100
        experience_score = min((features['experience_years'] / 10) * 100, 100) * 0.25  # 25% weight
        skills_score = features['skills_match'] * 100 * 0.30                            # 30% weight (most important!)
        completeness_score = features['completeness'] * 100 * 0.15                      # 15% weight
        quality_score = features['response_quality'] * 100 * 0.15                       # 15% weight
        education_score = features['education_level'] * 100 * 0.10                      # 10% weight
        motivation_score = features['motivation_quality'] * 100 * 0.05                  # 5% weight
        
        # Total score
        score = (
            experience_score +
            skills_score +
            completeness_score +
            quality_score +
            education_score +
            motivation_score
        )
        
        # Add small randomness for variety (±3 points)
        noise = np.random.uniform(-3, 3)
        score = max(0, min(100, score + noise))
        
        return round(score, 1)
    
    def generate_rationale(self, candidate: Dict[str, Any], job: Dict[str, Any], score: float) -> str:
        """
        Generate detailed explanation for the ranking
        """
        features = self.extract_features(candidate, job)
        candidate_data = candidate.get('data', {})
        
        rationale_parts = []
        
        # Overall assessment prefix
        if score >= 85:
            prefix = "⭐ Exceptional match"
        elif score >= 75:
            prefix = "🎯 Excellent candidate"
        elif score >= 65:
            prefix = "✅ Strong candidate"
        elif score >= 50:
            prefix = "👍 Good candidate"
        else:
            prefix = "📝 Potential candidate"
        
        # Skills matching
        skills_match = features['skills_match']
        if skills_match >= 0.7:
            rationale_parts.append("excellent skills alignment with job requirements")
        elif skills_match >= 0.5:
            rationale_parts.append("good technical skills match")
        elif skills_match >= 0.3:
            rationale_parts.append("moderate skills overlap")
        else:
            rationale_parts.append("limited skills match to requirements")
        
        # Experience
        exp_years = features['experience_years']
        if exp_years >= 10:
            rationale_parts.append(f"{int(exp_years)}+ years of extensive experience")
        elif exp_years >= 5:
            rationale_parts.append(f"{int(exp_years)} years of solid experience")
        elif exp_years >= 2:
            rationale_parts.append(f"{int(exp_years)} years experience")
        elif exp_years >= 1:
            rationale_parts.append("early career professional")
        else:
            rationale_parts.append("entry-level candidate")
        
        # Education
        education_level = features['education_level']
        if education_level >= 0.8:
            rationale_parts.append("advanced degree")
        elif education_level >= 0.6:
            rationale_parts.append("bachelor's degree")
        
        # Application quality
        if features['completeness'] >= 0.9 and features['response_quality'] >= 0.6:
            rationale_parts.append("comprehensive and detailed application")
        elif features['completeness'] >= 0.7:
            rationale_parts.append("thorough application")
        elif features['completeness'] < 0.5:
            rationale_parts.append("incomplete application")
        
        # Motivation
        if features['motivation_quality'] >= 0.7:
            rationale_parts.append("strong motivation expressed")
        
        return f"{prefix}: {', '.join(rationale_parts)}."
    
    def rank_candidates(self, job: Dict[str, Any], candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Rank candidates for a job
        """
        ranked = []
        
        for candidate in candidates:
            score = self.calculate_match_score(candidate, job)
            rationale = self.generate_rationale(candidate, job, score)
            
            ranked.append({
                'id': candidate['id'],
                'name': candidate['name'],
                'score': score,
                'rationale': rationale
            })
        
        # Sort by score descending
        ranked.sort(key=lambda x: x['score'], reverse=True)
        
        return ranked
    
    def train_model(self) -> Dict[str, Any]:
        """
        Train the ranking model with synthetic data
        """
        from app.training.generate_data import generate_training_data
        
        logger.info("Generating training data...")
        X, y = generate_training_data(n_samples=1000)
        
        logger.info(f"Training with {len(X)} samples...")
        
        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X, y)
        
        # Save model
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(self.model, MODEL_PATH)
        logger.info(f"Model saved to {MODEL_PATH}")
        
        # Calculate accuracy
        train_score = self.model.score(X, y)
        
        return {
            'model_type': 'RandomForestRegressor',
            'n_samples': len(X),
            'train_score': round(train_score, 4)
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the current model"""
        return {
            'model_loaded': self.is_model_loaded(),
            'model_type': type(self.model).__name__ if self.model else None,
            'model_path': MODEL_PATH,
            'version': '1.0.0'
        }

