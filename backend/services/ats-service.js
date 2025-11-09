const natural = require('natural');
const keyword = require('keyword-extractor');

class ATSService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Comprehensive ATS analysis of an application
   */
  async analyzeApplication(resumeData, jobDescription, requiredSkills = []) {
    const resumeText = resumeData.raw_text || '';
    
    // Perform various analyses
    const keywordAnalysis = this.analyzeKeywords(resumeText, jobDescription);
    const skillsAnalysis = this.analyzeSkills(resumeData.skills, requiredSkills);
    const experienceAnalysis = this.analyzeExperience(resumeData.experience);
    const formatAnalysis = this.analyzeFormat(resumeData);
    
    // Calculate overall ATS score
    const overallScore = this.calculateOverallScore({
      keywordAnalysis,
      skillsAnalysis,
      experienceAnalysis,
      formatAnalysis
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      keywordAnalysis,
      skillsAnalysis,
      experienceAnalysis,
      formatAnalysis
    });
    
    return {
      overall_score: overallScore,
      keyword_score: keywordAnalysis.score,
      skills_score: skillsAnalysis.score,
      experience_score: experienceAnalysis.score,
      format_score: formatAnalysis.score,
      
      matched_keywords: keywordAnalysis.matched,
      missing_keywords: keywordAnalysis.missing,
      skill_gaps: skillsAnalysis.gaps,
      recommendations: recommendations,
      
      details: {
        keyword_details: keywordAnalysis,
        skills_details: skillsAnalysis,
        experience_details: experienceAnalysis,
        format_details: formatAnalysis
      }
    };
  }

  /**
   * Analyze keyword matching between resume and job description
   */
  analyzeKeywords(resumeText, jobDescription) {
    // Extract keywords from job description
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeKeywords = this.extractKeywords(resumeText);
    
    // Find matched and missing keywords
    const matched = [];
    const missing = [];
    
    jobKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const isMatched = resumeKeywords.some(rk => 
        rk.toLowerCase().includes(keywordLower) || 
        keywordLower.includes(rk.toLowerCase())
      );
      
      if (isMatched) {
        matched.push(keyword);
      } else {
        missing.push(keyword);
      }
    });
    
    // Calculate keyword match score
    const matchRate = jobKeywords.length > 0 
      ? (matched.length / jobKeywords.length) * 100 
      : 0;
    
    // Calculate keyword density
    const density = this.calculateKeywordDensity(resumeText, matched);
    
    return {
      score: Math.round(matchRate),
      matched: matched,
      missing: missing,
      density: density,
      total_job_keywords: jobKeywords.length,
      matched_count: matched.length
    };
  }

  /**
   * Extract important keywords from text
   */
  extractKeywords(text) {
    const extraction_result = keyword.extract(text, {
      language: "english",
      remove_digits: false,
      return_changed_case: true,
      remove_duplicates: true
    });
    
    // Filter out very short keywords and common words
    const filtered = extraction_result.filter(kw => 
      kw.length > 2 && 
      !this.isCommonWord(kw)
    );
    
    // Get top 50 keywords
    return filtered.slice(0, 50);
  }

  /**
   * Check if word is too common to be meaningful
   */
  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have',
      'will', 'your', 'can', 'are', 'all', 'our', 'more', 'about',
      'work', 'team', 'role', 'job', 'position', 'company', 'business'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Calculate keyword density
   */
  calculateKeywordDensity(text, keywords) {
    if (keywords.length === 0) return 0;
    
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    
    let keywordCount = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = textLower.match(regex);
      if (matches) {
        keywordCount += matches.length;
      }
    });
    
    return words.length > 0 
      ? ((keywordCount / words.length) * 100).toFixed(2)
      : 0;
  }

  /**
   * Analyze skills matching
   */
  analyzeSkills(candidateSkills = [], requiredSkills = []) {
    if (requiredSkills.length === 0) {
      return {
        score: 100,
        matched: candidateSkills,
        gaps: [],
        coverage: 100
      };
    }
    
    const matched = [];
    const gaps = [];
    
    // Normalize skills for comparison
    const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase());
    
    requiredSkills.forEach(required => {
      const requiredLower = required.toLowerCase();
      const isMatched = normalizedCandidateSkills.some(cs => 
        cs.includes(requiredLower) || 
        requiredLower.includes(cs) ||
        this.calculateSimilarity(cs, requiredLower) > 0.8
      );
      
      if (isMatched) {
        matched.push(required);
      } else {
        gaps.push({
          skill: required,
          importance: 'high', // Could be enhanced with importance levels
          alternative: this.findAlternativeSkill(required, candidateSkills)
        });
      }
    });
    
    const coverage = requiredSkills.length > 0
      ? (matched.length / requiredSkills.length) * 100
      : 0;
    
    return {
      score: Math.round(coverage),
      matched: matched,
      gaps: gaps,
      coverage: Math.round(coverage),
      total_required: requiredSkills.length,
      matched_count: matched.length
    };
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  calculateSimilarity(str1, str2) {
    const distance = natural.LevenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  /**
   * Find alternative skill that candidate has
   */
  findAlternativeSkill(requiredSkill, candidateSkills) {
    // Simple alternatives mapping
    const alternatives = {
      'react': ['vue', 'angular', 'frontend'],
      'python': ['java', 'javascript', 'ruby'],
      'aws': ['azure', 'gcp', 'cloud'],
      'node.js': ['express', 'backend', 'server'],
      // Add more mappings as needed
    };
    
    const requiredLower = requiredSkill.toLowerCase();
    if (alternatives[requiredLower]) {
      for (const alt of alternatives[requiredLower]) {
        if (candidateSkills.some(cs => cs.toLowerCase().includes(alt))) {
          return candidateSkills.find(cs => cs.toLowerCase().includes(alt));
        }
      }
    }
    
    return null;
  }

  /**
   * Analyze work experience
   */
  analyzeExperience(experiences = []) {
    if (experiences.length === 0) {
      return {
        score: 0,
        total_years: 0,
        job_count: 0,
        has_relevant: false
      };
    }
    
    // Calculate total years (rough estimate)
    const totalYears = this.estimateTotalYears(experiences);
    
    // Score based on experience level
    let score = 0;
    if (totalYears >= 10) score = 100;
    else if (totalYears >= 5) score = 85;
    else if (totalYears >= 3) score = 70;
    else if (totalYears >= 1) score = 50;
    else score = 30;
    
    return {
      score: score,
      total_years: totalYears,
      job_count: experiences.length,
      has_relevant: experiences.length > 0,
      details: experiences.map(exp => ({
        period: exp.period,
        description_length: exp.description.join(' ').length
      }))
    };
  }

  /**
   * Estimate total years of experience from experience array
   */
  estimateTotalYears(experiences) {
    // Simple estimation: count number of date ranges
    // More sophisticated version would parse actual dates
    let years = 0;
    
    experiences.forEach(exp => {
      const period = exp.period || '';
      
      // Look for year patterns
      const yearMatches = period.match(/\b(19|20)\d{2}\b/g);
      if (yearMatches && yearMatches.length >= 2) {
        const startYear = parseInt(yearMatches[0]);
        const endYear = parseInt(yearMatches[1]);
        years += (endYear - startYear);
      } else if (yearMatches && yearMatches.length === 1) {
        // If only one year, assume 1 year duration
        years += 1;
      } else if (period.toLowerCase().includes('present') || period.toLowerCase().includes('current')) {
        // Assume 2 years for current roles
        years += 2;
      } else {
        // Default: assume 1.5 years per job
        years += 1.5;
      }
    });
    
    return Math.round(years * 10) / 10; // Round to 1 decimal
  }

  /**
   * Analyze resume format quality
   */
  analyzeFormat(resumeData) {
    const checks = {
      has_contact_email: !!resumeData.contact?.email,
      has_contact_phone: !!resumeData.contact?.phone,
      has_experience: resumeData.experience?.length > 0,
      has_education: resumeData.education?.length > 0,
      has_skills: resumeData.skills?.length > 0,
      has_summary: resumeData.summary?.length > 50,
      
      // Text quality checks
      sufficient_length: resumeData.raw_text?.length > 500,
      not_too_long: resumeData.raw_text?.length < 5000,
    };
    
    const passedChecks = Object.values(checks).filter(v => v).length;
    const totalChecks = Object.keys(checks).length;
    const score = Math.round((passedChecks / totalChecks) * 100);
    
    return {
      score: score,
      checks: checks,
      passed_checks: passedChecks,
      total_checks: totalChecks
    };
  }

  /**
   * Calculate overall ATS score with weighted components
   */
  calculateOverallScore(analyses) {
    const weights = {
      keyword: 0.30,    // 30% weight
      skills: 0.30,     // 30% weight
      experience: 0.25, // 25% weight
      format: 0.15      // 15% weight
    };
    
    const score = 
      (analyses.keywordAnalysis.score * weights.keyword) +
      (analyses.skillsAnalysis.score * weights.skills) +
      (analyses.experienceAnalysis.score * weights.experience) +
      (analyses.formatAnalysis.score * weights.format);
    
    return Math.round(score);
  }

  /**
   * Generate recommendations for improving ATS score
   */
  generateRecommendations(analyses) {
    const recommendations = [];
    
    // Keyword recommendations
    if (analyses.keywordAnalysis.score < 70) {
      recommendations.push({
        type: 'keywords',
        priority: 'high',
        message: `Add ${analyses.keywordAnalysis.missing.slice(0, 5).join(', ')} to improve keyword match`,
        impact: 'high'
      });
    }
    
    // Skills recommendations
    if (analyses.skillsAnalysis.gaps.length > 0) {
      const topGaps = analyses.skillsAnalysis.gaps.slice(0, 3);
      recommendations.push({
        type: 'skills',
        priority: 'high',
        message: `Missing critical skills: ${topGaps.map(g => g.skill).join(', ')}`,
        impact: 'high'
      });
    }
    
    // Experience recommendations
    if (analyses.experienceAnalysis.score < 50) {
      recommendations.push({
        type: 'experience',
        priority: 'medium',
        message: 'Add more details about your work experience and achievements',
        impact: 'medium'
      });
    }
    
    // Format recommendations
    if (!analyses.formatAnalysis.checks.has_contact_email) {
      recommendations.push({
        type: 'format',
        priority: 'high',
        message: 'Add email address for better ATS parsing',
        impact: 'high'
      });
    }
    
    if (!analyses.formatAnalysis.checks.has_summary) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        message: 'Add a professional summary at the top of your resume',
        impact: 'medium'
      });
    }
    
    if (!analyses.formatAnalysis.checks.sufficient_length) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        message: 'Resume is too short - add more details about your experience',
        impact: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * Compare multiple candidates
   */
  compareCandidates(analyses) {
    return analyses
      .map((analysis, index) => ({
        rank: index + 1,
        overall_score: analysis.overall_score,
        strengths: this.identifyStrengths(analysis),
        weaknesses: this.identifyWeaknesses(analysis)
      }))
      .sort((a, b) => b.overall_score - a.overall_score)
      .map((item, index) => ({...item, rank: index + 1}));
  }

  /**
   * Identify candidate strengths
   */
  identifyStrengths(analysis) {
    const strengths = [];
    
    if (analysis.keyword_score >= 80) strengths.push('Excellent keyword match');
    if (analysis.skills_score >= 80) strengths.push('Strong skill set');
    if (analysis.experience_score >= 80) strengths.push('Extensive experience');
    if (analysis.format_score >= 90) strengths.push('Well-formatted resume');
    
    return strengths;
  }

  /**
   * Identify candidate weaknesses
   */
  identifyWeaknesses(analysis) {
    const weaknesses = [];
    
    if (analysis.keyword_score < 60) weaknesses.push('Low keyword match');
    if (analysis.skills_score < 60) weaknesses.push('Skill gaps present');
    if (analysis.experience_score < 50) weaknesses.push('Limited experience');
    if (analysis.format_score < 70) weaknesses.push('Resume format issues');
    
    return weaknesses;
  }
}

module.exports = ATSService;

