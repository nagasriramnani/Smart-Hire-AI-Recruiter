const pdf = require('pdf-parse');
const mammoth = require('mammoth');

class ResumeParser {
  constructor() {
    // Email regex pattern
    this.emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    
    // Phone regex patterns
    this.phonePattern = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    
    // Common section headers
    this.sectionHeaders = {
      experience: /experience|work\s+history|employment|professional\s+background/i,
      education: /education|academic|qualification/i,
      skills: /skills|technical\s+skills|competencies|expertise/i,
      summary: /summary|profile|objective|about/i,
    };
  }

  /**
   * Parse resume from buffer based on file type
   */
  async parseResume(buffer, fileType) {
    try {
      let text = '';
      
      switch (fileType) {
        case 'application/pdf':
          text = await this.parsePDF(buffer);
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          text = await this.parseDOCX(buffer);
          break;
        case 'text/plain':
          text = buffer.toString('utf-8');
          break;
        default:
          throw new Error('Unsupported file type');
      }
      
      return this.extractStructuredData(text);
    } catch (error) {
      console.error('Resume parsing error:', error);
      throw new Error('Failed to parse resume');
    }
  }

  /**
   * Parse PDF file
   */
  async parsePDF(buffer) {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse PDF');
    }
  }

  /**
   * Parse DOCX file
   */
  async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error('Failed to parse DOCX');
    }
  }

  /**
   * Extract structured data from resume text
   */
  extractStructuredData(text) {
    const data = {
      raw_text: text,
      contact: this.extractContactInfo(text),
      experience: this.extractExperience(text),
      education: this.extractEducation(text),
      skills: this.extractSkills(text),
      summary: this.extractSummary(text),
    };
    
    return data;
  }

  /**
   * Extract contact information
   */
  extractContactInfo(text) {
    const contact = {
      email: null,
      phone: null,
      linkedin: null,
      github: null,
    };
    
    // Extract email
    const emailMatch = text.match(this.emailPattern);
    if (emailMatch) {
      contact.email = emailMatch[0];
    }
    
    // Extract phone
    const phoneMatch = text.match(this.phonePattern);
    if (phoneMatch) {
      contact.phone = phoneMatch[0];
    }
    
    // Extract LinkedIn
    const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) {
      contact.linkedin = linkedinMatch[0];
    }
    
    // Extract GitHub
    const githubMatch = text.match(/github\.com\/[\w-]+/i);
    if (githubMatch) {
      contact.github = githubMatch[0];
    }
    
    return contact;
  }

  /**
   * Extract work experience
   */
  extractExperience(text) {
    const experiences = [];
    
    // Find experience section
    const expSection = this.extractSection(text, this.sectionHeaders.experience);
    if (!expSection) return experiences;
    
    // Split by common separators (dates, bullet points, etc.)
    const lines = expSection.split('\n').filter(line => line.trim().length > 0);
    
    let currentExp = null;
    
    lines.forEach(line => {
      // Check if line contains a date range (e.g., "2020 - 2023")
      const datePattern = /\b(19|20)\d{2}\b.*?\b(19|20)\d{2}|present\b/i;
      if (datePattern.test(line)) {
        if (currentExp) {
          experiences.push(currentExp);
        }
        currentExp = {
          period: line.trim(),
          description: [],
        };
      } else if (currentExp) {
        currentExp.description.push(line.trim());
      }
    });
    
    if (currentExp) {
      experiences.push(currentExp);
    }
    
    return experiences;
  }

  /**
   * Extract education
   */
  extractEducation(text) {
    const education = [];
    
    // Find education section
    const eduSection = this.extractSection(text, this.sectionHeaders.education);
    if (!eduSection) return education;
    
    // Common degree keywords
    const degreeKeywords = [
      'bachelor', 'master', 'phd', 'doctorate', 'diploma',
      'bs', 'ba', 'ms', 'ma', 'mba', 'btech', 'mtech'
    ];
    
    const lines = eduSection.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (degreeKeywords.some(keyword => lowerLine.includes(keyword))) {
        education.push(line.trim());
      }
    });
    
    return education;
  }

  /**
   * Extract skills
   */
  extractSkills(text) {
    const skills = [];
    
    // Find skills section
    const skillsSection = this.extractSection(text, this.sectionHeaders.skills);
    if (!skillsSection) {
      // Fallback: extract common tech skills from entire text
      return this.extractCommonSkills(text);
    }
    
    // Split by common separators
    const separators = /[,•\n|]/;
    const items = skillsSection.split(separators);
    
    items.forEach(item => {
      const cleaned = item.trim();
      if (cleaned.length > 2 && cleaned.length < 50) {
        skills.push(cleaned);
      }
    });
    
    return skills;
  }

  /**
   * Extract common skills from entire text
   */
  extractCommonSkills(text) {
    const commonSkills = [
      // Programming Languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
      'TypeScript', 'Rust', 'Scala', 'R', 'MATLAB',
      
      // Frameworks & Libraries
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
      'ASP.NET', 'Laravel', 'Rails', 'Next.js', 'Nuxt.js',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite', 'Cassandra',
      'DynamoDB', 'Firebase',
      
      // Cloud & DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'CI/CD',
      'Terraform', 'Ansible',
      
      // Other
      'Machine Learning', 'AI', 'Data Science', 'Agile', 'Scrum', 'REST API',
      'GraphQL', 'Microservices', 'HTML', 'CSS', 'SQL'
    ];
    
    const foundSkills = [];
    const lowerText = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });
    
    return [...new Set(foundSkills)]; // Remove duplicates
  }

  /**
   * Extract summary/objective
   */
  extractSummary(text) {
    const summarySection = this.extractSection(text, this.sectionHeaders.summary);
    
    if (summarySection) {
      // Take first 500 characters of summary
      return summarySection.substring(0, 500).trim();
    }
    
    // Fallback: take first few lines
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const firstParagraph = lines.slice(0, 5).join(' ');
    return firstParagraph.substring(0, 500).trim();
  }

  /**
   * Extract a specific section from text
   */
  extractSection(text, headerPattern) {
    const lines = text.split('\n');
    let inSection = false;
    let sectionLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line is a section header
      if (headerPattern.test(line)) {
        inSection = true;
        continue;
      }
      
      // Check if we've hit a new section header
      if (inSection && this.isNewSection(line)) {
        break;
      }
      
      if (inSection) {
        sectionLines.push(line);
      }
    }
    
    return sectionLines.join('\n').trim();
  }

  /**
   * Check if line is a new section header
   */
  isNewSection(line) {
    const allHeaders = [
      this.sectionHeaders.experience,
      this.sectionHeaders.education,
      this.sectionHeaders.skills,
      this.sectionHeaders.summary,
    ];
    
    return allHeaders.some(pattern => pattern.test(line));
  }

  /**
   * Calculate resume quality metrics
   */
  calculateQualityMetrics(parsedData) {
    const metrics = {
      hasEmail: !!parsedData.contact.email,
      hasPhone: !!parsedData.contact.phone,
      hasExperience: parsedData.experience.length > 0,
      hasEducation: parsedData.education.length > 0,
      hasSkills: parsedData.skills.length > 0,
      hasSummary: parsedData.summary.length > 50,
      wordCount: parsedData.raw_text.split(/\s+/).length,
    };
    
    // Calculate completeness score
    const criteriaCount = 6;
    const metCount = Object.values(metrics).filter(v => v === true).length;
    metrics.completenessScore = (metCount / criteriaCount) * 100;
    
    return metrics;
  }
}

module.exports = ResumeParser;

