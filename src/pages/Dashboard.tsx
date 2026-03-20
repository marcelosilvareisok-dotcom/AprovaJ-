import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router';
import { BookOpen, Trophy, Target, TrendingUp, Clock, AlertCircle, Briefcase } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRENDING_EXAMS = [
  { name: 'INSS', vagas: '9.229 vagas previstas', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-900', sub: 'text-blue-700' },
  { name: 'Caixa Econômica', vagas: '4.000 vagas', bg: 'bg-sky-50', border: 'border-sky-100', text: 'text-sky-900', sub: 'text-sky-700' },
  { name: 'Polícia Federal', vagas: '2.599 solicitadas', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-900', sub: 'text-slate-700' },
  { name: 'Receita Federal', vagas: 'Auditor e Analista', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-900', sub: 'text-emerald-700' },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [recentSimulations, setRecentSimulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'simulations'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentSimulations(sims);
      } catch (error) {
        console.error("Erro ao buscar simulados:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  if (!profile) return null;

  const xpToNextLevel = profile.level * 1000;
  const progressPercentage = Math.min(100, Math.max(0, (profile.xp / xpToNextLevel) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome & Gamification */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            Olá, {profile.displayName?.split(' ')[0] || 'Concurseiro'}! 👋
          </h1>
          <p className="text-slate-500">Pronto para mais um dia de estudos rumo à aprovação?</p>
        </div>
        
        <div className="w-full md:w-auto flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-indigo-200 flex-shrink-0 relative">
            <Trophy className="w-8 h-8 text-indigo-600" />
            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
              Lvl {profile.level}
            </div>
          </div>
          <div className="flex-1 min-w-[150px]">
            <div className="flex justify-between text-sm font-medium mb-1">
              <span className="text-slate-700">Progresso</span>
              <span className="text-indigo-600">{profile.xp} / {xpToNextLevel} XP</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/simulados" className="bg-indigo-600 text-white p-6 rounded-3xl hover:bg-indigo-700 transition-colors group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
          <BookOpen className="w-8 h-8 mb-4 text-indigo-200" />
          <h3 className="text-xl font-bold mb-1">Novo Simulado</h3>
          <p className="text-indigo-200 text-sm">Gere um simulado personalizado</p>
        </Link>
        
        <Link to="/desempenho" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <Target className="w-8 h-8 mb-4 text-emerald-500" />
          <h3 className="text-xl font-bold text-slate-900 mb-1">Desempenho</h3>
          <p className="text-slate-500 text-sm">Análise detalhada por matéria</p>
        </Link>
        
        <Link to="/planos" className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group">
          <TrendingUp className="w-8 h-8 mb-4 text-amber-500" />
          <h3 className="text-xl font-bold text-slate-900 mb-1">Meu Plano</h3>
          <p className="text-slate-500 text-sm">
            {profile.plan === 'free' ? 'Faça upgrade para Premium' : `Plano ${profile.plan.toUpperCase()} ativo`}
          </p>
        </Link>
      </div>

      {/* Trending Exams */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" /> Concursos em Alta (Atualizados)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {TRENDING_EXAMS.map((exam, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${exam.bg} ${exam.border} hover:shadow-md transition-all cursor-pointer`}>
              <h4 className={`font-bold ${exam.text} mb-1`}>{exam.name}</h4>
              <p className={`text-xs font-medium ${exam.sub}`}>{exam.vagas}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Últimos Simulados
          </h2>
          <Link to="/desempenho" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : recentSimulations.length > 0 ? (
          <div className="space-y-3">
            {recentSimulations.map((sim) => (
              <div key={sim.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    {Math.round((sim.score / sim.totalQuestions) * 100)}%
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Simulado Geral</h4>
                    <p className="text-xs text-slate-500">
                      {sim.createdAt?.toDate ? format(sim.createdAt.toDate(), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'Data desconhecida'}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900">{sim.score} / {sim.totalQuestions} acertos</p>
                  <p className="text-xs text-slate-500">{Math.floor(sim.timeSpentSeconds / 60)}m {sim.timeSpentSeconds % 60}s</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum simulado ainda</h3>
            <p className="text-slate-500 mb-4">Faça seu primeiro simulado para ver seu histórico aqui.</p>
            <Link to="/simulados" className="inline-flex items-center justify-center bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors">
              Começar Agora
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
