import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Target, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

export default function Results() {
  const { user, profile } = useAuth();
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'simulations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSimulations(sims);
      } catch (error) {
        console.error("Erro ao buscar resultados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (simulations.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sem dados ainda</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Você precisa fazer pelo menos um simulado para ver suas estatísticas de desempenho.
        </p>
        <Link to="/simulados" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 inline-block">
          Fazer Primeiro Simulado
        </Link>
      </div>
    );
  }

  // Calculate overall stats
  const totalSimulations = simulations.length;
  const totalQuestions = simulations.reduce((acc, sim) => acc + sim.totalQuestions, 0);
  const totalCorrect = simulations.reduce((acc, sim) => acc + sim.score, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  // Calculate subject performance
  const subjectStats: Record<string, { correct: number, total: number }> = {};
  simulations.forEach(sim => {
    if (sim.subjectsPerformance) {
      Object.entries(sim.subjectsPerformance).forEach(([subject, stats]: [string, any]) => {
        if (!subjectStats[subject]) {
          subjectStats[subject] = { correct: 0, total: 0 };
        }
        subjectStats[subject].correct += stats.correct;
        subjectStats[subject].total += stats.total;
      });
    }
  });

  const sortedSubjects = Object.entries(subjectStats)
    .map(([name, stats]) => ({
      name,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      ...stats
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Seu Desempenho</h1>
        <p className="text-slate-500">Acompanhe sua evolução e identifique pontos de melhoria.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Aproveitamento Geral</p>
            <p className="text-3xl font-bold text-slate-900">{overallAccuracy}%</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Questões Resolvidas</p>
            <p className="text-3xl font-bold text-slate-900">{totalQuestions}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Simulados Feitos</p>
            <p className="text-3xl font-bold text-slate-900">{totalSimulations}</p>
          </div>
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" /> Desempenho por Disciplina
        </h2>
        
        <div className="space-y-6">
          {sortedSubjects.map((subject, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-48 font-medium text-slate-700 truncate" title={subject.name}>
                {subject.name}
              </div>
              
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      subject.accuracy >= 80 ? 'bg-emerald-500' : 
                      subject.accuracy >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${subject.accuracy}%` }}
                  />
                </div>
                <div className="w-16 text-right font-bold text-slate-900">
                  {subject.accuracy}%
                </div>
              </div>
              
              <div className="hidden sm:block w-24 text-right text-sm text-slate-500">
                {subject.correct}/{subject.total}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
