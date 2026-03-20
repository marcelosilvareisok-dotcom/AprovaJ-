import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Star, Zap, ShieldCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';

const PLANS = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para conhecer a plataforma e testar seus conhecimentos.',
    features: [
      'Simulados com até 5 questões',
      'Acesso a 3 disciplinas básicas',
      'Correção automática simples',
      'Estatísticas básicas'
    ],
    icon: <ShieldCheck className="w-6 h-6 text-slate-500" />,
    color: 'slate'
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 'R$ 29,90',
    period: '/mês',
    description: 'Para quem está começando a estudar a sério para concursos.',
    features: [
      'Simulados com até 30 questões',
      'Acesso a todas as disciplinas',
      'Gabarito comentado por professores',
      'Estatísticas detalhadas por matéria',
      'Histórico completo de simulados'
    ],
    icon: <Zap className="w-6 h-6 text-indigo-500" />,
    color: 'indigo',
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 59,90',
    period: '/mês',
    description: 'A preparação completa para garantir sua aprovação mais rápido.',
    features: [
      'Simulados ilimitados e personalizados',
      'Acesso a todas as disciplinas e bancas',
      'Gabarito em vídeo e texto',
      'Análise de desempenho com IA',
      'Plano de estudos gerado automaticamente',
      'Simulados inéditos toda semana'
    ],
    icon: <Star className="w-6 h-6 text-amber-500" />,
    color: 'amber'
  }
];

export default function Plans() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!user || planId === profile?.plan) return;
    
    setLoading(planId);
    try {
      // In a real app, this would redirect to a payment gateway (Stripe, etc.)
      // For this MVP, we just update the user document directly
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { plan: planId });
      
      // Force reload to update context (in a real app, context would listen to changes)
      window.location.reload();
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      alert("Erro ao atualizar plano. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Escolha o plano ideal para a sua aprovação
        </h1>
        <p className="text-lg text-slate-500">
          Desbloqueie todo o potencial da plataforma e acelere seus estudos com recursos exclusivos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {PLANS.map((plan) => {
          const isCurrentPlan = profile?.plan === plan.id;
          const isPopular = plan.popular;

          return (
            <div 
              key={plan.id}
              className={cn(
                "relative bg-white rounded-3xl p-8 border-2 transition-all flex flex-col h-full",
                isPopular ? "border-indigo-600 shadow-xl shadow-indigo-100 md:-mt-4 md:mb-4" : "border-slate-100 shadow-sm hover:border-slate-300",
                isCurrentPlan && !isPopular && "border-slate-400"
              )}
            >
              {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                  Mais Escolhido
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  `bg-${plan.color}-50`
                )}>
                  {plan.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                <span className="text-slate-500 font-medium">{plan.period}</span>
              </div>

              <p className="text-slate-600 mb-8 min-h-[48px]">
                {plan.description}
              </p>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className={cn(
                      "w-5 h-5 flex-shrink-0 mt-0.5",
                      isPopular ? "text-indigo-600" : "text-slate-400"
                    )} />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || loading !== null}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg transition-all flex justify-center items-center gap-2",
                  isCurrentPlan ? "bg-slate-100 text-slate-500 cursor-not-allowed" :
                  isPopular ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200" :
                  "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
                )}
              >
                {loading === plan.id ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isCurrentPlan ? (
                  'Plano Atual'
                ) : (
                  'Assinar Agora'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
