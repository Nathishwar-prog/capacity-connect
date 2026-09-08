/**
 * Content Similarity Algorithm
 * Computes semantic and keyword overlap between course content and learner interest profile.
 */

export interface CourseContentMetadata {
  title?: string;
  description: string;
  category: string;
  topics: string[];
}

export interface LearnerInterestProfile {
  preferredCategories: string[];
  interestTopics: string[];
  recentTopics: string[];
}

export class ContentSimilarityAlgorithm {
  /**
   * Computes normalized content similarity (0 - 100).
   */
  public static calculate(
    course: CourseContentMetadata,
    learner: LearnerInterestProfile
  ): number {
    let score = 0;

    // 1. Direct Category Match (40% weight)
    const courseCat = course.category.toLowerCase().trim();
    const hasCategoryMatch = learner.preferredCategories.some(
      (cat) => cat.toLowerCase().trim() === courseCat
    );
    if (hasCategoryMatch) {
      score += 40;
    }

    // 2. Topic Overlap (35% weight)
    if (course.topics.length > 0 && learner.interestTopics.length > 0) {
      const courseTopicsNormalized = new Set(
        course.topics.map((t) => t.toLowerCase().trim())
      );
      let matchedTopics = 0;
      for (const it of learner.interestTopics) {
        if (courseTopicsNormalized.has(it.toLowerCase().trim())) {
          matchedTopics++;
        }
      }
      const topicOverlapRatio = matchedTopics / Math.max(1, learner.interestTopics.length);
      score += Math.min(35, topicOverlapRatio * 35 * 1.5);
    }

    // 3. Keyword / Text Similarity (25% weight)
    const textBlob = `${course.title || ''} ${course.description || ''}`.toLowerCase();
    const allUserKeywords = [...learner.interestTopics, ...learner.recentTopics].map((k) =>
      k.toLowerCase().trim()
    );

    if (allUserKeywords.length > 0) {
      let keywordHits = 0;
      for (const kw of allUserKeywords) {
        if (kw.length > 2 && textBlob.includes(kw)) {
          keywordHits++;
        }
      }
      const textOverlapRatio = keywordHits / Math.max(1, allUserKeywords.length);
      score += Math.min(25, textOverlapRatio * 25 * 1.5);
    }

    return Math.round(Math.min(100, Math.max(0, score)) * 100) / 100;
  }
}

export function calculateContentSimilarity(
  courseA: { category: string; topics: string[]; description?: string; title?: string },
  courseB: { category: string; topics: string[]; description?: string; title?: string }
): number {
  return ContentSimilarityAlgorithm.calculate(
    {
      title: courseA.title || '',
      description: courseA.description || '',
      category: courseA.category,
      topics: courseA.topics,
    },
    {
      preferredCategories: [courseB.category],
      interestTopics: courseB.topics,
      recentTopics: courseB.topics,
    }
  );
}
