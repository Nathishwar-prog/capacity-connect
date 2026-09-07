import { Router } from 'express';
import { healthRouter } from './health.routes';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { dashboardRouter } from './dashboard.routes';
import { courseRouter } from './course.routes';
import { enrollmentRouter } from './enrollment.routes';
import resourceRouter from './resource.routes';
import trainerMonitoringRouter from './trainer-monitoring.routes';
import assessmentRouter from './assessment.routes';

const router = Router();

// API index catalog
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Capacity Connect REST API Gateway v1',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout',
        me: 'GET /api/v1/auth/me',
        onboardingMeta: 'GET /api/v1/auth/onboarding-meta',
        onboarding: 'POST /api/v1/auth/onboarding',
      },
      users: {
        list: 'GET /api/v1/users',
        create: 'POST /api/v1/users',
        me: 'GET /api/v1/users/me',
        updateMe: 'PATCH /api/v1/users/me',
        getById: 'GET /api/v1/users/:id',
        updateById: 'PATCH /api/v1/users/:id',
        deleteById: 'DELETE /api/v1/users/:id',
      },
      dashboard: {
        trainee: 'GET /api/v1/dashboard/trainee',
        trainer: 'GET /api/v1/dashboard/trainer',
        admin: 'GET /api/v1/dashboard/admin',
      },
      courses: {
        list: 'GET /api/v1/courses',
        create: 'POST /api/v1/courses',
        getById: 'GET /api/v1/courses/:id',
        updateById: 'PATCH /api/v1/courses/:id',
        archiveById: 'DELETE /api/v1/courses/:id',
        submit: 'POST /api/v1/courses/:id/submit',
        approve: 'POST /api/v1/courses/:id/approve',
        reject: 'POST /api/v1/courses/:id/reject',
        publish: 'POST /api/v1/courses/:id/publish'
      },
      enrollments: {
        enroll: 'POST /api/v1/enrollments',
        myEnrollments: 'GET /api/v1/enrollments',
        getById: 'GET /api/v1/enrollments/:id',
        updateProgress: 'POST /api/v1/enrollments/:id/lessons/:lessonId/progress',
        drop: 'POST /api/v1/enrollments/:id/drop'
      },
      resources: {
        list: 'GET /api/v1/resources',
        createLink: 'POST /api/v1/resources/link',
        uploadFile: 'POST /api/v1/resources/upload',
        getById: 'GET /api/v1/resources/:id',
        updateMetadata: 'PATCH /api/v1/resources/:id',
        delete: 'DELETE /api/v1/resources/:id',
        approve: 'PATCH /api/v1/resources/:id/approve',
        reject: 'PATCH /api/v1/resources/:id/reject',
        publish: 'PATCH /api/v1/resources/:id/publish',
        attachToCourse: 'POST /api/v1/resources/courses/:courseId/attach/:resourceId',
        detachFromCourse: 'DELETE /api/v1/resources/courses/:courseId/detach/:resourceId',
        attachToLesson: 'POST /api/v1/resources/lessons/:lessonId/attach/:resourceId',
        detachFromLesson: 'DELETE /api/v1/resources/lessons/:lessonId/detach/:resourceId',
      },
      trainerMonitoring: {
        overview: 'GET /api/v1/trainer/monitoring/overview',
        trainees: 'GET /api/v1/trainer/monitoring/trainees',
        courseMonitoring: 'GET /api/v1/trainer/monitoring/courses/:courseId',
        traineeCourseDetail: 'GET /api/v1/trainer/monitoring/courses/:courseId/trainees/:traineeId',
        assessments: 'GET /api/v1/trainer/monitoring/assessments',
      },
      assessments: {
        list: 'GET /api/v1/assessments',
        create: 'POST /api/v1/assessments',
        getById: 'GET /api/v1/assessments/:id',
        updateById: 'PATCH /api/v1/assessments/:id',
        deleteById: 'DELETE /api/v1/assessments/:id',
        addQuestion: 'POST /api/v1/assessments/:assessmentId/questions',
        updateQuestion: 'PATCH /api/v1/assessments/:assessmentId/questions/:questionId',
        deleteQuestion: 'DELETE /api/v1/assessments/:assessmentId/questions/:questionId',
        startAttempt: 'POST /api/v1/assessments/:assessmentId/attempts',
        getAttempt: 'GET /api/v1/assessments/:assessmentId/attempts/:attemptId',
        submitAttempt: 'POST /api/v1/assessments/:assessmentId/attempts/:attemptId/submit',
        getResult: 'GET /api/v1/assessments/:assessmentId/attempts/:attemptId/result',
      },
    },
  });
});

// System health check
router.use('/health', healthRouter);

// Domain routers
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/dashboard', dashboardRouter);
router.use('/courses', courseRouter);
router.use('/enrollments', enrollmentRouter);
router.use('/resources', resourceRouter);
router.use('/trainer/monitoring', trainerMonitoringRouter);
router.use('/assessments', assessmentRouter);

export default router;
