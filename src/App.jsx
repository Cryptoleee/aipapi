import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Menu, X, ArrowRight, Instagram, Twitter, Mail, MoveRight, Sparkles, Zap, Eye, ChevronLeft, ChevronRight, Wand2, Upload, Check, Fingerprint, Cpu, Palette, Terminal, Trash2, Minus, Plus, Share2, Layers, Printer, Package, Aperture, Sliders, Loader2, Send, Truck, Award, Maximize, Leaf, ScanLine, CreditCard, Lock, ChevronDown, Wallet } from 'lucide-react';

/**
 * AiPapi - Headless Frontend (React)
 * Gekoppeld aan: https://www.aipostershop.nl/
 * STATUS: RESTORED PAGES
 * - Restored missing 'collection' view
 * - Restored missing 'process' view
 * - Kept the new 'About' layout
 */

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
  const [selectedSize, setSelectedSize] = useState('A2'); // Default changed to A2
  const [productVariations, setProductVariations] = useState([]); 
  const [loadingVariations, setLoadingVariations] = useState(false);

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

  // --- WORDPRESS CONTENT STATE ---
  const [aboutContent, setAboutContent] = useState({
    title: "HET MOOIE DECODEREN",
    text: "Creativiteit is de kern. Als eigenaar van Wijzijnwolf.nl ben ik dagelijks bezig met video en beeld. Ai Papi is waar die visuele ervaring en technische nieuwsgierigheid samenkomen."
  });

  // Haal de tekst op uit WordPress en maak schoon
  useEffect(() => {
    const fetchPageData = async () => {
        try {
            const response = await fetch(`${SITE_URL}/wp-json/wp/v2/pages?slug=over-ons`);
            const data = await response.json();
            
            if (data && data.length > 0) {
                const page = data[0];
                
                // 1. Verwijder HTML tags (zoals <p>, <div>)
                let cleanText = page.content.rendered.replace(/<[^>]+>/g, '');
                
                // 2. Verwijder Shortcodes (alles tussen [ en ]) - DIT LOST JE BUG OP
                cleanText = cleanText.replace(/\[.*?\]/g, '');
                
                // 3. Verwijder dubbele witregels die achterblijven
                cleanText = cleanText.replace(/\s+/g, ' ').trim();
                
                // Fallback als de pagina leeg is na opschonen
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
  
  // Shipping
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
    
    // Reset size to A2 if available, otherwise first available option
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

  // FIND SELECTED VARIATION
  const selectedVariation = useMemo(() => {
    if (!selectedProduct || productVariations.length === 0) return null;
    return productVariations.find(v => 
      v.attributes.some(attr => attr.option.toUpperCase() === selectedSize.toUpperCase())
    );
  }, [selectedProduct, selectedSize, productVariations]);

  // CALCULATE CURRENT PRICE
  const currentPrice = useMemo(() => {
    if (!selectedProduct) return 0;
    if (selectedVariation && selectedVariation.price) {
        return parseFloat(selectedVariation.price);
    }
    return selectedProduct.price || 0; // Safety fallback
  }, [selectedProduct, selectedVariation]);

  // DYNAMIC HERO ITEMS
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

  // Rotate Hero Images
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
    if (teleportStatus !== 'idle') return;
    setTeleportStatus('loading');
    setTimeout(() => {
        setTeleportStatus('failed');
        setTimeout(() => setTeleportStatus('idle'), 4000);
    }, 2000);
  };

  const handleTuringTest = () => {
     const msgs = ["I am alive.", "Just math.", "Define 'Real'?", "Error: Drip too hard", "Humanity detected", "Beep Boop", "Not a robot (mostly)"];
     let newMsg = msgs[Math.floor(Math.random() * msgs.length)];
     setSentienceMsg(newMsg);
  };

  const cartCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0), [cartItems]);

  // --- WORDPRESS API CONNECTIE ---
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
            sizes: availableSizes 
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

  // --- INSTAGRAM FEED ---
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

  // Cart Actions
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
        variationId: variationId, // Store specific variation ID
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
  
  // Navigation
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

  const handleCommissionSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => { setCommissionOpen(false); setFormSubmitted(false); }, 2000);
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => { setContactOpen(false); setContactSubmitted(false); }, 2000);
  };

  // --- REAL CHECKOUT LOGIC ---
  const handlePlaceOrder = async (e) => {
    // PREVENT PAGE RELOAD
    if (e) e.preventDefault();

    if (!termsAccepted) {
        alert("Je moet akkoord gaan met de algemene voorwaarden.");
        return;
    }
    
    // Validate basic fields
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.address || !formData.houseNumber) {
        alert("Vul alsjeblieft alle verplichte velden in.");
        return;
    }

    setIsProcessing(true);
    
    const orderData = {
        // We omit payment_method here so WooCommerce assigns a default or lets the user choose on the pay page
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
            variation_id: item.variationId, // Send specific variation ID to WC
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
        console.log("Order Created:", order);

        // Use the official payment URL if provided by WooCommerce/Mollie, otherwise construct it
        const payUrl = order.payment_url || `${SITE_URL}/afrekenen/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;
        
        setOrderPlaced(true);
        window.location.href = payUrl; 

    } catch (err) {
        console.error("Checkout Error:", err);
        alert("Er ging iets mis bij het plaatsen van de bestelling. Probeer het later opnieuw.");
        setIsProcessing(false);
    }
  };

  // Event Listeners
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

  // Pagination Logic
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
      
      {/* --- Global Background Effects --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-300"
            style={{
              // Reduced opacity from 0.5 to 0.15 for a subtler glow
              background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 100, 0, 0.15), transparent 40%)`
            }}
          />
          {/* Reduced opacity and blur for the side glow */}
          <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-orange-600/5 to-transparent blur-2xl animate-pulse-slow"></div>
      </div>

      {/* --- Navigation --- */}
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

      {/* --- Main Content Wrapper --- */}
      <div 
        className={`relative z-10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          selectedProduct || commissionOpen || cartOpen || contactOpen ? 'blur-xl scale-[0.98] opacity-50 pointer-events-none grayscale' : 'blur-0 scale-100 opacity-100'
        }`}
      >
        {view === 'home' && (
          <div className="animate-in fade-in duration-700">
            {/* Hero Section */}
            <header className="relative min-h-screen flex items-center pt-20 overflow-hidden">
              <div className="absolute inset-0 z-0 opacity-10" 
                   style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100px 100px' }}>
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
                    <div 
                        className="group bg-white/5 p-4 rounded-sm border border-white/10 hover:border-orange-500 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        onClick={handleTeleport}
                    >
                        <div className="relative z-10">
                            <div className="mb-3 p-2 bg-white/10 w-fit rounded-full group-hover:scale-110 transition-transform duration-500">
                                <Truck className={`w-5 h-5 text-white ${teleportStatus === 'loading' ? 'animate-bounce' : 'group-hover:text-orange-500'} transition-colors`} />
                            </div>
                            <h4 className="font-black text-sm mb-1 group-hover:text-orange-500 transition-colors text-white">
                                {teleportStatus === 'idle' && "FYSIEKE OVERDRACHT"}
                                {teleportStatus === 'loading' && "QUANTUM TUNNELING..."}
                                {teleportStatus === 'failed' && "TELEPORT FAILED"}
                            </h4>
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                {teleportStatus === 'idle' && "Klik voor Instant Delivery"}
                                {teleportStatus === 'loading' && "Kalibreren..."}
                                {teleportStatus === 'failed' && "Backup: PostNL (Gratis)"}
                            </p>
                        </div>
                        {teleportStatus === 'loading' && (
                            <div className="absolute bottom-0 left-0 h-1 bg-orange-500 animate-[width_2s_ease-in-out_forwards]" style={{width: '100%'}}></div>
                        )}
                        {teleportStatus === 'failed' && (
                            <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                        )}
                    </div>

                    <div 
                        className="group bg-white/5 p-4 rounded-sm border border-white/10 hover:border-purple-600 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        onClick={handleTuringTest}
                    >
                        <div className="absolute inset-0 bg-purple-600/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <div className="relative z-10">
                            <div className="mb-3 p-2 bg-white/10 w-fit rounded-full group-hover:rotate-180 transition-transform duration-700">
                                <Fingerprint className="w-5 h-5 text-white group-hover:text-purple-600 transition-colors" />
                            </div>
                            <h4 className="font-black text-sm mb-1 group-hover:text-purple-600 transition-colors text-white">
                                TURING TEST
                            </h4>
                            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                {sentienceMsg}
                            </p>
                        </div>
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

                <div className="relative h-[600px] w-full hidden md:block perspective-1000">
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
                    Next-Gen Art <Sparkles className="w-5 h-5 fill-black" /> Limited Editions <div className="w-2 h-2 bg-black rounded-full"></div>
                  </span>
                ))}
              </div>
            </div>

            <section id="collections" className="py-32 relative">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
                  <div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">Nieuwste Drops</h2>
                    <div className="h-1 w-20 bg-orange-600"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {isLoading ? (
                    <div className="text-white">Laden...</div>
                  ) : (
                    products.slice(0, 6).map((product) => (
                      <div 
                        key={product.id} 
                        className="group relative cursor-pointer"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <div className={`relative ${product.aspect} overflow-hidden bg-gray-900 border border-white/5 rounded-sm transition-transform duration-500 hover:-translate-y-2`}>
                          {product.color.includes('http') ? (
                            <img src={product.color} alt={product.title} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700" />
                          ) : (
                            <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-100 group-hover:opacity-90 transition-opacity duration-700`}></div>
                          )}
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
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
                            <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">{product.title}</h3>
                            <p className="text-xs text-gray-500 mt-1 font-mono">EDITIE VAN 50</p>
                          </div>
                          <span className="text-lg font-medium">€{product.price}</span>
                        </div>
                      </div>
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

              <div 
                key={collectionPage}
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 min-h-[1000px] animate-in fade-in duration-700 ease-out-expo ${
                  slideDirection === 'right' ? 'slide-in-from-right-12' : 'slide-in-from-left-12'
                }`}
              >
                {currentProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="group relative cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className={`relative ${product.aspect} overflow-hidden bg-gray-900 border border-white/5 rounded-sm transition-transform duration-500 hover:-translate-y-2`}>
                      {product.color.includes('http') ? (
                          <img src={product.color} alt={product.title} className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:scale-110 transition-all duration-700" />
                      ) : (
                          <div className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-100 group-hover:opacity-90 transition-opacity duration-700`}></div>
                      )}
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
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
                        <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">{product.title}</h3>
                        <p className="text-xs text-gray-500 mt-1 font-mono">EDITIE VAN 50</p>
                      </div>
                      <span className="text-lg font-medium">€{product.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-white/10 pt-8">
                 <button 
                    onClick={prevPage}
                    disabled={collectionPage === 0}
                    className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                    <ChevronLeft className="w-4 h-4" /> Vorige
                 </button>
                 <div className="flex gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                       <button 
                         key={i}
                         onClick={() => goToPage(i)}
                         className={`w-2 h-2 rounded-full transition-all duration-300 ${i === collectionPage ? 'bg-orange-500 w-8' : 'bg-gray-700 hover:bg-gray-500'}`}
                       />
                    ))}
                 </div>
                 <button 
                    onClick={nextPage}
                    disabled={collectionPage === totalPages - 1}
                    className="flex items-center gap-2 px-6 py-3 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                 >
                    Volgende <ChevronRight className="w-4 h-4" />
                 </button>
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
                      {/* REDUCED GLOW EFFECT TO 5% */}
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

        {/* --- CHECKOUT VIEW --- */}
        {view === 'checkout' && (
          <div className="min-h-screen pt-32 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="bg-orange-600/10 border-y border-orange-500/20 text-orange-500 text-center py-3 px-6 text-xs font-mono uppercase tracking-widest mb-12 backdrop-blur-md">
               Heb je een waardebon? Klik hier om je code in te vullen
             </div>

             <div className="container mx-auto px-6 max-w-6xl">
               <div className="grid md:grid-cols-2 gap-16">
                 
                 <div>
                   <h2 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-3">
                      <Terminal className="w-6 h-6 text-orange-500" />
                      FACTUURGEGEVENS
                   </h2>
                   <form className="space-y-6 font-mono text-sm">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voornaam *</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleBillingChange} 
                                className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                                placeholder="Jouw naam" 
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Achternaam *</label>
                            <input 
                                type="text" 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={handleBillingChange} 
                                className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                                placeholder="Jouw achternaam" 
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bedrijfsnaam (optioneel)</label>
                         <input 
                            type="text" 
                            name="company" 
                            value={formData.company} 
                            onChange={handleBillingChange} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                            placeholder="" 
                        />
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Land *</label>
                         <div className="relative">
                            <select 
                                value={billingCountry}
                                onChange={(e) => setBillingCountry(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white appearance-none cursor-pointer"
                            >
                                <option value="NL" className="bg-black text-white">Nederland</option>
                                <option value="BE" className="bg-black text-white">België</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Straat *</label>
                         <input 
                            type="text" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleBillingChange} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                            placeholder="Straatnaam" 
                        />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Huisnummer *</label>
                         <input 
                            type="text" 
                            name="houseNumber" 
                            value={formData.houseNumber} 
                            onChange={handleBillingChange} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                            placeholder="Nr." 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Postcode *</label>
                           <input 
                                type="text" 
                                name="postcode" 
                                value={formData.postcode} 
                                onChange={handleBillingChange} 
                                className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                                placeholder="1234 AB" 
                            />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plaats *</label>
                           <input 
                                type="text" 
                                name="city" 
                                value={formData.city} 
                                onChange={handleBillingChange} 
                                className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                                placeholder="Amsterdam" 
                            />
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">E-mailadres *</label>
                         <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleBillingChange} 
                            className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" 
                            placeholder="jouw@email.com" 
                        />
                      </div>

                      <div className="pt-4 border-t border-white/10">
                         <label className="flex items-center gap-3 cursor-pointer group mb-6">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                className="peer sr-only" 
                                checked={shipToDifferentAddress}
                                onChange={(e) => setShipToDifferentAddress(e.target.checked)}
                              />
                              <div className="w-5 h-5 border border-white/30 rounded-sm peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors group-hover:border-orange-500/50"></div>
                              <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Verzenden naar een ander adres?</span>
                         </label>

                         {shipToDifferentAddress && (
                            <div className="space-y-6 pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Verzendgegevens</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Voornaam *</label>
                                        <input type="text" name="firstName" value={shippingData.firstName} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Achternaam *</label>
                                        <input type="text" name="lastName" value={shippingData.lastName} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bedrijfsnaam (optioneel)</label>
                                    <input type="text" name="company" value={shippingData.company} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Land *</label>
                                    <div className="relative">
                                        <select 
                                            value={shippingCountry}
                                            onChange={(e) => setShippingCountry(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white appearance-none cursor-pointer"
                                        >
                                            <option value="Nederland" className="bg-black text-white">Nederland</option>
                                            <option value="België" className="bg-black text-white">België</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Straat *</label>
                                    <input type="text" name="address" value={shippingData.address} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Huisnummer *</label>
                                    <input type="text" name="houseNumber" value={shippingData.houseNumber} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Postcode *</label>
                                        <input type="text" name="postcode" value={shippingData.postcode} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Plaats *</label>
                                        <input type="text" name="city" value={shippingData.city} onChange={handleShippingChange} className="w-full bg-white/5 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors text-white placeholder-gray-600" />
                                    </div>
                                </div>
                            </div>
                         )}
                      </div>
                   </form>
                 </div>

                 <div>
                   <h2 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-3">
                      <Package className="w-6 h-6 text-orange-500" />
                      JE BESTELLING
                   </h2>
                   
                   <div className="bg-white/5 border border-white/10 p-8 rounded-sm space-y-6 mb-8 backdrop-blur-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
                      {cartItems.map((item) => (
                        <div key={item.cartId} className="flex gap-4 relative z-10">
                           <div className={`w-20 h-24 bg-gradient-to-br ${item.image} flex-shrink-0 relative overflow-hidden rounded-sm border border-white/10`}>
                              {item.image.includes('http') ? ( <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-80" /> ) : ( <div className={`absolute inset-0 bg-gradient-to-br ${item.image} opacity-80`}></div> )}
                              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-lg">{item.title}</h4>
                                  <span className="font-bold font-mono">€{item.price}</span>
                              </div>
                              <div className="flex gap-2 text-xs text-gray-500 uppercase tracking-widest mt-1 font-mono">
                                  <span>Limited Edition</span>
                                  <span>•</span>
                                  <span className="text-orange-500 font-bold">{item.size}</span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 font-mono">Aantal: {item.quantity}</p>
                           </div>
                        </div>
                      ))}
                      
                      <div className="border-t border-white/10 pt-6 space-y-3 relative z-10 font-mono text-sm">
                         <div className="flex justify-between">
                            <span className="text-gray-400 uppercase tracking-wider">Subtotaal</span>
                            <span className="font-bold">€{cartTotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-gray-400 uppercase tracking-wider">Verzending</span>
                            <span className="text-green-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                               <Truck className="w-3 h-3" /> Gratis verzending
                            </span>
                         </div>
                         <div className="flex justify-between border-t border-white/10 pt-4 mt-4">
                            <span className="font-black text-lg uppercase tracking-wider">Totaal</span>
                            <div className="text-right">
                               <span className="font-black text-2xl block text-orange-500">€{cartTotal.toFixed(2)}</span>
                               <span className="text-[10px] text-gray-500 uppercase tracking-widest">(inclusief € {(cartTotal * 0.21).toFixed(2)} btw)</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <p className="text-xs text-gray-500 leading-relaxed mb-6 font-mono">
                      Je persoonlijke gegevens zullen worden gebruikt om je bestelling te verwerken, om je beleving op deze site te optimaliseren en voor andere doeleinden zoals beschreven in onze privacybeleid.
                   </p>

                   <div className="mb-8 font-mono">
                      <label className="flex items-start gap-3 cursor-pointer group">
                         <div className="relative mt-0.5">
                           <input 
                             type="checkbox" 
                             className="peer sr-only" 
                             checked={termsAccepted}
                             onChange={(e) => setTermsAccepted(e.target.checked)}
                           />
                           <div className="w-5 h-5 border border-white/30 rounded-sm peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors group-hover:border-orange-500/50"></div>
                           <Check className="absolute top-0.5 left-0.5 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                         </div>
                         <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Ik heb de algemene voorwaarden van de site gelezen en ga hiermee akkoord *</span>
                      </label>
                   </div>

                   <button 
                     type="button" // Explicitly set type to button to prevent form submission
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
             </div>
          </div>
        )}

        {/* --- INSTAGRAM SECTION (Updated to use fetched data) --- */}
        <section className="relative bg-black py-24 border-t border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white/10 rounded-full border border-white/10"><Instagram className="w-4 h-4 text-white" /></div>
                            <span className="text-xs font-mono text-orange-500 uppercase tracking-widest">@aipapiprints</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">VISUAL FEED</h2>
                    </div>
                    <a 
                        href="https://www.instagram.com/aipapiprints/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:text-orange-500 transition-colors border-b border-transparent hover:border-orange-500 pb-1"
                    >
                        Volg het Algoritme <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                {/* Dynamic Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                    {instaPosts.map((item, i) => (
                        <a 
                            key={item.id || i}
                            href={item.permalink}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group relative aspect-square bg-gray-900 rounded-sm overflow-hidden border border-white/10 hover:border-orange-500/50 transition-all duration-500"
                        >
                            {/* Image - Handles Behold JSON keys (mediaUrl) or Mock keys */}
                            {item.mediaType === 'VIDEO' ? (
                               <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500">
                                  <span className="text-xs uppercase">Video Content</span>
                               </div>
                            ) : (
                               <img 
                                    src={item.sizes?.large?.mediaUrl || item.mediaUrl || item.media_url} 
                                    alt={item.caption || "Instagram Post"}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                               />
                            )}
                            
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-sm px-4 text-center">
                                <Instagram className="w-8 h-8 text-white mb-2" />
                                <span className="text-xs font-mono text-orange-500 uppercase tracking-widest mb-2">Bekijk Post</span>
                                <p className="text-[10px] text-gray-300 line-clamp-2">{item.caption}</p>
                            </div>

                            <div className="absolute bottom-4 left-4 z-10">
                                <span className="text-[10px] font-mono text-white/70 bg-black/50 px-2 py-1 rounded-sm backdrop-blur-md group-hover:text-white transition-colors">
                                    IMG_0{i+1}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-2">
                <div className="text-3xl font-bold tracking-tighter mb-6">AiPapi.</div>
                <p className="text-gray-400 max-w-sm">
                  De grenzen van creativiteit herdefiniëren door middel van kunstmatige intelligentie. Doe mee met de beweging.
                </p>
                <div className="flex gap-4 mt-6">
                   <div className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"><Instagram className="w-5 h-5" /></div>
                   <div onClick={() => setContactOpen(true)} className="p-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors cursor-pointer"><Mail className="w-5 h-5" /></div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-mono">
              <p>&copy; 2024 AiPapi Inc. Alle rechten voorbehouden.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* --- MODALS --- */}
       {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-700" onClick={() => setSelectedProduct(null)}></div>
          <div className="relative w-full max-w-5xl bg-gray-900 border border-white/10 shadow-2xl overflow-hidden grid md:grid-cols-2 rounded-lg animate-in zoom-in-[0.9] fade-in duration-500 slide-in-from-bottom-8 ease-out-expo">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-white hover:text-black text-white p-2 rounded-full transition-colors backdrop-blur-md border border-white/10"><X className="w-5 h-5" /></button>
            <div className="relative h-64 md:h-auto w-full bg-black/20 flex items-center justify-center p-8 md:p-12">
                <div className={`relative w-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ${selectedProduct.aspect} overflow-hidden bg-gray-900 group`}>
                   {selectedProduct.color.includes('http') ? ( <img src={selectedProduct.color} alt={selectedProduct.title} className="absolute inset-0 w-full h-full object-cover" /> ) : ( <div className={`absolute inset-0 bg-gradient-to-br ${selectedProduct.color}`}></div> )}
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay pointer-events-none"></div>
                </div>
            </div>
            <div className="p-8 md:p-12 flex flex-col justify-center bg-gray-950/90 backdrop-blur-sm">
               <div className="inline-block px-3 py-1 mb-6 text-[10px] font-mono border border-orange-500/30 text-orange-500 bg-orange-500/5 rounded-full uppercase tracking-widest w-max">{selectedProduct.category} Collectie</div>
               <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-none">{selectedProduct.title}</h2>
               <p className="text-gray-400 text-lg leading-relaxed mb-8 border-l-2 border-white/10 pl-4">{selectedProduct.desc}</p>
               <div className="mt-auto space-y-6">
                 <div className="flex items-center justify-between border-b border-white/10 pb-6">
                   <div>
                       <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Prijs</span>
                       <span className="text-3xl font-bold">€{currentPrice.toFixed(2)}</span>
                   </div>
                   
                   {/* UPDATED SIZE SELECTOR IN MODAL */}
                   <div className="text-right">
                      <span className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Kies Formaat</span>
                      <div className="flex gap-2 justify-end">
                         {selectedProduct.sizes && selectedProduct.sizes.length > 0 ? (
                            selectedProduct.sizes.map(size => (
                               <button
                                 key={size}
                                 onClick={() => setSelectedSize(size)}
                                 className={`px-3 py-1 border text-xs font-mono transition-all duration-300 ${
                                   selectedSize === size 
                                     ? 'border-orange-500 bg-orange-500/10 text-white shadow-[0_0_10px_rgba(249,115,22,0.5)]' 
                                     : 'border-white/20 text-gray-400 hover:border-white/50 hover:text-white'
                                 }`}
                               >
                                 {size}
                               </button>
                            ))
                         ) : (
                            // Fallback buttons if no sizes found in data
                            <>
                              <button onClick={() => setSelectedSize('A1')} className={`px-3 py-1 border text-xs font-mono transition-all ${selectedSize === 'A1' ? 'border-orange-500 text-white' : 'border-white/20 text-gray-400'}`}>A1</button>
                              <button onClick={() => setSelectedSize('A2')} className={`px-3 py-1 border text-xs font-mono transition-all ${selectedSize === 'A2' ? 'border-orange-500 text-white' : 'border-white/20 text-gray-400'}`}>A2</button>
                            </>
                         )}
                      </div>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                        onClick={() => { 
                            addToCart(selectedProduct, selectedSize, currentPrice, selectedVariation?.id); 
                            setSelectedProduct(null); 
                        }} 
                        className="flex-1 bg-white text-black font-bold uppercase tracking-wider py-4 hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        In Winkelwagen <ShoppingBag className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleShare(selectedProduct.id)} className="px-6 py-4 border border-white/10 hover:bg-white/5 transition-colors relative">{copiedId === selectedProduct.id ? (<span className="text-xs font-bold text-green-500">GEKOPIEERD</span>) : (<Share2 className="w-5 h-5 text-gray-400" />)}</button>
                 </div>
                 <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest">Gratis Verzending Wereldwijd • 30 Dagen Retour</p>
               </div>
            </div>
          </div>
        </div>
      )}
      
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setContactOpen(false)}></div>
          <div className="relative w-full max-w-md bg-gray-900 border border-white/10 shadow-2xl rounded-lg animate-in zoom-in-95 duration-300 overflow-hidden">
             {contactSubmitted ? (
               <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-90 duration-500"><Check className="w-8 h-8 text-black" /></div>
                 <h3 className="text-3xl font-black mb-2">BERICHT VERSTUURD</h3>
                 <p className="text-gray-400">We nemen spoedig contact op.</p>
               </div>
             ) : (
               <form onSubmit={handleContactSubmit} className="p-8 md:p-10 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-8"><div><h3 className="text-2xl font-black">CONTACT</h3><p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Neem contact met ons op</p></div><button type="button" onClick={() => setContactOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
                 <div className="space-y-6">
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Naam</label><input required type="text" className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors" placeholder="Jouw naam" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">E-mail</label><input required type="email" className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors" placeholder="jouw@email.com" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Bericht</label><textarea required rows={4} className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors resize-none" placeholder="Waar kunnen we je mee helpen?" /></div>
                    <button className="w-full bg-white text-black font-bold uppercase tracking-wider py-4 mt-4 hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2">Verstuur Bericht <Send className="w-4 h-4" /></button>
                 </div>
               </form>
             )}
          </div>
        </div>
      )}

      {commissionOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setCommissionOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 shadow-2xl rounded-lg animate-in zoom-in-95 duration-300 overflow-hidden">
             {formSubmitted ? (
               <div className="p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 animate-in zoom-in spin-in-90 duration-500"><Check className="w-8 h-8 text-black" /></div>
                 <h3 className="text-3xl font-black mb-2">AANVRAAG VERSTUURD</h3>
                 <p className="text-gray-400">Onze curatoren nemen spoedig contact op.</p>
               </div>
             ) : (
               <form onSubmit={handleCommissionSubmit} className="p-8 md:p-10 flex flex-col h-full">
                 <div className="flex justify-between items-start mb-8"><div><h3 className="text-2xl font-black">START EEN COMMISSIE</h3><p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Op Maat Gemaakte 1/1 Art Generatie</p></div><button type="button" onClick={() => setCommissionOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button></div>
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Naam</label><input required type="text" className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors" placeholder="Jane Doe" /></div>
                       <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">E-mail</label><input required type="email" className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors" placeholder="jane@example.com" /></div>
                    </div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Visie / Bericht</label><textarea required rows={4} className="w-full bg-black/30 border border-white/10 p-3 rounded-sm focus:border-orange-500 focus:outline-none transition-colors resize-none" placeholder="Beschrijf de sfeer, kleuren en stijl die je zoekt..." /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase">Referentiebeelden (Optioneel)</label><div className="border-2 border-dashed border-white/10 rounded-sm p-8 flex flex-col items-center justify-center text-gray-500 hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors cursor-pointer group"><Upload className="w-8 h-8 mb-3 group-hover:text-orange-500 transition-colors" /><p className="text-sm">Klik om te uploaden of sleep hierheen</p><p className="text-[10px] mt-1">JPG, PNG, WEBP (Max 10MB)</p></div></div>
                    <button className="w-full bg-white text-black font-bold uppercase tracking-wider py-4 mt-4 hover:bg-orange-500 hover:text-white transition-all duration-300">Verstuur Aanvraag</button>
                 </div>
               </form>
             )}
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-transparent" onClick={() => setCartOpen(false)}></div>
          <div className="relative w-full max-w-md h-full bg-black border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
             <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/80 backdrop-blur-md z-10">
               <div className="flex items-center gap-3"><ShoppingBag className="w-5 h-5" /><h2 className="font-bold text-lg tracking-wider">JOUW WINKELWAGEN <span className="text-gray-500 text-sm ml-2">({cartCount})</span></h2></div>
               <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500"><ShoppingBag className="w-12 h-12 mb-4 opacity-20" /><p>Je winkelwagen is leeg.</p></div>
                ) : (
                  cartItems.map(item => (
                    <div key={item.cartId} className="flex gap-4 group">
                       <div className={`w-20 h-24 bg-gradient-to-br ${item.image} flex-shrink-0 relative overflow-hidden rounded-sm border border-white/10`}>
                          {item.image.includes('http') ? ( <img src={item.image} alt={item.title} className="absolute inset-0 w-full h-full object-cover" /> ) : ( <div className={`absolute inset-0 bg-gradient-to-br ${item.image}`}></div> )}
                          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                       </div>
                       <div className="flex-1 flex flex-col justify-between">
                          <div>
                             <div className="flex justify-between items-start"><h3 className="font-bold text-lg">{item.title}</h3><span className="font-mono text-sm">€{item.price}</span></div>
                             <div className="flex gap-2 text-xs text-gray-500 uppercase tracking-widest mt-1 font-mono">
                               <span>Limited Edition</span>
                               <span>•</span>
                               <span className="text-orange-500 font-bold">{item.size}</span>
                             </div>
                          </div>
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-3 bg-white/5 rounded-full px-3 py-1 border border-white/10">
                                <button className="hover:text-orange-500 disabled:opacity-30" onClick={() => updateQuantity(item.cartId, -1)} disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                                <span className="text-xs font-mono w-4 text-center">{item.quantity}</span>
                                <button className="hover:text-orange-500" onClick={() => updateQuantity(item.cartId, 1)}><Plus className="w-3 h-3" /></button>
                             </div>
                             <button className="text-gray-500 hover:text-red-500 transition-colors" onClick={() => removeFromCart(item.cartId)}><Trash2 className="w-4 h-4" /></button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
             <div className="p-6 border-t border-white/10 bg-black/90 backdrop-blur-sm">
                <div className="flex justify-between items-end mb-6"><span className="text-gray-500 text-sm uppercase tracking-widest">Subtotaal</span><span className="text-3xl font-bold">€{cartTotal.toFixed(2)}</span></div>
                <p className="text-xs text-gray-500 mb-6 text-center">Verzendkosten & belastingen berekend bij afrekenen</p>
                <button 
                  onClick={() => { setCartOpen(false); navigateTo('checkout'); }}
                  className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Afrekenen <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-200">
          <button className="absolute top-8 right-8" onClick={() => setMobileMenuOpen(false)}><X className="w-8 h-8 text-white" /></button>
          <button className="text-4xl font-bold text-white/80 hover:text-orange-500 transition-colors" onClick={() => { setMobileMenuOpen(false); navigateTo('collection'); }}>Collecties</button>
          <button className="text-4xl font-bold text-white/80 hover:text-orange-500 transition-colors" onClick={() => { setMobileMenuOpen(false); navigateTo('process'); }}>Proces</button>
          <button className="text-4xl font-bold text-white/80 hover:text-orange-500 transition-colors" onClick={() => { setMobileMenuOpen(false); navigateTo('about'); }}>Over</button>
        </div>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 20s linear infinite; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .perspective-1000 { perspective: 1000px; }
        .ease-out-expo { transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes scan { 0% { top: 0; opacity: 0; } 20% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
      `}</style>
    </div>
  );
};

export default App;
