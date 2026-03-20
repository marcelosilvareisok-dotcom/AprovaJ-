import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Play, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import confetti from 'canvas-confetti';

const MOCK_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Direito Constitucional',
    text: 'A Constituição Federal de 1988 estabelece que a República Federativa do Brasil constitui-se em Estado Democrático de Direito e tem como fundamentos:',
    options: [
      'A soberania, a cidadania e a dignidade da pessoa humana.',
      'A construção de uma sociedade livre, justa e solidária.',
      'A garantia do desenvolvimento nacional e a erradicação da pobreza.',
      'A independência nacional e a prevalência dos direitos humanos.'
    ],
    correctOptionIndex: 0,
    explanation: 'O art. 1º da CF/88 elenca os fundamentos da República: soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa, e pluralismo político (SOCIDIVAPLU).'
  },
  {
    id: 'q2',
    subject: 'Direito Administrativo',
    text: 'Sobre os princípios da Administração Pública expressos na Constituição Federal (Art. 37), assinale a alternativa correta:',
    options: [
      'Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.',
      'Razoabilidade, Proporcionalidade, Motivação e Ampla Defesa.',
      'Supremacia do Interesse Público e Indisponibilidade.',
      'Continuidade do Serviço Público e Autotutela.'
    ],
    correctOptionIndex: 0,
    explanation: 'O art. 37, caput, da CF/88 estabelece os princípios expressos da Administração Pública, conhecidos pelo mnemônico LIMPE: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.'
  },
  {
    id: 'q3',
    subject: 'Língua Portuguesa',
    text: 'Assinale a alternativa em que o uso da crase está INCORRETO:',
    options: [
      'Fui à feira comprar maçãs.',
      'Ele se referiu àquela mulher.',
      'Entreguei o documento à Vossa Excelência.',
      'Chegamos às duas horas da tarde.'
    ],
    correctOptionIndex: 2,
    explanation: 'Não se usa crase antes de pronomes de tratamento (com exceção de senhora, senhorita e dona), pois eles não admitem o artigo feminino "a".'
  },
  {
    id: 'q4',
    subject: 'Informática',
    text: 'Qual atalho de teclado é comumente utilizado para desfazer a última ação no Windows?',
    options: [
      'Ctrl + C',
      'Ctrl + V',
      'Ctrl + Z',
      'Ctrl + Y'
    ],
    correctOptionIndex: 2,
    explanation: 'Ctrl + Z é o atalho padrão universal para a função "Desfazer".'
  },
  {
    id: 'q5',
    subject: 'Raciocínio Lógico',
    text: 'Se a proposição "Se chove, então a rua fica molhada" é verdadeira, qual das seguintes proposições é necessariamente verdadeira?',
    options: [
      'Se a rua está molhada, então choveu.',
      'Se não chove, então a rua não fica molhada.',
      'Se a rua não está molhada, então não choveu.',
      'Chove e a rua não fica molhada.'
    ],
    correctOptionIndex: 2,
    explanation: 'A proposição equivalente à condicional (P -> Q) é a sua contrapositiva (~Q -> ~P). Portanto, "Se a rua não está molhada, então não choveu".'
  }
];

export default function Simulation() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [isStarted, setIsStarted] = useState(false);
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);

  // Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStarted && !isFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, isFinished, timeLeft]);

  const startSimulation = () => {
    // Determine number of questions based on plan
    const numQuestions = profile?.plan === 'free' ? 5 : 10;
    // In a real app, fetch random questions from Firestore here
    setQuestions(MOCK_QUESTIONS.slice(0, numQuestions));
    setTimeLeft(numQuestions * 60 * 2); // 2 minutes per question
    setIsStarted(true);
    setAnswers({});
    setCurrentQuestion(0);
    setIsFinished(false);
    setScore(0);
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsFinished(true);
    setSaving(true);

    let finalScore = 0;
    const subjectsPerf: Record<string, { correct: number, total: number }> = {};

    questions.forEach((q, index) => {
      const isCorrect = answers[index] === q.correctOptionIndex;
      if (isCorrect) finalScore++;

      if (!subjectsPerf[q.subject]) {
        subjectsPerf[q.subject] = { correct: 0, total: 0 };
      }
      subjectsPerf[q.subject].total++;
      if (isCorrect) subjectsPerf[q.subject].correct++;
    });

    setScore(finalScore);

    if (finalScore > questions.length / 2) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#fbbf24']
      });
    }

    try {
      if (user) {
        const timeSpent = (questions.length * 60 * 2) - timeLeft;
        
        // Save simulation result
        await addDoc(collection(db, 'simulations'), {
          userId: user.uid,
          score: finalScore,
          totalQuestions: questions.length,
          timeSpentSeconds: timeSpent,
          subjectsPerformance: subjectsPerf,
          createdAt: serverTimestamp()
        });

        // Update user XP and total simulations
        const xpEarned = finalScore * 10;
        const userRef = doc(db, 'users', user.uid);
        
        // Calculate new level (simple logic: 1 level per 1000 XP)
        const currentXp = profile?.xp || 0;
        const newTotalXp = currentXp + xpEarned;
        const newLevel = Math.floor(newTotalXp / 1000) + 1;

        await updateDoc(userRef, {
          xp: increment(xpEarned),
          totalSimulations: increment(1),
          level: newLevel > (profile?.level || 1) ? newLevel : profile?.level || 1
        });
      }
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Novo Simulado</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Teste seus conhecimentos com questões atualizadas. O tempo é cronometrado para simular o dia da prova.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 text-left">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Questões</p>
            <p className="text-xl font-bold text-slate-900">{profile?.plan === 'free' ? '5' : '10'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Tempo Estimado</p>
            <p className="text-xl font-bold text-slate-900">{profile?.plan === 'free' ? '10' : '20'} min</p>
          </div>
        </div>

        {profile?.plan === 'free' && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3 mb-8 text-left text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Você está no plano <strong>Gratuito</strong> e fará um simulado reduzido (5 questões). 
              Faça o upgrade para acessar simulados completos e todas as disciplinas.
            </p>
          </div>
        )}

        <button
          onClick={startSimulation}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Play className="w-5 h-5" /> Iniciar Simulado Agora
        </button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Simulado Concluído!</h2>
          <p className="text-slate-500 mb-8">Você acertou {score} de {questions.length} questões.</p>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-bold text-lg border border-emerald-200">
              {Math.round((score / questions.length) * 100)}% de Aproveitamento
            </div>
            <div className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-bold text-lg border border-indigo-200">
              +{score * 10} XP
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/desempenho')}
              className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              Ver Estatísticas
            </button>
            <button
              onClick={startSimulation}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
            >
              Fazer Novo Simulado
            </button>
          </div>
        </div>

        {/* Correction Review */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" /> Gabarito Comentado
          </h3>
          
          <div className="space-y-8">
            {questions.map((q, qIndex) => {
              const userAnswer = answers[qIndex];
              const isCorrect = userAnswer === q.correctOptionIndex;

              return (
                <div key={q.id} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      Questão {qIndex + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-500">{q.subject}</span>
                  </div>
                  
                  <p className="text-lg font-medium text-slate-900 mb-4">{q.text}</p>
                  
                  <div className="space-y-2 mb-4">
                    {q.options.map((opt, optIndex) => {
                      const isSelected = userAnswer === optIndex;
                      const isActuallyCorrect = q.correctOptionIndex === optIndex;
                      
                      return (
                        <div key={optIndex} className={cn(
                          "p-4 rounded-xl border flex items-start gap-3",
                          isActuallyCorrect ? "bg-emerald-50 border-emerald-200" : 
                          (isSelected && !isActuallyCorrect) ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"
                        )}>
                          <div className="mt-0.5">
                            {isActuallyCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : 
                             (isSelected ? <XCircle className="w-5 h-5 text-red-600" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300" />)}
                          </div>
                          <span className={cn(
                            "font-medium",
                            isActuallyCorrect ? "text-emerald-900" : 
                            (isSelected ? "text-red-900" : "text-slate-600")
                          )}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-sm font-bold text-indigo-900 mb-1">Comentário:</p>
                    <p className="text-sm text-indigo-800">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mb-6 sticky top-20 z-40">
        <div className="flex items-center gap-4">
          <div className="bg-slate-100 px-4 py-2 rounded-xl font-mono font-bold text-slate-700">
            {currentQuestion + 1} / {questions.length}
          </div>
          <div className="hidden sm:block h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg border-2",
          timeLeft < 60 ? "bg-red-50 text-red-600 border-red-200 animate-pulse" : "bg-slate-50 text-slate-700 border-slate-200"
        )}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4 inline-block">
          {currentQ.subject}
        </span>
        <h2 className="text-xl md:text-2xl font-medium text-slate-900 mb-8 leading-relaxed">
          {currentQ.text}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, index) => {
            const isSelected = answers[currentQuestion] === index;
            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={cn(
                  "w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all flex items-start gap-4 group",
                  isSelected 
                    ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors",
                  isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300 group-hover:border-indigo-400"
                )}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <span className={cn(
                  "font-medium text-lg",
                  isSelected ? "text-indigo-900" : "text-slate-700"
                )}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            if (window.confirm('Tem certeza que deseja desistir do simulado? O progresso será perdido.')) {
              navigate('/dashboard');
            }
          }}
          className="text-slate-500 font-medium hover:text-slate-900 px-4 py-2"
        >
          Desistir
        </button>
        
        <button
          onClick={handleNext}
          disabled={answers[currentQuestion] === undefined || saving}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          {currentQuestion < questions.length - 1 ? (
            <>Próxima <ChevronRight className="w-5 h-5" /></>
          ) : (
            saving ? 'Finalizando...' : 'Finalizar Simulado'
          )}
        </button>
      </div>
    </div>
  );
}
