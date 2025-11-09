const db = require('../db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

console.log('🌱 Seeding SmartHire database with mock data...');

// Clear existing data
console.log('🧹 Clearing existing data...');
db.prepare('DELETE FROM bookmarks').run();
db.prepare('DELETE FROM applications').run();
db.prepare('DELETE FROM jobs').run();
db.prepare('DELETE FROM candidate_profiles').run();
db.prepare('DELETE FROM users').run();

// Helper function to hash passwords
const hashPassword = (password) => {
  return bcrypt.hashSync(password, 10);
};

// 1. Create test users
console.log('👥 Creating test users...');
const users = [
  {
    id: uuidv4(),
    email: 'employer@local.dev',
    password: hashPassword('password'),
    name: 'Sarah Johnson',
    role: 'employer',
    avatar: null
  },
  {
    id: uuidv4(),
    email: 'recruiter@local.dev',
    password: hashPassword('password'),
    name: 'Mike Chen',
    role: 'recruiter',
    avatar: null
  },
  {
    id: uuidv4(),
    email: 'employer2@local.dev',
    password: hashPassword('password'),
    name: 'David Smith',
    role: 'employer',
    avatar: null
  }
];

const userStmt = db.prepare(`
  INSERT INTO users (id, email, password, name, role, avatar)
  VALUES (?, ?, ?, ?, ?, ?)
`);

users.forEach(user => {
  userStmt.run(user.id, user.email, user.password, user.name, user.role, user.avatar);
});

const employerId = users[0].id;
const recruiterId = users[1].id;

// 2. Create candidate profiles
console.log('👨‍💼 Creating candidate profiles...');

const skills = [
  ['JavaScript', 'React', 'Node.js', 'TypeScript'],
  ['Python', 'Django', 'PostgreSQL', 'Docker'],
  ['Java', 'Spring Boot', 'Microservices', 'AWS'],
  ['React', 'Vue.js', 'HTML', 'CSS', 'UI/UX'],
  ['Machine Learning', 'Python', 'TensorFlow', 'Data Science'],
  ['DevOps', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
  ['iOS', 'Swift', 'SwiftUI', 'Mobile Development'],
  ['Android', 'Kotlin', 'Java', 'Mobile Development'],
  ['Full Stack', 'React', 'Node.js', 'MongoDB', 'Express'],
  ['Backend', 'Go', 'gRPC', 'Redis', 'PostgreSQL']
];

const locations = ['New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Remote', 'Chicago, IL', 'Denver, CO'];
const education = [
  [{ degree: 'BS Computer Science', school: 'MIT', year: 2020 }],
  [{ degree: 'MS Software Engineering', school: 'Stanford', year: 2021 }],
  [{ degree: 'BS Information Technology', school: 'UC Berkeley', year: 2019 }],
  [{ degree: 'BS Data Science', school: 'Carnegie Mellon', year: 2020 }]
];

const names = [
  'Emma Wilson', 'James Martinez', 'Olivia Brown', 'Noah Davis',
  'Ava Garcia', 'Liam Rodriguez', 'Sophia Lee', 'William Taylor',
  'Isabella Anderson', 'Benjamin Thomas', 'Mia Jackson', 'Lucas White',
  'Charlotte Harris', 'Henry Clark', 'Amelia Lewis', 'Alexander Walker',
  'Harper Hall', 'Daniel Allen', 'Evelyn Young', 'Michael King'
];

const candidateStmt = db.prepare(`
  INSERT INTO candidate_profiles (
    id, name, email, phone, location, bio, skills, 
    experience_years, education, work_history, available
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const candidates = [];
for (let i = 0; i < 50; i++) {
  const candidate = {
    id: uuidv4(),
    name: names[i % names.length] + ' ' + (i > 19 ? 'Jr.' : ''),
    email: `candidate${i + 1}@example.com`,
    phone: `555-${String(i).padStart(4, '0')}`,
    location: locations[i % locations.length],
    bio: `Experienced professional with ${Math.floor(Math.random() * 10) + 1} years in the industry. Passionate about technology and innovation.`,
    skills: JSON.stringify(skills[i % skills.length]),
    experience_years: Math.floor(Math.random() * 15) + 1,
    education: JSON.stringify(education[i % education.length]),
    work_history: JSON.stringify([
      {
        title: 'Software Engineer',
        company: 'Tech Corp',
        years: '2020-Present'
      }
    ]),
    available: Math.random() > 0.3 ? 1 : 0
  };
  
  candidates.push(candidate);
  candidateStmt.run(
    candidate.id, candidate.name, candidate.email, candidate.phone,
    candidate.location, candidate.bio, candidate.skills, candidate.experience_years,
    candidate.education, candidate.work_history, candidate.available
  );
}

// 3. Create jobs
console.log('💼 Creating job postings...');

const jobs = [
  {
    id: uuidv4(),
    employer_id: employerId,
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced full stack developer to join our team.',
    company_name: 'TechCorp Inc',
    location: 'San Francisco, CA',
    job_type: 'Full-time',
    salary_range: '$120k - $180k',
    form_schema: JSON.stringify({
      fields: [
        { id: '1', type: 'text', label: 'Full Name', required: true },
        { id: '2', type: 'email', label: 'Email', required: true },
        { id: '3', type: 'tel', label: 'Phone', required: false },
        { id: '4', type: 'textarea', label: 'Why do you want to work here?', required: true },
        { id: '5', type: 'file', label: 'Resume', required: true },
        { id: '6', type: 'select', label: 'Years of Experience', options: ['0-2', '3-5', '6-10', '10+'], required: true }
      ]
    }),
    status: 'published'
  },
  {
    id: uuidv4(),
    employer_id: employerId,
    title: 'Frontend React Developer',
    description: 'Join our team to build beautiful user interfaces with React.',
    company_name: 'TechCorp Inc',
    location: 'Remote',
    job_type: 'Full-time',
    salary_range: '$90k - $140k',
    form_schema: JSON.stringify({
      fields: [
        { id: '1', type: 'text', label: 'Full Name', required: true },
        { id: '2', type: 'email', label: 'Email', required: true },
        { id: '3', type: 'textarea', label: 'Describe your React experience', required: true },
        { id: '4', type: 'file', label: 'Resume', required: true }
      ]
    }),
    status: 'published'
  },
  {
    id: uuidv4(),
    employer_id: employerId,
    title: 'DevOps Engineer',
    description: 'Help us build and maintain our cloud infrastructure.',
    company_name: 'TechCorp Inc',
    location: 'Austin, TX',
    job_type: 'Full-time',
    salary_range: '$110k - $160k',
    form_schema: JSON.stringify({
      fields: [
        { id: '1', type: 'text', label: 'Full Name', required: true },
        { id: '2', type: 'email', label: 'Email', required: true },
        { id: '3', type: 'file', label: 'Resume', required: true }
      ]
    }),
    status: 'draft'
  }
];

const jobStmt = db.prepare(`
  INSERT INTO jobs (
    id, employer_id, title, description, company_name, 
    location, job_type, salary_range, form_schema, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

jobs.forEach(job => {
  jobStmt.run(
    job.id, job.employer_id, job.title, job.description, job.company_name,
    job.location, job.job_type, job.salary_range, job.form_schema, job.status
  );
});

// 4. Create applications for the first job
console.log('📝 Creating job applications...');

const firstJobId = jobs[0].id;
const applicationStmt = db.prepare(`
  INSERT INTO applications (
    id, job_id, candidate_name, candidate_email, candidate_data, status
  ) VALUES (?, ?, ?, ?, ?, ?)
`);

for (let i = 0; i < 15; i++) {
  const candidate = candidates[i];
  const application = {
    id: uuidv4(),
    job_id: firstJobId,
    candidate_name: candidate.name,
    candidate_email: candidate.email,
    candidate_data: JSON.stringify({
      'Full Name': candidate.name,
      'Email': candidate.email,
      'Phone': candidate.phone,
      'Why do you want to work here?': 'I am excited about this opportunity because...',
      'Years of Experience': candidate.experience_years > 10 ? '10+' : `${candidate.experience_years}`
    }),
    status: 'pending'
  };
  
  applicationStmt.run(
    application.id, application.job_id, application.candidate_name,
    application.candidate_email, application.candidate_data, application.status
  );
}

console.log('✅ Seeding complete!');
console.log('📊 Summary:');
console.log(`   - ${users.length} users created`);
console.log(`   - ${candidates.length} candidate profiles created`);
console.log(`   - ${jobs.length} jobs created`);
console.log(`   - 15 applications created`);
console.log('\n🔐 Test credentials:');
console.log('   Employer: employer@local.dev / password');
console.log('   Recruiter: recruiter@local.dev / password');

