import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ShoppingBag, Menu, X, ArrowRight, Instagram, Twitter, Mail, MoveRight, Sparkles, Zap, Eye, ChevronLeft, ChevronRight, Wand2, Upload, Check, Fingerprint, Cpu, Palette, Terminal, Trash2, Minus, Plus, Share2, Layers, Printer, Package, Aperture, Sliders, Loader2, Send, Truck, Award, Maximize, Leaf, ScanLine, CreditCard, Lock, ChevronDown, Wallet, Activity, Home, Camera, Smartphone, RotateCcw } from 'lucide-react';

/**
 * AiPapi - Headless Frontend (React)
 * Gekoppeld aan: https://www.aipostershop.nl/
 * STATUS: REAL PRICES & TRUE AR (WebXR)
 * - True AR with Wall/Floor detection via Three.js WebXR
 * - Fallback Camera AR for iOS/Non-WebXR devices
 * - Mobile Optimized Pop-up
 */

// --- CONFIGURATIE (Global) ---
const BEHOLD_URL = "https://feeds.behold.so/nguthImEl5LLe5wkCkaC";
const SITE_URL = "https://www.aipostershop.nl";
const CK = "ck_35d3827fc6d5e1c7a6919d23c78fdbfd48eb88ba";
const CS = "cs_de3798a3f768a50e14f485c14e09cb547147bf99";

// --- UTILS: CONFETTI COMPONENT ---
const Confetti = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const colors = ['#f97316', '#ffffff', '#22c55e', '#3b82f6'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 5 + Math.random() * 10,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.5,
      duration: 3 + Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-fall"
          style={{
            left: `${p.x}vw`,
            top: `${p.y}vh`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s linear forwards ${p.delay}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

// --- COMPONENT: AR SCANNER (Hybrid WebXR + Camera Fallback) ---
const ARScanner = ({ product, onClose }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  
  // States
  const [mode, setMode] = useState('detecting'); // detecting, webxr, fallback
  const [arStatus, setArStatus] = useState('init'); // init, scanning, placed, error, active (fallback)
  const [errorMsg, setErrorMsg] = useState('');
  
  // Fallback AR States (iOS)
  const [cameraStream, setCameraStream] = useState(null);
  const [posterPos, setPosterPos] = useState({ x: 0, y: 0 }); // Relative to center
  const [posterScale, setPosterScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect WebXR support
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (supported) {
          setMode('webxr');
        } else {
          setMode('fallback');
        }
      }).catch(() => setMode('fallback'));
    } else {
      setMode('fallback');
    }
  }, []);

  const startAR = async () => {
    if (mode === 'webxr') {
        startWebXR();
    } else {
        startFallbackCamera();
    }
  };

  // --- MODE 1: NATIVE WEBXR (Android) ---
  const startWebXR = async () => {
    if (!containerRef.current) return;
    try {
      const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test', 'dom-overlay'], optionalFeatures: ['dom-overlay'], domOverlay: { root: containerRef.current } });
      setArStatus('scanning');

      // THREE JS SETUP
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType('local');
      
      const scene = new THREE.Scene();
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      light.position.set(0.5, 1, 0.25);
      scene.add(light);

      const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');
      const imageUrl = product.color.includes('http') ? product.color : 'https://placehold.co/600x800/orange/white?text=No+Image';
      const texture = textureLoader.load(imageUrl);
      
      const posterWidth = 0.42; 
      const posterHeight = 0.594;
      const geometry = new THREE.PlaneGeometry(posterWidth, posterHeight);
      const material = new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide });
      const posterMesh = new THREE.Mesh(geometry, material);
      posterMesh.visible = false;
      scene.add(posterMesh);

      let hitTestSource = null;
      let hitTestSourceRequested = false;

      const render = (timestamp, frame) => {
        if (frame) {
          const referenceSpace = renderer.xr.getReferenceSpace();
          const session = renderer.xr.getSession();

          if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((refSpace) => {
              session.requestHitTestSource({ space: refSpace }).then((source) => {
                hitTestSource = source;
              });
            });
            session.addEventListener('end', () => {
                hitTestSourceRequested = false;
                hitTestSource = null;
                onClose(); 
            });
            hitTestSourceRequested = true;
          }

          if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              reticle.visible = true;
              reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
              reticle.visible = false;
            }
          }
        }
        renderer.render(scene, camera);
      };

      const onSelect = () => {
        if (reticle.visible) {
          posterMesh.position.setFromMatrixPosition(reticle.matrix);
          posterMesh.quaternion.setFromRotationMatrix(reticle.matrix);
          posterMesh.visible = true;
          setArStatus('placed');
        }
      };

      session.addEventListener('select', onSelect);
      await renderer.xr.setSession(session);
      renderer.setAnimationLoop(render);
      
    } catch (e) {
      console.error("AR Start Error", e);
      // If WebXR fails unpredictably, fallback to camera
      setMode('fallback');
      startFallbackCamera();
    }
  };

  // --- MODE 2: CAMERA FALLBACK (iOS) ---
  const startFallbackCamera = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' } 
          });
          setCameraStream(stream);
          setArStatus('active');
      } catch (err) {
          console.error("Camera access denied", err);
          setErrorMsg("Camera toegang vereist. Controleer je browser instellingen.");
          setArStatus('error');
      }
  };

  // Bind stream to video element once it renders
  useEffect(() => {
    if (arStatus === 'active' && videoRef.current && cameraStream) {
        videoRef.current.srcObject = cameraStream;
        // iOS often needs explicit play call even with autoPlay prop
        videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }
  }, [arStatus, cameraStream]);

  // Cleanup stream on close
  useEffect(() => {
      return () => {
          if (cameraStream) {
              cameraStream.getTracks().forEach(track => track.stop());
          }
      };
  }, [cameraStream]);

  const handleTouchStart = (e) => {
      setIsDragging(true);
      const touch = e.touches[0];
      // Store offset from current pos
      dragStart.current = { x: touch.clientX - posterPos.x, y: touch.clientY - posterPos.y };
  };

  const handleTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      setPosterPos({ 
          x: touch.clientX - dragStart.current.x, 
          y: touch.clientY - dragStart.current.y 
      });
  };

  const handleTouchEnd = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center" ref={containerRef}>
      
      {/* BACKGROUND FOR FALLBACK */}
      {arStatus === 'active' && mode === 'fallback' ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
      ) : (
        <>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-orange-900/20 to-transparent pointer-events-none"></div>
        </>
      )}

      {/* OVERLAY CONTENT */}
      {arStatus === 'active' && mode === 'fallback' ? (
          // --- FALLBACK INTERFACE ---
          <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 animate-in fade-in duration-500">
              <button 
                onClick={onClose} 
                className="self-end bg-black/50 text-white p-3 rounded-full backdrop-blur-md border border-white/20"
              >
                  <X className="w-6 h-6" />
              </button>

              {/* DRAGGABLE POSTER */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                  <div 
                    style={{ 
                        transform: `translate(${posterPos.x}px, ${posterPos.y}px) scale(${posterScale})`,
                        width: '60vw', // Initial relative size
                        touchAction: 'none'
                    }}
                    className="pointer-events-auto cursor-move origin-center"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                      {product.color.includes('http') ? (
                          <img src={product.color} className="w-full h-auto shadow-2xl border-4 border-white" alt="AR Preview" />
                      ) : (
                          <div className={`w-full aspect-[2/3] bg-gradient-to-br ${product.color} shadow-2xl border-4 border-white`}></div>
                      )}
                  </div>
              </div>

              {/* CONTROLS */}
              <div className="w-full bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 mb-4">
                  <p className="text-center text-white text-xs font-bold mb-4 uppercase tracking-widest">Sleep om te verplaatsen • Pas grootte aan</p>
                  <div className="flex items-center gap-4">
                      <button onClick={() => setPosterScale(s => Math.max(0.2, s - 0.1))} className="p-3 bg-white/10 rounded-full text-white"><Minus className="w-4 h-4" /></button>
                      <input 
                        type="range" 
                        min="0.2" 
                        max="2" 
                        step="0.05" 
                        value={posterScale} 
                        onChange={(e) => setPosterScale(parseFloat(e.target.value))}
                        className="flex-1 accent-orange-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <button onClick={() => setPosterScale(s => Math.min(3, s + 0.1))} className="p-3 bg-white/10 rounded-full text-white"><Plus className="w-4 h-4" /></button>
                  </div>
              </div>
          </div>
      ) : (
          // --- INIT / LOADING / ERROR SCREEN ---
          <div className="relative z-10 max-w-md w-full bg-zinc-900 border border-white/10 p-8 rounded-sm text-center shadow-2xl m-4">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>

            <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center border border-orange-500/30 animate-pulse">
                    <Smartphone className="w-10 h-10 text-orange-500" />
                </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">TRUE AR STUDIO</h3>
            
            {arStatus === 'init' && (
                <>
                    <p className="text-gray-400 mb-8 font-medium">
                        Bekijk <strong>{product.title}</strong> in jouw kamer.
                        <br/><br/>
                        {mode === 'webxr' ? (
                            <span className="text-xs font-mono text-green-500">Android WebXR Gedetecteerd</span>
                        ) : (
                            <span className="text-xs font-mono text-orange-500">iOS/Camera Modus</span>
                        )}
                    </p>
                    <button 
                        onClick={startAR}
                        className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        Start Camera <ArrowRight className="w-4 h-4" />
                    </button>
                </>
            )}

            {arStatus === 'scanning' && mode === 'webxr' && (
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-white font-bold">Scanning...</p>
                    <p className="text-xs text-gray-500 mt-2">Kijk rond in de kamer. Tik als je de cirkel ziet.</p>
                </div>
            )}

            {arStatus === 'placed' && (
                <div className="text-center py-8">
                    <Check className="w-8 h-8 text-green-500 mx-auto mb-4" />
                    <p className="text-white font-bold">Artwork Geplaatst!</p>
                    <button onClick={() => setArStatus('scanning')} className="mt-4 text-xs text-orange-500 underline flex items-center justify-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Verplaatsen
                    </button>
                </div>
            )}

            {arStatus === 'error' && (
                <div className="text-center">
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-sm mb-6">
                        <p className="text-red-500 text-sm font-mono">{errorMsg}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full border border-white/20 text-white py-3 font-bold uppercase hover:bg-white hover:text-black transition-colors"
                    >
                        Sluiten
                    </button>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: PRODUCT CARD ---
const ProductCard = ({ product, onClick, onAddToCart }) => {
  const [isActive, setIsActive] = useState(false);
  const [hoveredSize, setHoveredSize] = useState(null);
  const [timer, setTimer] = useState(null);
  const [variations, setVariations] = useState([]);

  // Fetch variations for real prices
  useEffect(() => {
    let isMounted = true;
    const fetchVariations = async () => {
      try {
        const response = await fetch(`${SITE_URL}/wp-json/wc/v3/products/${product.id}/variations?consumer_key=${CK}&consumer_secret=${CS}`);
        if (response.ok) {
          const data = await response.json();
          if (isMounted) setVariations(data);
        }
      } catch (err) {
        console.error("Error fetching card variations:", err);
      }
    };
    fetchVariations();
    return () => { isMounted = false; };
  }, [product.id]);

  // Determine available sizes from product data or fallback
  const sizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['A2', 'A1'];
  
  // Default to A2 if available, otherwise first size
  const defaultSize = sizes.find(s => s === 'A2') || sizes[0] || 'A2';
  
  const currentSize = hoveredSize || defaultSize;
  
  // Zoek de juiste variatie en prijs voor display
  const selectedVariation = variations.find(v => 
    v.attributes.some(attr => attr.option.toUpperCase() === currentSize.toUpperCase())
  );

  // Gebruik de echte prijs als variatie geladen is, anders fallback naar product basisprijs
  const displayPrice = selectedVariation ? parseFloat(selectedVariation.price) : product.price;

  const handleTouch = () => {
    setIsActive(true);
    if (timer) clearTimeout(timer);
    const newTimer = setTimeout(() => {
      setIsActive(false);
    }, 3000);
    setTimer(newTimer);
  };

  const handleMouseEnter = () => {
    if (timer) clearTimeout(timer);
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer);
    setIsActive(false);
  };

  const handleSizeClick = (e, size) => {
    e.stopPropagation(); // Voorkom openen modal
    
    // Zoek specifieke variatie voor DEZE maat (niet de hoveredSize, maar de clicked size)
    const specificVariation = variations.find(v => 
        v.attributes.some(attr => attr.option.toUpperCase() === size.toUpperCase())
    );
    const specificPrice = specificVariation ? parseFloat(specificVariation.price) : product.price;
    const specificVarId = specificVariation ? specificVariation.id : null;

    onAddToCart(product, size, specificPrice, specificVarId);
  };

  return (
    <div className="group relative cursor-pointer">
      <div 
        className={`relative ${product.aspect} overflow-hidden bg-gray-900 border border-white/5 rounded-sm transition-transform duration-500 hover:-translate-y-2`}
        onClick={() => onClick(product)}
        onTouchStart={handleTouch}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {product.color.includes('http') ? (
          <img 
            src={product.color} 
            alt={product.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-100 transition-all duration-700" 
            style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-100 group-hover:opacity-90 transition-opacity duration-700`}></div>
        )}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        {/* Hover Overlay - Only shows on Image Hover */}
        <div 
          className={`absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        >
          <button className="bg-white text-black px-6 py-3 font-bold uppercase tracking-wider text-xs hover:scale-105 transition-transform flex items-center gap-2">
            <Eye className="w-4 h-4" /> Bekijk Print
          </button>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white transition-colors group-hover:text-orange-500">{product.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            {sizes.slice(0, 3).map(size => (
              <button
                key={size}
                onClick={(e) => handleSizeClick(e, size)}
                onMouseEnter={() => setHoveredSize(size)}
                onMouseLeave={() => setHoveredSize(null)}
                className={`text-[10px] font-mono px-2 py-0.5 border transition-all ${currentSize === size ? 'border-orange-500 text-orange-500 bg-orange-500/10' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-medium block">€{displayPrice.toFixed(2)}</span>
          <span className="text-[9px] font-mono text-gray-600 uppercase">incl. btw</span>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- DATA STATE ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]); 
  const [lastOrderedItems, setLastOrderedItems] = useState([]);

  // Product Selection State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('A2');
  const [productVariations, setProductVariations] = useState([]); 
  const [loadingVariations, setLoadingVariations] = useState(false);
  
  // --- AR STATE ---
  const [showAR, setShowAR] = useState(false);

  // Share State
  const [copiedId, setCopiedId] = useState(null);

  // Instagram State
  const [instaPosts, setInstaPosts] = useState([]);
  
  // --- FUN / INTERACTIVE STATES ---
  const [teleportStatus, setTeleportStatus] = useState('idle');
  const [sentienceMsg, setSentienceMsg] = useState("VERIFY_SOUL.EXE");

  // New states for About Section
  const [resLevel, setResLevel] = useState(0);
  const [ecoStatus, setEcoStatus] = useState('idle');

  // --- UPLOAD STATE ---
  const [commissionFile, setCommissionFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- PAYMENT STATE ---
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // --- FIGURINE EXPLODED VIEW DATA ---
  const figurineParts = [
    { id: 'head', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Head.png', x: 50, y: 15, width: 25, depth: 0.08, z: 10, rotate: 0 },
    { id: 'torso', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Torso.png', x: 50, y: 38, width: 35, depth: 0.04, z: 5, rotate: 0 },
    { id: 'l_arm', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Leftarm.png', x: 25, y: 38, width: 20, depth: 0.06, z: 6, rotate: -10 },
    { id: 'r_arm', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Rightarm.png', x: 75, y: 38, width: 20, depth: 0.06, z: 6, rotate: 10 },
    { id: 'l_hand', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/lefthand.png', x: 15, y: 55, width: 15, depth: 0.10, z: 8, rotate: -20 },
    { id: 'r_hand', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Righthand.png', x: 85, y: 55, width: 15, depth: 0.10, z: 8, rotate: 20 },
    { id: 'pants', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Pants.png', x: 50, y: 65, width: 30, depth: 0.02, z: 4, rotate: 0 },
    { id: 'l_shoe', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Leftshoe.png', x: 40, y: 85, width: 15, depth: 0.03, z: 4, rotate: -5 },
    { id: 'r_shoe', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Rightshoe.png', x: 60, y: 85, width: 15, depth: 0.03, z: 4, rotate: 5 },
  ];

  // --- WORDPRESS CONTENT STATE ---
  const [aboutContent, setAboutContent] = useState({
    title: "HET MOOIE DECODEREN",
    text: "Creativiteit is de kern. Als eigenaar van Wijzijnwolf.nl ben ik dagelijks bezig met video en beeld. Ai Papi is waar die visuele ervaring en technische nieuwsgierigheid samenkomen."
  });

  useEffect(() => {
    const fetchPageData = async () => {
        try {
            const response = await fetch(`${SITE_URL}/wp-json/wp/v2/pages?slug=over-ons`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const page = data[0];
                let cleanText = page.content.rendered.replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').replace(/\s+/g, ' ').trim();
                
                if (cleanText.length < 5) {
                    cleanText = "Tekst kon niet geladen worden vanuit WordPress. Controleer de pagina content.";
                }

                setAboutContent({
                    title: page.title.rendered,
                    text: cleanText
                });
            }
        } catch (err) {
            console.error("Kon WP pagina tekst niet laden:", err);
        }
    };
    fetchPageData();
  }, []);

  // --- FETCH PAYMENT GATEWAYS ---
  useEffect(() => {
    const fetchGateways = async () => {
        try {
             const response = await fetch(`${SITE_URL}/wp-json/wc/v3/payment_gateways?consumer_key=${CK}&consumer_secret=${CS}`);
             const data = await response.json();
             const enabled = data.filter(g => g.enabled);
             if (enabled.length > 0) {
                 setPaymentMethods(enabled);
                 setSelectedPaymentMethod(enabled[0].id);
             } else {
                 throw new Error("No gateways found");
             }
        } catch(e) { 
            console.error("Error fetching gateways:", e); 
            // HARD FALLBACK
            const fallbackMethods = [
                { id: 'mollie_wc_gateway_ideal', title: 'iDEAL', description: 'Betaal veilig met je eigen bank.' },
                { id: 'mollie_wc_gateway_creditcard', title: 'Creditcard', description: 'Visa, Mastercard, Amex.' },
                { id: 'mollie_wc_gateway_bancontact', title: 'Bancontact', description: 'Voor Belgische klanten.' }
            ];
            setPaymentMethods(fallbackMethods);
            setSelectedPaymentMethod('mollie_wc_gateway_ideal');
        }
    };
    fetchGateways();
  }, []);

  // --- CHECKOUT STATE ---
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', company: '', email: '',
    address: '', houseNumber: '', postcode: '', city: '', phone: ''
  });
  const [billingCountry, setBillingCountry] = useState('NL');
  
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);
  const [shippingData, setShippingData] = useState({
    firstName: '', lastName: '', company: '',
    address: '', houseNumber: '', postcode: '', city: ''
  });
  const [shippingCountry, setShippingCountry] = useState('NL');

  const handleBillingChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});
  const handleShippingChange = (e) => setShippingData({...shippingData, [e.target.name]: e.target.value});

  // --- HERO SHOWCASE STATE ---
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Navigation State
  const [view, setView] = useState('home'); 
  const [collectionPage, setCollectionPage] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right'); 

  // Modal States
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // --- VARIATION FETCHING & SELECTION ---
  useEffect(() => {
    if (!selectedProduct) {
      setProductVariations([]);
      return;
    }
    
    if(selectedProduct.sizes && selectedProduct.sizes.length > 0) {
        const hasA2 = selectedProduct.sizes.some(s => s.toUpperCase() === 'A2');
        if (hasA2) {
            setSelectedSize('A2');
        } else {
            setSelectedSize(selectedProduct.sizes[0]);
        }
    } else {
        setSelectedSize('A2');
    }

    const fetchVariations = async () => {
      setLoadingVariations(true);
      try {
        const response = await fetch(`${SITE_URL}/wp-json/wc/v3/products/${selectedProduct.id}/variations?consumer_key=${CK}&consumer_secret=${CS}`);
        if (response.ok) {
          const data = await response.json();
          setProductVariations(data);
        } else {
          setProductVariations([]);
        }
      } catch (err) {
        console.error("Error fetching variations:", err);
        setProductVariations([]);
      }
      setLoadingVariations(false);
    };

    fetchVariations();
  }, [selectedProduct]);

  const selectedVariation = useMemo(() => {
    if (!selectedProduct || productVariations.length === 0) return null;
    return productVariations.find(v => 
      v.attributes.some(attr => attr.option.toUpperCase() === selectedSize.toUpperCase())
    );
  }, [selectedProduct, selectedSize, productVariations]);

  const currentPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedVariation && selectedVariation.price) {
        return parseFloat(selectedVariation.price);
    }
    return selectedProduct.price || 0;
  }, [selectedProduct, selectedVariation]);

  const heroItems = useMemo(() => {
    if (products.length === 0) {
      return [
        { src: "https://iili.io/fqFKrgf.jpg", title: "LIQUID CHROME", gen: "GEN 01", seed: "839210" },
        { src: "https://iili.io/fqFK6J4.jpg", title: "NEON DRIFT", gen: "GEN 02", seed: "102938" },
        { src: "https://iili.io/fqFKg0G.jpg", title: "VOID SIGNAL", gen: "GEN 03", seed: "472819" },
        { src: "https://iili.io/fKNxzKP.png", title: "SYNTH WAVE", gen: "GEN 04", seed: "991823" }
      ];
    }
    return [...products]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5)
      .map(p => ({
        src: p.color,
        title: p.title.toUpperCase(),
        gen: `GEN ${p.id.toString().slice(-2)}`,
        seed: p.id
      }));
  }, [products]);

  const floatingItems = useMemo(() => {
    return heroItems.map((item, i) => ({
      ...item,
      top: Math.random() * 60 + 5,
      left: Math.random() * 80 + 10,
      duration: 8 + Math.random() * 7,
      delay: i * 2,
      rotation: Math.random() * 40 - 20,
      scale: Math.random() * 0.4 + 0.6
    }));
  }, [heroItems]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroItems.length]);

  const handleEnhance = () => setResLevel(prev => (prev + 1) % 5);

  const handleEcoCheck = () => {
    if (ecoStatus !== 'idle') return;
    setEcoStatus('scanning');
    setTimeout(() => setEcoStatus('clean'), 1500);
    setTimeout(() => setEcoStatus('idle'), 4000);
  };

  const handleTeleport = () => {
    // Keep function for future use
    console.log("System status checked");
  };

  const handleTuringTest = () => {
    // Keep function for future use
    console.log("Material spec viewed");
  };

  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0), [cartItems]);

  useEffect(() => {
    const fetchWooCommerceProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${SITE_URL}/wp-json/wc/v3/products?consumer_key=${CK}&consumer_secret=${CS}&status=publish&per_page=100`);
        if (!response.ok) throw new Error("Fout bij ophalen data");
        const wpData = await response.json();
        
        const mappedProducts = wpData.map(wpProduct => {
          const sizeAttr = wpProduct.attributes?.find(a => a.name.toLowerCase() === 'formaat' || a.name.toLowerCase() === 'size');
          const availableSizes = sizeAttr ? sizeAttr.options : ['A1', 'A2']; 

          return {
            id: wpProduct.id,
            title: wpProduct.name,
            price: parseFloat(wpProduct.price) || 0, 
            desc: wpProduct.short_description ? wpProduct.short_description.replace(/<[^>]*>?/gm, '') : "Geen beschrijving beschikbaar.", 
            category: wpProduct.categories[0]?.name || "Art",
            color: wpProduct.images[0]?.src || "from-gray-500 to-gray-700", 
            aspect: 'aspect-[3/4]',
            sizes: availableSizes,
            featured: wpProduct.featured || false
          };
        });
        
        setProducts(mappedProducts);
        setIsLoading(false);
      } catch (err) {
        console.error("Oeps, connectie mislukt:", err);
        setError("Kan geen verbinding maken met the shop. Controleer of je 'WP CORS' plugin aanstaat in WordPress.");
        setIsLoading(false);
      }
    };
    fetchWooCommerceProducts();
  }, []);

  const featuredDrops = useMemo(() => {
    const featured = products.filter(p => p.featured);
    return featured.length > 0 ? featured.slice(0, 3) : products.slice(0, 3);
  }, [products]);

  useEffect(() => {
      async function fetchInstagram() {
          if (!BEHOLD_URL) return;
          try {
              const res = await fetch(BEHOLD_URL);
              const data = await res.json();
              const postsArray = data.posts ? data.posts : (Array.isArray(data) ? data : []);
              setInstaPosts(postsArray.slice(0, 3)); 
          } catch (e) {
              console.error("Fout bij laden Instagram feed:", e);
              setInstaPosts([
                    { id: 'mock1', mediaUrl: 'https://iili.io/fqFKrgf.jpg', caption: 'Liquid Chrome', permalink: 'https://www.instagram.com/aipapiprints/', mediaType: 'IMAGE' },
                    { id: 'mock2', mediaUrl: 'https://iili.io/fqFK6J4.jpg', caption: 'Neon Drift', permalink: 'https://www.instagram.com/aipapiprints/', mediaType: 'IMAGE' },
                    { id: 'mock3', mediaUrl: 'https://iili.io/fqFKg0G.jpg', caption: 'Void Signal', permalink: 'https://www.instagram.com/aipapiprints/', mediaType: 'IMAGE' }
              ]);
          }
      }
      fetchInstagram();
  }, []);

  const addToCart = (product, size, price, variationId) => {
    const cartId = `${product.id}-${size}`; 
    setCartItems(prev => {
      const existing = prev.find(item => item.cartId === cartId);
      if (existing) {
        return prev.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        cartId: cartId,
        id: product.id, 
        variationId: variationId, 
        title: product.title, 
        price: price, 
        quantity: 1, 
        image: product.color,
        size: size 
      }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (cartId, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId) => {
    setCartItems(prev => prev.filter(item => item.cartId !== cartId));
  };
  
  const navigateTo = (targetView) => {
    setView(targetView);
    setMobileMenuOpen(false); 
    window.scrollTo(0, 0);
  };

  const nextPage = () => {
    if (collectionPage < totalPages - 1) {
      setSlideDirection('right');
      setCollectionPage(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (collectionPage > 0) {
      setSlideDirection('left');
      setCollectionPage(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (i) => {
    setSlideDirection(i > collectionPage ? 'right' : 'left');
    setCollectionPage(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommissionSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    const form = e.target;
    const data = new FormData();
    data.append('name', form.elements['name'].value);
    data.append('email', form.elements['email'].value);
    data.append('message', form.elements['message'].value);
    
    if (commissionFile) {
        data.append('file', commissionFile);
    }

    try {
        const res = await fetch(`${SITE_URL}/contact-upload.php`, {
            method: 'POST',
            body: data
        });

        if (res.ok) {
             setFormSubmitted(true);
             setTimeout(() => { 
                 setCommissionOpen(false); 
                 setFormSubmitted(false); 
                 setCommissionFile(null);
             }, 3000);
        } else {
            alert("Er ging iets mis bij het versturen. Probeer het later opnieuw.");
        }
    } catch (err) {
        console.error("Upload error:", err);
        alert("Kon geen verbinding maken met the server.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => { setContactOpen(false); setContactSubmitted(false); }, 2000);
  };
  
  const handleShare = (id) => {
    setCopiedId(id);
    const link = `${window.location.origin}/?product=${id}`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(link);
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlaceOrder = async (e) => {
    if (e) e.preventDefault();

    if (!termsAccepted) {
        alert("Je moet akkoord gaan met de algemene voorwaarden.");
        return;
    }
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.houseNumber) {
        alert("Vul alsjeblieft alle verplichte velden in.");
        return;
    }

    setIsProcessing(true);

    // 1. Prepare Line Items
    const line_items = cartItems.map(item => ({
        product_id: item.id,
        variation_id: item.variationId || 0,
        quantity: item.quantity
    }));

    // 2. Prepare Order Payload
    const orderData = {
        payment_method: selectedPaymentMethod,
        payment_method_title: paymentMethods.find(p => p.id === selectedPaymentMethod)?.title || 'Payment',
        set_paid: false,
        billing: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: `${formData.address} ${formData.houseNumber}`,
            city: formData.city,
            postcode: formData.postcode,
            country: billingCountry,
            email: formData.email,
            phone: formData.phone,
            company: formData.company
        },
        shipping: shipToDifferentAddress ? {
            first_name: shippingData.firstName,
            last_name: shippingData.lastName,
            address_1: `${shippingData.address} ${shippingData.houseNumber}`,
            city: shippingData.city,
            postcode: shippingData.postcode,
            country: shippingCountry,
            company: shippingData.company
        } : {
            first_name: formData.firstName,
            last_name: formData.lastName,
            address_1: `${formData.address} ${formData.houseNumber}`,
            city: formData.city,
            postcode: formData.postcode,
            country: billingCountry,
            company: formData.company
        },
        line_items: line_items
    };

    try {
        // 3. Create Order via WooCommerce API
        const response = await fetch(`${SITE_URL}/wp-json/wc/v3/orders?consumer_key=${CK}&consumer_secret=${CS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Fout bij aanmaken order.");
        }

        const order = await response.json();
        
        // 4. Handle Payment Redirect
        // Check if a payment URL is provided (some gateways return this)
        if (order.payment_url) {
            window.location.href = order.payment_url;
        } 
        // Fallback: Use standard WooCommerce 'Order Pay' endpoint
        else if (order.id && order.order_key) {
            const payUrl = `${SITE_URL}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;
            window.location.href = payUrl;
        } else {
             // Just in case no payment is needed (e.g. 100% discount or COD without redirect)
             setLastOrderedItems([...cartItems]);
             setCartItems([]);
             setView('thankyou');
             setIsProcessing(false);
             window.scrollTo(0,0);
        }

    } catch (err) {
        console.error("Order process error:", err);
        alert(`Er ging iets mis bij het afrekenen: ${err.message}`);
        setIsProcessing(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedProduct(null);
        setCommissionOpen(false);
        setContactOpen(false);
        setCartOpen(false);
        setShowAR(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const currentProducts = products.slice(collectionPage * ITEMS_PER_PAGE, (collectionPage + 1) * ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest animate-pulse">Initialising Neural Link...</p>
        {error && <p className="text-red-500 mt-4 text-xs font-mono">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-orange-500 selection:text-black overflow-x-hidden relative">
      
      {/* AR SCANNER OVERLAY */}
      {showAR && selectedProduct && (
        <ARScanner product={selectedProduct} onClose={() => setShowAR(false)} />
      )}

      {/* Background stays dark for main app, but we will override for checkout/thankyou */}
      <div className={`fixed inset-0 z-0 pointer-events-none ${view === 'checkout' || view === 'thankyou' ? 'hidden' : 'block'}`}>
          <div 
            className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 100, 0, 0.6), transparent 40%)`
            }}
          />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-orange-600/5 to-transparent blur-xl animate-pulse-slow"></div>
      </div>

      {/* NAV - Conditional Styling */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-8'} ${(view === 'checkout' || view === 'thankyou') ? 'bg-black/90 text-white border-b border-white/10' : ''}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div 
            className="text-2xl font-bold tracking-tighter flex items-center gap-2 group cursor-pointer"
            onClick={() => navigateTo('home')}
          >
             {/* Logo */}
            <img 
              src="https://www.aipostershop.nl/wp-content/uploads/2025/11/AiPapiLogo.svg" 
              alt="Ai Papi Logo" 
              className={`h-16 w-auto group-hover:rotate-6 transition-transform duration-300`}
            />
          </div>

          <div className={`hidden md:flex items-center gap-12 text-sm font-medium tracking-wide text-gray-400`}>
            <button onClick={() => navigateTo('home')} className={`hover:text-orange-500 transition-colors relative group ${view === 'home' ? 'text-white' : ''}`}>
              Home
            </button>
            <button onClick={() => navigateTo('collection')} className={`hover:text-orange-500 transition-colors relative group ${view === 'collection' ? 'text-white' : ''}`}>
              Collecties
            </button>
            <button onClick={() => navigateTo('process')} className={`hover:text-white transition-colors relative group ${view === 'process' ? 'text-white' : ''}`}>
              Proces
            </button>
            <button onClick={() => navigateTo('about')} className={`hover:text-white transition-colors relative group ${view === 'about' ? 'text-white' : ''}`}>
              Over
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative group" onClick={() => setCartOpen(true)}>
              <ShoppingBag className={`w-5 h-5 transition-colors text-gray-300 group-hover:text-white`} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- CONTENT WRAPPER --- */}
      <div 
        className={`relative z-10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          selectedProduct || commissionOpen || cartOpen || contactOpen ? 'blur-xl scale-[0.98] opacity-50 pointer-events-none grayscale' : 'blur-0 scale-100 opacity-100'
        }`}
      >
        {view === 'home' && (
          <div className="animate-in fade-in duration-700">
            <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
              <div className="absolute inset-0 z-0 opacity-10" 
                   style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100px 100px' }}>
              </div>

              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                 {floatingItems.map((item, i) => (
                    <div 
                      key={`float-${i}`}
                      className="absolute opacity-60 blur-sm transition-all"
                      style={{
                        top: `${item.top}%`,
                        left: `${item.left}%`,
                        animationName: 'float',
                        animationDuration: `${item.duration}s`,
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDirection: 'alternate',
                        animationDelay: `${item.delay}s`
                      }}
                    >
                       <div 
                          className="w-32 h-40 bg-gray-800 border border-white/10 rounded-sm overflow-hidden shadow-lg"
                          style={{ 
                            transform: `rotate(${item.rotation}deg) scale(${item.scale})` 
                          }}
                       >
                          <img src={item.src} alt="" className="w-full h-full object-cover opacity-80" />
                       </div>
                    </div>
                 ))}
              </div>

              <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/20 rounded-full text-xs font-mono text-green-400 uppercase tracking-widest bg-green-900/10">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_#4ade80]"></span>
                    Status: currently prompting
                  </div>
                  
                  <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] text-white mix-blend-difference">
                    FRESH <br />
                    <span className="relative inline-block group cursor-none">
                      <span className="relative z-10 group-hover:text-orange-600 transition-colors duration-100">PRINTS</span>
                      <span className="absolute top-0 left-0 -ml-1 text-red-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-75 mix-blend-screen">PRINTS</span>
                      <span className="absolute top-0 left-0 -ml-1 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-75 mix-blend-screen">PRINTS</span>
                    </span>
                  </h1>

                  <p className="text-gray-400 text-lg md:text-xl max-w-md leading-relaxed">
                      Esthetische artworks gedrukt op hoog kwaliteit papier. Een blend van van neurale netwerken en tastbare kunst.                    </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                    {/* Minimalist Stat Block */}
                    <div className="border-l-2 border-white/10 pl-6 py-2 hover:border-orange-500/50 transition-colors duration-300 group cursor-default">
                        <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> System Status
                        </h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-white">{products.length}</span>
                            <span className="text-xs text-gray-400">Assets Live</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-[10px] text-green-500 font-mono">OPERATIONAL</span>
                        </div>
                    </div>

                    {/* Minimalist Specs Block */}
                    <div className="border-l-2 border-white/10 pl-6 py-2 hover:border-blue-500/50 transition-colors duration-300 group cursor-default">
                        <h4 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Print Specs
                        </h4>
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">250g/m² Woodfree Satin MC</span>
                             <span className="text-xs text-gray-400">Gloss Laminate Finish</span>
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-gray-500">
                            PREMIUM FINISH
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-4">
                    <button 
                      onClick={() => navigateTo('collection')}
                      className="bg-white text-black px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center gap-3 group"
                    >
                      Bekijk Galerij
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative w-full max-w-[450px] aspect-[3/4] hidden md:block perspective-1000 mx-auto">
                   <div 
                      className="absolute inset-0 transition-transform duration-100 ease-linear"
                      style={{
                        transform: `rotateY(${(mousePos.x - window.innerWidth/2) * 0.02}deg) rotateX(${-(mousePos.y - window.innerHeight/2) * 0.02}deg)`,
                        transformStyle: 'preserve-3d'
                      }}
                   >
                      {heroItems.map((img, index) => (
                        <div 
                            key={index}
                            className={`absolute inset-0 bg-black border border-white/10 rounded-sm overflow-hidden shadow-2xl transition-all duration-700 ease-in-out ${index === heroIndex ? 'opacity-100 translate-z-0' : 'opacity-0 -translate-z-12 pointer-events-none'}`}
                        >
                             <img src={img.src} alt={img.title} className="w-full h-full object-cover opacity-90" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                             <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-white/5 to-transparent h-2 w-full animate-[scan_3s_linear_infinite]"></div>

                             <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                        <p className="text-xs font-mono text-orange-500 uppercase tracking-widest">{img.gen}</p>
                                    </div>
                                    <h3 className="text-5xl font-black text-white mix-blend-difference tracking-tighter truncate max-w-md">{img.title}</h3>
                                </div>
                                
                                <div className="text-right">
                                    <p className="text-[10px] font-mono text-gray-500">SEED: {img.seed}</p>
                                    <div className="mt-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                                        <ScanLine className="w-3 h-3 text-white" />
                                        <span className="text-xs font-bold text-white">Live Render</span>
                                    </div>
                                </div>
                             </div>
                        </div>
                      ))}
                      <div className="absolute inset-0 border border-white/5 pointer-events-none"></div>
                      <div className="absolute top-4 right-4 flex gap-1">
                          <div className="w-1 h-1 bg-white/20"></div>
                          <div className="w-1 h-1 bg-white/20"></div>
                          <div className="w-1 h-1 bg-white/20"></div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-orange-500 to-transparent"></div>
              </div>
            </header>

            <div className="bg-orange-600 py-4 overflow-hidden -rotate-1 relative z-20 shadow-lg shadow-orange-900/50">
              <div className="flex whitespace-nowrap animate-marquee">
                {[...Array(10)].map((_, i) => (
                  <span key={i} className="text-black font-black text-2xl mx-8 uppercase flex items-center gap-4">
                    UNIQUE PRINTS <Sparkles className="w-5 h-5 fill-black" /> ENRICH YOUR SPACE <div className="w-2 h-2 bg-black rounded-full"></div>
                  </span>
                ))}
              </div>
            </div>

            {!isLoading && featuredDrops.length > 0 && (
              <section className="py-24 relative border-b border-white/5 bg-gradient-to-b from-black to-zinc-900/30">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                <div className="container mx-auto px-6 relative z-10">
                  <div className="flex items-center justify-center gap-4 mb-16">
                     <div className="h-px w-12 bg-orange-500/50"></div>
                     <span className="text-xs font-mono text-orange-500 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> Featured Drops
                     </span>
                     <div className="h-px w-12 bg-orange-500/50"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
                    {featuredDrops.map((product, index) => (
                      <div 
                        key={product.id} 
                        className={`group relative cursor-pointer transition-all duration-500 ${index === 1 ? 'md:-translate-y-6 z-10' : 'hover:-translate-y-2 opacity-80 hover:opacity-100'}`}
                        onClick={() => setSelectedProduct(product)}
                      >
                         {index === 1 && <div className="absolute inset-0 -m-4 bg-orange-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>}
                         
                         <div className={`relative aspect-[3/4] bg-gray-900 border ${index === 1 ? 'border-orange-500/50 shadow-[0_0_30px_rgba(234,88,12,0.15)]' : 'border-white/10'} rounded-sm overflow-hidden shadow-2xl transition-all duration-500`}>
                            {product.color.includes('http') ? (
                              <img src={product.color} alt={product.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                            ) : (
                              <div className={`w-full h-full bg-gradient-to-br ${product.color}`}></div>
                            )}
                            
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-end justify-between">
                               <div className="text-left">
                                  <p className="text-xs font-bold text-white uppercase tracking-wider">{product.title}</p>
                                  <p className="text-[10px] font-mono text-orange-500 mt-1">LIMITED EDITION</p>
                               </div>
                               <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-100">
                                  <ArrowRight className="w-4 h-4" />
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section id="collections" className="py-32 relative">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">The Latest and Greatest</h2>
                    <div className="h-1 w-20 bg-orange-600"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {isLoading ? (
                    <div className="text-white">Laden...</div>
                  ) : (
                    products.slice(0, 8).map((product) => (
                        <ProductCard 
                            key={product.id}
                            product={product}
                            onClick={setSelectedProduct}
                            onAddToCart={addToCart}
                        />
                    ))
                  )}
                </div>
                <div className="mt-20 text-center">
                  <button onClick={() => navigateTo('collection')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors border border-white/10 px-8 py-3 rounded-full hover:border-white/30 hover:bg-white/5">
                    Bekijk Volledige Collectie <MoveRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            <section className="py-32 bg-white text-black relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gray-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">
                      KUNST UIT HET <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-purple-600">ALGORITME</span>
                    </h2>
                    <p className="text-xl font-medium leading-relaxed mb-6">
                      Ai Papi is een print studio die esthetische digitale kunst als print beschikbaar maakt. Voor iedere locatie!
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div 
                          className="group bg-gray-50 p-5 rounded-sm border border-gray-200 hover:border-blue-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                          onClick={handleEnhance}
                        >
                            <div className="relative z-10">
                                <div className="mb-4 p-2 bg-white w-fit rounded-full shadow-sm group-hover:scale-110 transition-transform duration-500">
                                    <Maximize className="w-5 h-5 text-gray-900 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h4 className="font-black text-2xl mb-1 group-hover:text-blue-600 transition-colors text-gray-900">
                                    {["4K+ RES", "8K ULTRA", "16K HYPER", "REALITY.ISO", "TOO SHARP"][resLevel]}
                                </h4>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                    {["Standaard", "Enhanced", "God Mode", "Simulation", "Go Back"][resLevel]}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                   <Sparkles className="w-3 h-3" /> Klik om te upscalen
                                </p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-5 transform rotate-12">
                                <Aperture className="w-24 h-24 text-blue-500" />
                            </div>
                        </div>

                        <div 
                          className="group bg-gray-50 p-5 rounded-sm border border-gray-200 hover:border-green-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                          onMouseEnter={handleEcoCheck}
                        >
                            <div className="relative z-10">
                                <div className="mb-4 p-2 bg-white w-fit rounded-full shadow-sm group-hover:rotate-12 transition-transform duration-500">
                                    <Leaf className={`w-5 h-5 text-gray-900 group-hover:text-green-500 transition-colors ${ecoStatus === 'scanning' ? 'animate-bounce' : ''}`} />
                                </div>
                                <h4 className="font-black text-2xl mb-1 group-hover:text-green-600 transition-colors text-gray-900 truncate">
                                    {ecoStatus === 'idle' && "100% ECO"}
                                    {ecoStatus === 'scanning' && "SCANNING..."}
                                    {ecoStatus === 'clean' && "0% TOXINS"}
                                </h4>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                                    {ecoStatus === 'idle' && "Carbon Neutral"}
                                    {ecoStatus === 'scanning' && "Checking Air Quality"}
                                    {ecoStatus === 'clean' && "Certified Fresh"}
                                </p>
                                 <p className="text-[10px] text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                   <Check className="w-3 h-3" /> Geen verf verspild
                                </p>
                            </div>
                            <div className="absolute -right-4 -bottom-4 opacity-5 transform -rotate-12">
                                <Leaf className="w-24 h-24 text-green-500" />
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="bg-black text-white p-12 relative z-10 rotate-2 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                      <h3 className="text-2xl font-bold mb-4">Het Proces</h3>
                      <ul className="space-y-4 font-mono text-sm text-gray-400">
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px]">01</span>
                          Prompt Engineering
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px]">02</span>
                          Upscaling & Restoratie
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px]">03</span>
                          Fine Art Giclée Printing
                        </li>
                        <li className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-[10px]">04</span>
                          Wereldwijde Verzending
                        </li>
                      </ul>
                      <div className="mt-8 pt-8 border-t border-gray-800">
                        <p className="italic text-gray-500">"Dikke prints voor aan je muur"</p>
                        <p className="font-bold mt-2">- Aiii Papi!</p>
                      </div>
                    </div>
                    <div className="absolute inset-0 border-2 border-black rotate-6 translate-x-4 translate-y-4 -z-0"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {view === 'collection' && (
          <div className="min-h-screen pt-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="container mx-auto px-6">
                <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                    <p className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-2">Archive_v2.0</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                        DE COLLECTIE
                    </h1>
                    </div>
                    <div className="text-right">
                    <p className="text-sm text-gray-400 font-mono">
                        PAGINA {collectionPage + 1} / {totalPages}
                    </p>
                    </div>
                </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 min-h-[1000px] animate-in fade-in duration-700 ease-out-expo">
                     {currentProducts.map((product) => (
                        <ProductCard key={product.id} product={product} onClick={setSelectedProduct} onAddToCart={addToCart} />
                     ))}
                 </div>
                 
                  <div className="flex justify-between items-center border-t border-white/10 pt-8">
                     <button onClick={prevPage} disabled={collectionPage === 0} className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft className="w-4 h-4" /> Vorige</button>
                     <div className="flex gap-2">{[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => goToPage(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === collectionPage ? 'bg-orange-500 w-8' : 'bg-gray-700 hover:bg-gray-500'}`} />))}</div>
                     <button onClick={nextPage} disabled={collectionPage === totalPages - 1} className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">Volgende <ChevronRight className="w-4 h-4" /></button>
                  </div>
              </div>
              
            <div className="mt-20 bg-orange-600 text-black py-32 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
               <div className="absolute -top-20 -right-20 w-96 h-96 bg-black/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
               <div className="container mx-auto px-6 relative z-10 text-center animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex items-center justify-center p-3 bg-black/10 rounded-full mb-8">
                    <Wand2 className="w-6 h-6 animate-pulse" />
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
                     KUN JE JE SOUL NIET VINDEN?
                  </h2>
                  <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed opacity-80">
                    Zit er niets tussen wat bij je past? No worries! Vertel ons wat je vet vind, stuur voorbeelden mee en wij gaan er mee aan de slag.
                  </p>
                  <button 
                    onClick={() => setCommissionOpen(true)}
                    className="bg-black text-white px-10 py-5 font-bold text-sm uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
                  >
                    Start een Commissie <ArrowRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
          </div>
        )}

        {view === 'process' && (
             <div className="min-h-screen pt-32 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="container mx-auto px-6">
                <div className="text-center max-w-4xl mx-auto mb-24">
                   <p className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-4">Voorbij de Prompt</p>
                   <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none">
                      HET ALGORITME <br/> & <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-500">DE ARTIEST</span>
                   </h1>
                   <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                     Kunst genereren is makkelijk. Een <i>ziel</i> genereren is een ambacht. We combineren traditionele ontwerpprincipes met geavanceerde neurale netwerken om iets echt unieks te creëren.
                   </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 mb-32">
                   <div className="bg-white/5 border border-white/10 p-8 rounded-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                         <Terminal className="w-12 h-12 text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><span className="text-orange-500">01.</span> CONCEPT</h3>
                      <p className="text-gray-400 leading-relaxed">
                          Het begint met een visie. We typen niet zomaar woorden; we deconstrueren abstracte ideeën naar beeldtaal, puttend uit tien jaar ervaring in ontwerptheorie en fotografie.
                      </p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-8 rounded-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                         <Cpu className="w-12 h-12 text-purple-500" />
                      </div>
                      <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><span className="text-purple-500">02.</span> ENGINEERING</h3>
                      <p className="text-gray-400 leading-relaxed">
                          Het geheime ingrediënt. Met jarenlange kennis sinds de vroege dagen van DALL-E 1, "koken" we de perfecte prompt, met honderden iteraties om de belichting en compositie van het model te sturen.
                      </p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-8 rounded-sm relative overflow-hidden group hover:bg-white/10 transition-colors">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                         <Printer className="w-12 h-12 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-black mb-4 flex items-center gap-3"><span className="text-green-500">03.</span> AFWERKING</h3>
                      <p className="text-gray-400 leading-relaxed">
                          De machine is slechts het begin. We fine-tunen handmatig, doen color grading in Photoshop en upscalen naar 8K, zodat elke pixel intentioneel en print-klaar is.
                      </p>
                   </div>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center mb-32">
                   <div className="relative h-[500px] bg-gray-900 rounded-lg overflow-hidden border border-white/10 group">
                      <img 
                        src="https://www.aipostershop.nl/wp-content/uploads/2025/11/EarlyDays.jpg" 
                        alt="Begin werk uit 2021" 
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                      
                      <div className="absolute bottom-0 left-0 w-full p-8">
                         <p className="font-mono text-xs text-orange-500 mb-2">EST. 2021</p>
                         <h4 className="text-2xl font-bold">Begin werk uit 2021</h4>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <h3 className="text-4xl font-bold">ONDERSTEUND DOOR ERVARING.</h3>
                      <div className="space-y-4 text-lg text-gray-400 leading-relaxed">
                         <p>
                            "Ik creëer al jaren visuals met Photoshop, fotografie en videografie. Ik ben niet zomaar op de AI-trein gesprongen; ik ben erbij sinds het begin."
                         </p>
                         <p>
                            Mijn achtergrond stelt me in staat de taal van de modellen vloeiend te spreken. Ik ken de nieuwste workflows, de beste modellen en precies hoe ik parameters moet aanpassen voor die specifieke esthetiek. Dit is geen automatie—het is digitale alchemie.
                         </p>
                      </div>
                      <button 
                        onClick={() => setCommissionOpen(true)}
                        className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        Start Jouw Project <ArrowRight className="w-4 h-4" />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'about' && (
          <div className="min-h-screen pt-40 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-black">
             <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,100,0,0.15),transparent_50%)] pointer-events-none"></div>
             
             <div className="container mx-auto px-6 mb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-20">
                   
                   <div className="w-full md:w-1/2 flex justify-center perspective-1000 relative">
                      <div className="absolute -inset-1 bg-orange-500/5 blur-xl animate-pulse-slow pointer-events-none"></div>
                      <div className="absolute -inset-20 bg-orange-600/5 blur-[100px] rounded-full pointer-events-none"></div>
                      
                      <div 
                         className="relative w-[340px] h-[460px] transition-transform duration-100 ease-linear group"
                         style={{
                           transform: `rotateY(${(mousePos.x - window.innerWidth/2) * 0.05}deg) rotateX(${-(mousePos.y - window.innerHeight/2) * 0.05}deg)`
                         }}
                      >
                         <div className="absolute inset-0 z-0">
                            <img 
                              src="https://www.aipostershop.nl/wp-content/uploads/2025/11/Lee.jpg" 
                              alt="The Architect" 
                              className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                              style={{
                                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                              }}
                            />
                            {/* Holographic Scanline Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent h-2 w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                            
                            {/* Glitch/Noise Overlay */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                         </div>
                         
                         {/* Floating HUD Elements */}
                         <div className="absolute top-10 -right-12 space-y-4 text-right hidden md:block">
                            <div className="bg-black/80 backdrop-blur-md border-r-2 border-orange-500 p-3 pr-4 transform translate-x-4 group-hover:translate-x-0 transition-transform duration-500">
                                <p className="text-[10px] text-gray-400 font-mono mb-1">IDENTITY_MATRIX</p>
                                <h3 className="text-xl font-black text-white">DE ARCHITECT</h3>
                            </div>
                            
                            <div className="bg-black/80 backdrop-blur-md border-r-2 border-green-500 p-2 pr-4 transform translate-x-8 group-hover:translate-x-0 transition-transform duration-700 delay-100">
                                <div className="flex items-center justify-end gap-2 text-xs font-mono text-green-400">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                                    SYSTEM_ONLINE
                                </div>
                            </div>

                            <div className="bg-black/80 backdrop-blur-md border-r-2 border-white/20 p-2 pr-4 transform translate-x-12 group-hover:translate-x-0 transition-transform duration-1000 delay-200">
                                <p className="text-[10px] font-mono text-orange-500">ID: 0x992...A1</p>
                            </div>
                         </div>

                         {/* Mobile Fallback HUD (Bottom) */}
                         <div className="absolute bottom-0 left-0 right-0 p-4 md:hidden bg-gradient-to-t from-black to-transparent">
                            <h3 className="text-2xl font-black text-white text-center">DE ARCHITECT</h3>
                            <div className="flex justify-center gap-4 mt-2 font-mono text-xs">
                                <span className="text-orange-500">Visual Futurist</span>
                                <span className="text-green-500">ONLINE</span>
                            </div>
                         </div>
                         
                         {/* Deco Elements */}
                         <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-orange-500/50"></div>
                         <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-orange-500/50"></div>
                      </div>
                   </div>

                   <div className="w-full md:w-1/2 space-y-8">
                      <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 bg-white/5 rounded-full text-xs font-mono text-gray-400 uppercase tracking-widest backdrop-blur-sm">
                         <div className="w-2 h-2 bg-white rounded-full"></div>
                         Over Mij
                      </div>
                      
                      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                         {aboutContent.title.includes(' ') ? (
                            <>
                                {aboutContent.title.split(' ').slice(0, -1).join(' ')} <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-600 drop-shadow-sm">
                                    {aboutContent.title.split(' ').pop()}
                                </span>
                            </>
                         ) : (
                             aboutContent.title
                         )}
                      </h1>
                      
                      <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-medium">
                         {aboutContent.text}
                      </p>
                      
                      <div className="flex gap-6 pt-6">
                         <div className="group relative p-6 bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-orange-500/50 transition-colors duration-300 w-40">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-3xl font-black text-orange-500 mb-1 relative z-10">4+</h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest relative z-10">Jaren Prompting</p>
                         </div>
                         
                         <div className="group relative p-6 bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/30 transition-colors duration-300 w-40">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h4 className="text-3xl font-black text-white mb-1 relative z-10">150k+</h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest relative z-10">Generaties</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-black text-white py-32 relative overflow-hidden border-t border-white/10">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent opacity-50"></div>
                <div className="container mx-auto px-6 relative z-10">
                   <div className="max-w-4xl mx-auto">
                      <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-tighter">VAN VIDEO NAAR VISIE</h2>
                      <div className="grid md:grid-cols-2 gap-12 text-lg leading-relaxed font-medium text-gray-400">
                         <p>
                            Ik ben altijd al een maker geweest. Met mijn bedrijf <span className="text-white">Wijzijnwolf.nl</span> produceer ik dagelijks video-content, en die drive om te creëren stopt niet als de camera uitgaat. Ik volg de AI-ontwikkelingen op de voet en gebruik die dagelijkse stroom aan innovatie om nieuwe beelden te smeden. De technische bagage die ik door de jaren heen heb opgebouwd, blijkt nu de perfecte toolset voor het aansturen van deze modellen.
                         </p>
                         <p>
                            Het ontwikkelen van een prompt is voor mij een nieuw soort ambacht. Het is zoeken naar dat specifieke, creatieve mengsel van woorden dat precies de juiste snaar raakt. Het gaat om het creëren van het perfecte beeld en de juiste vibe, waarbij ik mijn kennis van licht en compositie nu toepas via tekst en code. Ai Papi is het tastbare resultaat van die digitale zoektocht.
                         </p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mt-20 border-t border-white/10 pt-12">
                         <div className="text-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-16 h-16 bg-white/5 text-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 transition-colors border border-white/10">
                               <Terminal className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold uppercase tracking-widest text-sm">Code</h4>
                         </div>
                         <div className="text-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                             <div className="w-16 h-16 bg-white/5 text-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 transition-colors border border-white/10">
                               <Cpu className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold uppercase tracking-widest text-sm">Compute</h4>
                         </div>
                         <div className="text-center group cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                             <div className="w-16 h-16 bg-white/5 text-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-600 transition-colors border border-white/10">
                               <Palette className="w-8 h-8" />
                            </div>
                            <h4 className="font-bold uppercase tracking-widest text-sm">Canvas</h4>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'checkout' && (
          <div className="min-h-screen pt-32 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-black">
             <div className="container mx-auto px-6 max-w-7xl">
                <div className="mb-12">
                   <button onClick={() => setView('home')} className="text-sm text-gray-500 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                      <ChevronLeft className="w-4 h-4" /> Terug naar Winkel
                   </button>
                   <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Afreken <span className="text-orange-500">Protocol</span></h1>
                </div>

                <div className="grid lg:grid-cols-12 gap-12">
                   {/* LEFT COLUMN: FORMS */}
                   <div className="lg:col-span-7 space-y-12">
                      
                      {/* BILLING */}
                      <div className="space-y-6">
                         <h3 className="text-xl font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">1</span>
                            Factuurgegevens
                         </h3>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Voornaam *</label>
                               <input name="firstName" value={formData.firstName} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Achternaam *</label>
                               <input name="lastName" value={formData.lastName} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                         </div>
                         <div className="space-y-1">
                             <label className="text-[10px] font-mono text-gray-500 uppercase">Bedrijfsnaam (Optioneel)</label>
                             <input name="company" value={formData.company} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">E-mailadres *</label>
                               <input name="email" type="email" value={formData.email} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Telefoonnummer *</label>
                               <input name="phone" value={formData.phone} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Straatnaam *</label>
                               <input name="address" value={formData.address} onChange={handleBillingChange} placeholder="Straatnaam" className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                             <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Huisnummer *</label>
                               <input name="houseNumber" value={formData.houseNumber} onChange={handleBillingChange} placeholder="12A" className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Postcode *</label>
                               <input name="postcode" value={formData.postcode} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Stad *</label>
                               <input name="city" value={formData.city} onChange={handleBillingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                            </div>
                         </div>
                         <div className="space-y-1">
                               <label className="text-[10px] font-mono text-gray-500 uppercase">Land</label>
                               <select value={billingCountry} onChange={(e) => setBillingCountry(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm appearance-none cursor-not-allowed opacity-50" disabled>
                                   <option value="NL">Nederland</option>
                               </select>
                        </div>
                      </div>

                      {/* SHIPPING TOGGLE */}
                      <div>
                         <label className="flex items-center gap-3 cursor-pointer group">
                             <div className={`w-5 h-5 border border-white/20 flex items-center justify-center transition-colors ${shipToDifferentAddress ? 'bg-orange-500 border-orange-500' : 'bg-transparent'}`}>
                                 <input type="checkbox" className="hidden" checked={shipToDifferentAddress} onChange={() => setShipToDifferentAddress(!shipToDifferentAddress)} />
                                 {shipToDifferentAddress && <Check className="w-3 h-3 text-white" />}
                             </div>
                             <span className="text-sm font-bold uppercase group-hover:text-orange-500 transition-colors">Verzenden naar een ander adres?</span>
                         </label>

                         {/* SHIPPING FORM */}
                         {shipToDifferentAddress && (
                             <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 fade-in pl-8 border-l border-white/10">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Voornaam</label>
                                    <input name="firstName" value={shippingData.firstName} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                    <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-gray-500 uppercase">Achternaam</label>
                                    <input name="lastName" value={shippingData.lastName} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                </div>
                                {/* ... Same address fields as billing ... */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-mono text-gray-500 uppercase">Straatnaam</label>
                                        <input name="address" value={shippingData.address} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-gray-500 uppercase">Huisnummer</label>
                                        <input name="houseNumber" value={shippingData.houseNumber} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-gray-500 uppercase">Postcode</label>
                                        <input name="postcode" value={shippingData.postcode} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono text-gray-500 uppercase">Stad</label>
                                        <input name="city" value={shippingData.city} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                                    </div>
                                </div>
                             </div>
                         )}
                      </div>
                      
                      {/* PAYMENT METHODS */}
                      <div className="space-y-6">
                         <h3 className="text-xl font-bold border-b border-white/10 pb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-xs">2</span>
                            Betaalmethode
                         </h3>
                         <div className="space-y-3">
                             {paymentMethods.map(method => (
                                 <label key={method.id} className={`flex items-center gap-4 p-4 border rounded-sm cursor-pointer transition-all ${selectedPaymentMethod === method.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}`}>
                                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedPaymentMethod === method.id ? 'border-orange-500' : 'border-gray-500'}`}>
                                         {selectedPaymentMethod === method.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                     </div>
                                     <div className="flex-1">
                                         <div className="flex items-center gap-2">
                                             <span className="font-bold">{method.title}</span>
                                             {method.id.includes('ideal') && <CreditCard className="w-4 h-4 text-pink-600" />}
                                             {method.id.includes('card') && <CreditCard className="w-4 h-4 text-yellow-500" />}
                                         </div>
                                         <p className="text-xs text-gray-400 mt-1">{method.description}</p>
                                     </div>
                                 </label>
                             ))}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-green-500 bg-green-900/10 p-3 rounded-sm border border-green-500/20">
                             <Lock className="w-3 h-3" />
                             <span className="font-mono">SSL BEVEILIGDE VERBINDING - 256-BIT SECURE</span>
                         </div>
                      </div>
                   </div>

                   {/* RIGHT COLUMN: SUMMARY */}
                   <div className="lg:col-span-5">
                      <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-sm sticky top-32">
                          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                             <Package className="w-5 h-5 text-orange-500" />
                             Besteloverzicht
                          </h3>
                          
                          <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                              {cartItems.map((item) => (
                                  <div key={item.cartId} className="flex gap-4 items-center">
                                      <div className="w-16 h-20 bg-gray-800 rounded-sm overflow-hidden relative shrink-0">
                                         {item.image.includes('http') ? <img src={item.image} className="w-full h-full object-cover" /> : <div className={`w-full h-full bg-gradient-to-br ${item.image}`} />}
                                         <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold">{item.quantity}</span>
                                      </div>
                                      <div className="flex-1">
                                          <h4 className="font-bold text-sm text-white line-clamp-1">{item.title}</h4>
                                          <p className="text-[10px] text-gray-500 uppercase">{item.size}</p>
                                      </div>
                                      <span className="font-mono text-sm">€{(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                              ))}
                          </div>

                          <div className="space-y-3 border-t border-white/10 pt-6 mb-6">
                              <div className="flex justify-between text-sm text-gray-400">
                                  <span>Subtotaal</span>
                                  <span className="font-mono text-white">€{cartTotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-gray-400">
                                  <span>Verzending (NL)</span>
                                  <span className="font-mono text-green-500">GRATIS</span>
                              </div>
                              <div className="flex justify-between text-xl font-black text-white pt-4 border-t border-white/10">
                                  <span>TOTAAL</span>
                                  <span>€{cartTotal.toFixed(2)}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 text-right">Inclusief BTW</p>
                          </div>
                          
                          <div className="space-y-6">
                              <label className="flex items-start gap-3 cursor-pointer group">
                                 <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${termsAccepted ? 'bg-orange-500 border-orange-500' : 'border-white/20 bg-transparent'}`}>
                                     <input type="checkbox" className="hidden" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} />
                                     {termsAccepted && <Check className="w-3 h-3 text-white" />}
                                 </div>
                                 <span className="text-xs text-gray-400 group-hover:text-white transition-colors">
                                     Ik heb de <a href="#" className="underline decoration-orange-500 underline-offset-2 hover:text-orange-500">algemene voorwaarden</a> gelezen en ga hiermee akkoord *
                                 </span>
                              </label>

                              <button 
                                 onClick={handlePlaceOrder}
                                 disabled={isProcessing}
                                 className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden group"
                              >
                                 {isProcessing ? (
                                     <>Verwerken... <Loader2 className="w-4 h-4 animate-spin" /></>
                                 ) : (
                                     <>Bestelling Plaatsen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                 )}
                              </button>
                          </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {view === 'thankyou' && (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                <Confetti />
                
                <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center animate-in zoom-in duration-500">
                    
                    {/* LEFT: 3D HERO PRODUCT */}
                    <div className="flex flex-col items-center">
                         {lastOrderedItems.length > 0 ? (
                             <div className="relative w-[300px] md:w-[400px] aspect-[3/4] perspective-1000 group">
                                <div 
                                    className="relative w-full h-full transition-transform duration-100 ease-linear shadow-2xl rounded-sm overflow-hidden border border-white/10"
                                    style={{
                                        transform: `rotateY(${(mousePos.x - window.innerWidth/2) * 0.05}deg) rotateX(${-(mousePos.y - window.innerHeight/2) * 0.05}deg)`
                                    }}
                                >
                                    {lastOrderedItems[0].image.includes('http') ? (
                                        <img src={lastOrderedItems[0].image} alt="Ordered Art" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${lastOrderedItems[0].image}`}></div>
                                    )}
                                    {/* Gloss/Reflection overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 border border-white/10">
                                        <p className="text-white font-bold text-lg">{lastOrderedItems[0].title}</p>
                                        <p className="text-green-400 text-xs font-mono uppercase">Successfully Acquired</p>
                                    </div>
                                </div>
                                {/* Glow behind */}
                                <div className="absolute -inset-10 bg-green-500/20 blur-[50px] -z-10 rounded-full opacity-50"></div>
                             </div>
                         ) : (
                             <div className="text-white">Geen order data gevonden.</div>
                         )}
                    </div>

                    {/* RIGHT: CYBER RECEIPT */}
                    <div className="space-y-8 text-center md:text-left">
                        <div>
                            <div className="inline-flex items-center justify-center p-4 bg-green-500/10 rounded-full mb-6 border border-green-500/20">
                                <Check className="w-8 h-8 text-green-500" />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">ORDER<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CONFIRMED</span></h1>
                            <p className="text-gray-400 text-lg">Je kunstwerk wordt voorbereid voor transport.</p>
                        </div>

                        {/* Receipt Box */}
                        <div className="bg-gray-900 border border-white/10 p-6 font-mono text-sm relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between border-b border-white/10 pb-2 text-gray-500 text-xs">
                                    <span>ORDER ID</span>
                                    <span>DATE</span>
                                </div>
                                <div className="flex justify-between text-white mb-4">
                                    <span>#AI-{Math.floor(Math.random()*10000)}</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                                <div className="space-y-2">
                                    {lastOrderedItems.map((item, i) => (
                                        <div key={i} className="flex justify-between text-gray-300">
                                            <span>{item.quantity}x {item.title}</span>
                                            <span>{item.size}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/10 pt-4 flex justify-between text-green-400 font-bold">
                                    <span>STATUS</span>
                                    <span>PAID / PROCESSING</span>
                                </div>
                            </div>
                             {/* Scanline */}
                            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                        </div>

                        <button 
                            onClick={() => { setView('home'); setLastOrderedItems([]); }}
                            className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center gap-2 mx-auto md:mx-0"
                        >
                            <Home className="w-4 h-4" /> Terug naar Home
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div> 

       {/* ... Modals (SelectedProduct, Contact, Commission, Cart) ... */}
       {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-700" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] bg-black border border-white/10 shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12 rounded-lg animate-in zoom-in-[0.95] fade-in duration-500 slide-in-from-bottom-8 ease-out-expo">
             
             {/* --- MOBILE LAYOUT (< md) --- */}
             <div className="md:hidden relative w-full h-full bg-black">
               {/* 1. Full Screen Image Layer */}
               <div className="absolute inset-0 z-0">
                   {/* Blurred BG for Fill */}
                   <div className="absolute inset-0 overflow-hidden">
                       {selectedProduct.color.includes('http') ? (
                           <img src={selectedProduct.color} className="w-full h-full object-cover opacity-40 blur-2xl scale-125" />
                       ) : (
                           <div className={`w-full h-full bg-gradient-to-br ${selectedProduct.color} opacity-40 blur-2xl`}></div>
                       )}
                   </div>
                   {/* Sharp Main Image */}
                   <div className="absolute inset-0 flex items-center justify-center p-8 pb-48">
                        {selectedProduct.color.includes('http') ? (
                           <img src={selectedProduct.color} className="max-w-full max-h-full object-contain shadow-2xl" />
                        ) : (
                           <div className={`w-full aspect-[3/4] bg-gradient-to-br ${selectedProduct.color} shadow-2xl`}></div>
                        )}
                   </div>
                   {/* Gradient Overlay for Readability (Bottom Only) */}
                   <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black pointer-events-none"></div>
               </div>

               {/* 2. Top Controls Layer */}
               <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
                   <button onClick={() => setShowAR(true)} className="bg-black/40 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors">
                       <Smartphone className="w-3 h-3 text-orange-500" /> AR View
                   </button>
                   <button onClick={() => setSelectedProduct(null)} className="bg-black/40 backdrop-blur-md text-white p-2 rounded-full border border-white/10 hover:bg-white hover:text-black transition-colors">
                       <X className="w-5 h-5" />
                   </button>
               </div>

               {/* 3. Bottom Controls Layer (Floating Overlay) */}
               <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black via-black/95 to-transparent pt-20">
                   <div className="space-y-5">
                        {/* Title & Price */}
                        <div className="flex justify-between items-end">
                            <div className="flex-1 pr-4">
                                <h2 className="text-3xl font-black text-white uppercase leading-none drop-shadow-md">{selectedProduct.title}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">LIMITED EDITION</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-white block drop-shadow-md">€{currentPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Size Selector */}
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">Selecteer Formaat</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                                    selectedProduct.sizes.map(size => (
                                       <button
                                          key={size}
                                          onClick={() => setSelectedSize(size)}
                                          className={`flex-1 min-w-[80px] py-3 text-xs font-bold border rounded-sm transition-all ${
                                          selectedSize === size 
                                             ? 'bg-white text-black border-white' 
                                             : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                          }`}
                                       >
                                          {size}
                                       </button>
                                    ))
                                ) : (
                                    <>
                                       <button onClick={() => setSelectedSize('A1')} className={`flex-1 py-3 text-xs font-bold border rounded-sm transition-all ${selectedSize === 'A1' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>A1</button>
                                       <button onClick={() => setSelectedSize('A2')} className={`flex-1 py-3 text-xs font-bold border rounded-sm transition-all ${selectedSize === 'A2' ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-400 border-white/10'}`}>A2</button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button 
                                onClick={() => { addToCart(selectedProduct, selectedSize, currentPrice, selectedVariation?.id); setSelectedProduct(null); }} 
                                className="flex-1 bg-white text-black h-14 font-black uppercase tracking-widest flex items-center justify-center gap-2 text-sm rounded-sm hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                            >
                                Toevoegen <ShoppingBag className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleShare(selectedProduct.id)}
                                className="w-14 h-14 border border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center text-white rounded-sm hover:bg-white/20 transition-colors"
                            >
                                {copiedId === selectedProduct.id ? (<Check className="w-6 h-6 text-green-500" />) : (<Share2 className="w-6 h-6" />)}
                            </button>
                        </div>
                   </div>
               </div>
             </div>

             {/* --- DESKTOP LAYOUT (md+) --- */}
             <div className="hidden md:contents">
                 <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 bg-black hover:bg-white hover:text-black text-white p-2 rounded-full transition-colors border border-white/10 group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
                 <div className="relative col-span-7 bg-zinc-900/50 flex items-center justify-center h-auto overflow-hidden shrink-0">
                     {selectedProduct.color.includes('http') ? <img src={selectedProduct.color} className="w-full h-full object-contain" /> : <div className={`w-full h-full bg-gradient-to-br ${selectedProduct.color}`}></div>}
                     
                     {/* AR TRIGGER BUTTON OVERLAY */}
                     <div className="absolute top-4 left-4 z-20">
                        <button 
                            onClick={() => setShowAR(true)}
                            className="bg-black/80 backdrop-blur-md border border-orange-500/50 text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg"
                        >
                            <Smartphone className="w-4 h-4 text-orange-500" />
                            View in AR
                        </button>
                     </div>
                 </div>
                 <div className="col-span-5 p-6 md:p-10 flex flex-col justify-center bg-black border-l border-white/5 overflow-y-auto flex-1">
                     {/* ... Details & Add to Cart ... */}
                     <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-[0.9] text-white uppercase">{selectedProduct.title}</h2>
                      {/* ... UPDATED Size Selection ... */}
                      <div className="mt-auto space-y-8">
                         <div className="space-y-6">
                            <div className="flex items-end justify-between border-b border-white/10 pb-4">
                               <span className="text-4xl font-black tracking-tighter">€{currentPrice.toFixed(2)}</span>
                               <div className="text-right">
                                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Selecteer Formaat</p>
                                  <div className="flex gap-2 justify-end flex-wrap">
                                     {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                                        selectedProduct.sizes.map(size => (
                                           <button
                                              key={size}
                                              onClick={() => setSelectedSize(size)}
                                              className={`px-4 py-2 text-xs font-bold border transition-all duration-300 ${
                                              selectedSize === size 
                                                 ? 'border-white bg-white text-black' 
                                                 : 'border-white/20 text-gray-400 hover:border-white hover:text-white'
                                              }`}
                                           >
                                              {size}
                                           </button>
                                        ))
                                     ) : (
                                        // ... fallback ...
                                        <>
                                           <button onClick={() => setSelectedSize('A1')} className={`px-4 py-2 text-xs font-bold border transition-all duration-300 ${selectedSize === 'A1' ? 'border-white bg-white text-black' : 'border-white/20 text-gray-400 hover:border-white hover:text-white'}`}>A1</button>
                                           <button onClick={() => setSelectedSize('A2')} className={`px-4 py-2 text-xs font-bold border transition-all duration-300 ${selectedSize === 'A2' ? 'border-white bg-white text-black' : 'border-white/20 text-gray-400 hover:border-white hover:text-white'}`}>A2</button>
                                        </>
                                     )}
                                  </div>
                               </div>
                            </div>
                         </div>
                          <div className="flex gap-3">
                            <button onClick={() => { addToCart(selectedProduct, selectedSize, currentPrice, selectedVariation?.id); setSelectedProduct(null); }} className="flex-1 bg-white text-black h-14 font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm">Toevoegen <ShoppingBag className="w-4 h-4" /></button>
                            {/* ... Share ... */}
                            <button onClick={() => handleShare(selectedProduct.id)} className="w-14 h-14 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">{copiedId === selectedProduct.id ? (<Check className="w-5 h-5 text-green-500" />) : (<Share2 className="w-5 h-5 text-white" />)}</button>
                          </div>
                          {/* ... Footer Info ... */}
                          <div className="grid grid-cols-2 gap-4 pt-4">
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider"><Truck className="w-3 h-3" /> Gratis Verzending</div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider"><Award className="w-3 h-3" /> Museum Kwaliteit</div>
                          </div>
                      </div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      <div className={`fixed inset-0 z-[150] pointer-events-none ${cartOpen ? 'pointer-events-auto' : ''}`}>
        {/* Backdrop */}
        <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${cartOpen ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setCartOpen(false)}
        />
        
        {/* Drawer */}
        <div className={`absolute top-0 right-0 h-full w-full md:w-[500px] bg-black border-l border-white/10 shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${cartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="flex flex-col h-full p-6 md:p-10">
              <div className="flex items-center justify-between mb-8">
                 <h2 className="text-3xl font-black uppercase tracking-tighter">Your Stash <span className="text-orange-500">({cartCount})</span></h2>
                 <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                 {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                       <ShoppingBag className="w-16 h-16 mb-4" />
                       <p className="font-mono text-sm uppercase">Empty Void</p>
                    </div>
                 ) : (
                    cartItems.map((item) => (
                       <div key={item.cartId} className="flex gap-4 group">
                          <div className="w-20 h-28 bg-gray-900 border border-white/10 overflow-hidden relative shrink-0">
                             {item.image.includes('http') ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                             ) : (
                                <div className={`w-full h-full bg-gradient-to-br ${item.image}`}></div>
                             )}
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div>
                                <div className="flex justify-between items-start">
                                   <h4 className="font-bold text-white uppercase leading-none">{item.title}</h4>
                                   <button onClick={() => removeFromCart(item.cartId)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <p className="text-[10px] font-mono text-gray-500 mt-1 uppercase">Size: {item.size}</p>
                             </div>
                             <div className="flex justify-between items-end">
                                <div className="flex items-center gap-3 bg-white/5 rounded-sm px-2 py-1">
                                   <button onClick={() => updateQuantity(item.cartId, -1)} className="text-gray-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                                   <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(item.cartId, 1)} className="text-gray-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                                </div>
                                <span className="font-bold text-sm">€{(item.price * item.quantity).toFixed(2)}</span>
                             </div>
                          </div>
                       </div>
                    ))
                 )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                 <div className="flex justify-between text-sm uppercase tracking-widest text-gray-400">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">€{cartTotal.toFixed(2)}</span>
                 </div>
                 <p className="text-[10px] text-gray-600 font-mono text-center">Shipping & Taxes calculated at checkout</p>
                 <button 
                    onClick={() => { setCartOpen(false); navigateTo('checkout'); }}
                    disabled={cartItems.length === 0}
                    className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                 >
                    Checkout Process
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 z-[200] bg-black transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-6 flex justify-between items-center border-b border-white/10">
            <span className="font-bold text-xl tracking-tighter">MENU</span>
            <button onClick={() => setMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
         </div>
         <div className="p-6 flex flex-col gap-6 text-2xl font-black uppercase tracking-tighter">
            <button onClick={() => navigateTo('home')} className="text-left hover:text-orange-500">Home</button>
            <button onClick={() => navigateTo('collection')} className="text-left hover:text-orange-500">Collecties</button>
            <button onClick={() => navigateTo('process')} className="text-left hover:text-orange-500">Proces</button>
            <button onClick={() => navigateTo('about')} className="text-left hover:text-orange-500">Over Ons</button>
         </div>
      </div>

      {/* COMMISSION MODAL */}
      {commissionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setCommissionOpen(false)}></div>
           <div className="relative w-full max-w-lg bg-black border border-white/10 p-8 rounded-sm animate-in zoom-in duration-300 shadow-2xl">
              <button onClick={() => setCommissionOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              
              <div className="mb-6">
                 <h2 className="text-2xl font-black uppercase mb-2">Start Commission</h2>
                 <p className="text-gray-400 text-sm">Describe your vision. We will generate the soul.</p>
              </div>

              {formSubmitted ? (
                 <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                       <Check className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Request Received</h3>
                    <p className="text-gray-400 text-sm">We will contact you within 24 hours.</p>
                 </div>
              ) : (
                 <form onSubmit={handleCommissionSubmit} className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-mono text-gray-500 uppercase">Your Name</label>
                       <input name="name" required className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                       <input name="email" type="email" required className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-mono text-gray-500 uppercase">Vision Description</label>
                       <textarea name="message" required rows={4} className="w-full bg-white/5 border border-white/10 p-3 text-sm focus:border-orange-500 outline-none text-white rounded-sm resize-none" placeholder="Cyberpunk city with neon rain..."></textarea>
                    </div>
                    
                    {/* File Upload UI */}
                     <div 
                        className="border-2 border-dashed border-white/10 rounded-sm p-6 text-center cursor-pointer hover:border-orange-500/50 hover:bg-white/5 transition-all"
                        onClick={() => fileInputRef.current.click()}
                     >
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           onChange={(e) => setCommissionFile(e.target.files[0])} 
                           accept="image/*"
                        />
                        <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">{commissionFile ? commissionFile.name : "Upload Reference (Optional)"}</p>
                     </div>

                    <button 
                        type="submit" 
                        disabled={isUploading}
                        className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all mt-4 flex justify-center items-center gap-2"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Request <Send className="w-4 h-4" /></>}
                    </button>
                 </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};
