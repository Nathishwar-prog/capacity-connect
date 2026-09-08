export type Language = 'en' | 'hi' | 'ta';

export const courseDiscoveryTranslations = {
  en: {
    pageTitle: 'Course Discovery & Curricula',
    pageSubtitle:
      'Browse official training tracks, numerical weather prediction workshops, and operational radar curricula accredited under WMO-258 standards and MoES Capacity Building.',
    searchPlaceholder: 'Search courses by title, syllabus keywords, or trainer...',
    clearSearch: 'Clear search',

    // Filters
    filtersHeader: 'Search & Catalog Filters',
    categoryLabel: 'Domain / Category',
    allCategories: 'All Categories',
    difficultyLabel: 'Difficulty Level',
    allDifficulties: 'All Levels',
    trainerLabel: 'Instructor / Faculty',
    allTrainers: 'All Instructors',
    sortByLabel: 'Sort By',
    sortNewest: 'Newest First',
    sortTitle: 'Alphabetical (A-Z)',
    sortDuration: 'Duration (Shortest First)',
    activeFilters: 'Active Filters',
    clearAllFilters: 'Clear All Filters',
    resultsCount: 'Available Courses Found',

    // Card Details
    hours: 'Hours',
    modules: 'Modules',
    lessons: 'Lessons',
    trainerBy: 'Taught by',
    viewDetails: 'View Details',
    enrollNow: 'Enroll Now',
    alreadyEnrolled: 'Already Enrolled',
    enrolling: 'Enrolling...',

    // Details Modal
    modalTitle: 'Course Curriculum Details',
    tabOverview: 'Overview & Objectives',
    tabSyllabus: 'Syllabus & Modules',
    tabPrerequisites: 'Prerequisites',
    tabCompetencies: 'Competency Outcomes',
    tabTrainer: 'Instructor Profile',
    noPrerequisites: 'No prerequisites required. Open to all MoES / IMD trainees.',
    prerequisitesRequired: 'Prerequisite Courses & Background:',
    objectivesTitle: 'Target Learning Objectives',
    competenciesTitle: 'Target WMO-258 Competencies',
    targetLevel: 'Target Competency Level',
    lessonsInModule: 'Lessons in this module',
    previewLesson: 'Preview',
    close: 'Close',

    // Confirmation Modal
    confirmTitle: 'Confirm Course Enrollment',
    confirmMessage: 'Are you sure you want to enroll in this course?',
    confirmSubtext:
      'Once enrolled, this course will appear in your learning cockpit and training trajectory.',
    confirmAction: 'Confirm Enrollment',
    cancelAction: 'Cancel',
    enrollSuccessToast: 'Successfully enrolled in course!',
    alreadyEnrolledToast: 'You are already enrolled in this course.',

    // Empty States
    noCoursesFound: 'No courses match your selected search and filter criteria.',
    noCoursesSub: 'Try broadening your search keywords or resetting active filter constraints.',
    resetFilters: 'Reset All Filters',
  },
  hi: {
    pageTitle: 'पाठ्यक्रम खोज एवं पाठ्यक्रम तालिका',
    pageSubtitle:
      'WMO-258 मानकों और MoES क्षमता निर्माण के तहत आधिकारिक प्रशिक्षण ट्रैक, संख्यात्मक मौसम भविष्यवाणी कार्यशालाओं और परिचालन रडार पाठ्यक्रमों को ब्राउज़ करें।',
    searchPlaceholder: 'शीर्षक, पाठ्यक्रम विषय या प्रशिक्षक द्वारा पाठ्यक्रम खोजें...',
    clearSearch: 'खोज साफ़ करें',

    // Filters
    filtersHeader: 'खोज एवं फ़िल्टर',
    categoryLabel: 'विषय / श्रेणी',
    allCategories: 'सभी श्रेणियां',
    difficultyLabel: 'कठिनाई स्तर',
    allDifficulties: 'सभी स्तर',
    trainerLabel: 'प्रशिक्षक / संकाय',
    allTrainers: 'सभी प्रशिक्षक',
    sortByLabel: 'क्रमबद्ध करें',
    sortNewest: 'नवीनतम पहले',
    sortTitle: 'वर्णमाला (A-Z)',
    sortDuration: 'अवधि (कम से अधिक)',
    activeFilters: 'सक्रिय फ़िल्टर',
    clearAllFilters: 'सभी फ़िल्टर हटाएं',
    resultsCount: 'उपलब्ध पाठ्यक्रम मिले',

    // Card Details
    hours: 'घंटे',
    modules: 'मॉड्यूल',
    lessons: 'पाठ',
    trainerBy: 'प्रशिक्षक:',
    viewDetails: 'विवरण देखें',
    enrollNow: 'नामांकन करें',
    alreadyEnrolled: 'पहले से नामांकित',
    enrolling: 'नामांकन हो रहा है...',

    // Details Modal
    modalTitle: 'पाठ्यक्रम विस्तृत विवरण',
    tabOverview: 'अवलोकन एवं उद्देश्य',
    tabSyllabus: 'पाठ्यक्रम और मॉड्यूल',
    tabPrerequisites: 'पूर्व-अपेक्षाएं',
    tabCompetencies: 'दक्षता परिणाम',
    tabTrainer: 'प्रशिक्षक प्रोफ़ाइल',
    noPrerequisites: 'कोई पूर्व-अपेक्षा आवश्यक नहीं है। सभी MoES / IMD प्रशिक्षुओं के लिए खुला है।',
    prerequisitesRequired: 'आवश्यक पूर्व पाठ्यक्रम एवं पृष्ठभूमि:',
    objectivesTitle: 'लक्षित शिक्षण उद्देश्य',
    competenciesTitle: 'लक्षित WMO-258 दक्षताएं',
    targetLevel: 'लक्षित दक्षता स्तर',
    lessonsInModule: 'इस मॉड्यूल में पाठ',
    previewLesson: 'पूर्वावलोकन',
    close: 'बंद करें',

    // Confirmation Modal
    confirmTitle: 'पाठ्यक्रम नामांकन की पुष्टि करें',
    confirmMessage: 'क्या आप इस पाठ्यक्रम में नामांकन करना चाहते हैं?',
    confirmSubtext:
      'नामांकन के बाद, यह पाठ्यक्रम आपके अध्ययन कॉकपिट और प्रशिक्षण पथ में दिखाई देगा।',
    confirmAction: 'नामांकन की पुष्टि करें',
    cancelAction: 'रद्द करें',
    enrollSuccessToast: 'पाठ्यक्रम में सफलतापूर्वक नामांकित!',
    alreadyEnrolledToast: 'आप पहले से ही इस पाठ्यक्रम में नामांकित हैं।',

    // Empty States
    noCoursesFound: 'आपके चयनित खोज और फ़िल्टर मानदंडों से कोई पाठ्यक्रम मेल नहीं खाता।',
    noCoursesSub: 'अपने खोज शब्दों को व्यापक बनाने या सक्रिय फ़िल्टर रीसेट करने का प्रयास करें।',
    resetFilters: 'सभी फ़िल्टर रीसेट करें',
  },
  ta: {
    pageTitle: 'பாடநெறி கண்டுபிடிப்பு மற்றும் பாடத்திட்டம்',
    pageSubtitle:
      'WMO-258 தரநிலைகள் மற்றும் MoES திறன் மேம்பாட்டின் கீழ் அங்கீகரிக்கப்பட்ட அதிகாரப்பூர்வ பயிற்சி தடங்கள் மற்றும் செயல்பாட்டு ரேடார் பாடத்திட்டங்களை உலாவவும்.',
    searchPlaceholder: 'தலைப்பு, முக்கிய சொற்கள் அல்லது பயிற்றுவிப்பாளர் மூலம் தேடவும்...',
    clearSearch: 'தேடலை அழி',

    // Filters
    filtersHeader: 'தேடல் மற்றும் வடிகட்டிகள்',
    categoryLabel: 'களம் / பிரிவு',
    allCategories: 'அனைத்து பிரிவுகள்',
    difficultyLabel: 'கடினத்தன்மை நிலை',
    allDifficulties: 'அனைத்து நிலைகள்',
    trainerLabel: 'பயிற்றுவிப்பாளர்',
    allTrainers: 'அனைத்து பயிற்றுவிப்பாளர்கள்',
    sortByLabel: 'வரிசைப்படுத்து',
    sortNewest: 'புதியவை முதலில்',
    sortTitle: 'அகரவரிசை (A-Z)',
    sortDuration: 'கால அளவு',
    activeFilters: 'செயலில் உள்ள வடிகட்டிகள்',
    clearAllFilters: 'அனைத்து வடிகட்டிகளையும் நீக்கு',
    resultsCount: 'கிடைக்கக்கூடிய பாடநெறிகள்',

    // Card Details
    hours: 'மணிநேரம்',
    modules: 'தொகுதிகள்',
    lessons: 'பாடங்கள்',
    trainerBy: 'பயிற்றுவிப்பாளர்:',
    viewDetails: 'விவரங்களைப் பார்க்கவும்',
    enrollNow: 'இப்போதே சேரவும்',
    alreadyEnrolled: 'ஏற்கனவே சேர்ந்தவை',
    enrolling: 'சேர்க்கை நடைபெறுகிறது...',

    // Details Modal
    modalTitle: 'பாடநெறி பாடத்திட்ட விவரங்கள்',
    tabOverview: 'கண்ணோட்டம் & நோக்கங்கள்',
    tabSyllabus: 'பாடத்திட்டம் & தொகுதிகள்',
    tabPrerequisites: 'முன்தேவைகள்',
    tabCompetencies: 'திறன் விளைவுகள்',
    tabTrainer: 'பயிற்றுவிப்பாளர் விவரம்',
    noPrerequisites:
      'முன்தேவைகள் எதுவும் தேவையில்லை. அனைத்து MoES / IMD பயிற்சியாளர்களுக்கும் திறக்கப்பட்டுள்ளது.',
    prerequisitesRequired: 'தேவையான முன்தேவை பாடநெறிகள்:',
    objectivesTitle: 'இலக்கு கற்றல் நோக்கங்கள்',
    competenciesTitle: 'இலக்கு WMO-258 திறன்கள்',
    targetLevel: 'இலக்கு திறன் நிலை',
    lessonsInModule: 'இந்த தொகுதியில் உள்ள பாடங்கள்',
    previewLesson: 'முன்னோட்டம்',
    close: 'மூடவும்',

    // Confirmation Modal
    confirmTitle: 'பாடநெறி சேர்க்கையை உறுதிப்படுத்தவும்',
    confirmMessage: 'இந்த பாடநெறியில் சேர விரும்புகிறீர்களா?',
    confirmSubtext: 'சேர்ந்தவுடன், இந்த பாடம் உங்கள் கற்றல் பகுதியில் தோன்றும்.',
    confirmAction: 'சேர்க்கையை உறுதிசெய்',
    cancelAction: 'ரத்து செய்',
    enrollSuccessToast: 'பாடநெறியில் வெற்றிகரமாக சேர்க்கப்பட்டீர்கள்!',
    alreadyEnrolledToast: 'நீங்கள் ஏற்கனவே இந்த பாடநெறியில் சேர்ந்துள்ளீர்கள்.',

    // Empty States
    noCoursesFound: 'நீங்கள் தேர்ந்தெடுத்த வடிகட்டிகளுக்கு ஏற்ப எந்த பாடநெறியும் பொருந்தவில்லை.',
    noCoursesSub: 'உங்கள் தேடல் சொற்களை விரிவுபடுத்தவும் அல்லது வடிகட்டிகளை மீட்டமைக்கவும்.',
    resetFilters: 'அனைத்து வடிகட்டிகளையும் மீட்டமை',
  },
};

export const useCourseDiscoveryTranslation = (lang: Language) => {
  return courseDiscoveryTranslations[lang] || courseDiscoveryTranslations.en;
};
