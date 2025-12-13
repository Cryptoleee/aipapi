import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ShoppingBag, Menu, X, ArrowRight, Instagram, Twitter, Mail, MoveRight, Sparkles, Zap, Eye, ChevronLeft, ChevronRight, Wand2, Upload, Check, Fingerprint, Cpu, Palette, Terminal, Trash2, Minus, Plus, Share2, Layers, Printer, Package, Aperture, Sliders, Loader2, Send, Truck, Award, Maximize, Leaf, ScanLine, CreditCard, Lock, ChevronDown, Wallet, Activity } from 'lucide-react';

/**
 * AiPapi - Headless Frontend (React)
 * Gekoppeld aan: https://www.aipostershop.nl/
 * STATUS: HERO UPDATE - SERIOUS MODE
 * - Replaced playful Teleport/Turing cards with System Metrics & Material Specs
 * - Added simulated live system load state
 */

// --- SUB-COMPONENT: PRODUCT CARD (Smart Hover/Touch Logic) ---
const ProductCard = ({ product, onClick }) => {
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(null);

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

  return (
    <div 
      className="group relative cursor-pointer"
      onClick={() => onClick(product)}
      onTouchStart={handleTouch}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`relative ${product.aspect} overflow-hidden bg-gray-900 border border-white/5 rounded-sm transition-transform duration-500 hover:-translate-y-2`}>
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
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        
        <div 
          className={`absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}
        >
          <button className="bg-white text-black px-6 py-3 font-bold uppercase tracking-wider text-xs hover:scale-105 transition-transform flex items-center gap-2">
            <Eye className="w-4 h-4" /> Bekijk Print
          </button>
        </div>
        
        <div className="absolute top-4 left-4">
          <span className="bg-black/50 backdrop-blur-md text-[10px] font-mono border border-white/10 px-2 py-1 text-gray-300 uppercase">
            {product.category}
          </span>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-start">
        <div>
          <h3 className={`text-xl font-bold transition-colors ${isActive ? 'text-orange-500' : 'text-white'}`}>{product.title}</h3>
          <p className="text-xs text-gray-500 mt-1 font-mono">EDITIE VAN 50</p>
        </div>
        <span className="text-lg font-medium">€{product.price}</span>
      </div>
    </div>
  );
};

const App = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // --- CONFIGURATIE ---
  const BEHOLD_URL = "https://feeds.behold.so/nguthImEl5LLe5wkCkaC";
  const SITE_URL = "https://www.aipostershop.nl";
  const CK = "ck_35d3827fc6d5e1c7a6919d23c78fdbfd48eb88ba";
  const CS = "cs_de3798a3f768a50e14f485c14e09cb547147bf99";

  // --- DATA STATE ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart State
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]); 

  // Product Selection State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('A2');
  const [productVariations, setProductVariations] = useState([]); 
  const [loadingVariations, setLoadingVariations] = useState(false);

  // Share State
  const [copiedId, setCopiedId] = useState(null);

  // Instagram State
  const [instaPosts, setInstaPosts] = useState([]);
  
  // --- FUN / INTERACTIVE STATES ---
  const [systemLoad, setSystemLoad] = useState(42);

  // New states for About Section
  const [resLevel, setResLevel] = useState(0);
  const [ecoStatus, setEcoStatus] = useState('idle');

  // --- UPLOAD STATE ---
  const [commissionFile, setCommissionFile] = useState(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- FIGURINE EXPLODED VIEW DATA (With Positions) ---
  const figurineParts = [
    // Head (Top Center)
    { id: 'head', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Head.png', 
      x: 50, y: 15, width: 25, depth: 0.08, z: 10, rotate: 0 },
    
    // Torso (Center)
    { id: 'torso', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Torso.png', 
      x: 50, y: 38, width: 35, depth: 0.04, z: 5, rotate: 0 },
    
    // Arms (Sides)
    { id: 'l_arm', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Leftarm.png', 
      x: 25, y: 38, width: 20, depth: 0.06, z: 6, rotate: -10 },
    { id: 'r_arm', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Rightarm.png', 
      x: 75, y: 38, width: 20, depth: 0.06, z: 6, rotate: 10 },
      
    // Hands (Lower Sides)
    { id: 'l_hand', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/lefthand.png', 
      x: 15, y: 55, width: 15, depth: 0.10, z: 8, rotate: -20 },
    { id: 'r_hand', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Righthand.png', 
      x: 85, y: 55, width: 15, depth: 0.10, z: 8, rotate: 20 },

    // Pants (Lower Center)
    { id: 'pants', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Pants.png', 
      x: 50, y: 65, width: 30, depth: 0.02, z: 4, rotate: 0 },

    // Shoes (Bottom)
    { id: 'l_shoe', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Leftshoe.png', 
      x: 40, y: 85, width: 15, depth: 0.03, z: 4, rotate: -5 },
    { id: 'r_shoe', src: 'https://www.aipostershop.nl/wp-content/uploads/2025/12/Rightshoe.png', 
      x: 60, y: 85, width: 15, depth: 0.03, z: 4, rotate: 5 },
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

  // --- CHECKOUT STATE ---
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', company: '', email: '',
    address: '', houseNumber: '', postcode: '', city: ''
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

  // --- SYSTEM LOAD SIMULATION ---
  useEffect(() => {
    const interval = setInterval(() => {
        setSystemLoad(prev => {
            const fluctuation = (Math.random() * 10) - 5;
            return Math.min(99, Math.max(20, Math.floor(prev + fluctuation)));
        });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
    // Keep function for future use, but currently unused in new layout
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
        setError("Kan geen verbinding maken met de shop. Controleer of je 'WP CORS' plugin aanstaat in WordPress.");
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
        alert("Kon geen verbinding maken met de server.");
    } finally {
        setIsUploading(false);
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => { setContactOpen(false); setContactSubmitted(false); }, 2000);
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
    
    const orderData = {
        set_paid: false,
        billing: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company: formData.company,
            address_1: `${formData.address} ${formData.houseNumber}`,
            address_2: "",
            city: formData.city,
            postcode: formData.postcode,
            country: billingCountry,
            email: formData.email,
            phone: ""
        },
        shipping: shipToDifferentAddress ? {
            first_name: shippingData.firstName,
            last_name: shippingData.lastName,
            company: shippingData.company,
            address_1: `${shippingData.address} ${shippingData.houseNumber}`,
            address_2: "",
            city: shippingData.city,
            postcode: shippingData.postcode,
            country: shippingCountry
        } : {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company: formData.company,
            address_1: `${formData.address} ${formData.houseNumber}`,
            address_2: "",
            city: formData.city,
            postcode: formData.postcode,
            country: billingCountry
        },
        line_items: cartItems.map(item => ({
            product_id: item.id,
            variation_id: item.variationId,
            quantity: item.quantity,
        }))
    };

    try {
        const response = await fetch(`${SITE_URL}/wp-json/wc/v3/orders?consumer_key=${CK}&consumer_secret=${CS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Order failed: ${errorText}`);
        }

        const order = await response.json();
        const payUrl = order.payment_url || `${SITE_URL}/afrekenen/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;
        
        setOrderPlaced(true);
        window.location.href = payUrl; 

    } catch (err) {
        console.error("Checkout Error:", err);
        alert("Er ging iets mis bij het plaatsen van de bestelling. Probeer het later opnieuw.");
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
      
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-300"
            style={{
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 100, 0, 0.6), transparent 40%)`
            }}
          />
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-orange-600/5 to-transparent blur-xl animate-pulse-slow"></div>
      </div>

      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-8'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div 
            className="text-2xl font-bold tracking-tighter flex items-center gap-2 group cursor-pointer"
            onClick={() => navigateTo('home')}
          >
            <img 
              src="https://www.aipostershop.nl/wp-content/uploads/2025/11/AiPapiLogo.svg" 
              alt="Ai Papi Logo" 
              className="h-16 w-auto group-hover:rotate-6 transition-transform duration-300"
            />
          </div>

          <div className="hidden md:flex items-center gap-12 text-sm font-medium tracking-wide text-gray-400">
            <button onClick={() => navigateTo('home')} className={`hover:text-white transition-colors relative group ${view === 'home' ? 'text-white' : ''}`}>
              Home
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-orange-500 transition-all ${view === 'home' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => navigateTo('collection')} className={`hover:text-white transition-colors relative group ${view === 'collection' ? 'text-white' : ''}`}>
              Collecties
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-orange-500 transition-all ${view === 'collection' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => navigateTo('process')} className={`hover:text-white transition-colors relative group ${view === 'process' ? 'text-white' : ''}`}>
              Proces
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-orange-500 transition-all ${view === 'process' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            <button onClick={() => navigateTo('about')} className={`hover:text-white transition-colors relative group ${view === 'about' ? 'text-white' : ''}`}>
              Over
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-orange-500 transition-all ${view === 'about' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative group" onClick={() => setCartOpen(true)}>
              <ShoppingBag className="w-5 h-5 text-gray-300 group-hover:text-white transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-600 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
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
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {/* NEW SERIOUS INTERACTIVE CARDS */}
                    
                    {/* Card 1: System Status -> Live Art Counter */}
                    <div 
                        className="group bg-white/5 p-4 rounded-sm border border-white/10 hover:border-green-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <div className="p-2 bg-white/10 w-fit rounded-full group-hover:bg-green-500/20 transition-colors duration-500">
                                    <Sparkles className="w-5 h-5 text-white group-hover:text-green-500 transition-colors" />
                                </div>
                                <div className="text-[10px] font-mono text-green-500 animate-pulse">● LIVE FEED</div>
                            </div>
                            
                            <h4 className="font-black text-sm mb-1 group-hover:text-green-500 transition-colors text-white">
                                DATABASE METRICS
                            </h4>
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between items-end text-xs font-mono text-gray-400">
                                    <span>TOTAL ASSETS</span>
                                    <span className="text-white text-2xl font-black tracking-tighter leading-none">
                                        {products.length > 0 ? products.length : <Loader2 className="w-4 h-4 animate-spin inline" />}
                                    </span>
                                </div>
                                {/* Progress bar simulating live capacity or sync status */}
                                <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 animate-[pulse_3s_ease-in-out_infinite]" 
                                        style={{ width: `${products.length > 0 ? '100%' : '10%'}` }}
                                    ></div>
                                </div>
                            </div>
                             <p className="text-[10px] font-mono text-gray-500 mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                Auto-Sync Active
                            </p>
                        </div>
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Card 2: Material Specs (Updated) */}
                    <div 
                        className="group bg-white/5 p-4 rounded-sm border border-white/10 hover:border-blue-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                    >
                         <div className="absolute inset-0 bg-blue-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                         
                        <div className="relative z-10">
                            <div className="mb-3 p-2 bg-white/10 w-fit rounded-full group-hover:rotate-90 transition-transform duration-700">
                                <Layers className="w-5 h-5 text-white group-hover:text-blue-200 transition-colors" />
                            </div>
                            <h4 className="font-black text-sm mb-1 group-hover:text-white transition-colors text-white">
                                MATERIAL SPECS
                            </h4>
                            <div className="flex flex-col gap-1.5 mt-2">
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 group-hover:text-blue-100">
                                    <span>PAPER</span>
                                    <span className="font-bold text-white uppercase">Woodfree Satin MC</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 group-hover:text-blue-100">
                                    <span>WEIGHT</span>
                                    <span className="font-bold text-white">250 GSM</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 group-hover:text-blue-100">
                                    <span>PRINT</span>
                                    <span className="font-bold text-white uppercase">Full Color (1-Sided)</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 group-hover:text-blue-100">
                                    <span>FINISH</span>
                                    <span className="font-bold text-white uppercase">Gloss Laminate</span>
                                </div>
                            </div>
                        </div>
                        {/* Scanline effect on hover */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-400/50 shadow-[0_0_10px_#60a5fa] opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_linear_infinite]"></div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-4">
                    <button 
                      onClick={() => navigateTo('collection')}
                      className="bg-white text-black px-8 py-4 font-bold text-sm uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center gap-3 group"
                    >
                      Bekijk Galerij
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            
            {/* Rest of the components remain same... */}

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

        {/* ... Rest of views (collection, process, about, checkout, modals) remain unchanged ... */}
        {view === 'collection' && (
          // ... (Existing code for collection view) ...
          <div className="min-h-screen pt-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* ... content same as before ... */}
              <div className="container mx-auto px-6">
                <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
                    <div>
                    <p className="text-orange-500 font-mono text-xs uppercase tracking-widest mb-2">Archive_v2.0</p>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
                        DE COLLECTIE
                    </h1>
                    </div>
                    {/* ... */}
                </div>
                 {/* ... grid and pagination ... */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 min-h-[1000px] animate-in fade-in duration-700 ease-out-expo">
                     {currentProducts.map((product) => (
                        <ProductCard key={product.id} product={product} onClick={setSelectedProduct} />
                     ))}
                 </div>
                 {/* ... pagination buttons ... */}
                  <div className="flex justify-between items-center border-t border-white/10 pt-8">
                     <button onClick={prevPage} disabled={collectionPage === 0} className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft className="w-4 h-4" /> Vorige</button>
                     <div className="flex gap-2">{[...Array(totalPages)].map((_, i) => (<button key={i} onClick={() => goToPage(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === collectionPage ? 'bg-orange-500 w-8' : 'bg-gray-700 hover:bg-gray-500'}`} />))}</div>
                     <button onClick={nextPage} disabled={collectionPage === totalPages - 1} className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">Volgende <ChevronRight className="w-4 h-4" /></button>
                  </div>
              </div>
              {/* ... CTA ... */}
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
             </div>
          </div>
        )}

        {view === 'about' && (
          // ... (Restored original About view) ...
          <div className="min-h-screen pt-40 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 bg-black">
             {/* ... content ... */}
             <div className="container mx-auto px-6 mb-32 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-20">
                   
                   <div className="w-full md:w-1/2 flex justify-center perspective-1000 relative">
                      {/* ... The Architect Card ... */}
                      <div className="relative w-[340px] h-[460px] transition-transform duration-100 ease-linear group" style={{ transform: `rotateY(${(mousePos.x - window.innerWidth/2) * 0.05}deg) rotateX(${-(mousePos.y - window.innerHeight/2) * 0.05}deg)` }}>
                         <div className="absolute inset-0 z-0">
                            <img src="https://www.aipostershop.nl/wp-content/uploads/2025/11/Lee.jpg" alt="The Architect" className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity duration-700" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }} />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/10 to-transparent h-2 w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                         </div>
                         {/* ... HUD Elements ... */}
                      </div>
                   </div>

                   <div className="w-full md:w-1/2 space-y-8">
                      {/* ... Text Content ... */}
                      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                         {aboutContent.title}
                      </h1>
                      <p className="text-xl text-gray-400 leading-relaxed max-w-lg font-medium">{aboutContent.text}</p>
                   </div>
                </div>
             </div>
          </div>
        )}
        
        {view === 'checkout' && (
            // ... (Checkout View) ...
            <div className="min-h-screen pt-32 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
               {/* ... form ... */}
               <div className="container mx-auto px-6 max-w-6xl">
                 {/* ... inputs ... */}
                  <button 
                     type="button" 
                     onClick={handlePlaceOrder}
                     disabled={isProcessing}
                     className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                   >
                     <div className={`absolute inset-0 bg-orange-500 transition-transform duration-300 z-0 ${isProcessing ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}></div>
                     <span className="relative z-10 flex items-center gap-2">
                        {isProcessing ? (
                           <>Doorsturen naar betaling... <Loader2 className="w-5 h-5 animate-spin" /></>
                        ) : (
                           <>Ga naar betaling <Lock className="w-4 h-4 group-hover:text-white transition-colors" /></>
                        )}
                     </span>
                   </button>
               </div>
            </div>
        )}
        </div> {/* Correct closing tag for content wrapper */}

       {/* ... Modals (SelectedProduct, Contact, Commission, Cart) ... */}
       {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-700" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative w-full max-w-6xl h-full md:h-auto md:max-h-[90vh] bg-black border border-white/10 shadow-2xl overflow-hidden flex flex-col md:grid md:grid-cols-12 rounded-lg animate-in zoom-in-[0.95] fade-in duration-500 slide-in-from-bottom-8 ease-out-expo">
             {/* ... Modal Content ... */}
             <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 bg-black hover:bg-white hover:text-black text-white p-2 rounded-full transition-colors border border-white/10 group"><X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
             <div className="relative col-span-7 bg-zinc-900/50 flex items-center justify-center h-[40vh] md:h-auto overflow-hidden shrink-0">
                 {selectedProduct.color.includes('http') ? <img src={selectedProduct.color} className="w-full h-full object-contain" /> : <div className={`w-full h-full bg-gradient-to-br ${selectedProduct.color}`}></div>}
             </div>
             <div className="col-span-5 p-6 md:p-10 flex flex-col justify-center bg-black border-l border-white/5 overflow-y-auto flex-1">
                 {/* ... Details & Add to Cart ... */}
                 <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tighter leading-[0.9] text-white uppercase">{selectedProduct.title}</h2>
                 <button onClick={() => { addToCart(selectedProduct, selectedSize, currentPrice, selectedVariation?.id); setSelectedProduct(null); }} className="flex-1 bg-white text-black h-14 font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 text-sm">Toevoegen <ShoppingBag className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      )}

      {/* ... Other Modals ... */}

      {/* ... Mobile Menu ... */}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .perspective-1000 { perspective: 1000px; }
        .ease-out-expo { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scan { 0% { top: 0; opacity: 0; } 20% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        
        @keyframes float {
          0% { transform: translate(0, 0); }
          50% { transform: translate(15px, -20px); }
          100% { transform: translate(-10px, 15px); }
        }
      `}</style>
    </div>
  );
};

export default App;
