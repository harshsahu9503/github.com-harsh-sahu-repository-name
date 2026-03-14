export interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  description: string;
  quiz: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  lessons: Lesson[];
}

export interface UserProgress {
  enrolledCourses: string[];
  completedLessons: string[];
  xp: number;
  badges: Badge[];
  studyTime: { day: string; minutes: number }[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: string;
}
