============================================================
🚨 DOMAIN-SPECIFIC RULE — CAPACITY CONNECT FOR MoES / IMD
============================================================

CAPACITY CONNECT is a government-oriented Digital Capacity Building and Learning Management Portal intended for the Ministry of Earth Sciences (MoES) and the India Meteorological Department (IMD).

Therefore, this application MUST be designed around the actual professional training, capacity-building, operational, scientific, technical, administrative, and domain-specific requirements of MoES/IMD.

IMPORTANT:
Do NOT treat CAPACITY CONNECT as a generic software-engineering, IT-learning, coding-course, or engineering-course LMS.

The primary course catalog, competencies, skills, learning resources, assessments, trainer expertise, recommendations, and AI-generated content MUST be relevant to the MoES/IMD ecosystem.

Examples of appropriate domain areas may include, where applicable to the requirements:

- Meteorology
- Weather forecasting
- Climate science
- Climate monitoring
- Atmospheric sciences
- Ocean sciences
- Hydrology and related environmental sciences
- Weather observation and monitoring
- Numerical weather prediction
- Remote sensing
- Satellite meteorology
- Radar meteorology
- Atmospheric data analysis
- Climate data analysis
- Disaster/weather early warning
- Environmental and Earth-system sciences
- Scientific research and operational practices
- Meteorological instruments and observation systems
- Forecast verification and quality assessment
- GIS/geospatial applications relevant to meteorology and Earth sciences
- Scientific communication
- Technical and operational capacity building
- Government/public-sector administrative and professional skills
- Leadership and management training
- Field/operational training
- Institutional procedures and domain-specific competencies

These are examples, NOT an instruction to blindly create all of them. The actual course and competency taxonomy MUST be derived from the approved project requirements, MoES/IMD requirements, provided documents, and authoritative sources.

============================================================
DOMAIN RELEVANCE RULE
============================================================

Whenever implementing:

- Courses
- Skills
- Competencies
- Learning resources
- Assessments
- Prerequisites
- Trainer profiles
- Trainer expertise
- Trainer matching
- Course recommendations
- Skill-gap analysis
- AI recommendations
- AI chatbot knowledge
- Feedback analysis
- Reports
- Analytics
- Search/filter categories

the implementation MUST consider MoES/IMD domain relevance.

Do NOT populate production-oriented course catalogs with arbitrary generic engineering or software-development courses such as:

- Generic Java courses
- Generic Python courses
- Generic Web Development
- Generic MERN courses
- Generic Full Stack Development
- Generic Competitive Programming
- Generic Software Engineering
- Generic Engineering subjects

unless the actual MoES/IMD requirements explicitly require them.

If digital/IT skills are required, they should be represented according to their actual role in the MoES/IMD workforce and training requirements rather than assuming that the platform is an engineering-learning portal.

============================================================
CONTENT SAFETY & DOMAIN ACCURACY
============================================================

Never invent official MoES/IMD courses, policies, competencies, certifications, training requirements, institutional procedures, or official terminology.

If domain-specific information is required and it is not available in the existing project requirements or documentation:

1. Clearly identify the missing information.
2. Prefer authoritative MoES/IMD sources when external research is explicitly permitted.
3. Keep uncertain information configurable rather than hardcoded.
4. Do not present assumptions as official government requirements.

AI-generated recommendations and content MUST NOT be presented as official MoES/IMD policy unless the information is explicitly verified from an authoritative source.

============================================================
DOMAIN-FIRST DATA DESIGN
============================================================

The database architecture MUST allow the organization to evolve its domain taxonomy without requiring major code changes.

Avoid hardcoding course categories such as:

"Engineering"
"Programming"
"Web Development"

directly into business logic.

Instead, design scalable entities/taxonomies where appropriate, such as:

Domain
  ↓
Discipline
  ↓
Competency
  ↓
Skill
  ↓
Course
  ↓
Learning Resource
  ↓
Assessment

The exact schema should follow the approved requirements and existing database architecture.

The system should support future expansion to additional MoES/IMD departments, disciplines, training programs, roles, competencies, and learning paths without requiring architectural redesign.

============================================================
ROLE-BASED DOMAIN RELEVANCE
============================================================

Training recommendations MUST consider the user's:

- organizational role
- department
- professional responsibility
- existing competencies
- skill gaps
- completed courses
- prerequisites
- assessment performance
- required competencies

Do NOT recommend courses solely based on generic popularity.

For example:

Trainee Role
    ↓
Required Competencies
    ↓
Current Competencies
    ↓
Competency Gap
    ↓
Relevant MoES/IMD Training
    ↓
Prerequisite Check
    ↓
Learning Path
    ↓
Assessment
    ↓
Competency Update

============================================================
TRAINER DOMAIN MATCHING
============================================================

Trainer matching MUST prioritize domain expertise.

A trainer should be matched based on relevant factors such as:

- subject expertise
- competency expertise
- course expertise
- professional/domain experience
- required training level
- relevant certifications/qualifications where applicable
- availability
- organizational requirements

Do NOT match trainers merely because they have generic teaching experience.

============================================================
AI DOMAIN RESTRICTION
============================================================

For AI features such as:

- AI Skill Analyzer
- AI Feedback Analysis
- AI Course Recommendation
- AI Trainer Matching
- AI Chatbot
- Competency Gap Analysis

the AI MUST operate within the approved CAPACITY CONNECT domain and available knowledge sources.

AI must distinguish between:

1. Official/verified information
2. Project-configured information
3. AI-generated recommendations
4. General informational content

Never hallucinate official government requirements.

For high-impact recommendations, provide the reasoning or relevant competency relationship where appropriate.

============================================================
CONFIGURABILITY RULE
============================================================

Domain-specific content should be data-driven and configurable wherever practical.

Course categories, competencies, skills, departments, roles, prerequisites, trainer expertise, and learning paths should NOT be unnecessarily hardcoded into frontend components or backend business logic.

Administrators should be able to manage domain content through the appropriate modules where the requirements call for it.

============================================================
FINAL DOMAIN PRINCIPLE
============================================================

CAPACITY CONNECT is NOT "another generic LMS."

It is a domain-oriented capacity-building platform for the MoES/IMD ecosystem.

Every feature must therefore answer:

"How does this support training, competency development, knowledge acquisition, skill improvement, or capacity building relevant to MoES/IMD?"

If a proposed feature, course, skill, recommendation, or content item has no clear relevance to the target organization's capacity-building objectives, DO NOT automatically implement or populate it.

First verify its domain relevance against the approved requirements.