/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  MessageCircle, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Send,
  Sparkles,
  Award,
  Clock,
  Menu,
  BrainCircuit,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from './lib/utils';
import coursesData from './courses.json';
import { Course, Lesson, UserProgress, Badge } from './types';
import { summarizeLesson, getTutorResponse } from './services/geminiService';

const COURSES = coursesData as Course[];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses'>('dashboard');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('eduflow_progress');
    if (saved) return JSON.parse(saved);
    return {
      enrolledCourses: [],
      completedLessons: [],
      xp: 0,
      badges: [],
      studyTime: [
        { day: 'Mon', minutes: 45 },
        { day: 'Tue', minutes: 30 },
        { day: 'Wed', minutes: 60 },
        { day: 'Thu', minutes: 20 },
        { day: 'Fri', minutes: 90 },
        { day: 'Sat', minutes: 120 },
        { day: 'Sun', minutes: 0 },
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem('eduflow_progress', JSON.stringify(progress));
  }, [progress]);

  const handleEnroll = (courseId: string) => {
    if (!progress.enrolledCourses.includes(courseId)) {
      setProgress(prev => ({
        ...prev,
        enrolledCourses: [...prev.enrolledCourses, courseId]
      }));
    }
    const course = COURSES.find(c => c.id === courseId);
    if (course) {
      setSelectedCourse(course);
      setSelectedLesson(course.lessons[0]);
      setActiveTab('courses');
    }
  };

  const handleCompleteLesson = (lessonId: string) => {
    if (!progress.completedLessons.includes(lessonId)) {
      setProgress(prev => {
        const newCompleted = [...prev.completedLessons, lessonId];
        const newXp = prev.xp + 100;
        const newBadges = [...prev.badges];
        
        if (newCompleted.length === 1 && !newBadges.find(b => b.id === 'first-step')) {
          newBadges.push({ id: 'first-step', name: 'First Step', icon: 'Award', unlockedAt: new Date().toISOString() });
        }
        
        return {
          ...prev,
          completedLessons: newCompleted,
          xp: newXp,
          badges: newBadges
        };
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col gap-8 z-40 transition-transform duration-500",
        isZenMode && "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-2xl">
          <BrainCircuit className="w-8 h-8" />
          <span>EduFlow</span>
        </div>

        <nav className="flex flex-col gap-2">
          <SidebarItem 
            icon={<LayoutDashboard className="w-5 h-5" />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setSelectedCourse(null); }}
          />
          <SidebarItem 
            icon={<BookOpen className="w-5 h-5" />} 
            label="My Courses" 
            active={activeTab === 'courses'} 
            onClick={() => setActiveTab('courses')}
          />
          <SidebarItem 
            icon={<Trophy className="w-5 h-5" />} 
            label="Achievements" 
            active={false} 
            onClick={() => {}}
          />
        </nav>

        <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Your Stats</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{progress.xp} XP</div>
          <div className="text-xs text-blue-600 mt-1">Level 4 Learner</div>
          <div className="w-full bg-blue-200 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full w-3/4 rounded-full" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500 min-h-screen",
        !isZenMode && "lg:ml-64",
        "p-4 lg:p-8"
      )}>
        {/* Header */}
        <header className={cn(
          "flex items-center justify-between mb-8 transition-all duration-500",
          isZenMode && "opacity-0 -translate-y-4 pointer-events-none mb-0 h-0"
        )}>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              {activeTab === 'dashboard' ? 'Welcome back, Student!' : selectedCourse ? selectedCourse.title : 'Explore Courses'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' ? "You're on a 5-day learning streak! Keep it up." : "Continue your learning journey."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors relative">
              <Clock className="w-5 h-5 text-slate-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">
              HS
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <DashboardView 
              progress={progress} 
              onContinueCourse={(courseId) => handleEnroll(courseId)} 
            />
          ) : selectedCourse ? (
            <CourseView 
              course={selectedCourse} 
              selectedLesson={selectedLesson}
              setSelectedLesson={setSelectedLesson}
              completedLessons={progress.completedLessons}
              onCompleteLesson={handleCompleteLesson}
              onBack={() => setSelectedCourse(null)}
              isZenMode={isZenMode}
              setIsZenMode={setIsZenMode}
            />
          ) : (
            <CoursesListView 
              enrolledCourses={progress.enrolledCourses}
              onEnroll={handleEnroll}
            />
          )}
        </AnimatePresence>
      </main>

      {/* AI Study Buddy Floating Button */}
      {!isZenMode && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-[#3B82F6] text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:scale-110 transition-transform z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* AI Study Buddy Modal */}
      <AnimatePresence>
        {isChatOpen && (
          <ChatModal 
            onClose={() => setIsChatOpen(false)} 
            currentLesson={selectedLesson}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-blue-50 text-blue-600 font-semibold" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
      )}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function DashboardView({ progress, onContinueCourse }: { progress: UserProgress, onContinueCourse: (id: string) => void }) {
  const enrolledCourses = COURSES.filter(c => progress.enrolledCourses.includes(c.id));
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Left Column: Stats & Progress */}
      <div className="lg:col-span-2 space-y-8">
        {/* Study Time Chart */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Weekly Study Time</h2>
            <select className="bg-slate-50 border-none text-sm font-medium text-slate-600 rounded-lg px-3 py-1 outline-none">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progress.studyTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {progress.studyTime.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 60 ? '#3B82F6' : '#93C5FD'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* In Progress Courses */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">In Progress</h2>
            <button className="text-sm font-semibold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.length > 0 ? enrolledCourses.map(course => (
              <div key={course.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex gap-4 group cursor-pointer hover:border-blue-200 transition-colors" onClick={() => onContinueCourse(course.id)}>
                <img src={course.thumbnail} alt={course.title} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{course.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">12 lessons • 4h 20m</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      <span>Progress</span>
                      <span>45%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[45%] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-2 p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="font-bold text-slate-900">No courses started yet</h3>
                <p className="text-slate-500 text-sm mt-1">Explore our catalog to start your learning journey.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Right Column: Badges & Activity */}
      <div className="space-y-8">
        {/* Badges */}
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Completed Badges</h2>
          <div className="grid grid-cols-3 gap-4">
            {progress.badges.length > 0 ? progress.badges.map(badge => (
              <div key={badge.id} className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-100 flex items-center justify-center text-yellow-600 shadow-inner">
                  <Award className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-tighter">{badge.name}</span>
              </div>
            )) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-slate-400 text-sm italic">Complete your first lesson to earn a badge!</p>
              </div>
            )}
            {/* Locked Badges */}
            <div className="flex flex-col items-center gap-2 opacity-30 grayscale">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                <Award className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-bold text-slate-600 text-center uppercase tracking-tighter">Fast Learner</span>
            </div>
          </div>
        </section>

        {/* Daily Motivation */}
        <section className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Ready for a challenge?</h3>
            <p className="text-blue-100 text-sm mb-4">Complete 2 lessons today to earn a 2x XP boost!</p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
              Start Learning
            </button>
          </div>
          <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 rotate-12" />
        </section>
      </div>
    </motion.div>
  );
}

function CoursesListView({ enrolledCourses, onEnroll }: { enrolledCourses: string[], onEnroll: (id: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {COURSES.map(course => (
        <div key={course.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
          <div className="relative h-48 overflow-hidden">
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider">
              {course.lessons.length} Lessons
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{course.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-6">{course.description}</p>
            <button 
              onClick={() => onEnroll(course.id)}
              className={cn(
                "w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                enrolledCourses.includes(course.id)
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
              )}
            >
              {enrolledCourses.includes(course.id) ? 'Continue Learning' : 'Enroll Now'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function CourseView({ 
  course, 
  selectedLesson, 
  setSelectedLesson, 
  completedLessons, 
  onCompleteLesson,
  onBack,
  isZenMode,
  setIsZenMode
}: { 
  course: Course, 
  selectedLesson: Lesson | null, 
  setSelectedLesson: (l: Lesson) => void,
  completedLessons: string[],
  onCompleteLesson: (id: string) => void,
  onBack: () => void,
  isZenMode: boolean,
  setIsZenMode: (v: boolean) => void
}) {
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [quizState, setQuizState] = useState<'idle' | 'active' | 'result'>('idle');
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isCourseComplete = useMemo(() => {
    return course.lessons.every(l => completedLessons.includes(l.id));
  }, [course, completedLessons]);

  useEffect(() => {
    if (selectedLesson) {
      handleSummarize();
      setQuizState('idle');
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setSelectedOption(null);
    }
  }, [selectedLesson]);

  const handleSummarize = async () => {
    if (!selectedLesson) return;
    setIsSummarizing(true);
    const result = await summarizeLesson(selectedLesson.description);
    setSummary(result);
    setIsSummarizing(false);
  };

  const handleQuizAnswer = () => {
    if (selectedOption === null || !selectedLesson) return;
    
    const isCorrect = selectedOption === selectedLesson.quiz[currentQuestionIndex].correctAnswer;
    if (isCorrect) setQuizScore(prev => prev + 1);

    if (currentQuestionIndex < selectedLesson.quiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizState('result');
      if (isCorrect && quizScore + 1 === selectedLesson.quiz.length) {
        onCompleteLesson(selectedLesson.id);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-8"
    >
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition-colors w-fit">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsZenMode(!isZenMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              isZenMode 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {isZenMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {isZenMode ? 'Exit Zen Mode' : 'Zen Mode'}
          </button>

          {isCourseComplete && (
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">
              <Download className="w-4 h-4" />
              Claim Certificate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Video Player & Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {selectedLesson ? (
              <iframe 
                src={selectedLesson.videoUrl} 
                className="w-full h-full" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                Select a lesson to start
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{selectedLesson?.title}</h2>
              {completedLessons.includes(selectedLesson?.id || '') && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed mb-8">{selectedLesson?.description}</p>

            {/* Adaptive Quiz Module */}
            <div className="border-t border-slate-100 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                Adaptive Quiz
              </h3>
              
              {quizState === 'idle' ? (
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-blue-900">Test your knowledge</h4>
                    <p className="text-blue-600 text-sm">3 questions to master this lesson.</p>
                  </div>
                  <button 
                    onClick={() => setQuizState('active')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Start Quiz
                  </button>
                </div>
              ) : quizState === 'active' && selectedLesson ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-400 uppercase tracking-widest">
                    <span>Question {currentQuestionIndex + 1} of {selectedLesson.quiz.length}</span>
                    <span>{Math.round(((currentQuestionIndex) / selectedLesson.quiz.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300" 
                      style={{ width: `${((currentQuestionIndex) / selectedLesson.quiz.length) * 100}%` }} 
                    />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedLesson.quiz[currentQuestionIndex].question}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedLesson.quiz[currentQuestionIndex].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all font-medium",
                          selectedOption === idx 
                            ? "border-blue-500 bg-blue-50 text-blue-700" 
                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleQuizAnswer}
                    disabled={selectedOption === null}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next Question
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-3xl border border-slate-200">
                  <div className={cn(
                    "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4",
                    quizScore === selectedLesson?.quiz.length ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                  )}>
                    {quizScore === selectedLesson?.quiz.length ? <CheckCircle2 className="w-10 h-10" /> : <X className="w-10 h-10" />}
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900">
                    {quizScore === selectedLesson?.quiz.length ? 'Perfect Score!' : 'Keep Practicing!'}
                  </h4>
                  <p className="text-slate-500 mb-6">You got {quizScore} out of {selectedLesson?.quiz.length} correct.</p>
                  
                  {quizScore < (selectedLesson?.quiz.length || 0) && (
                    <div className="max-w-md mx-auto mb-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-800 text-sm">
                      <p className="font-bold mb-1">Remedial Micro-lesson:</p>
                      Focus on the core definitions again. Try re-watching the first 2 minutes of the video!
                    </div>
                  )}

                  <button 
                    onClick={() => { setQuizState('idle'); setCurrentQuestionIndex(0); setQuizScore(0); setSelectedOption(null); }}
                    className="bg-white border border-slate-200 px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Retake Quiz
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Smart Notes & Lesson List */}
        <div className="space-y-8">
          {/* Smart Note-taker */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                Smart Notes
              </h3>
              <button onClick={handleSummarize} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[150px]">
              {isSummarizing ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-medium">Gemini is thinking...</span>
                </div>
              ) : (
                <div className="text-sm text-slate-600 prose prose-slate">
                  {summary.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Lesson List */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Course Content</h3>
            <div className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={cn(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left",
                    selectedLesson?.id === lesson.id 
                      ? "bg-blue-50 border border-blue-100" 
                      : "hover:bg-slate-50 border border-transparent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                    completedLessons.includes(lesson.id)
                      ? "bg-emerald-100 text-emerald-600"
                      : selectedLesson?.id === lesson.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {completedLessons.includes(lesson.id) ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn(
                      "text-sm font-bold truncate",
                      selectedLesson?.id === lesson.id ? "text-blue-900" : "text-slate-700"
                    )}>
                      {lesson.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">15:00 • Video</p>
                  </div>
                  {selectedLesson?.id === lesson.id && <Play className="w-4 h-4 text-blue-600 fill-blue-600" />}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}

function ChatModal({ onClose, currentLesson }: { onClose: () => void, currentLesson: Lesson | null }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hi there! I'm your EduFlow Study Buddy. Need a hint with the current lesson or have a question about the material?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const response = await getTutorResponse(
      userMessage, 
      currentLesson ? `Lesson: ${currentLesson.title}. Description: ${currentLesson.description}` : "No specific lesson context.",
      messages
    );

    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 w-[380px] h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">AI Study Buddy</h3>
            <p className="text-[10px] text-blue-100 font-medium">Always here to help</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "flex",
            msg.role === 'user' ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
