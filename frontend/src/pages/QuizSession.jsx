import { useState } from 'react';

export default function QuizSession({ course, onComplete, onBack }) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    // Utilise les quiz personnalisés du cours, ou génère des questions dynamiques par défaut si vide
    const courseTitle = course?.title || 'this course';
    const questions = course?.quizzes && course.quizzes.length > 0
        ? course.quizzes
        : [
            {
                id: 'default-1',
                question: `What is the primary objective and core focus of ${courseTitle}?`,
                options: [
                    `Mastering the foundational and advanced concepts of ${courseTitle}`,
                    "Configuring local operating system drivers",
                    "Managing physical network hardware routers",
                    "None of the above"
                ],
                correct: 0
            },
            {
                id: 'default-2',
                question: `Which architectural approach is best applied when developing projects in ${courseTitle}?`,
                options: [
                    "Static manual text file editing",
                    "Modular component and reactive state architecture",
                    "Monolithic legacy processing",
                    "Unstructured shell scripting"
                ],
                correct: 1
            }
        ];

    const handleOptionSelect = (optionIndex) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestion]: optionIndex
        });
    };

    const handleSubmit = () => {
        let calculatedScore = 0;
        questions.forEach((q, index) => {
            if (selectedAnswers[index] === q.correct) {
                calculatedScore += 1;
            }
        });
        setScore(calculatedScore);
        setSubmitted(true);

        if (typeof onComplete === 'function') {
            onComplete(calculatedScore, questions.length);
        }
    };

    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= 50; // Réussite à 50% ou plus

    return (
        <section className="student-page" style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
            {onBack && (
                <button type="button" onClick={onBack} style={{ marginBottom: '20px' }}>
                    ← Back to Course
                </button>
            )}

            <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                <h2>📝 Knowledge Check Quiz</h2>
                <p style={{ color: '#6b7280', marginBottom: '20px' }}>Course: <strong>{courseTitle}</strong></p>

                {!submitted ? (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color: '#4f46e5', fontWeight: 'bold' }}>
                            <span>Question {currentQuestion + 1} of {questions.length}</span>
                            <span>Progress: {Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                        </div>

                        <h3 style={{ fontSize: '1.2em', marginBottom: '20px', color: '#1f2937' }}>
                            {questions[currentQuestion].question}
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                            {questions[currentQuestion].options.map((option, index) => (
                                <label
                                    key={index}
                                    style={{
                                        padding: '12px 16px',
                                        border: selectedAnswers[currentQuestion] === index ? '2px solid #4f46e5' : '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: selectedAnswers[currentQuestion] === index ? '#eef2ff' : '#fff',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestion}`}
                                        checked={selectedAnswers[currentQuestion] === index}
                                        onChange={() => handleOptionSelect(index)}
                                        style={{ marginRight: '12px' }}
                                    />
                                    {option}
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                type="button"
                                disabled={currentQuestion === 0}
                                onClick={() => setCurrentQuestion(prev => prev - 1)}
                                style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: '6px', cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer' }}
                            >
                                Previous
                            </button>

                            {currentQuestion < questions.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentQuestion(prev => prev + 1)}
                                    style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={selectedAnswers[currentQuestion] === undefined}
                                    style={{ padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    Submit Quiz
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <h3 style={{ fontSize: '1.5em', marginBottom: '10px' }}>Quiz Results</h3>
                        <p style={{ fontSize: '1.2em', margin: '15px 0' }}>
                            You scored <strong>{score}</strong> out of <strong>{questions.length}</strong> ({percentage}%)
                        </p>

                        {isPassed ? (
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '15px', borderRadius: '8px', color: '#166534', margin: '20px 0' }}>
                                🎉 <strong>Congratulations!</strong> You passed the assessment successfully.
                            </div>
                        ) : (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '8px', color: '#991b1b', margin: '20px 0' }}>
                                ❌ <strong>Keep trying!</strong> Review the course material and retake the quiz to improve your score.
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setSubmitted(false);
                                setCurrentQuestion(0);
                                setSelectedAnswers({});
                            }}
                            style={{ marginTop: '15px', padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            Retake Quiz
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}