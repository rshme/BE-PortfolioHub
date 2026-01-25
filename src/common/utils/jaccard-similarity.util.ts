/**
 * Utility class for calculating Jaccard similarity coefficient
 * Used to measure similarity between two sets
 */
export class JaccardSimilarity {
  /**
   * Calculate Jaccard index between two sets
   * Formula: J(A, B) = |A ∩ B| / |A ∪ B|
   *
   * @param setA - First set of items
   * @param setB - Second set of items
   * @returns Jaccard coefficient between 0 and 1
   */
  static calculate<T>(setA: T[], setB: T[]): number {
    if (setA.length === 0 && setB.length === 0) {
      return 1.0; // Both empty sets are identical
    }

    if (setA.length === 0 || setB.length === 0) {
      return 0.0; // One empty set means no similarity
    }

    const uniqueSetA = new Set(setA);
    const uniqueSetB = new Set(setB);

    // Calculate intersection
    const intersection = new Set(
      [...uniqueSetA].filter((item) => uniqueSetB.has(item)),
    );

    // Calculate union
    const union = new Set([...uniqueSetA, ...uniqueSetB]);

    // Return Jaccard coefficient
    return intersection.size / union.size;
  }

  /**
   * Calculate intersection count between two sets
   *
   * @param setA - First set of items
   * @param setB - Second set of items
   * @returns Number of common items
   */
  static intersection<T>(setA: T[], setB: T[]): number {
    const uniqueSetA = new Set(setA);
    const uniqueSetB = new Set(setB);

    const intersection = new Set(
      [...uniqueSetA].filter((item) => uniqueSetB.has(item)),
    );

    return intersection.size;
  }

  /**
   * Calculate union count between two sets
   *
   * @param setA - First set of items
   * @param setB - Second set of items
   * @returns Number of unique items in both sets
   */
  static union<T>(setA: T[], setB: T[]): number {
    const union = new Set([...setA, ...setB]);
    return union.size;
  }

  /**
   * Get common items between two sets
   *
   * @param setA - First set of items
   * @param setB - Second set of items
   * @returns Array of common items
   */
  static getCommonItems<T>(setA: T[], setB: T[]): T[] {
    const uniqueSetA = new Set(setA);
    const uniqueSetB = new Set(setB);

    return [...uniqueSetA].filter((item) => uniqueSetB.has(item));
  }

  /**
   * Calculate weighted Jaccard similarity
   * Useful when skills have different importance levels
   *
   * @param setA - First set of items with weights
   * @param setB - Second set of items with weights
   * @returns Weighted Jaccard coefficient
   */
  static calculateWeighted(
    setA: Array<{ id: string; weight: number }>,
    setB: Array<{ id: string; weight: number }>,
  ): number {
    if (setA.length === 0 && setB.length === 0) {
      return 1.0;
    }

    if (setA.length === 0 || setB.length === 0) {
      return 0.0;
    }

    const weightsA = new Map(setA.map((item) => [item.id, item.weight]));
    const weightsB = new Map(setB.map((item) => [item.id, item.weight]));

    const allIds = new Set([...weightsA.keys(), ...weightsB.keys()]);

    let intersectionSum = 0;
    let unionSum = 0;

    for (const id of allIds) {
      const weightA = weightsA.get(id) || 0;
      const weightB = weightsB.get(id) || 0;

      intersectionSum += Math.min(weightA, weightB);
      unionSum += Math.max(weightA, weightB);
    }

    return unionSum > 0 ? intersectionSum / unionSum : 0;
  }
}
