#!/usr/bin/env python3
"""
Train the SmartHire ranking model locally
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ranking import RankingService
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("🚀 Starting SmartHire ML model training...")
    
    service = RankingService()
    result = service.train_model()
    
    logger.info("✅ Training complete!")
    logger.info(f"📊 Results: {result}")
    logger.info(f"🎯 Model saved and ready to use")

if __name__ == '__main__':
    main()

