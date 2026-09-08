export type Language = 'en' | 'hi' | 'ta';

export const profileTranslations = {
  en: {
    pageTitle: 'Trainee Professional Profile',
    pageSubtitle:
      'Manage your institutional records, scientific qualifications, operational meteorological experience, technical competencies, and certified credentials under MoES / IMD capacity building.',
    completeness: 'Profile Completeness',
    completeAction: 'Complete remaining fields to reach 100%',
    verifiedOfficer: 'Verified MoES / IMD Trainee Officer',

    // Core Sections
    basicInfoTitle: 'Basic & Institutional Information',
    basicInfoDesc:
      'Primary identity, contact details, operational deployment, and institutional identifiers.',
    qualificationsTitle: 'Academic & Scientific Qualifications',
    qualificationsDesc:
      'University degrees, specialized meteorological coursework, and research credentials.',
    experienceTitle: 'Professional & Operational Experience',
    experienceDesc:
      'Field postings, forecasting shifts, meteorological observatories, and organizational roles.',
    skillsTitle: 'Technical & Domain Competencies',
    skillsDesc:
      'Operational meteorological skills, instrumentation proficiencies, and scientific analysis tools.',
    interestsTitle: 'Professional Learning Interests',
    interestsDesc: 'Domain specializations and future curriculum interests for career progression.',
    certificatesTitle: 'Certified Credentials & Accreditations',
    certificatesDesc:
      'Official certifications accredited under WMO-258 standards and MoES training councils.',

    // Actions & Buttons
    edit: 'Edit Information',
    save: 'Save Changes',
    cancel: 'Cancel',
    addQualification: 'Add Qualification',
    addExperience: 'Add Experience',
    addSkill: 'Add Skill',
    addInterest: 'Add Interest',
    typeSkillPlaceholder: 'Type new skill and press Enter...',
    typeInterestPlaceholder: 'Type new interest and press Enter...',
    suggestedSkills: 'Suggested MoES/IMD Skills',
    suggestedInterests: 'Suggested Research Domains',
    delete: 'Delete',
    editAction: 'Edit',
    viewCertificate: 'View Certificate',
    credentialId: 'Credential ID',
    issuedOn: 'Issued',
    expiresOn: 'Valid until',
    currentPosition: 'Currently serving in this role',
    present: 'Present',
    verified: 'Verified Credential',
    pending: 'Pending Verification',

    // Fields
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Official Email',
    phone: 'Phone Number',
    age: 'Age',
    location: 'Duty Station / Location',
    moesId: 'MoES Employee ID',
    imdId: 'IMD Cadet / Roll ID',
    designation: 'Designation / Post',
    department: 'Department / Division',
    organization: 'Organization',
    bio: 'Professional Summary',
    degree: 'Degree / Program',
    fieldOfStudy: 'Field of Study / Specialization',
    institution: 'University / Institute',
    startDate: 'Start Date',
    endDate: 'End Date / Passing Year',
    jobTitle: 'Designation / Operational Role',
    companyName: 'Organization / Center',
    description: 'Operational Responsibilities & Scope',

    // Modals
    modalAddQualification: 'Add Academic Qualification',
    modalEditQualification: 'Edit Academic Qualification',
    modalAddExperience: 'Add Professional Experience',
    modalEditExperience: 'Edit Professional Experience',
    modalCertificateDetails: 'Institutional Certificate Details',
    closeModal: 'Close',

    // Feedback & Alerts
    savedSuccess: 'Changes saved successfully.',
    addedSuccess: 'New record added successfully.',
    updatedSuccess: 'Record updated successfully.',
    deletedSuccess: 'Record removed successfully.',

    // Empty States
    noQualifications:
      'No qualifications recorded yet. Add your academic and scientific credentials.',
    noExperience:
      'No operational experience added yet. Add past postings and organizational roles.',
    noSkills: 'No competencies tagged yet. Add your technical meteorological skills.',
    noInterests: 'No learning interests selected yet. Select or add research disciplines.',
    noCertificates:
      'No certificates issued yet. Complete courses and pass assessments to earn credentials.',
  },
  hi: {
    pageTitle: 'प्रशिक्षु व्यावसायिक प्रोफ़ाइल',
    pageSubtitle:
      'पृथ्वी विज्ञान मंत्रालय (MoES) / भारत मौसम विज्ञान विभाग (IMD) क्षमता निर्माण के तहत अपने आधिकारिक रिकॉर्ड, वैज्ञानिक योग्यताएं, परिचालन अनुभव और कौशल प्रबंधित करें।',
    completeness: 'प्रोफ़ाइल पूर्णता',
    completeAction: '100% तक पहुंचने के लिए शेष फ़ील्ड भरें',
    verifiedOfficer: 'सत्यापित MoES / IMD प्रशिक्षु अधिकारी',

    // Core Sections
    basicInfoTitle: 'मूल एवं संस्थागत जानकारी',
    basicInfoDesc: 'प्राथमिक पहचान, संपर्क विवरण, परिचालन तैनाती और आधिकारिक पहचानकर्ता।',
    qualificationsTitle: 'शैक्षणिक एवं वैज्ञानिक योग्यताएं',
    qualificationsDesc: 'विश्वविद्यालय उपाधियां, विशेष मौसम विज्ञान पाठ्यक्रम और अनुसंधान साख।',
    experienceTitle: 'व्यावसायिक एवं परिचालन अनुभव',
    experienceDesc:
      'क्षेत्रीय पदस्थापना, पूर्वानुमान पारियां, मौसम वेधशालाएं और संगठनात्मक भूमिकाएं।',
    skillsTitle: 'तकनीकी एवं विषयगत दक्षताएं',
    skillsDesc: 'परिचालन मौसम कौशल, उपकरण दक्षता और वैज्ञानिक विश्लेषण उपकरण।',
    interestsTitle: 'व्यावसायिक अध्ययन रुचियां',
    interestsDesc: 'करियर विकास के लिए विषय विशेषज्ञताएं और भावी पाठ्यक्रम रुचियां।',
    certificatesTitle: 'प्रमाणित योग्यताएं एवं प्रमाणपत्र',
    certificatesDesc: 'WMO-258 मानकों और MoES प्रशिक्षण परिषद के तहत आधिकारिक प्रमाणन।',

    // Actions & Buttons
    edit: 'जानकारी संपादित करें',
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    addQualification: 'योग्यता जोड़ें',
    addExperience: 'अनुभव जोड़ें',
    addSkill: 'कौशल जोड़ें',
    addInterest: 'रुचि जोड़ें',
    typeSkillPlaceholder: 'नया कौशल लिखें और Enter दबाएं...',
    typeInterestPlaceholder: 'नई रुचि लिखें और Enter दबाएं...',
    suggestedSkills: 'सुझाए गए MoES/IMD कौशल',
    suggestedInterests: 'सुझाए गए अनुसंधान क्षेत्र',
    delete: 'हटाएं',
    editAction: 'संपादित करें',
    viewCertificate: 'प्रमाणपत्र देखें',
    credentialId: 'क्रेडेंशियल आईडी',
    issuedOn: 'जारी किया गया',
    expiresOn: 'वैधता तिथि',
    currentPosition: 'वर्तमान में इस पद पर कार्यरत',
    present: 'वर्तमान',
    verified: 'सत्यापित प्रमाणपत्र',
    pending: 'सत्यापन लंबित',

    // Fields
    fullName: 'पूरा नाम',
    firstName: 'पहला नाम',
    lastName: 'अंतिम नाम',
    email: 'आधिकारिक ईमेल',
    phone: 'फ़ोन नंबर',
    age: 'आयु',
    location: 'कार्य स्टेशन / स्थान',
    moesId: 'MoES कर्मचारी आईडी',
    imdId: 'IMD कैडेट आईडी',
    designation: 'पदनाम / पद',
    department: 'विभाग / प्रभाग',
    organization: 'संगठन',
    bio: 'व्यावसायिक सारांश',
    degree: 'उपाधि / डिग्री',
    fieldOfStudy: 'अध्ययन क्षेत्र / विशेषज्ञता',
    institution: 'विश्वविद्यालय / संस्थान',
    startDate: 'प्रारंभ तिथि',
    endDate: 'समाप्ति वर्ष / तिथि',
    jobTitle: 'पदनाम / परिचालन भूमिका',
    companyName: 'संगठन / केंद्र',
    description: 'परिचालन जिम्मेदारियां और कार्यक्षेत्र',

    // Modals
    modalAddQualification: 'शैक्षणिक योग्यता जोड़ें',
    modalEditQualification: 'शैक्षणिक योग्यता संपादित करें',
    modalAddExperience: 'व्यावसायिक अनुभव जोड़ें',
    modalEditExperience: 'व्यावसायिक अनुभव संपादित करें',
    modalCertificateDetails: 'संस्थागत प्रमाणपत्र विवरण',
    closeModal: 'बंद करें',

    // Feedback & Alerts
    savedSuccess: 'परिवर्तन सफलतापूर्वक सहेजे गए।',
    addedSuccess: 'नया रिकॉर्ड सफलतापूर्वक जोड़ा गया।',
    updatedSuccess: 'रिकॉर्ड सफलतापूर्वक अद्यतन किया गया।',
    deletedSuccess: 'रिकॉर्ड सफलतापूर्वक हटाया गया।',

    // Empty States
    noQualifications: 'कोई योग्यता दर्ज नहीं है। अपनी शैक्षणिक और वैज्ञानिक साख जोड़ें।',
    noExperience: 'कोई अनुभव दर्ज नहीं है। पिछली पदस्थापनाएं और भूमिकाएं जोड़ें।',
    noSkills: 'कोई कौशल टैग नहीं किया गया। अपने तकनीकी मौसम कौशल जोड़ें।',
    noInterests: 'कोई रुचि नहीं चुनी गई। अनुसंधान विषयों का चयन करें।',
    noCertificates:
      'कोई प्रमाणपत्र जारी नहीं हुआ। क्रेडेंशियल अर्जित करने के लिए पाठ्यक्रम पूरे करें।',
  },
  ta: {
    pageTitle: 'பயிற்சியாளர் தொழில்முறை சுயவிவரம்',
    pageSubtitle:
      'புவி அறிவியல் அமைச்சகம் (MoES) / இந்திய வானிலை ஆய்வுத் துறை (IMD) திறன் மேம்பாட்டின் கீழ் உங்கள் அதிகாரப்பூர்வ பதிவுகள், அறிவியல் தகுதிகள் மற்றும் அனுபவத்தை நிர்வகிக்கவும்.',
    completeness: 'சுயவிவர நிறைவு',
    completeAction: '100% அடைய மீதமுள்ள புலங்களை நிரப்பவும்',
    verifiedOfficer: 'சரிபார்க்கப்பட்ட MoES / IMD பயிற்சியாளர் அதிகாரி',

    // Core Sections
    basicInfoTitle: 'அடிப்படை மற்றும் நிறுவனத் தகவல்',
    basicInfoDesc:
      'முதன்மையான அடையாளம், தொடர்பு விவரங்கள், செயல்பாட்டு பணி மற்றும் நிறுவன அடையாளங்கள்.',
    qualificationsTitle: 'கல்வி மற்றும் அறிவியல் தகுதிகள்',
    qualificationsDesc:
      'பல்கலைக்கழக பட்டங்கள், சிறப்பு வானிலை பாடநெறிகள் மற்றும் ஆராய்ச்சி சான்றுகள்.',
    experienceTitle: 'தொழில்முறை மற்றும் செயல்பாட்டு அனுபவம்',
    experienceDesc:
      'களப் பணிகள், முன்னறிவிப்பு ஷிப்டுகள், வானிலை ஆய்வகங்கள் மற்றும் நிறுவன பொறுப்புகள்.',
    skillsTitle: 'தொழில்நுட்ப மற்றும் களத் திறன்கள்',
    skillsDesc:
      'செயல்பாட்டு வானிலை திறன்கள், கருவி பயன்பாட்டு திறன் மற்றும் அறிவியல் பகுப்பாய்வு கருவிகள்.',
    interestsTitle: 'தொழில்முறை கற்றல் ஆர்வங்கள்',
    interestsDesc:
      'தொழில் முன்னேற்றத்திற்கான சிறப்பு களங்கள் மற்றும் எதிர்கால பாடத்திட்ட ஆர்வங்கள்.',
    certificatesTitle: 'சான்றளிக்கப்பட்ட நற்சான்றிதழ்கள்',
    certificatesDesc:
      'WMO-258 தரநிலைகள் மற்றும் MoES பயிற்சி கவுன்சிலின் கீழ் அதிகாரப்பூர்வ சான்றிதழ்கள்.',

    // Actions & Buttons
    edit: 'தகவலைத் திருத்து',
    save: 'சேமிக்கவும்',
    cancel: 'ரத்து செய்',
    addQualification: 'தகுதி சேர்க்கவும்',
    addExperience: 'அனுபவம் சேர்க்கவும்',
    addSkill: 'திறன் சேர்க்கவும்',
    addInterest: 'ஆர்வம் சேர்க்கவும்',
    typeSkillPlaceholder: 'புதிய திறனை உள்ளிட்டு Enter அழுத்தவும்...',
    typeInterestPlaceholder: 'புதிய ஆர்வத்தை உள்ளிட்டு Enter அழுத்தவும்...',
    suggestedSkills: 'பரிந்துரைக்கப்பட்ட MoES/IMD திறன்கள்',
    suggestedInterests: 'பரிந்துரைக்கப்பட்ட ஆராய்ச்சி களங்கள்',
    delete: 'நீக்கு',
    editAction: 'திருத்து',
    viewCertificate: 'சான்றிதழைப் பார்க்கவும்',
    credentialId: 'சான்றளிப்பு எண்',
    issuedOn: 'வழங்கப்பட்டது',
    expiresOn: 'செல்லுபடியாகும் காலம்',
    currentPosition: 'தற்போது இந்த பதவியில் பணியாற்றுகிறார்',
    present: 'தற்போது',
    verified: 'சரிபார்க்கப்பட்ட சான்றிதழ்',
    pending: 'சரிபார்ப்பு நிலுவையில் உள்ளது',

    // Fields
    fullName: 'முழு பெயர்',
    firstName: 'முதல் பெயர்',
    lastName: 'கடைசி பெயர்',
    email: 'அலுவலக மின்னஞ்சல்',
    phone: 'தொலைபேசி எண்',
    age: 'வயது',
    location: 'பணி நிலையம் / இடம்',
    moesId: 'MoES பணியாளர் எண்',
    imdId: 'IMD மாணவர் எண்',
    designation: 'பதவிப் பெயர்',
    department: 'துறை / பிரிவு',
    organization: 'அமைப்பு',
    bio: 'தொழில்முறை சுருக்கம்',
    degree: 'பட்டம் / படிப்பு',
    fieldOfStudy: 'படிப்புத் துறை / சிறப்புப் பிரிவு',
    institution: 'பல்கலைக்கழகம் / நிறுவனம்',
    startDate: 'தொடக்க தேதி',
    endDate: 'முடிவு ஆண்டு / தேதி',
    jobTitle: 'பதவி / செயல்பாட்டுப் பொறுப்பு',
    companyName: 'அமைப்பு / மையம்',
    description: 'செயல்பாட்டுப் பொறுப்புகள் மற்றும் பணிகள்',

    // Modals
    modalAddQualification: 'கல்வித் தகுதியைச் சேர்க்கவும்',
    modalEditQualification: 'கல்வித் தகுதியைத் திருத்தவும்',
    modalAddExperience: 'தொழில்முறை அனுபவத்தைச் சேர்க்கவும்',
    modalEditExperience: 'தொழில்முறை அனுபவத்தைத் திருத்தவும்',
    modalCertificateDetails: 'நிறுவன சான்றிதழ் விவரங்கள்',
    closeModal: 'மூடவும்',

    // Feedback & Alerts
    savedSuccess: 'மாற்றங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன.',
    addedSuccess: 'புதிய பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது.',
    updatedSuccess: 'பதிவு வெற்றிகரமாக புதுப்பிக்கப்பட்டது.',
    deletedSuccess: 'பதிவு வெற்றிகரமாக நீக்கப்பட்டது.',

    // Empty States
    noQualifications: 'கல்வித் தகுதிகள் எதுவும் சேர்க்கப்படவில்லை. புதிய தகுதியைச் சேர்க்கவும்.',
    noExperience: 'அனுபவம் எதுவும் சேர்க்கப்படவில்லை. முந்தைய பணிகளைச் சேர்க்கவும்.',
    noSkills: 'திறன்கள் எதுவும் சேர்க்கப்படவில்லை. உங்கள் தொழில்நுட்பத் திறன்களைச் சேர்க்கவும்.',
    noInterests: 'கற்றல் ஆர்வங்கள் எதுவும் தேர்ந்தெடுக்கப்படவில்லை. களங்களைத் தேர்வுசெய்யவும்.',
    noCertificates:
      'சான்றிதழ்கள் எதுவும் வழங்கப்படவில்லை. சான்றிதழ் பெற தேர்வுகளில் தேர்ச்சி பெறவும்.',
  },
};

export const useProfileTranslation = (lang: Language) => {
  return profileTranslations[lang] || profileTranslations.en;
};
