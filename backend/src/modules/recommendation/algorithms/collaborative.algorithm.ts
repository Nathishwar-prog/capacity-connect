/**
 * Collaborative Filtering Algorithm
 * Computes peer-similarity based recommendations without fabricating cold-start signals.
 */

export interface PeerLearnerRecord {
  userId: string;
  completedCourseIds: string[];
  competencyLevels?: Map<string, number>;
}

export interface PeerLearnerHistory {
  peerUserId: string;
  completedCourseIds: string[];
}

export class CollaborativeAlgorithm {
  /**
   * Computes collaborative score (0 - 100) for a candidate course based on peer completion patterns.
   */
  public static calculate(
    candidateCourseId: string,
    learnerCompletedCourseIds: string[],
    peers: PeerLearnerRecord[]
  ): number {
    if (learnerCompletedCourseIds.length === 0 || peers.length === 0) {
      return 0.0; // Cold start: zero fabricated signal
    }

    const learnerCourses = new Set(learnerCompletedCourseIds);
    let peerSupportScore = 0;
    let totalWeight = 0;

    for (const peer of peers) {
      // Compute Jaccard overlap between target learner and peer
      const peerCourses = new Set(peer.completedCourseIds);
      let intersectionCount = 0;

      for (const cId of peerCourses) {
        if (learnerCourses.has(cId)) intersectionCount++;
      }

      const unionCount = new Set([...learnerCourses, ...peerCourses]).size;
      const jaccard = unionCount > 0 ? intersectionCount / unionCount : 0;

      if (jaccard > 0.15) {
        totalWeight += jaccard;
        if (peerCourses.has(candidateCourseId)) {
          peerSupportScore += jaccard * 100;
        }
      }
    }

    if (totalWeight === 0) return 0.0;

    const finalCollaborative = peerSupportScore / totalWeight;
    return Math.round(Math.min(100, Math.max(0, finalCollaborative)) * 100) / 100;
  }
}

export function calculateCollaborativeScore(
  userCompletedCourseIds: string[],
  peerHistories: Array<{ peerUserId?: string; userId?: string; completedCourseIds: string[] }>,
  candidateCourseId: string
): number {
  const peers: PeerLearnerRecord[] = peerHistories.map(p => ({
    userId: p.peerUserId || p.userId || '',
    completedCourseIds: p.completedCourseIds,
  }));

  return CollaborativeAlgorithm.calculate(candidateCourseId, userCompletedCourseIds, peers);
}
