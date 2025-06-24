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

// 3D bone positions (approximate positions for a human skeleton)
const bones: Bone[] = [
  { id: 'skull', name: 'Crâne', position: [0, 1.7, 0] },
  { id: 'clavicle', name: 'Clavicule', position: [0.3, 1.4, 0] },
  { id: 'sternum', name: 'Sternum', position: [0, 1.2, 0.1] },
  { id: 'ribs', name: 'Côtes', position: [0.4, 1.1, 0] },
  { id: 'humerus', name: 'Humérus', position: [-0.4, 1.0, 0] },
  { id: 'radius', name: 'Radius', position: [-0.4, 0.6, 0.1] },
  { id: 'ulna', name: 'Cubitus', position: [-0.4, 0.6, -0.1] },
  { id: 'spine', name: 'Colonne vertébrale', position: [0, 0.8, -0.1] },
  { id: 'pelvis', name: 'Bassin', position: [0, 0.2, 0] },
  { id: 'femur', name: 'Fémur', position: [0.2, -0.3, 0] },
  { id: 'tibia', name: 'Tibia', position: [0.2, -0.8, 0.05] },
  { id: 'fibula', name: 'Péroné', position: [0.15, -0.8, -0.05] }
];

// Fallback Skeleton Component (basic geometric skeleton)
function FallbackSkeleton() {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={[0, -0.5, 0]} scale={[0.8, 0.8, 0.8]}>
      {/* Basic geometric skeleton */}
      {/* Head */}
      <mesh position={[0, 1.7, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      
      {/* Spine */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Rib cage */}
      {[0.2, 0.4, 0.6].map((y, i) => (
        <group key={i}>
          <mesh position={[0.3, 1.2 - y, 0]} rotation={[0, 0, -0.3]}>
            <torusGeometry args={[0.25, 0.02, 4, 12]} />
            <meshStandardMaterial color="#d0d0d0" />
          </mesh>
          <mesh position={[-0.3, 1.2 - y, 0]} rotation={[0, 0, 0.3]}>
            <torusGeometry args={[0.25, 0.02, 4, 12]} />
            <meshStandardMaterial color="#d0d0d0" />
          </mesh>
        </group>
      ))}
      
      {/* Arms */}
      <mesh position={[-0.4, 1.0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0.4, 1.0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Forearms */}
      <mesh position={[-0.4, 0.6, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0.4, 0.6, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Pelvis */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.1, -0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0.1, -0.3, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      
      {/* Shins */}
      <mesh position={[-0.1, -0.8, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      <mesh position={[0.1, -0.8, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.6, 8]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    </group>
  );
}

// Skeleton Model Component with Error Handling
function SkeletonModel({ modelUrl }: { modelUrl: string }) {
  const [modelError, setModelError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const meshRef = useRef<THREE.Group>(null);

  // Custom hook to handle GLB loading with error catching
  const [gltf, setGltf] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setModelError(null);

    const loadModel = async () => {
      try {
        // Test if the URL is accessible first
        const response = await fetch(modelUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Model not found: ${response.status} ${response.statusText}`);
        }

        // If URL is accessible, load with useGLTF
        const { useGLTF } = await import('@react-three/drei');
        const gltfData = useGLTF(modelUrl);
        
        if (mounted) {
          setGltf(gltfData);
          setIsLoading(false);
        }
      } catch (error) {
        console.warn('Failed to load 3D model:', error);
        if (mounted) {
          setModelError(error instanceof Error ? error.message : 'Failed to load model');
          setIsLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, [modelUrl]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  useEffect(() => {
    if (gltf?.scene) {
      gltf.scene.traverse((child: any) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            const material = child.material as THREE.MeshStandardMaterial;
            material.roughness = 0.3;
            material.metalness = 0.1;
          }
        }
      });
    }
  }, [gltf]);

  // Show loading state
  if (isLoading) {
    return (
      <Html center>
        <div style={{ 
          color: 'white', 
          fontSize: '16px',
          background: 'rgba(0,0,0,0.7)',
          padding: '15px 20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div>🔄 Chargement du modèle 3D...</div>
        </div>
      </Html>
    );
  }

  // Show error state with fallback
  if (modelError) {
    return (
      <group>
        <Html position={[0, 2.5, 0]} center>
          <div style={{ 
            color: '#f39c12', 
            fontSize: '14px',
            background: 'rgba(243, 156, 18, 0.2)',
            padding: '10px 15px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid rgba(243, 156, 18, 0.5)',
            maxWidth: '300px'
          }}>
            ⚠️ Modèle 3D indisponible<br/>
            <small>Utilisation du squelette de base</small>
          </div>
        </Html>
        <FallbackSkeleton />
      </group>
    );
  }

  // Show loaded model
  if (gltf?.scene) {
    return (
      <group ref={meshRef} position={[0, -1, 0]} scale={[1, 1, 1]}>
        <primitive object={gltf.scene} />
      </group>
    );
  }

  // Final fallback
  return <FallbackSkeleton />;
}

// Error Boundary Component
class SkeletonErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('3D Model Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackSkeleton />;
    }

    return this.props.children;
  }
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

  const getColor = () => {
    if (gameState === 'finished') {
      return isCorrect ? '#27ae60' : '#e74c3c';
    }
    return userAnswer ? '#3498db' : hovered ? '#f39c12' : '#95a5a6';
  };

  return (
    <group position={bone.position}>
      {/* Interactive sphere */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => gameState === 'playing' && userAnswer && onRemove(bone.id)}
        scale={hovered ? 1.2 : 1}
      >
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial 
          color={getColor()} 
          emissive={getColor()} 
          emissiveIntensity={0.2}
          transparent
          opacity={0.8}
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
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: `2px solid ${getColor()}`,
              color: gameState === 'finished' ? getColor() : '#2c3e50',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              whiteSpace: 'nowrap'
            }}
          >
            {gameState === 'finished' && (isCorrect ? '✓ ' : '✗ ')}
            {userAnswer}
          </div>
        </Html>
      )}

      {/* Connection line to center */}
      <Html
        position={[0, 0, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            width: '2px',
            height: '40px',
            background: `linear-gradient(to bottom, ${getColor()}, transparent)`,
            transform: 'translateX(-1px) translateY(-20px)',
            opacity: 0.6
          }}
        />
      </Html>
    </group>
  );
}

// Scene Setup Component
function SceneSetup() {
  const { scene } = useThree();
  
  useEffect(() => {
    scene.fog = new THREE.Fog(0xf0f0f0, 5, 15);
  }, [scene]);

  return null;
}

const Block: React.FC<BlockProps> = ({ title = "Anatomie 3D - Reconnaissance des Os", description }) => {
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
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
            camera={{ position: [3, 2, 3], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <SceneSetup />
            
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -5]} intensity={0.3} />

            <Suspense fallback={
              <Html center>
                <div style={{ 
                  color: 'white', 
                  fontSize: '18px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '20px',
                  borderRadius: '10px'
                }}>
                  Chargement du modèle 3D...
                </div>
              </Html>
            }>
              {/* 3D Skeleton Model with Error Boundary */}
              <SkeletonErrorBoundary>
                <SkeletonModel modelUrl="https://content.mext.app/uploads/c51d7e81-bf01-477e-93b2-61951d133344.glb" />
              </SkeletonErrorBoundary>
              
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
                      <ringGeometry args={[0.08, 0.1, 16]} />
                      <meshBasicMaterial color="#f39c12" transparent opacity={0.8} />
                    </mesh>
                  )}
                  
                  {/* Clickable area for bone selection */}
                  <mesh 
                    position={bone.position}
                    onClick={() => gameState === 'playing' && setSelectedBone(bone.id)}
                    visible={false}
                  >
                    <sphereGeometry args={[0.1]} />
                  </mesh>
                </group>
              ))}
            </Suspense>

            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={1}
              maxDistance={8}
              maxPolarAngle={Math.PI}
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