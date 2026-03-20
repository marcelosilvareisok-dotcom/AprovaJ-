import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, ChevronRight, Play, Trophy, XCircle, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

const PREVIEW_QUESTIONS = [
  {
    id: 'q1',
    subject: 'Direito Constitucional',
    text: 'Segundo a Constituição Federal de 1988, é correto afirmar sobre os direitos e garantias fundamentais:',
    options: [
      'São absolutos e não podem sofrer qualquer tipo de restrição.',
      'Apenas brasileiros natos possuem direitos fundamentais.',
      'A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito.',
      'O direito de greve é garantido apenas aos trabalhadores da iniciativa privada.'
    ],
    correctOptionIndex: 2,
    explanation: 'O princípio da inafastabilidade da jurisdição (art. 5º, XXXV, CF) garante que a lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito.'
  },
  {
    id: 'q2',
    subject: 'Língua Portuguesa',
    text: 'Assinale a alternativa em que a concordância verbal está CORRETA:',
    options: [
      'Faziam dois anos que ele não estudava.',
      'Houveram muitos problemas na prova.',
      'Devem existir outras formas de resolver a questão.',
      'Aluga-se apartamentos nesta região.'
    ],
    correctOptionIndex: 2,
    explanation: 'O verbo "existir" é pessoal e concorda com o sujeito "outras formas". "Fazer" indicando tempo é impessoal (Faz dois anos). "Haver" no sentido de existir é impessoal (Houve muitos problemas). Com a partícula apassivadora "se", o verbo concorda com o sujeito paciente (Alugam-se apartamentos).'
  },
  {
    id: 'q3',
    subject: 'Raciocínio Lógico',
    text: 'Se todo A é B e nenhum B é C, então:',
    options: [
      'Algum A é C.',
      'Nenhum A é C.',
      'Todo C é A.',
      'Algum C é B.'
    ],
    correctOptionIndex: 1,
    explanation: 'Se todo A está dentro de B, e B não tem intersecção com C, logo, A também não tem intersecção com C. Portanto, nenhum A é C.'
  }
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === PREVIEW_QUESTIONS[currentQuestion].correctOptionIndex) {
      setScore(s => s + 1);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#fbbf24']
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < PREVIEW_QUESTIONS.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  if (user) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
          <Trophy className="w-4 h-4" />
          <span>A plataforma nº 1 para concurseiros</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl mb-6 leading-tight">
          Acelere sua aprovação com <span className="text-indigo-600">simulados inteligentes</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mb-10">
          Treine com questões atualizadas, acompanhe seu desempenho por matéria e suba de nível na sua jornada até a posse.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
            Começar Gratuitamente <ChevronRight className="w-5 h-5" />
          </Link>
          <button 
            onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-white text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" /> Testar Agora
          </button>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className="w-full max-w-3xl py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Simulado Rápido</h2>
              <p className="text-slate-400 text-sm">Teste seus conhecimentos em 3 questões</p>
            </div>
            {!finished && (
              <div className="bg-slate-800 px-4 py-2 rounded-xl font-mono font-bold">
                {currentQuestion + 1} / {PREVIEW_QUESTIONS.length}
              </div>
            )}
          </div>

          <div className="p-6 md:p-8">
            {finished ? (
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-12 h-12" />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-2">Você acertou {score} de {PREVIEW_QUESTIONS.length}!</h3>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Esse é apenas o começo. Crie sua conta gratuita para acessar milhares de questões, simulados completos e estatísticas detalhadas.
                </p>
                <Link to="/login" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 inline-block">
                  Criar Conta Gratuita
                </Link>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {PREVIEW_QUESTIONS[currentQuestion].subject}
                  </span>
                  <h3 className="text-xl font-medium text-slate-900 mt-4 leading-relaxed">
                    {PREVIEW_QUESTIONS[currentQuestion].text}
                  </h3>
                </div>

                <div className="space-y-3">
                  {PREVIEW_QUESTIONS[currentQuestion].options.map((option, index) => {
                    const isSelected = selectedOption === index;
                    const isCorrect = index === PREVIEW_QUESTIONS[currentQuestion].correctOptionIndex;
                    const showCorrect = showExplanation && isCorrect;
                    const showWrong = showExplanation && isSelected && !isCorrect;

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={showExplanation}
                        className={cn(
                          "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3",
                          !showExplanation && "border-slate-200 hover:border-indigo-600 hover:bg-indigo-50",
                          showCorrect && "border-emerald-500 bg-emerald-50",
                          showWrong && "border-red-500 bg-red-50",
                          showExplanation && !isSelected && !isCorrect && "border-slate-100 opacity-50"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5",
                          !showExplanation && "border-slate-300",
                          showCorrect && "border-emerald-500 bg-emerald-500 text-white",
                          showWrong && "border-red-500 bg-red-500 text-white",
                          showExplanation && !isSelected && !isCorrect && "border-slate-200"
                        )}>
                          {showCorrect && <CheckCircle2 className="w-4 h-4" />}
                          {showWrong && <XCircle className="w-4 h-4" />}
                        </div>
                        <span className={cn(
                          "text-slate-700 font-medium",
                          showCorrect && "text-emerald-900",
                          showWrong && "text-red-900"
                        )}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {showExplanation && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" /> 
                      Comentário do Professor
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      {PREVIEW_QUESTIONS[currentQuestion].explanation}
                    </p>
                    <button
                      onClick={handleNext}
                      className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                      {currentQuestion < PREVIEW_QUESTIONS.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
