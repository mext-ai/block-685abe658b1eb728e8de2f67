import React, { useEffect, useState } from 'react';

interface BlockProps {
  title?: string;
  description?: string;
}

interface Bone {
  id: string;
  name: string;
  x: number;
  y: number;
  lineEndX: number;
  lineEndY: number;
  isCorrect?: boolean;
  userAnswer?: string;
}

const bones: Bone[] = [
  { id: 'skull', name: 'Crâne', x: 80, y: 30, lineEndX: 165, lineEndY: 50 },
  { id: 'clavicle', name: 'Clavicule', x: 50, y: 120, lineEndX: 150, lineEndY: 130 },
  { id: 'sternum', name: 'Sternum', x: 280, y: 180, lineEndX: 205, lineEndY: 180 },
  { id: 'ribs', name: 'Côtes', x: 320, y: 200, lineEndX: 250, lineEndY: 200 },
  { id: 'humerus', name: 'Humérus', x: 60, y: 180, lineEndX: 140, lineEndY: 165 },
  { id: 'radius', name: 'Radius', x: 40, y: 260, lineEndX: 125, lineEndY: 240 },
  { id: 'ulna', name: 'Cubitus', x: 30, y: 300, lineEndX: 130, lineEndY: 265 },
  { id: 'spine', name: 'Colonne vertébrale', x: 320, y: 280, lineEndX: 200, lineEndY: 250 },
  { id: 'pelvis', name: 'Bassin', x: 300, y: 350, lineEndX: 200, lineEndY: 340 },
  { id: 'femur', name: 'Fémur', x: 100, y: 420, lineEndX: 175, lineEndY: 420 },
  { id: 'tibia', name: 'Tibia', x: 70, y: 500, lineEndX: 175, lineEndY: 510 },
  { id: 'fibula', name: 'Péroné', x: 90, y: 560, lineEndX: 155, lineEndY: 545 }
];

const Block: React.FC<BlockProps> = ({ title = "Jeu de Reconnaissance des Os", description }) => {
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
  const [availableLabels, setAvailableLabels] = useState<string[]>(
    bones.map(bone => bone.name).sort(() => Math.random() - 0.5)
  );
  const [score, setScore] = useState<number>(0);
  const [results, setResults] = useState<{ [key: string]: boolean }>({});

  // Envoi de l'événement de completion
  useEffect(() => {
    if (gameState === 'finished') {
      window.postMessage({ 
        type: 'BLOCK_COMPLETION', 
        blockId: 'bone-recognition-game', 
        completed: true,
        score: score,
        maxScore: 100
      }, '*');
      window.parent?.postMessage({ 
        type: 'BLOCK_COMPLETION', 
        blockId: 'bone-recognition-game', 
        completed: true,
        score: score,
        maxScore: 100
      }, '*');
    }
  }, [gameState, score]);

  const handleDragStart = (e: React.DragEvent, label: string) => {
    setDraggedLabel(label);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, boneId: string) => {
    e.preventDefault();
    if (draggedLabel) {
      setUserAnswers(prev => ({
        ...prev,
        [boneId]: draggedLabel
      }));
      setAvailableLabels(prev => prev.filter(label => label !== draggedLabel));
      setDraggedLabel(null);
    }
  };

  const removeAnswer = (boneId: string) => {
    const removedLabel = userAnswers[boneId];
    if (removedLabel) {
      setAvailableLabels(prev => [...prev, removedLabel].sort());
      setUserAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[boneId];
        return newAnswers;
      });
    }
  };

  const checkAnswers = () => {
    const newResults: { [key: string]: boolean } = {};
    let correctCount = 0;

    bones.forEach(bone => {
      const userAnswer = userAnswers[bone.id];
      const isCorrect = userAnswer === bone.name;
      newResults[bone.id] = isCorrect;
      if (isCorrect) correctCount++;
    });

    setResults(newResults);
    const finalScore = Math.round((correctCount / bones.length) * 100);
    setScore(finalScore);
    setGameState('finished');
  };

  const resetGame = () => {
    setGameState('playing');
    setUserAnswers({});
    setAvailableLabels(bones.map(bone => bone.name).sort(() => Math.random() - 0.5));
    setScore(0);
    setResults({});
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent ! Vous maîtrisez parfaitement l'anatomie ! 🏆";
    if (score >= 75) return "Très bien ! Vous avez de bonnes connaissances anatomiques ! 👏";
    if (score >= 60) return "Bien ! Continuez à étudier pour vous améliorer ! 📚";
    if (score >= 40) return "Passable. Il faut réviser un peu plus ! 💪";
    return "Il faut étudier davantage l'anatomie ! Ne vous découragez pas ! 📖";
  };

  // Composant SVG du squelette simplifié mais reconnaissable
  const SkeletonSVG = () => (
    <svg
      width="400"
      height="600"
      viewBox="0 0 400 600"
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1
      }}
    >
      {/* Fond blanc */}
      <rect width="400" height="600" fill="#f8f9fa" stroke="#e0e0e0" strokeWidth="2" rx="10"/>
      
      {/* Squelette simplifié mais reconnaissable */}
      
      {/* Crâne amélioré - plus réaliste */}
      <ellipse cx="200" cy="60" rx="40" ry="35" fill="#ffffff" stroke="#2c3e50" strokeWidth="3"/>
      {/* Orbites oculaires */}
      <ellipse cx="185" cy="55" rx="8" ry="10" fill="none" stroke="#2c3e50" strokeWidth="2"/>
      <ellipse cx="215" cy="55" rx="8" ry="10" fill="none" stroke="#2c3e50" strokeWidth="2"/>
      {/* Cavité nasale */}
      <path d="M 200 65 L 195 80 L 200 85 L 205 80 Z" fill="none" stroke="#2c3e50" strokeWidth="2"/>
      {/* Mâchoire */}
      <path d="M 175 85 Q 200 95 225 85" fill="none" stroke="#2c3e50" strokeWidth="2"/>
      {/* Dents */}
      <rect x="190" y="88" width="3" height="4" fill="#2c3e50"/>
      <rect x="195" y="88" width="3" height="4" fill="#2c3e50"/>
      <rect x="200" y="88" width="3" height="4" fill="#2c3e50"/>
      <rect x="205" y="88" width="3" height="4" fill="#2c3e50"/>
      <rect x="210" y="88" width="3" height="4" fill="#2c3e50"/>
      
      {/* Colonne vertébrale */}
      <line x1="200" y1="95" x2="200" y2="340" stroke="#2c3e50" strokeWidth="4"/>
      
      {/* Côtes - simplifiées mais reconnaissables */}
      <ellipse cx="200" cy="150" rx="45" ry="20" fill="none" stroke="#2c3e50" strokeWidth="2.5"/>
      <ellipse cx="200" cy="170" rx="50" ry="23" fill="none" stroke="#2c3e50" strokeWidth="2.5"/>
      <ellipse cx="200" cy="190" rx="55" ry="25" fill="none" stroke="#2c3e50" strokeWidth="2.5"/>
      <ellipse cx="200" cy="210" rx="50" ry="23" fill="none" stroke="#2c3e50" strokeWidth="2.5"/>
      
      {/* Clavicules */}
      <line x1="155" y1="130" x2="245" y2="130" stroke="#2c3e50" strokeWidth="4"/>
      
      {/* Sternum */}
      <rect x="196" y="140" width="8" height="70" fill="#ffffff" stroke="#2c3e50" strokeWidth="2"/>
      
      {/* Bras gauche */}
      <line x1="155" y1="130" x2="140" y2="200" stroke="#2c3e50" strokeWidth="4"/> {/* Humérus */}
      <line x1="140" y1="200" x2="125" y2="280" stroke="#2c3e50" strokeWidth="3"/> {/* Radius */}
      <line x1="140" y1="200" x2="130" y2="285" stroke="#2c3e50" strokeWidth="3"/> {/* Ulna */}
      
      {/* Bras droit */}
      <line x1="245" y1="130" x2="260" y2="200" stroke="#2c3e50" strokeWidth="4"/> {/* Humérus */}
      <line x1="260" y1="200" x2="275" y2="280" stroke="#2c3e50" strokeWidth="3"/> {/* Radius */}
      <line x1="260" y1="200" x2="270" y2="285" stroke="#2c3e50" strokeWidth="3"/> {/* Ulna */}
      
      {/* Mains */}
      <ellipse cx="123" cy="295" rx="10" ry="15" fill="#ffffff" stroke="#2c3e50" strokeWidth="2"/>
      <ellipse cx="277" cy="295" rx="10" ry="15" fill="#ffffff" stroke="#2c3e50" strokeWidth="2"/>
      
      {/* Bassin */}
      <ellipse cx="200" cy="340" rx="50" ry="22" fill="#ffffff" stroke="#2c3e50" strokeWidth="3"/>
      
      {/* Jambe gauche */}
      <line x1="175" y1="362" x2="175" y2="480" stroke="#2c3e50" strokeWidth="5"/> {/* Fémur */}
      <line x1="175" y1="480" x2="165" y2="570" stroke="#2c3e50" strokeWidth="4"/> {/* Tibia */}
      <line x1="175" y1="480" x2="155" y2="565" stroke="#2c3e50" strokeWidth="3"/> {/* Péroné */}
      
      {/* Jambe droite */}
      <line x1="225" y1="362" x2="225" y2="480" stroke="#2c3e50" strokeWidth="5"/> {/* Fémur */}
      <line x1="225" y1="480" x2="235" y2="570" stroke="#2c3e50" strokeWidth="4"/> {/* Tibia */}
      <line x1="225" y1="480" x2="245" y2="565" stroke="#2c3e50" strokeWidth="3"/> {/* Péroné */}
      
      {/* Pieds */}
      <ellipse cx="163" cy="585" rx="18" ry="10" fill="#ffffff" stroke="#2c3e50" strokeWidth="2"/>
      <ellipse cx="237" cy="585" rx="18" ry="10" fill="#ffffff" stroke="#2c3e50" strokeWidth="2"/>
    </svg>
  );

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px',
        color: '#2c3e50'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem' }}>{title}</h1>
        <p style={{ margin: '0', fontSize: '1.1rem', opacity: 0.8 }}>
          Glissez les étiquettes vers les os correspondants
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Zone du squelette */}
        <div style={{
          flex: '1',
          minWidth: '400px',
          background: 'white',
          borderRadius: '15px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div style={{
            position: 'relative',
            width: '400px',
            height: '600px',
            margin: '0 auto'
          }}>
            {/* Squelette SVG */}
            <SkeletonSVG />
            
            {/* SVG par-dessus pour les zones interactives */}
            <svg
              width="400"
              height="600"
              viewBox="0 0 400 600"
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2
              }}
            >
              {bones.map(bone => (
                <g key={bone.id}>
                  {/* Ligne de connexion */}
                  <line 
                    x1={bone.x} 
                    y1={bone.y} 
                    x2={bone.lineEndX} 
                    y2={bone.lineEndY} 
                    stroke={gameState === 'finished' ? (results[bone.id] ? '#27ae60' : '#e74c3c') : '#7f8c8d'} 
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  
                  {/* Zone de drop */}
                  <circle
                    cx={bone.x}
                    cy={bone.y}
                    r="15"
                    fill={
                      gameState === 'finished' 
                        ? (results[bone.id] ? '#27ae60' : '#e74c3c')
                        : userAnswers[bone.id] 
                          ? '#3498db' 
                          : '#95a5a6'
                    }
                    stroke="white"
                    strokeWidth="3"
                    style={{ cursor: 'pointer' }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, bone.id)}
                    onClick={() => gameState === 'playing' && removeAnswer(bone.id)}
                    opacity="0.9"
                  />
                  
                  {/* Étiquette placée */}
                  {userAnswers[bone.id] && (
                    <g>
                      <rect
                        x={bone.x - 35}
                        y={bone.y - 28}
                        width="70"
                        height="18"
                        fill="rgba(255,255,255,0.95)"
                        stroke={gameState === 'finished' ? (results[bone.id] ? '#27ae60' : '#e74c3c') : '#3498db'}
                        strokeWidth="2"
                        rx="9"
                      />
                      <text
                        x={bone.x}
                        y={bone.y - 15}
                        textAnchor="middle"
                        fontSize="10"
                        fill={gameState === 'finished' ? (results[bone.id] ? '#27ae60' : '#e74c3c') : '#2c3e50'}
                        fontWeight="bold"
                      >
                        {userAnswers[bone.id]}
                      </text>
                    </g>
                  )}
                  
                  {/* Icône de validation */}
                  {userAnswers[bone.id] && (
                    <text
                      x={bone.x}
                      y={bone.y + 5}
                      textAnchor="middle"
                      fontSize="12"
                      fill="white"
                      fontWeight="bold"
                    >
                      {gameState === 'finished' ? (results[bone.id] ? '✓' : '✗') : '•'}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Zone des étiquettes et contrôles */}
        <div style={{
          flex: '0 0 300px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Étiquettes disponibles */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Étiquettes disponibles</h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {availableLabels.map(label => (
                <div
                  key={label}
                  draggable
                  onDragStart={(e) => handleDragStart(e, label)}
                  style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    padding: '10px 14px',
                    borderRadius: '20px',
                    cursor: 'grab',
                    fontSize: '0.9rem',
                    userSelect: 'none',
                    transition: 'all 0.2s',
                    border: '2px solid transparent',
                    boxShadow: '0 2px 8px rgba(52,152,219,0.3)'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Réponses placées */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Réponses placées ({Object.keys(userAnswers).length}/{bones.length})</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {Object.entries(userAnswers).map(([boneId, answer]) => {
                const bone = bones.find(b => b.id === boneId);
                return (
                  <div
                    key={boneId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      margin: '4px 0',
                      background: gameState === 'finished' 
                        ? (results[boneId] ? 'linear-gradient(135deg, #d5f4e6 0%, #a8e6cf 100%)' : 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)')
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      border: gameState === 'finished' 
                        ? (results[boneId] ? '2px solid #27ae60' : '2px solid #e74c3c')
                        : '1px solid #e0e0e0',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <span style={{ 
                      color: gameState === 'finished' 
                        ? (results[boneId] ? '#27ae60' : '#e74c3c')
                        : '#2c3e50',
                      fontWeight: 'bold'
                    }}>
                      {gameState === 'finished' && (results[boneId] ? '✓ ' : '✗ ')}
                      {answer}
                    </span>
                    {gameState === 'playing' && (
                      <button
                        onClick={() => removeAnswer(boneId)}
                        style={{
                          background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contrôles */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {gameState === 'playing' ? (
              <button
                onClick={checkAnswers}
                disabled={Object.keys(userAnswers).length === 0}
                style={{
                  background: Object.keys(userAnswers).length === 0 
                    ? 'linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%)' 
                    : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  cursor: Object.keys(userAnswers).length === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: Object.keys(userAnswers).length === 0 
                    ? 'none' 
                    : '0 4px 15px rgba(39,174,96,0.3)',
                  fontWeight: 'bold'
                }}
              >
                Vérifier les réponses
              </button>
            ) : (
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: score >= 75 ? '#27ae60' : score >= 50 ? '#f39c12' : '#e74c3c',
                  margin: '0 0 10px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  Score: {score}%
                </div>
                <p style={{
                  margin: '0 0 20px 0',
                  color: '#2c3e50',
                  fontSize: '1rem',
                  lineHeight: '1.4'
                }}>
                  {getScoreMessage(score)}
                </p>
                <button
                  onClick={resetGame}
                  style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '15px 30px',
                    borderRadius: '25px',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(52,152,219,0.3)',
                    fontWeight: 'bold'
                  }}
                >
                  🔄 Rejouer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Block;