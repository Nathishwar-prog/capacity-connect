import { assessmentImportService } from '../services/assessment-import.service';
import { Role } from '@prisma/client';

describe('AssessmentImportService - Unit Tests', () => {
  const mockTrainerId = 'trainer-uuid-001';

  describe('Root and Schema Version Validation', () => {
    it('should reject non-object payloads', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        ['invalid', 'array'],
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_ROOT_TYPE')).toBe(true);
    });

    it('should reject missing schemaVersion', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        { assessment: { title: 'Test', questions: [] } },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'MISSING_SCHEMA_VERSION')).toBe(true);
    });

    it('should reject unsupported schema versions', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        { schemaVersion: '3.0', assessment: { title: 'Test', questions: [] } },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'UNSUPPORTED_VERSION')).toBe(true);
    });
  });

  describe('Metadata Validation', () => {
    it('should reject empty or too short title', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        { schemaVersion: '1.0', assessment: { title: 'AB', questions: [] } },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_TITLE_LENGTH')).toBe(true);
    });

    it('should reject invalid durationMinutes', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        { schemaVersion: '1.0', assessment: { title: 'Valid Title', durationMinutes: -5, questions: [] } },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_DURATION')).toBe(true);
    });

    it('should reject passing percentage out of bounds', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        { schemaVersion: '1.0', assessment: { title: 'Valid Title', passingPercentage: 110, questions: [] } },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_PASSING_PERCENTAGE')).toBe(true);
    });
  });

  describe('Question & Option Validation', () => {
    it('should reject question with invalid option reference in SINGLE_CHOICE', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Meteorology Exam',
            questions: [
              {
                questionType: 'SINGLE_CHOICE',
                question: 'What is the primary balance in geostrophic wind?',
                options: [
                  { id: 'A', text: 'Coriolis force' },
                  { id: 'B', text: 'Friction' },
                ],
                correctAnswer: { type: 'OPTION', value: 'D' }, // Nonexistent D
                explanation: 'Valid scientific explanation of geostrophic balance.',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_OPTION_REFERENCE')).toBe(true);
      expect(res.errors[0].path).toBe('assessment.questions[0].correctAnswer.value');
    });

    it('should reject duplicate correct answers in MULTIPLE_CHOICE', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Synoptic Systems Quiz',
            questions: [
              {
                questionType: 'MULTIPLE_CHOICE',
                question: 'Which factors favor baroclinic cyclogenesis?',
                options: [
                  { id: 'A', text: 'Vertical shear' },
                  { id: 'B', text: 'Horizontal temp gradient' },
                ],
                correctAnswer: { type: 'OPTIONS', value: ['A', 'A'] }, // Duplicate A
                explanation: 'Baroclinic instability explanation provided.',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'DUPLICATE_CORRECT_ANSWER')).toBe(true);
    });

    it('should reject non-boolean answers for TRUE_FALSE', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Atmospheric Physics',
            questions: [
              {
                questionType: 'TRUE_FALSE',
                question: 'The Coriolis force is zero at the equator.',
                correctAnswer: { type: 'BOOLEAN', value: 'yes' },
                explanation: 'Proportional to sine of latitude.',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'INVALID_BOOLEAN_ANSWER')).toBe(true);
    });
  });

  describe('Explanation Quality Assurance', () => {
    it('should reject empty explanations', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Quiz',
            questions: [
              {
                questionType: 'TRUE_FALSE',
                question: 'Sample question prompt here?',
                correctAnswer: { type: 'BOOLEAN', value: true },
                explanation: '',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'MISSING_EXPLANATION')).toBe(true);
    });

    it('should reject placeholder text in explanations', async () => {
      for (const placeholder of ['TODO', 'N/A', 'n/a', 'TBD', 'none', 'placeholder']) {
        const res = await assessmentImportService.validateAssessmentImport(
          mockTrainerId,
          Role.TRAINER,
          {
            schemaVersion: '1.0',
            assessment: {
              title: 'Quiz',
              questions: [
                {
                  questionType: 'TRUE_FALSE',
                  question: 'Sample question prompt here?',
                  correctAnswer: { type: 'BOOLEAN', value: true },
                  explanation: placeholder,
                },
              ],
            },
          },
        );
        expect(res.valid).toBe(false);
        expect(res.errors.some((e) => e.code === 'INVALID_EXPLANATION')).toBe(true);
      }
    });
  });

  describe('Duplicate Detection', () => {
    it('should flag exact duplicate question prompts with a warning', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Duplicate Test',
            questions: [
              {
                questionType: 'TRUE_FALSE',
                question: 'The Coriolis parameter depends on latitude.',
                correctAnswer: { type: 'BOOLEAN', value: true },
                explanation: 'Latitude-dependent Coriolis parameter explanation.',
              },
              {
                questionType: 'TRUE_FALSE',
                question: 'The Coriolis parameter depends on latitude.', // duplicate
                correctAnswer: { type: 'BOOLEAN', value: true },
                explanation: 'Second explanation for duplicate.',
              },
            ],
          },
        },
      );
      expect(res.warnings.some((w) => w.code === 'EXACT_DUPLICATE_QUESTION')).toBe(true);
    });
  });

  describe('Unsupported Question Types', () => {
    it('should reject SHORT_ANSWER with UNSUPPORTED_QUESTION_TYPE and exact path', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Unsupported Type Test',
            questions: [
              {
                questionType: 'SHORT_ANSWER',
                question: 'Define hydrostatic balance.',
                correctAnswer: { type: 'TEXT', value: 'dP/dz = -rho*g' },
                explanation: 'Balance between vertical pressure gradient and gravity.',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      const error = res.errors.find((e) => e.code === 'UNSUPPORTED_QUESTION_TYPE');
      expect(error).toBeDefined();
      expect(error?.path).toBe('assessment.questions[0].questionType');
      expect(error?.message).toContain('SHORT_ANSWER');
      expect(error?.message).toContain('SINGLE_CHOICE');
    });

    it('should reject ESSAY or other unrecognized question types', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Essay Test',
            questions: [
              {
                questionType: 'ESSAY',
                question: 'Explain the Madden-Julian Oscillation.',
                explanation: 'Valid explanation here.',
              },
            ],
          },
        },
      );
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.code === 'UNSUPPORTED_QUESTION_TYPE')).toBe(true);
    });
  });

  describe('Hierarchy Mapping & Non-Blocking Course Titles', () => {
    it('should emit COURSE_MAPPING_REQUIRED warning rather than blocking error for unmatched course titles', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Unmatched Course Title Assessment',
            course: {
              courseTitle: 'Nonexistent Course 12345',
            },
            questions: [
              {
                questionType: 'TRUE_FALSE',
                question: 'Geostrophic balance occurs above the boundary layer.',
                correctAnswer: { type: 'BOOLEAN', value: true },
                explanation: 'Above friction layer, Coriolis force balances PGF.',
              },
            ],
          },
        },
      );
      // Valid is true because COURSE_MAPPING_REQUIRED is a WARNING, not an error!
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.warnings.some((w) => w.code === 'COURSE_MAPPING_REQUIRED')).toBe(true);
      expect(res.assessmentData.courseTitle).toBe('Nonexistent Course 12345');
    });

    it('should respect STANDALONE placement override without emitting course warnings', async () => {
      const res = await assessmentImportService.validateAssessmentImport(
        mockTrainerId,
        Role.TRAINER,
        {
          schemaVersion: '1.0',
          assessment: {
            title: 'Standalone Assessment',
            course: {
              courseTitle: 'Some Arbitrary Course',
            },
            questions: [
              {
                questionType: 'TRUE_FALSE',
                question: 'The dry adiabatic lapse rate is approx 9.8 C/km.',
                correctAnswer: { type: 'BOOLEAN', value: true },
                explanation: 'Calculated as g/Cp for dry air in hydrostatic atmosphere.',
              },
            ],
          },
        },
        { placementType: 'STANDALONE' },
      );
      expect(res.valid).toBe(true);
      expect(res.assessmentData.placementType).toBe('STANDALONE');
      expect(res.assessmentData.courseId).toBeNull();
      expect(res.warnings.some((w) => w.code === 'COURSE_MAPPING_REQUIRED')).toBe(false);
    });
  });
});

