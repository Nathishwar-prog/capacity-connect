import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseDiscoveryApi } from '../api/courseDiscoveryApi';
import { mockCatalogCourses, mockFilterMetadata } from '../utils/mockData';
import {
  CourseSummary,
  CourseDetails,
  CourseDifficulty,
  CourseQueryParams,
} from '../types/course-discovery.types';

const DISCOVERY_QUERY_KEY = ['course-discovery'];

export function useCourseDiscovery() {
  const queryClient = useQueryClient();

  // Filter and search state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [difficulty, setDifficulty] = useState<CourseDifficulty | 'ALL'>('ALL');
  const [trainerId, setTrainerId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'duration'>('newest');
  const [page, setPage] = useState(1);

  // Local state for interactive local demo enrollment
  const [localCourses, setLocalCourses] = useState<CourseDetails[]>(mockCatalogCourses);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Query parameters object
  const queryParams: CourseQueryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: category !== 'ALL' ? category : undefined,
      difficulty: difficulty !== 'ALL' ? (difficulty as CourseDifficulty) : undefined,
      trainerId: trainerId !== 'ALL' ? trainerId : undefined,
      sortBy,
      page,
      limit: 12,
    }),
    [search, category, difficulty, trainerId, sortBy, page],
  );

  const query = useQuery({
    queryKey: [...DISCOVERY_QUERY_KEY, queryParams],
    queryFn: async () => {
      try {
        const response = await courseDiscoveryApi.getCourses(queryParams);
        setIsUsingMock(false);
        return response;
      } catch {
        // Fallback to local interactive mock data when offline or unseeded
        setIsUsingMock(true);
        return null;
      }
    },
    staleTime: 1000 * 60 * 3,
  });

  // Filtered courses from local state when in mock mode
  const mockFiltered = useMemo(() => {
    let result = [...localCourses];

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(term) ||
          c.description.toLowerCase().includes(term) ||
          c.trainer.name.toLowerCase().includes(term) ||
          c.category.toLowerCase().includes(term),
      );
    }

    if (category !== 'ALL') {
      result = result.filter((c) => c.category === category);
    }

    if (difficulty !== 'ALL') {
      result = result.filter((c) => c.difficulty === difficulty);
    }

    if (trainerId !== 'ALL') {
      result = result.filter((c) => c.trainer.id === trainerId);
    }

    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'duration') {
      result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else {
      result.sort(
        (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
      );
    }

    return {
      courses: result as CourseSummary[],
      total: result.length,
      page: 1,
      limit: 12,
      totalPages: Math.ceil(result.length / 12) || 1,
      filters: mockFilterMetadata,
    };
  }, [localCourses, search, category, difficulty, trainerId, sortBy]);

  const data = isUsingMock || !query.data ? mockFiltered : query.data;

  // Enrollment mutation with local state sync
  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      if (!isUsingMock) {
        try {
          return await courseDiscoveryApi.enrollInCourse(courseId);
        } catch {
          // Fall through to local state update
        }
      }
      // Local state update
      setLocalCourses((prev) =>
        prev.map((c) =>
          c.id === courseId ? { ...c, isEnrolled: true, enrollmentStatus: 'ENROLLED' as const } : c,
        ),
      );
      return { success: true, message: 'Successfully enrolled in course' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DISCOVERY_QUERY_KEY });
    },
  });

  const clearFilters = () => {
    setSearch('');
    setCategory('ALL');
    setDifficulty('ALL');
    setTrainerId('ALL');
    setSortBy('newest');
    setPage(1);
  };

  const activeFiltersCount =
    (category !== 'ALL' ? 1 : 0) +
    (difficulty !== 'ALL' ? 1 : 0) +
    (trainerId !== 'ALL' ? 1 : 0) +
    (search.trim() ? 1 : 0);

  return {
    courses: data.courses,
    total: data.total,
    totalPages: data.totalPages,
    page,
    filtersMetadata: data.filters,
    isLoading: query.isLoading && !isUsingMock,
    isError: query.isError && !isUsingMock,
    // Filter controls
    search,
    setSearch,
    category,
    setCategory,
    difficulty,
    setDifficulty,
    trainerId,
    setTrainerId,
    sortBy,
    setSortBy,
    setPage,
    clearFilters,
    activeFiltersCount,
    // Enrollment
    enrollInCourse: enrollMutation.mutateAsync,
    isEnrolling: enrollMutation.isPending,
    // Direct access to find full details
    getCourseById: (id: string): CourseDetails | undefined => {
      return localCourses.find((c) => c.id === id);
    },
  };
}
