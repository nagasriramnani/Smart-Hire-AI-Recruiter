import numpy as np
import pandas as pd
from typing import Tuple

def generate_training_data(n_samples: int = 1000) -> Tuple[np.ndarray, np.ndarray]:
    """
    Generate synthetic training data for the ranking model
    
    Features:
    - experience_years: 0-15 years
    - completeness: 0-1 (percentage of form completed)
    - response_quality: 0-1 (quality of text responses)
    - email_quality: 0-1 (quality indicator)
    
    Target:
    - match_score: 0-100 (calculated based on weighted features)
    """
    np.random.seed(42)
    
    # Generate features
    experience_years = np.random.exponential(scale=5, size=n_samples)
    experience_years = np.clip(experience_years, 0, 15)
    
    completeness = np.random.beta(a=5, b=2, size=n_samples)  # Skewed towards higher completeness
    
    response_quality = np.random.beta(a=3, b=3, size=n_samples)  # Normal distribution
    
    email_quality = np.random.choice([0.5, 1.0], size=n_samples, p=[0.3, 0.7])
    
    # Calculate target scores (ground truth)
    match_scores = (
        experience_years * 3 +           # 30% weight (scaled to 0-45)
        completeness * 25 +              # 25% weight
        response_quality * 30 +          # 30% weight
        email_quality * 15               # 15% weight
    )
    
    # Add some noise
    noise = np.random.normal(0, 5, size=n_samples)
    match_scores = np.clip(match_scores + noise, 0, 100)
    
    # Combine features
    X = np.column_stack([
        experience_years,
        completeness,
        response_quality,
        email_quality
    ])
    
    y = match_scores
    
    return X, y

def generate_candidate_profiles(n_profiles: int = 100) -> pd.DataFrame:
    """
    Generate mock candidate profiles for database seeding
    """
    np.random.seed(42)
    
    skills_pool = [
        ['JavaScript', 'React', 'Node.js'],
        ['Python', 'Django', 'Flask'],
        ['Java', 'Spring Boot', 'Microservices'],
        ['React', 'Vue.js', 'Angular'],
        ['Machine Learning', 'TensorFlow', 'Python'],
        ['DevOps', 'Kubernetes', 'AWS'],
        ['iOS', 'Swift', 'Mobile'],
        ['Android', 'Kotlin', 'Java'],
        ['Full Stack', 'MERN', 'MongoDB'],
        ['Backend', 'Go', 'PostgreSQL']
    ]
    
    locations = [
        'New York, NY', 'San Francisco, CA', 'Austin, TX',
        'Seattle, WA', 'Boston, MA', 'Remote', 'Chicago, IL', 'Denver, CO'
    ]
    
    first_names = [
        'Emma', 'James', 'Olivia', 'Noah', 'Ava', 'Liam', 'Sophia',
        'William', 'Isabella', 'Benjamin', 'Mia', 'Lucas', 'Charlotte',
        'Henry', 'Amelia', 'Alexander', 'Harper', 'Daniel', 'Evelyn', 'Michael'
    ]
    
    last_names = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia',
        'Martinez', 'Davis', 'Rodriguez', 'Wilson', 'Anderson', 'Taylor',
        'Thomas', 'Moore', 'Jackson', 'Martin', 'Lee', 'Walker', 'Hall', 'Allen'
    ]
    
    profiles = []
    
    for i in range(n_profiles):
        name = f"{np.random.choice(first_names)} {np.random.choice(last_names)}"
        
        profile = {
            'name': name,
            'email': f"{name.lower().replace(' ', '.')}@example.com",
            'location': np.random.choice(locations),
            'skills': np.random.choice(skills_pool),
            'experience_years': int(np.random.exponential(scale=5)),
            'available': np.random.choice([True, False], p=[0.7, 0.3])
        }
        
        profiles.append(profile)
    
    return pd.DataFrame(profiles)

if __name__ == '__main__':
    # Test data generation
    X, y = generate_training_data(n_samples=10)
    print("Features shape:", X.shape)
    print("Target shape:", y.shape)
    print("\nSample data:")
    print("X:", X[:3])
    print("y:", y[:3])

