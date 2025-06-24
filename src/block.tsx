import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Html, Text, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface BlockProps {
  title?: string;
  description?: string;
}

interface Bone {
  id: string;
  name: string;
  position: [number, number, number];
  isCorrect?: boolean;
  userAnswer?: string;
}

// Updated bone positions to match the actual GLB skeleton model
const bones: Bone[] = [
  { id: 'skull', name: 'Crâne', position: [0, 1.1, 0] },
  { id: 'clavicle', name: 'Clavicule', position: [0.15, 0.7, 0] },
  { id: 'sternum', name: 'Sternum', position: [0, 0.5, 0.05] },
  { id: 'ribs', name: 'Côtes', position: [0.18, 0.45, 0] },
  { id: 'humerus', name: 'Humérus', position: [-0.25, 0.35, 0] },
  { id: 'radius', name: 'Radius', position: [-0.25, 0.05, 0.05] },
  { id: 'ulna', name: 'Cubitus', position: [-0.25, 0.05, -0.05] },
  { id: 'spine', name: 'Colonne vertébrale', position: [0, 0.2, -0.05] },
  { id: 'pelvis', name: 'Bassin', position: [0, -0.0, 0] },
  { id: 'femur', name: 'Fémur', position: [0.13, -0.35, 0] },
  { id: 'tibia', name: 'Tibia', position: [0.08, -0.65, -0.04] },
  { id: 'fibula', name: 'Péroné', position: [-0.13, -0.65, -0.04] }
];

// Skeleton Model Component with proper error handling
function SkeletonModel({ modelUrl }: { modelUrl: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [modelError, setModelError] = useState(false);
  
  // Use GLB model with error handling
  const { scene } = useGLTF(modelUrl, undefined, undefined, (error) => {
    console.error('Failed to load GLB model:', error);
    setModelError(true);
  });

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle idle animation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  useEffect(() => {
    if (scene) {
      // Configure the loaded model
      scene.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Enhance material properties
          if (child.material) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.roughness = 0.7;
            material.metalness = 0.0;
            
            // Ensure proper bone coloring - remove the multiplier that was washing out the model
            if (material.color) {
              // Keep original color but ensure it's not too bright
              material.color.setHex(0xf5f5dc); // Bone color (beige)
            }
          }
        }
      });
    }
  }, [scene]);

  // If there's an error, throw it to be caught by error boundary
  if (modelError) {
    throw new Error('Failed to load 3D skeleton model');
  }

  if (!scene) {
    return null; // Loading handled by Suspense
  }

  return (
    <group ref={meshRef} position={[0, 0, 0]} scale={[0.3, 0.3, 0.3]}>
      <primitive object={scene} />
    </group>
  );
}

// Error Boundary for Model Loading
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Model loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Loading Component
function LoadingModel() {
  return (
    <Html center>
      <div style={{ 
        color: 'white', 
        fontSize: '18px',
        background: 'rgba(0,0,0,0.8)',
        padding: '20px 30px',
        borderRadius: '15px',
        textAlign: 'center',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🦴</div>
        <div>Chargement du squelette 3D...</div>
      </div>
    </Html>
  );
}

// Error Component
function ModelError() {
  return (
    <Html center>
      <div style={{ 
        color: '#e74c3c', 
        fontSize: '16px',
        background: 'rgba(231, 76, 60, 0.1)',
        padding: '20px 30px',
        borderRadius: '15px',
        textAlign: 'center',
        border: '2px solid rgba(231, 76, 60, 0.5)',
        maxWidth: '300px'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
        <div><strong>Erreur de chargement</strong></div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
          Impossible de charger le modèle 3D
        </div>
      </div>
    </Html>
  );
}

// Safe Model Loader
function SafeSkeletonModel({ modelUrl }: { modelUrl: string }) {
  return (
    <ModelErrorBoundary fallback={<ModelError />}>
      <Suspense fallback={<LoadingModel />}>
        <SkeletonModel modelUrl={modelUrl} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

// Interactive Bone Point Component
function BonePoint({ 
  bone, 
  userAnswer, 
  gameState, 
  isCorrect, 
  onDrop, 
  onRemove 
}: {
  bone: Bone;
  userAnswer?: string;
  gameState: 'playing' | 'finished';
  isCorrect?: boolean;
  onDrop: (boneId: string) => void;
  onRemove: (boneId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.1;
    }
  });

  const getColor = () => {
    if (gameState === 'finished') {
      return isCorrect ? '#27ae60' : '#e74c3c';
    }
    return userAnswer ? '#3498db' : hovered ? '#f39c12' : '#DD1414';
  };

  return (
    <group position={bone.position}>
      {/* Interactive sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => gameState === 'playing' && userAnswer && onRemove(bone.id)}
        scale={hovered ? 1.3 : 1}
      >
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Pulsing ring for better visibility */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.035, 0.045, 16]} />
        <meshBasicMaterial 
          color={getColor()} 
          transparent 
          opacity={hovered ? 0.6 : 0.3}
        />
      </mesh>

      {/* Label */}
      {userAnswer && (
        <Html
          position={[0, 0.08, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '5px 10px',
              borderRadius: '15px',
              fontSize: '11px',
              fontWeight: 'bold',
              border: `2px solid ${getColor()}`,
              color: gameState === 'finished' ? getColor() : '#2c3e50',
              boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(5px)'
            }}
          >
            {gameState === 'finished' && (isCorrect ? '✓ ' : '✗ ')}
            {userAnswer}
          </div>
        </Html>
      )}

      {/* Connection line indicator */}
      {userAnswer && (
        <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.001, 0.001, 0.08, 4]} />
          <meshBasicMaterial color={getColor()} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// Scene Setup Component
function SceneSetup() {
  const { scene, camera } = useThree();
  
  useEffect(() => {
    // Enhanced fog for better depth perception
    scene.fog = new THREE.Fog(0x1a1a2e, 3, 12);
    
    // Optimize camera settings
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.near = 0.1;
      camera.far = 1000;
      camera.updateProjectionMatrix();
    }
  }, [scene, camera]);

  return null;
}

const Block: React.FC<BlockProps> = ({ title = "Anatomie 3D - Reconnaissance des Os", description }) => {
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [availableLabels, setAvailableLabels] = useState<string[]>(
    bones.map(bone => bone.name).sort(() => Math.random() - 0.5)
  );
  const [score, setScore] = useState<number>(0);
  const [results, setResults] = useState<{ [key: string]: boolean }>({});
  const [selectedBone, setSelectedBone] = useState<string | null>(null);

  // Send completion event
  useEffect(() => {
    if (gameState === 'finished') {
      window.postMessage({ 
        type: 'BLOCK_COMPLETION', 
        blockId: '3d-bone-recognition-game', 
        completed: true,
        score: score,
        maxScore: 100
      }, '*');
      window.parent?.postMessage({ 
        type: 'BLOCK_COMPLETION', 
        blockId: '3d-bone-recognition-game', 
        completed: true,
        score: score,
        maxScore: 100
      }, '*');
    }
  }, [gameState, score]);

  const handleLabelClick = (label: string) => {
    if (selectedBone && gameState === 'playing') {
      setUserAnswers(prev => ({
        ...prev,
        [selectedBone]: label
      }));
      setAvailableLabels(prev => prev.filter(l => l !== label));
      setSelectedBone(null);
    }
  };

  const removeBoneAnswer = (boneId: string) => {
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
    setSelectedBone(null);
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Excellent ! Vous maîtrisez parfaitement l'anatomie ! 🏆";
    if (score >= 75) return "Très bien ! Vous avez de bonnes connaissances anatomiques ! 👏";
    if (score >= 60) return "Bien ! Continuez à étudier pour vous améliorer ! 📚";
    if (score >= 40) return "Passable. Il faut réviser un peu plus ! 💪";
    return "Il faut étudier davantage l'anatomie ! Ne vous découragez pas ! 📖";
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      color: 'white'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
          {title}
        </h1>
        <p style={{ margin: '0', fontSize: '1.1rem', opacity: 0.9 }}>
          Cliquez sur un point puis sélectionnez l'étiquette correspondante
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto',
        height: '80vh'
      }}>
        {/* 3D Scene */}
        <div style={{
          flex: '1',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '15px',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <Canvas
            shadows
            camera={{ position: [2, 1, 2], fov: 50 }}
            style={{ background: 'transparent' }}
            gl={{ 
              antialias: true, 
              alpha: true,
              powerPreference: "high-performance"
            }}
          >
            <SceneSetup />
            
            {/* Enhanced Lighting Setup */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[5, 10, 5]}
              intensity={0.6}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
              shadow-camera-far={50}
              shadow-camera-left={-10}
              shadow-camera-right={10}
              shadow-camera-top={10}
              shadow-camera-bottom={-10}
            />
            <directionalLight
              position={[-3, -3, 2]}
              intensity={0.2}
              color="#ffeaa7"
            />
            <pointLight position={[2, 3, 2]} intensity={0.3} color="#ffffff" />
            <pointLight position={[-2, -3, -2]} intensity={0.2} color="#74b9ff" />

            {/* 3D Skeleton Model */}
            <SafeSkeletonModel modelUrl="https://content.mext.app/uploads/c51d7e81-bf01-477e-93b2-61951d133344.glb" />
            
            {/* Interactive Bone Points */}
            {bones.map(bone => (
              <group key={bone.id}>
                <BonePoint
                  bone={bone}
                  userAnswer={userAnswers[bone.id]}
                  gameState={gameState}
                  isCorrect={results[bone.id]}
                  onDrop={() => setSelectedBone(bone.id)}
                  onRemove={removeBoneAnswer}
                />
                
                {/* Selection indicator */}
                {selectedBone === bone.id && (
                  <mesh position={bone.position}>
                    <ringGeometry args={[0.06, 0.08, 16]} />
                    <meshBasicMaterial color="#f39c12" transparent opacity={0.8} />
                  </mesh>
                )}
                
                {/* Clickable area for bone selection */}
                <mesh 
                  position={bone.position}
                  onClick={() => gameState === 'playing' && setSelectedBone(bone.id)}
                  visible={false}
                >
                  <sphereGeometry args={[0.08]} />
                </mesh>
              </group>
            ))}

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1.5}
              maxDistance={6}
              maxPolarAngle={Math.PI * 0.9}
              minPolarAngle={Math.PI * 0.1}
              target={[0, 0, 0]}
            />
          </Canvas>

          {/* Selection Instructions */}
          {selectedBone && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(243, 156, 18, 0.95)',
              padding: '15px',
              borderRadius: '10px',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              animation: 'pulse 2s infinite'
            }}>
              📍 Point sélectionné - Choisissez une étiquette →
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div style={{
          flex: '0 0 320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Available Labels */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>
              Étiquettes disponibles ({availableLabels.length})
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {availableLabels.map(label => (
                <button
                  key={label}
                  onClick={() => handleLabelClick(label)}
                  disabled={!selectedBone}
                  style={{
                    background: selectedBone 
                      ? 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)'
                      : 'linear-gradient(135deg, #7f8c8d 0%, #95a5a6 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 12px',
                    borderRadius: '20px',
                    cursor: selectedBone ? 'pointer' : 'not-allowed',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxShadow: selectedBone ? '0 2px 8px rgba(39,174,96,0.3)' : 'none',
                    opacity: selectedBone ? 1 : 0.6
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Placed Answers */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            flex: 1
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'white' }}>
              Réponses placées ({Object.keys(userAnswers).length}/{bones.length})
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(userAnswers).map(([boneId, answer]) => (
                <div
                  key={boneId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    margin: '4px 0',
                    background: gameState === 'finished' 
                      ? (results[boneId] ? 'rgba(39, 174, 96, 0.3)' : 'rgba(231, 76, 60, 0.3)')
                      : 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    border: gameState === 'finished' 
                      ? (results[boneId] ? '2px solid #27ae60' : '2px solid #e74c3c')
                      : '1px solid rgba(255,255,255,0.2)'
                  }}
                >
                  <span style={{ 
                    color: gameState === 'finished' 
                      ? (results[boneId] ? '#2ecc71' : '#e74c3c')
                      : 'white',
                    fontWeight: 'bold'
                  }}>
                    {gameState === 'finished' && (results[boneId] ? '✓ ' : '✗ ')}
                    {answer}
                  </span>
                  {gameState === 'playing' && (
                    <button
                      onClick={() => removeBoneAnswer(boneId)}
                      style={{
                        background: 'rgba(231, 76, 60, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '15px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            textAlign: 'center'
          }}>
            {gameState === 'playing' ? (
              <button
                onClick={checkAnswers}
                disabled={Object.keys(userAnswers).length === 0}
                style={{
                  background: Object.keys(userAnswers).length === 0 
                    ? 'rgba(127, 140, 141, 0.5)' 
                    : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  cursor: Object.keys(userAnswers).length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  boxShadow: Object.keys(userAnswers).length === 0 
                    ? 'none' 
                    : '0 4px 15px rgba(39,174,96,0.4)'
                }}
              >
                Vérifier les réponses
              </button>
            ) : (
              <div>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: score >= 75 ? '#2ecc71' : score >= 50 ? '#f39c12' : '#e74c3c',
                  margin: '0 0 10px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Score: {score}%
                </div>
                <p style={{
                  margin: '0 0 20px 0',
                  fontSize: '0.95rem',
                  lineHeight: '1.4',
                  opacity: 0.9
                }}>
                  {getScoreMessage(score)}
                </p>
                <button
                  onClick={resetGame}
                  style={{
                    background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '15px 25px',
                    borderRadius: '25px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(52,152,219,0.4)'
                  }}
                >
                  🔄 Rejouer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default Block;