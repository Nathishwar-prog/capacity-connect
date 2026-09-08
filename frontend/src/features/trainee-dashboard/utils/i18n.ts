import { Language } from '@/store/language';

export interface Translations {
  // Brand & Shell
  portalName: string;
  portalTagline: string;
  ministryName: string;
  departmentName: string;
  searchPlaceholder: string;
  portalSubtitle: string;
  helpAndKnowledge: string;
  signOut: string;
  notifications: string;
  unread: string;
  allCaughtUp: string;
  markAllRead: string;
  viewAllNotifications: string;
  settings: string;
  myProfile: string;

  // Navigation Items
  navDashboard: string;
  navMyCourses: string;
  navExploreCourses: string;
  navMyProgress: string;
  navAssessments: string;
  navCertificates: string;
  navNotifications: string;
  navProfile: string;
  navSettings: string;

  // Framework Banner
  frameworkTitle: string;
  frameworkStandard: string;
  frameworkSubtitle: string;
  viewWorkflow: string;

  // Welcome & Profile Completion
  welcomeBack: string;
  welcomeSubtitle: string;
  profileCompletion: string;
  completeProfile: string;
  profileStatusDetail: string;

  // Section 2: Active Courses
  activeCourses: string;
  activeCoursesSubtitle: string;
  continueLearning: string;
  trainerLabel: string;
  noActiveCourses: string;

  // Section 3: Course Progress
  courseProgress: string;
  overallProgress: string;
  progressSubtitle: string;
  completedBadge: string;
  inProgressBadge: string;

  // Section 4: Upcoming Assessments
  upcomingAssessments: string;
  assessmentSubtitle: string;
  dueDate: string;
  viewAssessment: string;
  durationLabel: string;
  passScoreLabel: string;
  noUpcomingAssessments: string;

  // Section 5: Competency
  competencyTitle: string;
  overallCompetency: string;
  goodProgress: string;
  competencyLevel: string;
  competencySubtitle: string;

  // Section 6: Skill Gaps
  skillGapsTitle: string;
  skillGapsSubtitle: string;
  identifiedGaps: string;
  highPriority: string;
  mediumPriority: string;
  targetLevel: string;
  currentLevel: string;
  noSkillGaps: string;

  // Section 7: Recommendations
  recommendationsTitle: string;
  recommendationsSubtitle: string;
  viewCourse: string;
  recommendedReason: string;
  targetCompetency: string;
  noRecommendations: string;

  // Section 8: Achievements
  achievementsTitle: string;
  achievementsSubtitle: string;
  coursesCompleted: string;
  certificatesEarned: string;
  assessmentsPassed: string;
  learningHours: string;
  accreditedBadges: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    portalName: 'CAPACITY CONNECT',
    portalTagline: 'Learn • Develop • Grow',
    ministryName: 'Ministry of Earth Sciences',
    departmentName: 'India Meteorological Department',
    searchPlaceholder: 'Search courses, trainees, assessments, resources...',
    portalSubtitle: 'Safer Tomorrow',
    helpAndKnowledge: 'Help & Knowledge Center',
    signOut: 'Log Out',
    notifications: 'Notifications',
    unread: 'unread',
    allCaughtUp: 'All caught up',
    markAllRead: 'Mark all read',
    viewAllNotifications: 'View all notifications',
    settings: 'Settings',
    myProfile: 'My Profile',

    navDashboard: 'Dashboard',
    navMyCourses: 'My Courses',
    navExploreCourses: 'Explore Courses',
    navMyProgress: 'My Progress',
    navAssessments: 'Assessments',
    navCertificates: 'Certificates',
    navNotifications: 'Notifications',
    navProfile: 'Profile',
    navSettings: 'Settings',

    frameworkTitle: 'IMD METEOROLOGICAL TRAINING FRAMEWORK',
    frameworkStandard: 'WMO-258 & MoES Standards',
    frameworkSubtitle:
      'Continuous Competency Transformation Lifecycle & Active Forecaster Evaluation Loop',
    viewWorkflow: 'View Workflow',

    welcomeBack: 'Welcome back',
    welcomeSubtitle:
      'Track your learning progress, address identified skill gaps, and advance your forecaster competency.',
    profileCompletion: 'Profile Completion',
    completeProfile: 'Complete Profile',
    profileStatusDetail:
      'Profile nearly complete. Add emergency contact & operational posting details to reach 100%.',

    activeCourses: 'Active Courses',
    activeCoursesSubtitle:
      'Current atmospheric science & operational forecasting curricula in progress.',
    continueLearning: 'Continue Learning',
    trainerLabel: 'Instructor',
    noActiveCourses: 'No active courses yet. Enroll from the course catalog to start learning.',

    courseProgress: 'Overall Course Progress',
    overallProgress: 'Average Curriculum Completion',
    progressSubtitle: 'Progression velocity across your active professional learning pathways.',
    completedBadge: 'Completed',
    inProgressBadge: 'In Progress',

    upcomingAssessments: 'Upcoming Assessments',
    assessmentSubtitle:
      'Scheduled evaluations and practical forecasting tests awaiting completion.',
    dueDate: 'Due',
    viewAssessment: 'View Assessment',
    durationLabel: 'Duration',
    passScoreLabel: 'Pass Score',
    noUpcomingAssessments: 'No upcoming assessments scheduled at this time.',

    competencyTitle: 'Overall Competency',
    overallCompetency: 'Overall Competency Level',
    goodProgress: 'Good Progress • Operational Forecaster Level 3',
    competencyLevel: 'Level 3 Competence',
    competencySubtitle: 'Evaluated against WMO-258 and MoES Capacity Building metrics.',

    skillGapsTitle: 'Identified Skill Gaps',
    skillGapsSubtitle: 'Targeted areas requiring skill enhancement based on recent simulations.',
    identifiedGaps: 'Skill Gaps',
    highPriority: 'High Priority',
    mediumPriority: 'Medium Priority',
    targetLevel: 'Target Level',
    currentLevel: 'Current Level',
    noSkillGaps: 'No skill gaps identified. All competencies are meeting operational baselines.',

    recommendationsTitle: 'Recommended Curricula',
    recommendationsSubtitle:
      'Curated courses aligned with your identified skill gaps and career path.',
    viewCourse: 'View Course',
    recommendedReason: 'Why Recommended',
    targetCompetency: 'Target Skill',
    noRecommendations: 'No course recommendations available at this time.',

    achievementsTitle: 'Key Achievements & Milestones',
    achievementsSubtitle: 'Accredited certifications and milestone recognitions earned.',
    coursesCompleted: 'Courses Completed',
    certificatesEarned: 'Certificates Earned',
    assessmentsPassed: 'Assessments Passed',
    learningHours: 'Learning Hours',
    accreditedBadges: 'Institutional Milestone Badges',
  },

  hi: {
    portalName: 'कैपेसिटी कनेक्ट',
    portalTagline: 'सीखें • विकसित हों • आगे बढ़ें',
    ministryName: 'पृथ्वी विज्ञान मंत्रालय',
    departmentName: 'भारत मौसम विज्ञान विभाग',
    searchPlaceholder: 'पाठ्यक्रम, प्रशिक्षु, मूल्यांकन, संसाधन खोजें...',
    portalSubtitle: 'सुरक्षित कल',
    helpAndKnowledge: 'सहायता एवं ज्ञान केंद्र',
    signOut: 'लॉग आउट',
    notifications: 'सूचनाएं',
    unread: 'अपठित',
    allCaughtUp: 'सब देखा गया',
    markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
    viewAllNotifications: 'सभी सूचनाएं देखें',
    settings: 'सेटिंग्स',
    myProfile: 'मेरी प्रोफ़ाइल',

    navDashboard: 'डैशबोर्ड',
    navMyCourses: 'मेरे पाठ्यक्रम',
    navExploreCourses: 'पाठ्यक्रम खोजें',
    navMyProgress: 'मेरी प्रगति',
    navAssessments: 'मूल्यांकन',
    navCertificates: 'प्रमाणपत्र',
    navNotifications: 'सूचनाएं',
    navProfile: 'प्रोफ़ाइल',
    navSettings: 'सेटिंग्स',

    frameworkTitle: 'आईएमडी मौसम विज्ञान प्रशिक्षण रूपरेखा',
    frameworkStandard: 'डब्ल्यूएमओ-258 एवं एमओईएस मानक',
    frameworkSubtitle: 'सतत योग्यता परिवर्तन जीवन चक्र एवं सक्रिय पूर्वानुमानकर्ता मूल्यांकन चक्र',
    viewWorkflow: 'कार्यप्रवाह देखें',

    welcomeBack: 'वापसी पर स्वागत है',
    welcomeSubtitle:
      'अपनी शिक्षण प्रगति को ट्रैक करें, कौशल अंतरालों को सुधारें और अपनी पूर्वानुमान योग्यता बढ़ाएं।',
    profileCompletion: 'प्रोफ़ाइल पूर्णता',
    completeProfile: 'प्रोफ़ाइल पूरा करें',
    profileStatusDetail:
      'प्रोफ़ाइल लगभग पूर्ण है। 100% तक पहुँचने के लिए आपातकालीन संपर्क एवं पोस्टिंग विवरण जोड़ें।',

    activeCourses: 'सक्रिय पाठ्यक्रम',
    activeCoursesSubtitle: 'वर्तमान वायुमंडलीय विज्ञान एवं परिचालन पूर्वानुमान पाठ्यक्रम जारी हैं।',
    continueLearning: 'पढ़ाई जारी रखें',
    trainerLabel: 'प्रशिक्षक',
    noActiveCourses: 'वर्तमान में कोई सक्रिय पाठ्यक्रम नहीं है। कैटलॉग से नामांकन करें।',

    courseProgress: 'समग्र पाठ्यक्रम प्रगति',
    overallProgress: 'औसत पाठ्यक्रम पूर्णता',
    progressSubtitle: 'आपके सक्रिय व्यावसायिक शिक्षण पथों में प्रगति की गति।',
    completedBadge: 'पूर्ण',
    inProgressBadge: 'प्रगति पर',

    upcomingAssessments: 'आगामी मूल्यांकन',
    assessmentSubtitle: 'अनुसूचित मूल्यांकन और व्यावहारिक पूर्वानुमान परीक्षण देय हैं।',
    dueDate: 'नियत तिथि',
    viewAssessment: 'मूल्यांकन देखें',
    durationLabel: 'अवधि',
    passScoreLabel: 'उत्तीर्ण अंक',
    noUpcomingAssessments: 'इस समय कोई आगामी मूल्यांकन निर्धारित नहीं है।',

    competencyTitle: 'समग्र योग्यता',
    overallCompetency: 'समग्र योग्यता स्तर',
    goodProgress: 'अच्छी प्रगति • परिचालन पूर्वानुमानकर्ता स्तर 3',
    competencyLevel: 'स्तर 3 क्षमता',
    competencySubtitle: 'डब्ल्यूएमओ-258 एवं एमओईएस क्षमता निर्माण मानकों के अनुसार मूल्यांकित।',

    skillGapsTitle: 'पहचाने गए कौशल अंतराल',
    skillGapsSubtitle: 'हाल के सिमुलेशन के आधार पर कौशल वृद्धि की आवश्यकता वाले लक्षित क्षेत्र।',
    identifiedGaps: 'कौशल अंतराल',
    highPriority: 'उच्च प्राथमिकता',
    mediumPriority: 'मध्यम प्राथमिकता',
    targetLevel: 'लक्ष्य स्तर',
    currentLevel: 'वर्तमान स्तर',
    noSkillGaps: 'कोई कौशल अंतराल नहीं पहचाना गया। सभी योग्यताएं परिचालन मानकों पर खरी हैं।',

    recommendationsTitle: 'अनुशंसित पाठ्यक्रम',
    recommendationsSubtitle: 'आपके कौशल अंतराल और करियर पथ के अनुरूप चयनित पाठ्यक्रम।',
    viewCourse: 'पाठ्यक्रम देखें',
    recommendedReason: 'अनुशंसा का कारण',
    targetCompetency: 'लक्षित कौशल',
    noRecommendations: 'वर्तमान में कोई पाठ्यक्रम अनुशंसा उपलब्ध नहीं है।',

    achievementsTitle: 'प्रमुख उपलब्धियाँ एवं मील के पत्थर',
    achievementsSubtitle: 'मान्यता प्राप्त प्रमाणपत्र और मील के पत्थर की उपलब्धियाँ।',
    coursesCompleted: 'पूर्ण पाठ्यक्रम',
    certificatesEarned: 'अर्जित प्रमाणपत्र',
    assessmentsPassed: 'उत्तीर्ण मूल्यांकन',
    learningHours: 'शिक्षण घंटे',
    accreditedBadges: 'संस्थागत मील का पत्थर बैज',
  },

  ta: {
    portalName: 'கபாசிட்டி கனெக்ட்',
    portalTagline: 'கற்க • வளர • முன்னேற',
    ministryName: 'புவி அறிவியல் அமைச்சகம்',
    departmentName: 'இந்திய வானிலை ஆய்வுத் துறை',
    searchPlaceholder: 'படிப்புகள், பயிற்சியாளர்கள், மதிப்பீடுகள், ஆதாரங்களைத் தேடுங்கள்...',
    portalSubtitle: 'பாதுகாப்பான நாளை',
    helpAndKnowledge: 'உதவி மற்றும் அறிவு மையம்',
    signOut: 'வெளியேறு',
    notifications: 'அறிவிப்புகள்',
    unread: 'படிக்காதவை',
    allCaughtUp: 'அனைத்தும் பார்க்கப்பட்டது',
    markAllRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
    viewAllNotifications: 'அனைத்து அறிவிப்புகளையும் காண்க',
    settings: 'அமைப்புகள்',
    myProfile: 'எனது சுயவிவரம்',

    navDashboard: 'முகப்புப்பலகை',
    navMyCourses: 'எனது படிப்புகள்',
    navExploreCourses: 'படிப்புகளை ஆராய்க',
    navMyProgress: 'எனது முன்னேற்றம்',
    navAssessments: 'மதிப்பீடுகள்',
    navCertificates: 'சான்றிதழ்கள்',
    navNotifications: 'அறிவிப்புகள்',
    navProfile: 'சுயவிவரம்',
    navSettings: 'அமைப்புகள்',

    frameworkTitle: 'ஐஎம்டி வானிலை பயிற்சி கட்டமைப்பு',
    frameworkStandard: 'WMO-258 மற்றும் MoES தரநிலைகள்',
    frameworkSubtitle:
      'தொடர்ச்சியான திறன் உருமாற்ற வாழ்க்கை சுழற்சி மற்றும் முன்னறிவிப்பாளர் மதிப்பீட்டு வளையம்',
    viewWorkflow: 'பணிப்பாய்வைக் காண்க',

    welcomeBack: 'மீண்டும் வருக',
    welcomeSubtitle:
      'உங்கள் கற்றல் முன்னேற்றத்தைக் கண்காணித்து, திறன் இடைவெளிகளைக் களைந்து, முன்னறிவிப்பு தகுதியை மேம்படுத்துங்கள்.',
    profileCompletion: 'சுயவிவர நிறைவு',
    completeProfile: 'சுயவிவரத்தை முடிக்கவும்',
    profileStatusDetail:
      'சுயவிவரம் கிட்டத்தட்ட முடிந்தது. 100% ஐ அடைய அவசர தொடர்பு மற்றும் பணி விவரங்களைச் சேர்க்கவும்.',

    activeCourses: 'நடப்புப் படிப்புகள்',
    activeCoursesSubtitle:
      'செயலில் உள்ள வளிமண்டல அறிவியல் மற்றும் வானிலை முன்னறிவிப்பு பாடத்திட்டங்கள்.',
    continueLearning: 'கற்றலைத் தொடரவும்',
    trainerLabel: 'பயிற்றுவிப்பாளர்',
    noActiveCourses:
      'தற்போது செயலில் உள்ள படிப்புகள் எதுவும் இல்லை. பாடப் பட்டியலிலிருந்து சேரவும்.',

    courseProgress: 'ஒட்டுமொத்த பாடநெறி முன்னேற்றம்',
    overallProgress: 'சராசரி பாடத்திட்ட நிறைவு',
    progressSubtitle: 'உங்கள் செயலில் உள்ள தொழில்முறை கற்றல் பாதைகளின் முன்னேற்ற வேகம்.',
    completedBadge: 'நிறைவுற்றது',
    inProgressBadge: 'செயலில் உள்ளது',

    upcomingAssessments: 'வரவிருக்கும் மதிப்பீடுகள்',
    assessmentSubtitle:
      'திட்டமிடப்பட்ட மதிப்பீடுகள் மற்றும் செய்முறை வானிலை தேர்வுகள் நிலுவையில் உள்ளன.',
    dueDate: 'முடிவு தேதி',
    viewAssessment: 'மதிப்பீட்டைக் காண்க',
    durationLabel: 'கால அளவு',
    passScoreLabel: 'தேர்ச்சி மதிப்பெண்',
    noUpcomingAssessments: 'தற்போது எந்த மதிப்பீடுகளும் திட்டமிடப்படவில்லை.',

    competencyTitle: 'ஒட்டுமொத்த தகுதிநிலை',
    overallCompetency: 'ஒட்டுமொத்த தகுதி நிலை',
    goodProgress: 'நல்ல முன்னேற்றம் • முன்னறிவிப்பாளர் நிலை 3 தகுதி',
    competencyLevel: 'நிலை 3 திறன்',
    competencySubtitle:
      'WMO-258 மற்றும் MoES திறன் மேம்பாட்டு அளவீடுகளுக்கு எதிராக மதிப்பிடப்பட்டது.',

    skillGapsTitle: 'அடையாளம் காணப்பட்ட திறன் இடைவெளிகள்',
    skillGapsSubtitle:
      'சமீபத்திய உருவகப்படுத்துதல்களின் அடிப்படையில் கூடுதல் திறன் தேவைப்படும் பகுதிகள்.',
    identifiedGaps: 'திறன் இடைவெளிகள்',
    highPriority: 'உயர் முன்னுரிமை',
    mediumPriority: 'நடுத்தர முன்னுரிமை',
    targetLevel: 'இலக்கு நிலை',
    currentLevel: 'தற்போதைய நிலை',
    noSkillGaps:
      'திறன் இடைவெளிகள் எதுவும் இல்லை. அனைத்துத் திறன்களும் செயல்பாட்டுத் தரத்தை பூர்த்தி செய்கின்றன.',

    recommendationsTitle: 'பரிந்துரைக்கப்பட்ட படிப்புகள்',
    recommendationsSubtitle:
      'உங்கள் திறன் இடைவெளி மற்றும் வாழ்க்கைப்பாதைக்கு ஏற்ப தொகுக்கப்பட்ட படிப்புகள்.',
    viewCourse: 'பாடத்தைக் காண்க',
    recommendedReason: 'பரிந்துரைக்கான காரணம்',
    targetCompetency: 'இலக்குத் திறன்',
    noRecommendations: 'தற்போது எந்த பரிந்துரைகளும் கிடைக்கவில்லை.',

    achievementsTitle: 'முக்கிய சாதனைகள் மற்றும் மைல்கற்கள்',
    achievementsSubtitle: 'பெறப்பட்ட சான்றிதழ்கள் மற்றும் மைல்கல் அங்கீகாரங்கள்.',
    coursesCompleted: 'முடிக்கப்பட்ட படிப்புகள்',
    certificatesEarned: 'பெறப்பட்ட சான்றிதழ்கள்',
    assessmentsPassed: 'தேர்ச்சி பெற்ற மதிப்பீடுகள்',
    learningHours: 'கற்றல் மணிநேரம்',
    accreditedBadges: 'நிறுவன மைல்கல் பேட்ஜ்கள்',
  },
};

export const getTranslation = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};

export default getTranslation;
