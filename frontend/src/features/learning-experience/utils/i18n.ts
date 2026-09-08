export type Language = 'en' | 'hi' | 'ta';

export const learningExperienceTranslations = {
  en: {
    // Header & Meta
    courseProgress: 'Course Progress',
    overallProgress: 'Overall Completion',
    modulesCount: 'Modules',
    lessonsCompleted: 'Lessons Completed',
    lastAccessed: 'Last Accessed',
    courseContent: 'Course Curriculum',
    backToDashboard: 'Back to Dashboard',
    backToCourses: 'My Courses',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',

    // Module & Lesson
    moduleLabel: 'Module',
    lessonLabel: 'Lesson',
    durationMinutes: 'min',
    completedBadge: 'Completed',
    inProgressBadge: 'In Progress',
    notStartedBadge: 'Not Started',
    previewBadge: 'Preview Available',
    typeVideo: 'Video Lecture',
    typePdf: 'Technical Manual / PDF',
    typeArticle: 'Scientific Notes',
    typeDocument: 'Operational Standard Document',
    typeQuiz: 'Knowledge Check',

    // Viewer Controls
    lessonOverview: 'Lesson Overview & Objectives',
    keyTakeaways: 'Operational Key Takeaways',
    operationalChecklist: 'Forecaster Operational Checklist',
    transcript: 'Audio / Video Transcript',
    openExternal: 'Open Document in New Tab',
    downloadPdf: 'Download PDF',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset Zoom',
    pageOf: 'of',
    play: 'Play',
    pause: 'Pause',
    mute: 'Mute',
    unmute: 'Unmute',
    speed: 'Speed',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen',

    // Navigation & Actions
    previousLesson: 'Previous Lesson',
    nextLesson: 'Next Lesson',
    markAsComplete: 'Mark as Complete',
    savingProgress: 'Saving progress...',
    lessonCompleted: 'Lesson Completed',
    courseCompletedTitle: 'Congratulations! Curriculum Completed',
    courseCompletedSub:
      'You have successfully completed all lessons in this accredited MoES / IMD course.',
    reviewCurriculum: 'Review Curriculum',

    // UI States
    loadingCourse: 'Loading Course Learning Environment...',
    loadingLesson: 'Loading Lesson Resources...',
    errorLoadingCourse: 'Unable to load this course curriculum.',
    errorLoadingLesson: 'Unable to load this lesson.',
    retryAction: 'Try Again',
    unauthorizedTitle: 'Access Denied / Not Enrolled',
    unauthorizedMessage:
      'You are not enrolled in this accredited training course. Please enroll via Course Discovery to access learning materials.',
    browseCourses: 'Explore Course Catalog',
  },
  hi: {
    // Header & Meta
    courseProgress: 'पाठ्यक्रम प्रगति',
    overallProgress: 'कुल पूर्णता',
    modulesCount: 'मॉड्यूल',
    lessonsCompleted: 'पूर्ण किए गए पाठ',
    lastAccessed: 'अंतिम बार देखा गया',
    courseContent: 'पाठ्यक्रम तालिका',
    backToDashboard: 'डैशबोर्ड पर वापस जाएं',
    backToCourses: 'मेरे पाठ्यक्रम',
    expandAll: 'सभी खोलें',
    collapseAll: 'सभी समेटें',

    // Module & Lesson
    moduleLabel: 'मॉड्यूल',
    lessonLabel: 'पाठ',
    durationMinutes: 'मिनट',
    completedBadge: 'पूर्ण',
    inProgressBadge: 'प्रगति पर',
    notStartedBadge: 'शुरू नहीं हुआ',
    previewBadge: 'पूर्वावलोकन उपलब्ध',
    typeVideo: 'वीडियो व्याख्यान',
    typePdf: 'तकनीकी नियमावली / पीडीएफ',
    typeArticle: 'वैज्ञानिक नोट्स',
    typeDocument: 'परिचालन मानक दस्तावेज़',
    typeQuiz: 'ज्ञान परीक्षण',

    // Viewer Controls
    lessonOverview: 'पाठ अवलोकन एवं उद्देश्य',
    keyTakeaways: 'परिचालन मुख्य निष्कर्ष',
    operationalChecklist: 'मौसम विज्ञानी परिचालन चेकलिस्ट',
    transcript: 'ऑडियो / वीडियो प्रतिलेख',
    openExternal: 'दस्तावेज़ नए टैब में खोलें',
    downloadPdf: 'पीडीएफ डाउनलोड करें',
    zoomIn: 'ज़ूम इन',
    zoomOut: 'ज़ूम आउट',
    resetZoom: 'रीसेट ज़ूम',
    pageOf: 'का',
    play: 'चलाएं',
    pause: 'रोकें',
    mute: 'मूक करें',
    unmute: 'ध्वनि चालू करें',
    speed: 'गति',
    fullscreen: 'पूर्ण स्क्रीन',
    exitFullscreen: 'पूर्ण स्क्रीन से बाहर निकलें',

    // Navigation & Actions
    previousLesson: 'पिछला पाठ',
    nextLesson: 'अगला पाठ',
    markAsComplete: 'पूर्ण चिह्नित करें',
    savingProgress: 'प्रगति सहेजी जा रही है...',
    lessonCompleted: 'पाठ पूर्ण हुआ',
    courseCompletedTitle: 'बधाई! पाठ्यक्रम पूर्ण हुआ',
    courseCompletedSub:
      'आपने इस मान्यता प्राप्त MoES / IMD पाठ्यक्रम के सभी पाठों को सफलतापूर्वक पूरा कर लिया है।',
    reviewCurriculum: 'पाठ्यक्रम की समीक्षा करें',

    // UI States
    loadingCourse: 'पाठ्यक्रम शिक्षण वातावरण लोड हो रहा है...',
    loadingLesson: 'पाठ संसाधन लोड हो रहे हैं...',
    errorLoadingCourse: 'इस पाठ्यक्रम की पाठ्यचर्या लोड करने में असमर्थ।',
    errorLoadingLesson: 'इस पाठ को लोड करने में असमर्थ।',
    retryAction: 'पुनः प्रयास करें',
    unauthorizedTitle: 'पहुंच अस्वीकृत / नामांकित नहीं',
    unauthorizedMessage:
      'आप इस मान्यता प्राप्त प्रशिक्षण पाठ्यक्रम में नामांकित नहीं हैं। अध्ययन सामग्री तक पहुंचने के लिए कृपया पाठ्यक्रम खोज के माध्यम से नामांकन करें।',
    browseCourses: 'पाठ्यक्रम सूची देखें',
  },
  ta: {
    // Header & Meta
    courseProgress: 'பாடநெறி முன்னேற்றம்',
    overallProgress: 'முழுமையான நிறைவு',
    modulesCount: 'தொகுதிகள்',
    lessonsCompleted: 'முடிக்கப்பட்ட பாடங்கள்',
    lastAccessed: 'கடைசியாக அணுகப்பட்டது',
    courseContent: 'பாடத்திட்டம்',
    backToDashboard: 'டாஷ்போர்டுக்கு திரும்பு',
    backToCourses: 'எனது பாடநெறிகள்',
    expandAll: 'அனைத்தையும் விரி',
    collapseAll: 'அனைத்தையும் சுருக்கு',

    // Module & Lesson
    moduleLabel: 'தொகுதி',
    lessonLabel: 'பாடம்',
    durationMinutes: 'நிமிடம்',
    completedBadge: 'முடிந்தது',
    inProgressBadge: 'முன்னேற்றத்தில்',
    notStartedBadge: 'தொடங்கவில்லை',
    previewBadge: 'முன்னோட்டம் உள்ளது',
    typeVideo: 'வீடியோ விரிவுரை',
    typePdf: 'தொழில்நுட்ப கையேடு / PDF',
    typeArticle: 'அறிவியல் குறிப்புகள்',
    typeDocument: 'செயல்பாட்டு நிலையான ஆவணம்',
    typeQuiz: 'அறிவு சரிபார்ப்பு',

    // Viewer Controls
    lessonOverview: 'பாடம் கண்ணோட்டம் & நோக்கங்கள்',
    keyTakeaways: 'செயல்பாட்டு முக்கிய குறிப்புகள்',
    operationalChecklist: 'வானிலை முன்னறிவிப்பாளர் சரிபார்ப்புப் பட்டியல்',
    transcript: 'ஆடியோ / வீடியோ உரை प्रतिलेख',
    openExternal: 'ஆவணத்தை புதிய தாவலில் திறக்கவும்',
    downloadPdf: 'PDF ஐப் பதிவிறக்கவும்',
    zoomIn: 'பெரிதாக்கு',
    zoomOut: 'சிறிதாக்கு',
    resetZoom: 'மீட்டமை',
    pageOf: 'இல்',
    play: 'இயக்கு',
    pause: 'இடைநிறுத்து',
    mute: 'ஒலியடக்கு',
    unmute: 'ஒலியை இயக்கு',
    speed: 'வேகம்',
    fullscreen: 'முழுத்திரை',
    exitFullscreen: 'முழுத்திரையிலிருந்து வெளியேறு',

    // Navigation & Actions
    previousLesson: 'முந்தைய பாடம்',
    nextLesson: 'அடுத்த பாடம்',
    markAsComplete: 'முடிந்ததாகக் குறிக்கவும்',
    savingProgress: 'முன்னேற்றம் சேமிக்கப்படுகிறது...',
    lessonCompleted: 'பாடம் முடிந்தது',
    courseCompletedTitle: 'வாழ்த்துகள்! பாடத்திட்டம் முடிந்தது',
    courseCompletedSub:
      'இந்த அங்கீகரிக்கப்பட்ட MoES / IMD பாடநெறியின் அனைத்து பாடங்களையும் நீங்கள் வெற்றிகரமாக முடித்துவிட்டீர்கள்.',
    reviewCurriculum: 'பாடத்திட்டத்தை மதிப்பாய்வு செய்யவும்',

    // UI States
    loadingCourse: 'பாடநெறி கற்றல் சூழல் ஏற்றப்படுகிறது...',
    loadingLesson: 'பாடம் வளங்கள் ஏற்றப்படுகின்றன...',
    errorLoadingCourse: 'இந்த பாடத்திட்டத்தை ஏற்ற முடியவில்லை.',
    errorLoadingLesson: 'இந்த பாடத்தை ஏற்ற முடியவில்லை.',
    retryAction: 'மீண்டும் முயற்சிக்கவும்',
    unauthorizedTitle: 'அணுகல் மறுக்கப்பட்டது / பதிவு செய்யப்படவில்லை',
    unauthorizedMessage:
      'நீங்கள் இந்த அங்கீகரிக்கப்பட்ட பயிற்சி பாடநெறியில் பதிவு செய்யவில்லை. கற்றல் பொருட்களை அணுக, பாடநெறி கண்டுபிடிப்பு வழியாக பதிவு செய்யவும்.',
    browseCourses: 'பாடநெறி பட்டியலை ஆராயவும்',
  },
};

export const useLearningTranslation = (lang: Language) => {
  return learningExperienceTranslations[lang] || learningExperienceTranslations.en;
};
