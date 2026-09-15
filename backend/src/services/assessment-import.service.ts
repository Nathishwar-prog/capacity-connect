import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { prisma } from '../database/client';
import { Role, QuestionType, AssessmentType, AssessmentStatus } from '@prisma/client';
import { BadRequestError } from '../errors/app-error';
import {
  AssessmentValidationResult,
  AssessmentValidationIssue,
  NormalizedImportQuestion,
  HierarchyMappingOverride,
} from '../validators/assessment-import.validation';

const PLACEHOLDER_EXPLANATION_REGEX = /^(n\/?a|todo|tbd|none|null|nil|undefined|fixme|pending|placeholder|test|na|\s*)$/i;

function cleanString(str: string): string {
  return (str || '').trim().toLowerCase();
}

function stripHierarchyPrefix(str: string): string {
  return (str || '')
    .replace(/^(course|module|lesson|unit|chapter|part)\s*[-:]*\s*\d*\s*[-:.]*\s*/i, '')
    .trim()
    .toLowerCase();
}

function normalizeTokens(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class AssessmentImportService {
  /**
   * Stage 1: Validate Assessment JSON payload without persisting to the database.
   * Performs schema validation, question-level checks, option ID resolution,
   * explanation quality checks, hierarchy verification, and duplicate detection.
   */
  public async validateAssessmentImport(
    trainerId: string,
    userRole: Role,
    payload: any,
    mappingOverride?: HierarchyMappingOverride,
    userOrganizationId?: string,
  ): Promise<AssessmentValidationResult> {
    const errors: AssessmentValidationIssue[] = [];
    const warnings: AssessmentValidationIssue[] = [];

    // Resolve user's organizationId if not explicitly provided
    let userOrgId = userOrganizationId;
    if (!userOrgId && userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
      try {
        const userRecord = await prisma.user.findUnique({
          where: { id: trainerId },
          select: { organizationId: true },
        });
        userOrgId = userRecord?.organizationId;
      } catch (e) {
        // Fall back gracefully
      }
    }

    // 1. Root and Schema Version Validation
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      errors.push({
        path: 'root',
        code: 'INVALID_ROOT_TYPE',
        message: 'JSON root must be an object with schemaVersion and assessment keys',
        severity: 'ERROR',
      });
      return this.buildFailedResult(errors, warnings);
    }

    if (!payload.schemaVersion) {
      errors.push({
        path: 'schemaVersion',
        code: 'MISSING_SCHEMA_VERSION',
        message: 'Field schemaVersion is required. Expected "1.0"',
        severity: 'ERROR',
      });
    } else if (payload.schemaVersion !== '1.0') {
      errors.push({
        path: 'schemaVersion',
        code: 'UNSUPPORTED_VERSION',
        message: `Unsupported schema version "${payload.schemaVersion}". Supported version is "1.0"`,
        severity: 'ERROR',
      });
    }

    const rawAssessment = payload.assessment;
    if (!rawAssessment || typeof rawAssessment !== 'object' || Array.isArray(rawAssessment)) {
      errors.push({
        path: 'assessment',
        code: 'MISSING_ASSESSMENT_OBJECT',
        message: 'Assessment payload must contain an "assessment" object',
        severity: 'ERROR',
      });
      return this.buildFailedResult(errors, warnings);
    }

    // 2. Assessment Metadata Validation
    const title = typeof rawAssessment.title === 'string' ? rawAssessment.title.trim() : '';
    if (!title) {
      errors.push({
        path: 'assessment.title',
        code: 'MISSING_TITLE',
        message: 'Assessment title is required',
        severity: 'ERROR',
      });
    } else if (title.length < 3 || title.length > 200) {
      errors.push({
        path: 'assessment.title',
        code: 'INVALID_TITLE_LENGTH',
        message: 'Assessment title must be between 3 and 200 characters',
        severity: 'ERROR',
      });
    }

    const description = typeof rawAssessment.description === 'string' ? rawAssessment.description.trim() : null;
    const instructions = typeof rawAssessment.instructions === 'string' ? rawAssessment.instructions.trim() : null;
    let durationMinutes = rawAssessment.durationMinutes !== undefined && rawAssessment.durationMinutes !== null
      ? Number(rawAssessment.durationMinutes)
      : null;

    if (durationMinutes !== null) {
      if (isNaN(durationMinutes) || !Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
        errors.push({
          path: 'assessment.durationMinutes',
          code: 'INVALID_DURATION',
          message: 'Duration minutes must be a whole number between 1 and 600 minutes (10 hours)',
          severity: 'ERROR',
        });
        durationMinutes = null;
      }
    }

    let passingPercentage = rawAssessment.passingPercentage !== undefined && rawAssessment.passingPercentage !== null
      ? Number(rawAssessment.passingPercentage)
      : 70;

    if (isNaN(passingPercentage) || passingPercentage < 0 || passingPercentage > 100) {
      errors.push({
        path: 'assessment.passingPercentage',
        code: 'INVALID_PASSING_PERCENTAGE',
        message: 'Passing percentage must be a number between 0 and 100',
        severity: 'ERROR',
      });
      passingPercentage = 70;
    }

    // Subject area determination
    let subject = typeof rawAssessment.subject === 'string' && rawAssessment.subject.trim()
      ? rawAssessment.subject.trim()
      : 'Meteorology';

    // 3. Course / Module / Lesson Mapping & Security Checks
    let placementType: 'COURSE' | 'MODULE' | 'LESSON' | 'STANDALONE' =
      mappingOverride?.placementType ||
      (rawAssessment.lesson ? 'LESSON' : rawAssessment.module ? 'MODULE' : rawAssessment.course ? 'COURSE' : 'STANDALONE');

    let resolvedCourseId: string | null = null;
    let resolvedCourseTitle: string | null = null;
    let resolvedModuleId: string | null = null;
    let resolvedModuleTitle: string | null = null;
    let resolvedLessonId: string | null = null;
    let resolvedLessonTitle: string | null = null;

    if (mappingOverride) {
      if (mappingOverride.placementType === 'STANDALONE') {
        placementType = 'STANDALONE';
        resolvedCourseId = null;
        resolvedCourseTitle = null;
        resolvedModuleId = null;
        resolvedModuleTitle = null;
        resolvedLessonId = null;
        resolvedLessonTitle = null;
      } else {
        placementType = mappingOverride.placementType || 'COURSE';
        if (mappingOverride.courseId) {
          const foundCourse = await prisma.course.findUnique({
            where: { id: mappingOverride.courseId },
            include: {
              modules: {
                include: { lessons: true },
              },
            },
          });

          if (!foundCourse) {
            errors.push({
              path: 'assessment.course.courseId',
              code: 'COURSE_NOT_FOUND',
              message: `Course with ID "${mappingOverride.courseId}" does not exist in the platform`,
              severity: 'ERROR',
            });
          } else if (
            userRole !== Role.ADMIN &&
            userRole !== Role.SUPER_ADMIN &&
            foundCourse.trainerId !== trainerId &&
            (!userOrgId || foundCourse.organizationId !== userOrgId)
          ) {
            errors.push({
              path: 'assessment.course.courseId',
              code: 'FORBIDDEN_COURSE_ACCESS',
              message: 'You are not authorized to map assessments to this course. You can only import assessments into your own courses or courses within your organization.',
              severity: 'ERROR',
            });
          } else {
            resolvedCourseId = foundCourse.id;
            resolvedCourseTitle = foundCourse.title;
            if (foundCourse.category && subject === 'Meteorology') {
              subject = foundCourse.category;
            }

            if (placementType === 'MODULE' || placementType === 'LESSON') {
              if (mappingOverride.moduleId) {
                const matchedModule = foundCourse.modules.find((m) => m.id === mappingOverride.moduleId);
                if (!matchedModule) {
                  errors.push({
                    path: 'assessment.module.moduleId',
                    code: 'INVALID_MODULE_MAPPING',
                    message: `Selected module ID "${mappingOverride.moduleId}" does not belong to course "${foundCourse.title}"`,
                    severity: 'ERROR',
                  });
                } else {
                  resolvedModuleId = matchedModule.id;
                  resolvedModuleTitle = matchedModule.title;

                  if (mappingOverride.lessonId) {
                    const matchedLesson = matchedModule.lessons.find((l) => l.id === mappingOverride.lessonId);
                    if (!matchedLesson) {
                      errors.push({
                        path: 'assessment.lesson.lessonId',
                        code: 'INVALID_LESSON_MAPPING',
                        message: `Selected lesson ID "${mappingOverride.lessonId}" does not belong to module "${matchedModule.title}"`,
                        severity: 'ERROR',
                      });
                    } else {
                      resolvedLessonId = matchedLesson.id;
                      resolvedLessonTitle = matchedLesson.title;
                    }
                  } else if (placementType === 'LESSON') {
                    warnings.push({
                      path: 'assessment.lesson',
                      code: 'LESSON_SELECTION_REQUIRED',
                      message: 'Please select a lesson for this Lesson Assessment.',
                      severity: 'WARNING',
                    });
                  }
                }
              } else {
                warnings.push({
                  path: 'assessment.module',
                  code: 'MODULE_SELECTION_REQUIRED',
                  message: 'Please select a module for this Module Assessment.',
                  severity: 'WARNING',
                });
              }
            }
          }
        } else {
          // Course selection required for Course/Module/Lesson placement
          warnings.push({
            path: 'assessment.course',
            code: 'COURSE_SELECTION_REQUIRED',
            message: 'Please select a course to attach this assessment, or select Standalone Assessment.',
            severity: 'WARNING',
          });
        }
      }
    } else {
      // Fallback to JSON payload mappings (raw import / initial validation)
      const courseMapping = rawAssessment.course;
      const moduleMapping = rawAssessment.module;
      const lessonMapping = rawAssessment.lesson;

      if (courseMapping && typeof courseMapping === 'object') {
        const courseIdInput = courseMapping.courseId?.trim();
        const courseTitleInput = courseMapping.courseTitle?.trim();

        if (courseIdInput) {
          const foundCourse = await prisma.course.findUnique({
            where: { id: courseIdInput },
            include: {
              modules: {
                include: { lessons: true },
              },
            },
          });

          if (!foundCourse) {
            errors.push({
              path: 'assessment.course.courseId',
              code: 'COURSE_NOT_FOUND',
              message: `Course with ID "${courseIdInput}" does not exist in the platform`,
              severity: 'ERROR',
            });
          } else if (
            userRole !== Role.ADMIN &&
            userRole !== Role.SUPER_ADMIN &&
            foundCourse.trainerId !== trainerId &&
            (!userOrgId || foundCourse.organizationId !== userOrgId)
          ) {
            errors.push({
              path: 'assessment.course.courseId',
              code: 'FORBIDDEN_COURSE_ACCESS',
              message: 'You are not authorized to map assessments to this course. You can only import assessments into your own courses or courses within your organization.',
              severity: 'ERROR',
            });
          } else {
            resolvedCourseId = foundCourse.id;
            resolvedCourseTitle = foundCourse.title;
            if (foundCourse.category && subject === 'Meteorology') {
              subject = foundCourse.category;
            }

            if (courseTitleInput && courseTitleInput.toLowerCase() !== foundCourse.title.toLowerCase()) {
              warnings.push({
                path: 'assessment.course.courseTitle',
                code: 'COURSE_TITLE_MISMATCH',
                message: `Provided courseTitle "${courseTitleInput}" differs from database title "${foundCourse.title}". Mapping by ID will be used.`,
                severity: 'WARNING',
              });
            }

            // Verify Module if specified
            if (moduleMapping && typeof moduleMapping === 'object') {
              const moduleIdInput = moduleMapping.moduleId?.trim();
              const moduleTitleInput = moduleMapping.moduleTitle?.trim();

              if (moduleIdInput) {
                const matchedModule = foundCourse.modules.find((m) => m.id === moduleIdInput);
                if (!matchedModule) {
                  errors.push({
                    path: 'assessment.module.moduleId',
                    code: 'INVALID_MODULE_MAPPING',
                    message: `Module ID "${moduleIdInput}" does not belong to course "${foundCourse.title}"`,
                    severity: 'ERROR',
                  });
                } else {
                  resolvedModuleId = matchedModule.id;
                  resolvedModuleTitle = matchedModule.title;

                  if (lessonMapping && typeof lessonMapping === 'object') {
                    const lessonIdInput = lessonMapping.lessonId?.trim();
                    const lessonTitleInput = lessonMapping.lessonTitle?.trim();

                    if (lessonIdInput) {
                      const matchedLesson = matchedModule.lessons.find((l) => l.id === lessonIdInput);
                      if (!matchedLesson) {
                        errors.push({
                          path: 'assessment.lesson.lessonId',
                          code: 'INVALID_LESSON_MAPPING',
                          message: `Lesson ID "${lessonIdInput}" does not belong to module "${matchedModule.title}"`,
                          severity: 'ERROR',
                        });
                      } else {
                        resolvedLessonId = matchedLesson.id;
                        resolvedLessonTitle = matchedLesson.title;
                      }
                    } else if (lessonTitleInput) {
                      const matchedLesson = matchedModule.lessons.find(
                        (l) => l.title.toLowerCase() === lessonTitleInput.toLowerCase(),
                      );
                      if (matchedLesson) {
                        resolvedLessonId = matchedLesson.id;
                        resolvedLessonTitle = matchedLesson.title;
                      } else {
                        warnings.push({
                          path: 'assessment.lesson.lessonTitle',
                          code: 'LESSON_TITLE_NOT_FOUND',
                          message: `No lesson named "${lessonTitleInput}" found under module "${matchedModule.title}".`,
                          severity: 'WARNING',
                        });
                      }
                    }
                  }
                }
              } else if (moduleTitleInput) {
                const matchedModules = foundCourse.modules.filter(
                  (m) => m.title.toLowerCase() === moduleTitleInput.toLowerCase(),
                );
                if (matchedModules.length === 1) {
                  resolvedModuleId = matchedModules[0].id;
                  resolvedModuleTitle = matchedModules[0].title;
                } else if (matchedModules.length > 1) {
                  errors.push({
                    path: 'assessment.module.moduleTitle',
                    code: 'AMBIGUOUS_MAPPING',
                    message: `Multiple modules match title "${moduleTitleInput}". Please specify moduleId.`,
                    severity: 'ERROR',
                  });
                } else {
                  warnings.push({
                    path: 'assessment.module.moduleTitle',
                    code: 'MODULE_TITLE_NOT_FOUND',
                    message: `No module named "${moduleTitleInput}" found under course "${foundCourse.title}".`,
                    severity: 'WARNING',
                  });
                }
              }
            }
          }
        } else if (courseTitleInput) {
          // Fetch candidate courses accessible to this user/org
          const candidateCourses = await prisma.course.findMany({
            where:
              userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN
                ? {}
                : userOrgId
                ? { OR: [{ trainerId }, { organizationId: userOrgId }] }
                : { trainerId },
            include: { modules: { include: { lessons: true } } },
          });

          // Multi-tier Course Matching
          const cleanInput = cleanString(courseTitleInput);
          const strippedInput = stripHierarchyPrefix(courseTitleInput);
          const normInput = normalizeTokens(courseTitleInput);

          let matchedCandidates = candidateCourses.filter(
            (c) => cleanString(c.title) === cleanInput,
          );

          if (matchedCandidates.length === 0 && strippedInput) {
            matchedCandidates = candidateCourses.filter(
              (c) => stripHierarchyPrefix(c.title) === strippedInput,
            );
          }

          if (matchedCandidates.length === 0 && normInput) {
            matchedCandidates = candidateCourses.filter(
              (c) => normalizeTokens(c.title) === normInput,
            );
          }

          if (matchedCandidates.length === 0 && normInput.length > 3) {
            matchedCandidates = candidateCourses.filter((c) => {
              const cNorm = normalizeTokens(c.title);
              return cNorm.length > 3 && (cNorm.includes(normInput) || normInput.includes(cNorm));
            });
          }

          // Disambiguate if multiple candidates match using Module and Lesson
          if (matchedCandidates.length > 1 && moduleMapping && typeof moduleMapping === 'object') {
            const modTitleInput = moduleMapping.moduleTitle?.trim();
            const modIdInput = moduleMapping.moduleId?.trim();
            if (modIdInput || modTitleInput) {
              const disambiguated = matchedCandidates.filter((c) =>
                c.modules.some((m) => {
                  if (modIdInput && m.id === modIdInput) return true;
                  if (modTitleInput) {
                    if (cleanString(m.title) === cleanString(modTitleInput)) return true;
                    if (stripHierarchyPrefix(m.title) === stripHierarchyPrefix(modTitleInput)) return true;
                    if (normalizeTokens(m.title) === normalizeTokens(modTitleInput)) return true;
                  }
                  return false;
                }),
              );
              if (disambiguated.length > 0) {
                matchedCandidates = disambiguated;
              }
            }
          }

          if (matchedCandidates.length > 1 && lessonMapping && typeof lessonMapping === 'object') {
            const lesTitleInput = lessonMapping.lessonTitle?.trim();
            const lesIdInput = lessonMapping.lessonId?.trim();
            if (lesIdInput || lesTitleInput) {
              const disambiguated = matchedCandidates.filter((c) =>
                c.modules.some((m) =>
                  m.lessons.some((l) => {
                    if (lesIdInput && l.id === lesIdInput) return true;
                    if (lesTitleInput) {
                      if (cleanString(l.title) === cleanString(lesTitleInput)) return true;
                      if (stripHierarchyPrefix(l.title) === stripHierarchyPrefix(lesTitleInput)) return true;
                      if (normalizeTokens(l.title) === normalizeTokens(lesTitleInput)) return true;
                    }
                    return false;
                  }),
                ),
              );
              if (disambiguated.length > 0) {
                matchedCandidates = disambiguated;
              }
            }
          }

          if (matchedCandidates.length === 0) {
            warnings.push({
              path: 'assessment.course.courseTitle',
              code: 'COURSE_MAPPING_REQUIRED',
              message: `Course title "${courseTitleInput}" was not found among your active courses. Please select the target course from your courses below or import as Standalone.`,
              severity: 'WARNING',
            });
            resolvedCourseTitle = courseTitleInput;
            if (moduleMapping?.moduleTitle) resolvedModuleTitle = moduleMapping.moduleTitle;
            if (lessonMapping?.lessonTitle) resolvedLessonTitle = lessonMapping.lessonTitle;
          } else if (matchedCandidates.length > 1) {
            warnings.push({
              path: 'assessment.course.courseTitle',
              code: 'AMBIGUOUS_COURSE_MAPPING',
              message: `Multiple courses (${matchedCandidates.length}) match title "${courseTitleInput}". Please select your intended course from the dropdown below.`,
              severity: 'WARNING',
            });
            resolvedCourseTitle = courseTitleInput;
          } else {
            const matchedCourse = matchedCandidates[0];
            resolvedCourseId = matchedCourse.id;
            resolvedCourseTitle = matchedCourse.title;
            if (matchedCourse.category && subject === 'Meteorology') {
              subject = matchedCourse.category;
            }

            // Also check module and lesson if specified by title or ID
            if (moduleMapping && typeof moduleMapping === 'object') {
              const modIdInput = moduleMapping.moduleId?.trim();
              const modTitleInput = moduleMapping.moduleTitle?.trim();

              let matchedModule = null;
              if (modIdInput) {
                matchedModule = matchedCourse.modules.find((m) => m.id === modIdInput);
              }
              if (!matchedModule && modTitleInput) {
                const mClean = cleanString(modTitleInput);
                const mStripped = stripHierarchyPrefix(modTitleInput);
                const mNorm = normalizeTokens(modTitleInput);

                matchedModule =
                  matchedCourse.modules.find((m) => cleanString(m.title) === mClean) ||
                  (mStripped ? matchedCourse.modules.find((m) => stripHierarchyPrefix(m.title) === mStripped) : undefined) ||
                  (mNorm ? matchedCourse.modules.find((m) => normalizeTokens(m.title) === mNorm) : undefined) ||
                  (mNorm.length > 3
                    ? matchedCourse.modules.find((m) => {
                        const candNorm = normalizeTokens(m.title);
                        return candNorm.length > 3 && (candNorm.includes(mNorm) || mNorm.includes(candNorm));
                      })
                    : undefined);
              }

              if (matchedModule) {
                resolvedModuleId = matchedModule.id;
                resolvedModuleTitle = matchedModule.title;

                if (lessonMapping && typeof lessonMapping === 'object') {
                  const lesIdInput = lessonMapping.lessonId?.trim();
                  const lesTitleInput = lessonMapping.lessonTitle?.trim();

                  let matchedLesson = null;
                  if (lesIdInput) {
                    matchedLesson = matchedModule.lessons.find((l) => l.id === lesIdInput);
                  }
                  if (!matchedLesson && lesTitleInput) {
                    const lClean = cleanString(lesTitleInput);
                    const lStripped = stripHierarchyPrefix(lesTitleInput);
                    const lNorm = normalizeTokens(lesTitleInput);

                    matchedLesson =
                      matchedModule.lessons.find((l) => cleanString(l.title) === lClean) ||
                      (lStripped ? matchedModule.lessons.find((l) => stripHierarchyPrefix(l.title) === lStripped) : undefined) ||
                      (lNorm ? matchedModule.lessons.find((l) => normalizeTokens(l.title) === lNorm) : undefined) ||
                      (lNorm.length > 3
                        ? matchedModule.lessons.find((l) => {
                            const candNorm = normalizeTokens(l.title);
                            return candNorm.length > 3 && (candNorm.includes(lNorm) || lNorm.includes(candNorm));
                          })
                        : undefined);
                  }

                  if (matchedLesson) {
                    resolvedLessonId = matchedLesson.id;
                    resolvedLessonTitle = matchedLesson.title;
                  } else if (lesTitleInput) {
                    warnings.push({
                      path: 'assessment.lesson.lessonTitle',
                      code: 'LESSON_TITLE_NOT_FOUND',
                      message: `No lesson named "${lesTitleInput}" found under module "${matchedModule.title}".`,
                      severity: 'WARNING',
                    });
                  }
                }
              } else if (modTitleInput) {
                warnings.push({
                  path: 'assessment.module.moduleTitle',
                  code: 'MODULE_TITLE_NOT_FOUND',
                  message: `No module named "${modTitleInput}" found under course "${matchedCourse.title}".`,
                  severity: 'WARNING',
                });
              }
            }
          }
        }
      } else {
        placementType = 'STANDALONE';
      }

      // Automatically determine placementType from resolved hierarchy if not overridden
      if (resolvedLessonId) {
        placementType = 'LESSON';
      } else if (resolvedModuleId) {
        placementType = 'MODULE';
      } else if (resolvedCourseId) {
        placementType = 'COURSE';
      } else if (lessonMapping) {
        placementType = 'LESSON';
      } else if (moduleMapping) {
        placementType = 'MODULE';
      } else if (courseMapping) {
        placementType = 'COURSE';
      } else {
        placementType = 'STANDALONE';
      }
    }


    // 4. Questions Validation
    const rawQuestions = rawAssessment.questions;
    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      errors.push({
        path: 'assessment.questions',
        code: 'EMPTY_QUESTIONS',
        message: 'Assessment must contain at least 1 question',
        severity: 'ERROR',
      });
      return this.buildFailedResult(errors, warnings);
    }

    const normalizedQuestions: NormalizedImportQuestion[] = [];
    const seenExternalIds = new Map<string, number>();
    const seenNormalizedPrompts = new Map<string, number>();
    const promptTokensList: string[][] = [];

    let totalPoints = 0;
    const questionTypeCounts: Record<string, number> = {
      SINGLE_CHOICE: 0,
      MULTIPLE_CHOICE: 0,
      TRUE_FALSE: 0,
    };

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const qPath = `assessment.questions[${i}]`;

      if (!q || typeof q !== 'object') {
        errors.push({
          questionIndex: i,
          path: qPath,
          code: 'INVALID_QUESTION_OBJECT',
          message: `Question at index ${i} is not a valid JSON object`,
          severity: 'ERROR',
        });
        continue;
      }

      // External ID check
      const externalId = typeof q.externalId === 'string' && q.externalId.trim() ? q.externalId.trim() : undefined;
      if (externalId) {
        if (seenExternalIds.has(externalId)) {
          const firstIndex = seenExternalIds.get(externalId)!;
          errors.push({
            questionIndex: i,
            path: `${qPath}.externalId`,
            code: 'DUPLICATE_EXTERNAL_ID',
            message: `Duplicate externalId "${externalId}". Already used in Question ${firstIndex + 1}.`,
            severity: 'ERROR',
          });
        } else {
          seenExternalIds.set(externalId, i);
        }
      }

      // Prompt validation
      const prompt = typeof q.question === 'string' ? q.question.trim() : '';
      if (!prompt) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.question`,
          code: 'MISSING_QUESTION_TEXT',
          message: 'Question prompt cannot be empty',
          severity: 'ERROR',
        });
      } else if (prompt.length < 3) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.question`,
          code: 'QUESTION_TEXT_TOO_SHORT',
          message: 'Question prompt must be at least 3 characters',
          severity: 'ERROR',
        });
      }

      // Duplicate detection within file
      if (prompt) {
        const normalizedPrompt = prompt.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (seenNormalizedPrompts.has(normalizedPrompt)) {
          const originalIndex = seenNormalizedPrompts.get(normalizedPrompt)!;
          warnings.push({
            questionIndex: i,
            path: `${qPath}.question`,
            code: 'EXACT_DUPLICATE_QUESTION',
            message: `Question ${i + 1} has identical normalized text to Question ${originalIndex + 1}.`,
            severity: 'WARNING',
          });
        } else {
          seenNormalizedPrompts.set(normalizedPrompt, i);
        }

        // Tokenization for Jaccard potential duplicate detection
        const tokens = prompt
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((t: string) => t.length >= 3);
        promptTokensList.push(tokens);

        // Compare with earlier questions
        for (let j = 0; j < i; j++) {
          const otherTokens = promptTokensList[j];
          if (!otherTokens || otherTokens.length === 0 || tokens.length === 0) continue;

          const similarity = this.calculateJaccardSimilarity(tokens, otherTokens);
          if (similarity >= 0.75 && similarity < 1.0) {
            warnings.push({
              questionIndex: i,
              path: `${qPath}.question`,
              code: 'POTENTIAL_DUPLICATE',
              message: `Question ${i + 1} may duplicate Question ${j + 1} (${Math.round(similarity * 100)}% token similarity): "${prompt.slice(0, 60)}..."`,
              severity: 'WARNING',
            });
          }
        }
      } else {
        promptTokensList.push([]);
      }

      // Question Type check
      const rawType = q.questionType;
      const validTypes: Array<'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE'> = [
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
      ];

      if (!rawType || !validTypes.includes(rawType)) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.questionType`,
          code: 'UNSUPPORTED_QUESTION_TYPE',
          message: `Question type "${rawType}" is not supported by the assessment engine. Supported types are: ${validTypes.join(', ')}`,
          severity: 'ERROR',
        });
        continue;
      }

      const questionType = rawType as 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
      questionTypeCounts[questionType] = (questionTypeCounts[questionType] || 0) + 1;

      // Explanation validation (Mandatory, non-empty, non-placeholder)
      const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
      if (!explanation) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.explanation`,
          code: 'MISSING_EXPLANATION',
          message: 'Explanation is required for every question to explain why the answer is correct.',
          severity: 'ERROR',
        });
      } else if (PLACEHOLDER_EXPLANATION_REGEX.test(explanation)) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.explanation`,
          code: 'INVALID_EXPLANATION',
          message: `Explanation cannot contain placeholder text such as "${explanation}". Please provide a genuine explanation.`,
          severity: 'ERROR',
        });
      } else if (explanation.length < 5) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.explanation`,
          code: 'EXPLANATION_TOO_SHORT',
          message: 'Explanation must be at least 5 characters long.',
          severity: 'ERROR',
        });
      }

      // Points / marks validation
      const points = q.points !== undefined && q.points !== null ? Number(q.points) : 1.0;
      if (isNaN(points) || points < 0.5 || points > 100) {
        errors.push({
          questionIndex: i,
          path: `${qPath}.points`,
          code: 'INVALID_POINTS',
          message: 'Points must be a positive number between 0.5 and 100',
          severity: 'ERROR',
        });
      } else {
        totalPoints += points;
      }

      // Difficulty & metadata
      const difficulty = ['EASY', 'MEDIUM', 'HARD', 'EXPERT'].includes(q.difficulty)
        ? q.difficulty
        : 'MEDIUM';
      const tags = Array.isArray(q.tags) ? q.tags.map(String) : [];
      const competencies = Array.isArray(q.competencies) ? q.competencies.map(String) : [];

      // Type-specific Options and Correct Answer Validation
      const rawOptions = q.options;
      const rawAnswer = q.correctAnswer;

      if (questionType === 'SINGLE_CHOICE') {
        if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
          errors.push({
            questionIndex: i,
            path: `${qPath}.options`,
            code: 'INSUFFICIENT_OPTIONS',
            message: 'Single choice question must provide at least 2 options',
            severity: 'ERROR',
          });
        }

        const optionMap = new Map<string, string>();
        if (Array.isArray(rawOptions)) {
          for (let optIdx = 0; optIdx < rawOptions.length; optIdx++) {
            const opt = rawOptions[optIdx];
            const optId = typeof opt?.id === 'string' ? opt.id.trim() : '';
            const optText = typeof opt?.text === 'string' ? opt.text.trim() : '';

            if (!optId) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].id`,
                code: 'EMPTY_OPTION_ID',
                message: 'Option id cannot be empty',
                severity: 'ERROR',
              });
            } else if (optionMap.has(optId)) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].id`,
                code: 'DUPLICATE_OPTION_ID',
                message: `Duplicate option ID "${optId}" in question`,
                severity: 'ERROR',
              });
            }

            if (!optText) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].text`,
                code: 'EMPTY_OPTION_TEXT',
                message: 'Option text cannot be empty',
                severity: 'ERROR',
              });
            }

            if (optId) optionMap.set(optId, optText);
          }
        }

        if (!rawAnswer || typeof rawAnswer !== 'object' || rawAnswer.value === undefined || rawAnswer.value === null) {
          errors.push({
            questionIndex: i,
            path: `${qPath}.correctAnswer`,
            code: 'MISSING_CORRECT_ANSWER',
            message: 'correctAnswer is required for single choice question',
            severity: 'ERROR',
          });
        } else {
          const selectedOptionId = String(rawAnswer.value).trim();
          if (!optionMap.has(selectedOptionId)) {
            errors.push({
              questionIndex: i,
              path: `${qPath}.correctAnswer.value`,
              code: 'INVALID_OPTION_REFERENCE',
              message: `Correct answer "${selectedOptionId}" does not exist in the provided options. Available options: ${Array.from(optionMap.keys()).join(', ') || 'None'}`,
              severity: 'ERROR',
            });
          } else {
            normalizedQuestions.push({
              externalId,
              questionType: 'SINGLE_CHOICE',
              question: prompt,
              options: Array.from(optionMap.entries()).map(([id, text]) => ({
                id,
                text,
                isCorrect: id === selectedOptionId,
              })),
              explanation,
              points,
              difficulty,
              tags,
              competencies,
            });
          }
        }
      } else if (questionType === 'MULTIPLE_CHOICE') {
        if (!Array.isArray(rawOptions) || rawOptions.length < 2) {
          errors.push({
            questionIndex: i,
            path: `${qPath}.options`,
            code: 'INSUFFICIENT_OPTIONS',
            message: 'Multiple choice question must provide at least 2 options',
            severity: 'ERROR',
          });
        }

        const optionMap = new Map<string, string>();
        if (Array.isArray(rawOptions)) {
          for (let optIdx = 0; optIdx < rawOptions.length; optIdx++) {
            const opt = rawOptions[optIdx];
            const optId = typeof opt?.id === 'string' ? opt.id.trim() : '';
            const optText = typeof opt?.text === 'string' ? opt.text.trim() : '';

            if (!optId) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].id`,
                code: 'EMPTY_OPTION_ID',
                message: 'Option id cannot be empty',
                severity: 'ERROR',
              });
            } else if (optionMap.has(optId)) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].id`,
                code: 'DUPLICATE_OPTION_ID',
                message: `Duplicate option ID "${optId}" in question`,
                severity: 'ERROR',
              });
            }

            if (!optText) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.options[${optIdx}].text`,
                code: 'EMPTY_OPTION_TEXT',
                message: 'Option text cannot be empty',
                severity: 'ERROR',
              });
            }

            if (optId) optionMap.set(optId, optText);
          }
        }

        if (!rawAnswer || typeof rawAnswer !== 'object' || !Array.isArray(rawAnswer.value) || rawAnswer.value.length === 0) {
          errors.push({
            questionIndex: i,
            path: `${qPath}.correctAnswer.value`,
            code: 'MISSING_CORRECT_ANSWER',
            message: 'Multiple choice question must have at least one correct option in correctAnswer.value array',
            severity: 'ERROR',
          });
        } else {
          const selectedOptionIds = rawAnswer.value.map((v: any) => String(v).trim());
          const uniqueSelectedIds = new Set(selectedOptionIds);

          if (uniqueSelectedIds.size !== selectedOptionIds.length) {
            errors.push({
              questionIndex: i,
              path: `${qPath}.correctAnswer.value`,
              code: 'DUPLICATE_CORRECT_ANSWER',
              message: 'correctAnswer.value contains duplicate option references',
              severity: 'ERROR',
            });
          }

          let allValid = true;
          for (const sId of selectedOptionIds) {
            if (!optionMap.has(sId)) {
              errors.push({
                questionIndex: i,
                path: `${qPath}.correctAnswer.value`,
                code: 'INVALID_OPTION_REFERENCE',
                message: `Correct answer references option "${sId}", but only [${Array.from(optionMap.keys()).join(', ')}] exist`,
                severity: 'ERROR',
              });
              allValid = false;
            }
          }

          if (allValid) {
            normalizedQuestions.push({
              externalId,
              questionType: 'MULTIPLE_CHOICE',
              question: prompt,
              options: Array.from(optionMap.entries()).map(([id, text]) => ({
                id,
                text,
                isCorrect: uniqueSelectedIds.has(id),
              })),
              explanation,
              points,
              difficulty,
              tags,
              competencies,
            });
          }
        }
      } else if (questionType === 'TRUE_FALSE') {
        if (!rawAnswer || typeof rawAnswer !== 'object' || typeof rawAnswer.value !== 'boolean') {
          errors.push({
            questionIndex: i,
            path: `${qPath}.correctAnswer.value`,
            code: 'INVALID_BOOLEAN_ANSWER',
            message: 'True/False question correctAnswer.value must strictly be boolean true or false',
            severity: 'ERROR',
          });
        } else {
          const booleanValue = rawAnswer.value === true;
          normalizedQuestions.push({
            externalId,
            questionType: 'TRUE_FALSE',
            question: prompt,
            options: [
              { id: 'true', text: 'True', isCorrect: booleanValue },
              { id: 'false', text: 'False', isCorrect: !booleanValue },
            ],
            explanation,
            points,
            difficulty,
            tags,
            competencies,
          });
        }
      }
    }

    // 5. Check against existing questions in Database (if courseId provided)
    if (resolvedCourseId) {
      try {
        const existingQuestions = await prisma.assessmentQuestion.findMany({
          where: { assessment: { courseId: resolvedCourseId } },
          select: { questionText: true },
          take: 200,
        });

        for (let i = 0; i < normalizedQuestions.length; i++) {
          const qText = normalizedQuestions[i].question.toLowerCase().replace(/[^a-z0-9]/g, '');
          for (const eq of existingQuestions) {
            const eqText = eq.questionText.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (qText && qText === eqText) {
              warnings.push({
                questionIndex: i,
                path: `assessment.questions[${i}].question`,
                code: 'EXISTING_COURSE_DUPLICATE',
                message: `Question ${i + 1} matches an existing question prompt in this course.`,
                severity: 'WARNING',
              });
              break;
            }
          }
        }
      } catch (err) {
        // Non-blocking warning check
      }
    }

    const isValid = errors.length === 0;

    return {
      valid: isValid,
      summary: {
        totalQuestions: rawQuestions.length,
        validQuestions: normalizedQuestions.length,
        invalidQuestions: rawQuestions.length - normalizedQuestions.length,
        warningsCount: warnings.length,
        errorsCount: errors.length,
        questionTypes: questionTypeCounts,
        totalPoints,
        durationMinutes,
        passingPercentage,
      },
      assessmentData: {
        title,
        description,
        instructions,
        durationMinutes,
        passingPercentage,
        subject,
        placementType,
        courseId: resolvedCourseId,
        courseTitle: resolvedCourseTitle,
        moduleId: resolvedModuleId,
        moduleTitle: resolvedModuleTitle,
        lessonId: resolvedLessonId,
        lessonTitle: resolvedLessonTitle,
        questions: normalizedQuestions,
      },
      errors,
      warnings,
    };
  }

  /**
   * Stage 2: Confirm Assessment Import.
   * Performs an atomic database transaction creating the Assessment in DRAFT status,
   * creating all questions & options preserving exact JSON order, and logging audit history.
   * If any step fails, the entire transaction is rolled back.
   */
  public async confirmAssessmentImport(
    trainerId: string,
    userRole: Role,
    payload: any,
    fileMetadata: { fileName: string; fileSize?: number },
    mappingOverride?: HierarchyMappingOverride,
    userOrganizationId?: string,
  ): Promise<{ success: boolean; assessmentId: string; message: string }> {
    // 1. Re-validate payload on backend to prevent IDOR / client tampering
    const validationResult = await this.validateAssessmentImport(
      trainerId,
      userRole,
      payload,
      mappingOverride,
      userOrganizationId,
    );

    if (!validationResult.valid || validationResult.errors.length > 0) {
      throw new BadRequestError(
        `Assessment JSON contains ${validationResult.errors.length} validation error(s). Cannot import until all errors are resolved: ${validationResult.errors[0]?.message}`,
      );
    }

    const data = validationResult.assessmentData;

    // Verify course selection if placement is not STANDALONE
    if (data.placementType && data.placementType !== 'STANDALONE' && !data.courseId) {
      throw new BadRequestError(
        'A target course must be selected when importing a Course, Module, or Lesson assessment.',
      );
    }

    // 2. Execute Atomic PostgreSQL Transaction
    const createdAssessment = await prisma.$transaction(
      async (tx) => {
        // Create canonical Assessment with nested AssessmentQuestions and QuestionOptions
        const assessment = await tx.assessment.create({
          data: {
            trainerId,
            courseId: data.courseId || null,
            moduleId: data.moduleId || null,
            lessonId: data.lessonId || null,
            title: data.title,
            description: data.description,
            subject: data.subject,
            assessmentType: AssessmentType.MCQ,
            durationMinutes: data.durationMinutes,
            passingScore: data.passingPercentage,
            status: AssessmentStatus.DRAFT,
            questions: {
              create: data.questions.map((q, idx) => ({
                questionText: q.question,
                questionType: q.questionType as QuestionType,
                marks: q.points,
                orderIndex: idx + 1,
                explanation: q.explanation,
                options: {
                  create: q.options.map((opt, optIdx) => ({
                    optionText: opt.text,
                    isCorrect: opt.isCorrect,
                    orderIndex: optIdx + 1,
                  })),
                },
              })),
            },
          },
        });

        // Record Audit Log Entry for Import History
        const importId = randomUUID();
        await tx.auditLog.create({
          data: {
            userId: trainerId,
            action: 'ASSESSMENT_IMPORT',
            entityType: 'Assessment',
            entityId: assessment.id,
            newValues: {
              importId,
              trainerId,
              assessmentId: assessment.id,
              fileName: fileMetadata.fileName || 'assessment.json',
              fileSize: fileMetadata.fileSize || 0,
              schemaVersion: '1.0',
              placementType: data.placementType || 'STANDALONE',
              courseId: data.courseId,
              moduleId: data.moduleId,
              lessonId: data.lessonId,
              questionCount: data.questions.length,
              totalPoints: validationResult.summary.totalPoints,
              passingPercentage: data.passingPercentage,
              successfulImport: true,
              parserVersion: '1.0.0',
              importedAt: new Date().toISOString(),
            },
          },
        });

        return assessment;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      },
    );

    return {
      success: true,
      assessmentId: createdAssessment.id,
      message: `Assessment "${createdAssessment.title}" successfully imported with ${data.questions.length} questions.`,
    };
  }


  /**
   * Returns canonical JSON template for MoES / IMD trainers.
   */
  public getTemplateJson(): object {
    const templatePath = path.resolve(__dirname, '../../templates/assessment-template.json');
    if (fs.existsSync(templatePath)) {
      try {
        const content = fs.readFileSync(templatePath, 'utf8');
        return JSON.parse(content);
      } catch (err) {
        // Fall back to built-in template below
      }
    }

    return {
      schemaVersion: '1.0',
      assessment: {
        title: 'Advanced Atmospheric Dynamics Assessment',
        description: 'Assessment covering atmospheric dynamics and numerical weather prediction.',
        instructions: 'Answer all questions.',
        durationMinutes: 45,
        passingPercentage: 70,
        attemptsAllowed: 2,
        shuffleQuestions: false,
        shuffleOptions: false,
        subject: 'Atmospheric Dynamics',
        course: {
          courseTitle: 'Forecasters Training Course',
        },
        module: {
          moduleTitle: 'Advanced Atmospheric Dynamics & NWP',
        },
        lesson: {
          lessonTitle: 'Circulation Theorems and Pressure Systems',
        },
        questions: [
          {
            externalId: 'ATM-DYN-001',
            questionType: 'SINGLE_CHOICE',
            question: 'Which force primarily balances the pressure gradient force in geostrophic flow?',
            options: [
              { id: 'A', text: 'Coriolis force' },
              { id: 'B', text: 'Gravity' },
              { id: 'C', text: 'Friction' },
              { id: 'D', text: 'Buoyancy' },
            ],
            correctAnswer: {
              type: 'OPTION',
              value: 'A',
            },
            explanation: 'The Coriolis force balances the pressure gradient force in geostrophic flow.',
            points: 1,
            difficulty: 'MEDIUM',
            tags: ['atmospheric-dynamics', 'geostrophic-flow'],
            competencies: ['Atmospheric Dynamics'],
          },
        ],
      },
    };
  }

  /**
   * Helper to build a failure response for top-level structural errors
   */
  private buildFailedResult(
    errors: AssessmentValidationIssue[],
    warnings: AssessmentValidationIssue[],
  ): AssessmentValidationResult {
    return {
      valid: false,
      summary: {
        totalQuestions: 0,
        validQuestions: 0,
        invalidQuestions: 0,
        warningsCount: warnings.length,
        errorsCount: errors.length,
        questionTypes: {},
        totalPoints: 0,
        durationMinutes: null,
        passingPercentage: 70,
      },
      assessmentData: {
        title: '',
        description: null,
        instructions: null,
        durationMinutes: null,
        passingPercentage: 70,
        subject: 'Meteorology',
        placementType: 'STANDALONE',
        courseId: null,
        courseTitle: null,
        moduleId: null,
        moduleTitle: null,
        lessonId: null,
        lessonTitle: null,
        questions: [],
      },
      errors,
      warnings,
    };
  }

  /**
   * Computes token-based Jaccard similarity between two word lists
   */
  private calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let intersectionSize = 0;
    for (const token of setA) {
      if (setB.has(token)) intersectionSize++;
    }

    const unionSize = new Set([...tokensA, ...tokensB]).size;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
  }
}

export const assessmentImportService = new AssessmentImportService();
