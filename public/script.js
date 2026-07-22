
/* ZAPPY_STOREFRONT_FETCH_COALESCE_V1 */
(function(){
  if (window.__zappyStorefrontFetchCoalesceV1 || typeof window.fetch !== 'function' || typeof window.Response !== 'function') return;
  window.__zappyStorefrontFetchCoalesceV1 = true;
  var nativeFetch = window.fetch.bind(window);
  var cache = {};
  function cacheableUrl(input, init) {
    var method = init && init.method ? String(init.method).toUpperCase() : 'GET';
    if (method !== 'GET') return '';
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!/\/api\/ecommerce\/storefront\/(?:settings|categories)\?/.test(url)) return '';
    return url;
  }
  window.fetch = function(input, init) {
    var key = cacheableUrl(input, init);
    if (!key) return nativeFetch(input, init);
    if (!cache[key]) {
      cache[key] = nativeFetch(input, init).then(function(response) {
        return response.text().then(function(body) {
          var cached = {
            body: body,
            status: response.status,
            statusText: response.statusText,
            headers: Array.from(response.headers.entries()),
            ok: response.ok
          };
          // Never keep failed/non-OK responses for the page lifetime —
          // later callers must be able to retry the network.
          if (!cached.ok) delete cache[key];
          return cached;
        });
      }).catch(function(error) {
        delete cache[key];
        throw error;
      });
    }
    return cache[key].then(function(cached) {
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: cached.headers
      });
    });
  };
})();

document.addEventListener('DOMContentLoaded', function() {
  // 1. Smooth scroll for anchor links
  document.addEventListener('click', function(e) {
    var target = e.target.closest('a[href^="#"]');
    if (!target) return;
    
    var id = target.getAttribute('href').slice(1);
    var element = document.getElementById(id);
    if (!element) return;
    
    e.preventDefault();
    element.scrollIntoView({ behavior: 'smooth' });
  });

  // 2. Navbar scroll effect
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    var scrollThreshold = 50;
    var lastScroll = 0;
    
    function updateNavbar() {
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > scrollThreshold) {
        navbar.classList.add('navbar-scrolled');
      } else {
        navbar.classList.remove('navbar-scrolled');
      }
      lastScroll = currentScroll;
    }
    
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // 3. Form validation for contact form
  var contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.setAttribute('novalidate', '');
    
    function showError(input, message) {
      var existing = input.parentNode.querySelector('.form-error');
      if (existing) existing.remove();
      
      var error = document.createElement('span');
      error.className = 'form-error';
      error.textContent = message;
      error.style.color = '#e53e3e';
      error.style.fontSize = '0.875rem';
      error.style.marginTop = '0.25rem';
      error.style.display = 'block';
      input.parentNode.appendChild(error);
      input.setAttribute('aria-invalid', 'true');
      input.style.borderColor = '#e53e3e';
    }
    
    function clearError(input) {
      var existing = input.parentNode.querySelector('.form-error');
      if (existing) existing.remove();
      input.removeAttribute('aria-invalid');
      input.style.borderColor = '';
    }
    
    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function validateField(input) {
      var value = input.value.trim();
      var type = input.type;
      var name = input.name || '';
      
      clearError(input);
      
      if (input.hasAttribute('required') && !value) {
        showError(input, 'This field is required.');
        return false;
      }
      
      if (type === 'email' && value && !validateEmail(value)) {
        showError(input, 'Please enter a valid email address.');
        return false;
      }
      
      if (input.hasAttribute('minlength') && value.length < parseInt(input.getAttribute('minlength'))) {
        showError(input, 'Minimum ' + input.getAttribute('minlength') + ' characters required.');
        return false;
      }
      
      if (input.hasAttribute('maxlength') && value.length > parseInt(input.getAttribute('maxlength'))) {
        showError(input, 'Maximum ' + input.getAttribute('maxlength') + ' characters allowed.');
        return false;
      }
      
      if (input.pattern && value && !new RegExp(input.pattern).test(value)) {
        showError(input, input.title || 'Please match the requested format.');
        return false;
      }
      
      return true;
    }
    
    contactForm.addEventListener('submit', function(e) {
      var inputs = contactForm.querySelectorAll('input, textarea, select');
      var isValid = true;
      
      inputs.forEach(function(input) {
        if (!validateField(input)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        e.preventDefault();
        var firstError = contactForm.querySelector('.form-error');
        if (firstError) {
          firstError.closest('input, textarea, select').focus();
        }
      }
    });
    
    contactForm.addEventListener('input', function(e) {
      var input = e.target.closest('input, textarea, select');
      if (!input) return;
      if (input.parentNode.querySelector('.form-error')) {
        validateField(input);
      }
    });
    
    contactForm.addEventListener('blur', function(e) {
      var input = e.target.closest('input, textarea, select');
      if (!input) return;
      validateField(input);
    }, true);
  }

  // 4. Scroll animations (fade-in)
  var animatedElements = document.querySelectorAll('.fade-in, [data-animate]');
  
  if (animatedElements.length > 0) {
    var observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };
    
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    animatedElements.forEach(function(el) {
      observer.observe(el);
    });
  }
});

/* Cookie Consent */

// Helper function to check cookie consent
function hasConsentFor(category) {
  if (typeof window.CookieConsent === 'undefined') {
    return false; // Default to no consent if cookie consent not loaded
  }
  
  return window.CookieConsent.validConsent(category);
}

// Helper function to execute code only with consent
function withConsent(category, callback) {
  if (hasConsentFor(category)) {
    callback();
  } else {
    console.log(`[WARNING] Skipping ${category} code - no user consent`);
  }
}

// Cookie Consent Initialization (multi-language) /* __ccConfigCustomBannerV1 */

(function() {
  'use strict';
  
  var initAttempts = 0;
  var maxAttempts = 50;
  var cookieConsentScriptSrc = 'https://cdn.jsdelivr.net/npm/vanilla-cookieconsent@3/dist/cookieconsent.umd.js';
  var cookieConsentLoadPromise = null;

  function loadCookieConsentLibrary() {
    if (typeof window.CookieConsent !== 'undefined') {
      return Promise.resolve(window.CookieConsent);
    }
    if (cookieConsentLoadPromise) {
      return cookieConsentLoadPromise;
    }
    cookieConsentLoadPromise = new Promise(function(resolve, reject) {
      var existing = document.querySelector('script[data-zappy-cookie-consent="true"]');
      if (existing) {
        // A previously failed/already-complete tag never fires load again.
        if (existing.getAttribute('data-zappy-load-error') === 'true') {
          existing.parentNode && existing.parentNode.removeChild(existing);
        } else if (existing.getAttribute('data-zappy-loaded') === 'true' || existing.readyState === 'complete') {
          resolve(window.CookieConsent);
          return;
        } else {
          existing.addEventListener('load', function() {
            existing.setAttribute('data-zappy-loaded', 'true');
            resolve(window.CookieConsent);
          }, { once: true });
          existing.addEventListener('error', function(error) {
            existing.setAttribute('data-zappy-load-error', 'true');
            reject(error);
          }, { once: true });
          return;
        }
      }
      var script = document.createElement('script');
      script.src = cookieConsentScriptSrc;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-zappy-cookie-consent', 'true');
      script.onload = function() {
        script.setAttribute('data-zappy-loaded', 'true');
        resolve(window.CookieConsent);
      };
      script.onerror = function(error) {
        script.setAttribute('data-zappy-load-error', 'true');
        reject(error);
      };
      document.head.appendChild(script);
    }).catch(function() {
      cookieConsentLoadPromise = null;
    });
    return cookieConsentLoadPromise;
  }

  function initCookieConsent() {
    initAttempts++;

    if (typeof window.CookieConsent === 'undefined') {
      if (initAttempts < maxAttempts) {
        // Keep the previous backoff so we wait for the UMD global to attach
        // after the script load event, instead of exhausting attempts immediately.
        setTimeout(function() {
          loadCookieConsentLibrary().then(initCookieConsent);
        }, 100);
      }
      return;
    }

    if (window.__zappyCookieConsentInitialized) {
      return;
    }
    window.__zappyCookieConsentInitialized = true;

    var cc = window.CookieConsent;
    
    try {
      var __ccConfig = {
  "autoShow": false,
  "mode": "opt-in",
  "revision": 0,
  "categories": {
    "necessary": {
      "enabled": true,
      "readOnly": true
    },
    "analytics": {
      "enabled": false,
      "readOnly": false,
      "autoClear": {
        "cookies": [
          {
            "name": "_ga"
          },
          {
            "name": "_ga_*"
          },
          {
            "name": "_gid"
          },
          {
            "name": "_gat"
          }
        ]
      }
    },
    "marketing": {
      "enabled": false,
      "readOnly": false,
      "autoClear": {
        "cookies": [
          {
            "name": "_fbp"
          },
          {
            "name": "_fbc"
          },
          {
            "name": "fr"
          }
        ]
      }
    }
  },
  "language": {
    "default": "he",
    "translations": {
      "en": {
        "consentModal": {
          "description": "We use cookies to improve your experience and analyze site usage.",
          "acceptAllBtn": "Accept",
          "showPreferencesBtn": "Customize"
        },
        "preferencesModal": {
          "title": "Cookie Preferences",
          "acceptAllBtn": "Accept",
          "acceptNecessaryBtn": "Accept Necessary",
          "savePreferencesBtn": "Save Preferences",
          "closeIconLabel": "Close",
          "sections": [
            {
              "title": "Essential Cookies",
              "description": "These cookies are necessary for the website to function and cannot be disabled.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analytics Cookies",
              "description": "These cookies help us understand how visitors interact with our website.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketing Cookies",
              "description": "These cookies are used to deliver personalized advertisements.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "es": {
        "consentModal": {
          "description": "Usamos cookies para mejorar tu experiencia y analizar el uso del sitio.",
          "acceptAllBtn": "Aceptar",
          "showPreferencesBtn": "Personalizar"
        },
        "preferencesModal": {
          "title": "Preferencias de Cookies",
          "acceptAllBtn": "Aceptar",
          "acceptNecessaryBtn": "Solo Necesarias",
          "savePreferencesBtn": "Guardar Preferencias",
          "closeIconLabel": "Cerrar",
          "sections": [
            {
              "title": "Cookies Esenciales",
              "description": "Estas cookies son necesarias para que el sitio web funcione y no se pueden desactivar.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Cookies de Análisis",
              "description": "Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Cookies de Marketing",
              "description": "Estas cookies se utilizan para entregar anuncios personalizados.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "fr": {
        "consentModal": {
          "description": "Nous utilisons des cookies pour améliorer votre expérience et analyser l'utilisation du site.",
          "acceptAllBtn": "Accepter",
          "showPreferencesBtn": "Personnaliser"
        },
        "preferencesModal": {
          "title": "Préférences des Cookies",
          "acceptAllBtn": "Accepter",
          "acceptNecessaryBtn": "Accepter les Nécessaires",
          "savePreferencesBtn": "Enregistrer les Préférences",
          "closeIconLabel": "Fermer",
          "sections": [
            {
              "title": "Cookies Essentiels",
              "description": "Ces cookies sont nécessaires au fonctionnement du site web et ne peuvent pas être désactivés.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Cookies Analytiques",
              "description": "Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site web.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Cookies Marketing",
              "description": "Ces cookies sont utilisés pour diffuser des publicités personnalisées.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "de": {
        "consentModal": {
          "description": "Wir verwenden Cookies, um Ihr Erlebnis zu verbessern und die Nutzung der Website zu analysieren.",
          "acceptAllBtn": "Akzeptieren",
          "showPreferencesBtn": "Anpassen"
        },
        "preferencesModal": {
          "title": "Cookie-Einstellungen",
          "acceptAllBtn": "Akzeptieren",
          "acceptNecessaryBtn": "Nur Notwendige",
          "savePreferencesBtn": "Einstellungen speichern",
          "closeIconLabel": "Schließen",
          "sections": [
            {
              "title": "Notwendige Cookies",
              "description": "Diese Cookies sind für die Funktion der Website erforderlich und können nicht deaktiviert werden.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analyse-Cookies",
              "description": "Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketing-Cookies",
              "description": "Diese Cookies werden verwendet, um personalisierte Werbung zu liefern.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "it": {
        "consentModal": {
          "description": "Utilizziamo i cookie per migliorare la tua esperienza e analizzare l'utilizzo del sito.",
          "acceptAllBtn": "Accetta",
          "showPreferencesBtn": "Personalizza"
        },
        "preferencesModal": {
          "title": "Preferenze Cookie",
          "acceptAllBtn": "Accetta",
          "acceptNecessaryBtn": "Solo Necessari",
          "savePreferencesBtn": "Salva Preferenze",
          "closeIconLabel": "Chiudi",
          "sections": [
            {
              "title": "Cookie Essenziali",
              "description": "Questi cookie sono necessari per il funzionamento del sito web e non possono essere disattivati.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Cookie Analitici",
              "description": "Questi cookie ci aiutano a capire come i visitatori interagiscono con il nostro sito web.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Cookie di Marketing",
              "description": "Questi cookie vengono utilizzati per fornire pubblicità personalizzate.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "pt": {
        "consentModal": {
          "description": "Usamos cookies para melhorar sua experiência e analisar o uso do site.",
          "acceptAllBtn": "Aceitar",
          "showPreferencesBtn": "Personalizar"
        },
        "preferencesModal": {
          "title": "Preferências de Cookies",
          "acceptAllBtn": "Aceitar",
          "acceptNecessaryBtn": "Apenas Necessários",
          "savePreferencesBtn": "Salvar Preferências",
          "closeIconLabel": "Fechar",
          "sections": [
            {
              "title": "Cookies Essenciais",
              "description": "Estes cookies são necessários para o funcionamento do site e não podem ser desativados.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Cookies Analíticos",
              "description": "Estes cookies nos ajudam a entender como os visitantes interagem com nosso site.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Cookies de Marketing",
              "description": "Estes cookies são usados para exibir anúncios personalizados.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "nl": {
        "consentModal": {
          "description": "Wij gebruiken cookies om uw ervaring te verbeteren en het sitegebruik te analyseren.",
          "acceptAllBtn": "Accepteren",
          "showPreferencesBtn": "Aanpassen"
        },
        "preferencesModal": {
          "title": "Cookie-voorkeuren",
          "acceptAllBtn": "Accepteren",
          "acceptNecessaryBtn": "Alleen noodzakelijke",
          "savePreferencesBtn": "Voorkeuren opslaan",
          "closeIconLabel": "Sluiten",
          "sections": [
            {
              "title": "Noodzakelijke Cookies",
              "description": "Deze cookies zijn nodig voor het functioneren van de website en kunnen niet worden uitgeschakeld.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analytische Cookies",
              "description": "Deze cookies helpen ons te begrijpen hoe bezoekers onze website gebruiken.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketing Cookies",
              "description": "Deze cookies worden gebruikt om gepersonaliseerde advertenties te tonen.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "he": {
        "consentModal": {
          "description": "אנחנו משתמשים בעוגיות כדי לשפר את החוויה שלך ולנתח שימוש באתר.",
          "acceptAllBtn": "אישור",
          "showPreferencesBtn": "התאמה אישית"
        },
        "preferencesModal": {
          "title": "העדפות עוגיות",
          "acceptAllBtn": "אישור",
          "acceptNecessaryBtn": "רק הכרחי",
          "savePreferencesBtn": "שמור העדפות",
          "closeIconLabel": "סגור",
          "sections": [
            {
              "title": "עוגיות חיוניות",
              "description": "עוגיות אלה הכרחיות לתפקוד האתר ולא ניתן להשבית אותן.",
              "linkedCategory": "necessary"
            },
            {
              "title": "עוגיות ניתוח",
              "description": "עוגיות אלה עוזרות לנו להבין איך המבקרים מתקשרים עם האתר שלנו.",
              "linkedCategory": "analytics"
            },
            {
              "title": "עוגיות שיווקיות",
              "description": "עוגיות אלה משמשות להצגת פרסומות מותאמות אישית.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "ar": {
        "consentModal": {
          "description": "نستخدم ملفات تعريف الارتباط لتحسين تجربتك وتحليل استخدام الموقع.",
          "acceptAllBtn": "قبول",
          "showPreferencesBtn": "تخصيص"
        },
        "preferencesModal": {
          "title": "تفضيلات ملفات تعريف الارتباط",
          "acceptAllBtn": "قبول",
          "acceptNecessaryBtn": "الضرورية فقط",
          "savePreferencesBtn": "حفظ التفضيلات",
          "closeIconLabel": "إغلاق",
          "sections": [
            {
              "title": "ملفات تعريف الارتباط الأساسية",
              "description": "هذه الملفات ضرورية لعمل الموقع ولا يمكن تعطيلها.",
              "linkedCategory": "necessary"
            },
            {
              "title": "ملفات تعريف الارتباط التحليلية",
              "description": "تساعدنا هذه الملفات في فهم كيفية تفاعل الزوار مع موقعنا.",
              "linkedCategory": "analytics"
            },
            {
              "title": "ملفات تعريف الارتباط التسويقية",
              "description": "تُستخدم هذه الملفات لعرض إعلانات مخصصة.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "tr": {
        "consentModal": {
          "description": "Deneyiminizi geliştirmek ve site kullanımını analiz etmek için çerezler kullanırız.",
          "acceptAllBtn": "Kabul Et",
          "showPreferencesBtn": "Özelleştir"
        },
        "preferencesModal": {
          "title": "Çerez Tercihleri",
          "acceptAllBtn": "Kabul Et",
          "acceptNecessaryBtn": "Sadece Gerekli",
          "savePreferencesBtn": "Tercihleri Kaydet",
          "closeIconLabel": "Kapat",
          "sections": [
            {
              "title": "Zorunlu Çerezler",
              "description": "Bu çerezler web sitesinin çalışması için gereklidir ve devre dışı bırakılamaz.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analiz Çerezleri",
              "description": "Bu çerezler, ziyaretçilerin web sitemizle nasıl etkileşime girdiğini anlamamıza yardımcı olur.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Pazarlama Çerezleri",
              "description": "Bu çerezler kişiselleştirilmiş reklamlar sunmak için kullanılır.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "ru": {
        "consentModal": {
          "description": "Мы используем файлы cookie для улучшения вашего опыта и анализа использования сайта.",
          "acceptAllBtn": "Принять",
          "showPreferencesBtn": "Настроить"
        },
        "preferencesModal": {
          "title": "Настройки cookie",
          "acceptAllBtn": "Принять",
          "acceptNecessaryBtn": "Только необходимые",
          "savePreferencesBtn": "Сохранить настройки",
          "closeIconLabel": "Закрыть",
          "sections": [
            {
              "title": "Необходимые cookie",
              "description": "Эти файлы cookie необходимы для работы сайта и не могут быть отключены.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Аналитические cookie",
              "description": "Эти файлы cookie помогают нам понять, как посетители взаимодействуют с нашим сайтом.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Маркетинговые cookie",
              "description": "Эти файлы cookie используются для показа персонализированной рекламы.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "zh": {
        "consentModal": {
          "description": "我们使用 Cookie 来改善您的体验并分析网站使用情况。",
          "acceptAllBtn": "接受",
          "showPreferencesBtn": "自定义"
        },
        "preferencesModal": {
          "title": "Cookie 偏好设置",
          "acceptAllBtn": "接受",
          "acceptNecessaryBtn": "仅接受必要",
          "savePreferencesBtn": "保存偏好",
          "closeIconLabel": "关闭",
          "sections": [
            {
              "title": "必要 Cookie",
              "description": "这些 Cookie 是网站正常运行所必需的，无法禁用。",
              "linkedCategory": "necessary"
            },
            {
              "title": "分析 Cookie",
              "description": "这些 Cookie 帮助我们了解访问者如何与我们的网站互动。",
              "linkedCategory": "analytics"
            },
            {
              "title": "营销 Cookie",
              "description": "这些 Cookie 用于投放个性化广告。",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "ja": {
        "consentModal": {
          "description": "お客様の体験向上とサイト利用状況の分析のためにCookieを使用しています。",
          "acceptAllBtn": "許可する",
          "showPreferencesBtn": "カスタマイズ"
        },
        "preferencesModal": {
          "title": "Cookie設定",
          "acceptAllBtn": "許可する",
          "acceptNecessaryBtn": "必要なもののみ",
          "savePreferencesBtn": "設定を保存",
          "closeIconLabel": "閉じる",
          "sections": [
            {
              "title": "必要なCookie",
              "description": "これらのCookieはウェブサイトの機能に必要であり、無効にすることはできません。",
              "linkedCategory": "necessary"
            },
            {
              "title": "分析Cookie",
              "description": "これらのCookieは、訪問者がウェブサイトとどのように対話するかを理解するのに役立ちます。",
              "linkedCategory": "analytics"
            },
            {
              "title": "マーケティングCookie",
              "description": "これらのCookieはパーソナライズされた広告を配信するために使用されます。",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "ko": {
        "consentModal": {
          "description": "경험 향상과 사이트 사용 분석을 위해 쿠키를 사용합니다.",
          "acceptAllBtn": "수락",
          "showPreferencesBtn": "사용자 지정"
        },
        "preferencesModal": {
          "title": "쿠키 설정",
          "acceptAllBtn": "수락",
          "acceptNecessaryBtn": "필수만 수락",
          "savePreferencesBtn": "설정 저장",
          "closeIconLabel": "닫기",
          "sections": [
            {
              "title": "필수 쿠키",
              "description": "이 쿠키는 웹사이트 작동에 필요하며 비활성화할 수 없습니다.",
              "linkedCategory": "necessary"
            },
            {
              "title": "분석 쿠키",
              "description": "이 쿠키는 방문자가 웹사이트와 어떻게 상호작용하는지 이해하는 데 도움이 됩니다.",
              "linkedCategory": "analytics"
            },
            {
              "title": "마케팅 쿠키",
              "description": "이 쿠키는 맞춤형 광고를 제공하는 데 사용됩니다.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "pl": {
        "consentModal": {
          "description": "Używamy plików cookie, aby poprawić Twoje wrażenia i analizować korzystanie z witryny.",
          "acceptAllBtn": "Akceptuję",
          "showPreferencesBtn": "Dostosuj"
        },
        "preferencesModal": {
          "title": "Preferencje cookie",
          "acceptAllBtn": "Akceptuję",
          "acceptNecessaryBtn": "Tylko niezbędne",
          "savePreferencesBtn": "Zapisz preferencje",
          "closeIconLabel": "Zamknij",
          "sections": [
            {
              "title": "Niezbędne pliki cookie",
              "description": "Te pliki cookie są niezbędne do działania strony i nie można ich wyłączyć.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Analityczne pliki cookie",
              "description": "Te pliki cookie pomagają nam zrozumieć, w jaki sposób odwiedzający korzystają z naszej strony.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Marketingowe pliki cookie",
              "description": "Te pliki cookie służą do wyświetlania spersonalizowanych reklam.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "uk": {
        "consentModal": {
          "description": "Ми використовуємо файли cookie для покращення вашого досвіду та аналізу використання сайту.",
          "acceptAllBtn": "Прийняти",
          "showPreferencesBtn": "Налаштувати"
        },
        "preferencesModal": {
          "title": "Налаштування cookie",
          "acceptAllBtn": "Прийняти",
          "acceptNecessaryBtn": "Лише необхідні",
          "savePreferencesBtn": "Зберегти налаштування",
          "closeIconLabel": "Закрити",
          "sections": [
            {
              "title": "Необхідні cookie",
              "description": "Ці файли cookie необхідні для роботи сайту і не можуть бути вимкнені.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Аналітичні cookie",
              "description": "Ці файли cookie допомагають нам зрозуміти, як відвідувачі взаємодіють з нашим сайтом.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Маркетингові cookie",
              "description": "Ці файли cookie використовуються для показу персоналізованої реклами.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "ro": {
        "consentModal": {
          "description": "Folosim cookie-uri pentru a vă îmbunătăți experiența și a analiza utilizarea site-ului.",
          "acceptAllBtn": "Acceptă",
          "showPreferencesBtn": "Personalizează"
        },
        "preferencesModal": {
          "title": "Preferințe cookie",
          "acceptAllBtn": "Acceptă",
          "acceptNecessaryBtn": "Doar necesare",
          "savePreferencesBtn": "Salvează preferințele",
          "closeIconLabel": "Închide",
          "sections": [
            {
              "title": "Cookie-uri esențiale",
              "description": "Aceste cookie-uri sunt necesare pentru funcționarea site-ului și nu pot fi dezactivate.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Cookie-uri analitice",
              "description": "Aceste cookie-uri ne ajută să înțelegem cum interacționează vizitatorii cu site-ul nostru.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Cookie-uri de marketing",
              "description": "Aceste cookie-uri sunt folosite pentru a afișa reclame personalizate.",
              "linkedCategory": "marketing"
            }
          ]
        }
      },
      "bg": {
        "consentModal": {
          "description": "Използваме бисквитки, за да подобрим изживяването ви и да анализираме използването на сайта.",
          "acceptAllBtn": "Приемам",
          "showPreferencesBtn": "Персонализиране"
        },
        "preferencesModal": {
          "title": "Настройки за бисквитки",
          "acceptAllBtn": "Приемам",
          "acceptNecessaryBtn": "Само необходимите",
          "savePreferencesBtn": "Запазване на предпочитанията",
          "closeIconLabel": "Затвори",
          "sections": [
            {
              "title": "Необходими бисквитки",
              "description": "Тези бисквитки са необходими за функционирането на уебсайта и не могат да бъдат деактивирани.",
              "linkedCategory": "necessary"
            },
            {
              "title": "Аналитични бисквитки",
              "description": "Тези бисквитки ни помагат да разберем как посетителите взаимодействат с нашия уебсайт.",
              "linkedCategory": "analytics"
            },
            {
              "title": "Маркетингови бисквитки",
              "description": "Тези бисквитки се използват за показване на персонализирани реклами.",
              "linkedCategory": "marketing"
            }
          ]
        }
      }
    }
  },
  "guiOptions": {
    "consentModal": {
      "layout": "bar inline",
      "position": "bottom",
      "equalWeightButtons": false,
      "flipButtons": false
    },
    "preferencesModal": {
      "layout": "box",
      "equalWeightButtons": false,
      "flipButtons": false
    }
  }
};
      var __ccCloseLabels = {"en":"Close","es":"Cerrar","fr":"Fermer","de":"Schließen","it":"Chiudi","pt":"Fechar","nl":"Sluiten","he":"סגור","ar":"إغلاق","tr":"Kapat","ru":"Закрыть","zh":"关闭","ja":"閉じる","ko":"닫기","pl":"Zamknij","uk":"Закрити","ro":"Închide","bg":"Затвори"};

      // Detect the current page language and override the build-time default.
      // Published multi-language sites set <html lang="…"> per URL prefix;
      // preview pages may store the active language on zappyI18n.
      var pageLang = (document.documentElement.getAttribute('lang') || '').split('-')[0].toLowerCase();
      if (!pageLang && typeof zappyI18n !== 'undefined' && zappyI18n.language) {
        pageLang = String(zappyI18n.language).split('-')[0].toLowerCase();
      }
      if (pageLang && __ccConfig.language.translations[pageLang]) {
        __ccConfig.language.default = pageLang;
      }

      function getActiveLanguage() {
        var lang = (document.documentElement.getAttribute('lang') || '').split('-')[0].toLowerCase();
        if (!lang && typeof zappyI18n !== 'undefined' && zappyI18n.language) {
          lang = String(zappyI18n.language).split('-')[0].toLowerCase();
        }
        if (!lang || !__ccConfig.language.translations[lang]) {
          lang = __ccConfig.language.default || 'en';
        }
        return __ccConfig.language.translations[lang] ? lang : 'en';
      }

      function getConsentText() {
        var lang = getActiveLanguage();
        var translations = __ccConfig.language.translations || {};
        var current = translations[lang] || translations.en || {};
        var consent = current.consentModal || {};
        var labels = __ccCloseLabels || {};
        return {
          description: consent.description || '',
          accept: consent.acceptAllBtn || 'Accept',
          customize: consent.showPreferencesBtn || 'Customize',
          close: labels[lang] || labels.en || 'Close'
        };
      }

      function removeCustomBanner() {
        var banner = document.getElementById('zappy-cookie-banner');
        if (banner && banner.parentNode) {
          banner.parentNode.removeChild(banner);
        }
        document.documentElement.classList.remove('zappy-cookie-banner-visible');
      }

      function updateCustomBannerText() {
        var banner = document.getElementById('zappy-cookie-banner');
        if (!banner) return;
        var text = getConsentText();
        var desc = banner.querySelector('[data-zappy-cookie-description]');
        var accept = banner.querySelector('[data-zappy-cookie-accept]');
        var customize = banner.querySelector('[data-zappy-cookie-customize]');
        var close = banner.querySelector('[data-zappy-cookie-close]');
        banner.setAttribute('aria-label', text.description || text.close);
        if (desc) desc.textContent = text.description;
        if (accept) accept.textContent = text.accept;
        if (customize) customize.textContent = text.customize;
        if (close) close.setAttribute('aria-label', text.close);
      }

      // Google Consent Mode v2 integration
      function updateGoogleConsentMode() {
        if (typeof gtag !== 'function') {
          window.dataLayer = window.dataLayer || [];
          window.gtag = function(){dataLayer.push(arguments);};
        }
        
        var analyticsAccepted = cc.acceptedCategory('analytics');
        var marketingAccepted = cc.acceptedCategory('marketing');
        
        gtag('consent', 'update', {
          'analytics_storage': analyticsAccepted ? 'granted' : 'denied',
          'ad_storage': marketingAccepted ? 'granted' : 'denied',
          'ad_user_data': marketingAccepted ? 'granted' : 'denied',
          'ad_personalization': marketingAccepted ? 'granted' : 'denied'
        });
      }

      function acceptAndClose(categories) {
        try { cc.acceptCategory(categories); } catch (_) {}
        removeCustomBanner();
        updateGoogleConsentMode();
      }

      function renderCustomBanner() {
        try {
          if (typeof cc.validConsent === 'function' && cc.validConsent()) {
            removeCustomBanner();
            return;
          }
          if (!document.body) {
            setTimeout(renderCustomBanner, 50);
            return;
          }
          var existing = document.getElementById('zappy-cookie-banner');
          if (existing) {
            updateCustomBannerText();
            return;
          }

          var text = getConsentText();
          var banner = document.createElement('div');
          banner.id = 'zappy-cookie-banner';
          banner.className = 'zappy-cookie-banner';
          banner.setAttribute('role', 'region');
          banner.setAttribute('aria-label', text.description || text.close);

          var inner = document.createElement('div');
          inner.className = 'zappy-cookie-banner__inner';

          var description = document.createElement('p');
          description.className = 'zappy-cookie-banner__text';
          description.setAttribute('data-zappy-cookie-description', 'true');
          description.textContent = text.description;

          var actions = document.createElement('div');
          actions.className = 'zappy-cookie-banner__actions';

          var customizeBtn = document.createElement('button');
          customizeBtn.type = 'button';
          customizeBtn.className = 'zappy-cookie-banner__button zappy-cookie-banner__button--customize';
          customizeBtn.setAttribute('data-zappy-cookie-customize', 'true');
          customizeBtn.textContent = text.customize;
          customizeBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            try { cc.showPreferences(); } catch (_) {}
          });

          var acceptBtn = document.createElement('button');
          acceptBtn.type = 'button';
          acceptBtn.className = 'zappy-cookie-banner__button zappy-cookie-banner__button--accept';
          acceptBtn.setAttribute('data-zappy-cookie-accept', 'true');
          acceptBtn.textContent = text.accept;
          acceptBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            acceptAndClose('all');
          });

          var closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.className = 'zappy-cookie-banner__close';
          closeBtn.setAttribute('data-zappy-cookie-close', 'true');
          closeBtn.setAttribute('aria-label', text.close);
          closeBtn.textContent = '\u00D7';
          closeBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            acceptAndClose([]);
          });

          actions.appendChild(customizeBtn);
          actions.appendChild(acceptBtn);
          inner.appendChild(description);
          inner.appendChild(actions);
          inner.appendChild(closeBtn);
          banner.appendChild(inner);
          document.body.appendChild(banner);
          document.documentElement.classList.add('zappy-cookie-banner-visible');
        } catch (_) {
          // Defensive — never let the custom banner break the page.
        }
      }

      function handleConsentResolved() {
        removeCustomBanner();
        updateGoogleConsentMode();
      }

      __ccConfig.onFirstConsent = handleConsentResolved;
      __ccConfig.onConsent = handleConsentResolved;
      __ccConfig.onChange = handleConsentResolved;

      var runResult = cc.run(__ccConfig);
      var afterRun = function() {
        updateGoogleConsentMode();
        if (!cc.validConsent || !cc.validConsent()) {
          renderCustomBanner();
        }
      };
      if (runResult && typeof runResult.then === 'function') {
        runResult.then(afterRun).catch(afterRun);
      } else {
        setTimeout(afterRun, 0);
      }

      // Keep cookie consent in sync when the user switches language without
      // a full navigation (preview / embedded-resources path).
      if (typeof zappyI18n !== 'undefined' && typeof zappyI18n.onLanguageChange === 'function') {
        zappyI18n.onLanguageChange(function(newLang) {
          try {
            if (__ccConfig.language.translations[newLang]) {
              __ccConfig.language.default = newLang;
              cc.setLanguage(newLang, true);
              updateCustomBannerText();
            }
          } catch (_) {}
        });
      }
    } catch (error) {
      window.__zappyCookieConsentInitialized = false;
    }
  }

  function scheduleCookieConsentLoad() {
    var start = function() {
      loadCookieConsentLibrary().then(initCookieConsent);
    };
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 7000 });
    } else {
      setTimeout(start, 7000);
    }
  }

  if (document.readyState === 'complete') {
    scheduleCookieConsentLoad();
  } else if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('load', scheduleCookieConsentLoad, { once: true });
  } else {
    setTimeout(scheduleCookieConsentLoad, 1000);
  }
})();

/* Accessibility Features */

/* Mickidum Accessibility Toolbar Initialization - Zappy Style */

var zappyAccessibilityInitAttempts = 0;
var zappyAccessibilityMaxAttempts = 50;
var zappyAccessibilityScriptSrc = 'https://cdn.jsdelivr.net/gh/mickidum/acc_toolbar/acctoolbar/acctoolbar.min.js';
var zappyAccessibilityLoadPromise = null;

function loadZappyAccessibilityToolbar() {
    if (typeof window.MicAccessTool === 'function') {
        return Promise.resolve();
    }
    if (zappyAccessibilityLoadPromise) {
        return zappyAccessibilityLoadPromise;
    }
    zappyAccessibilityLoadPromise = new Promise(function(resolve, reject) {
        var existing = document.querySelector('script[data-zappy-accessibility-toolbar="true"]');
        if (existing) {
            // A previously failed/already-complete tag never fires load again.
            if (existing.getAttribute('data-zappy-load-error') === 'true') {
                existing.parentNode && existing.parentNode.removeChild(existing);
            } else if (existing.getAttribute('data-zappy-loaded') === 'true' || existing.readyState === 'complete') {
                resolve();
                return;
            } else {
                existing.addEventListener('load', function() {
                    existing.setAttribute('data-zappy-loaded', 'true');
                    resolve();
                }, { once: true });
                existing.addEventListener('error', function(error) {
                    existing.setAttribute('data-zappy-load-error', 'true');
                    reject(error);
                }, { once: true });
                return;
            }
        }
        var script = document.createElement('script');
        script.src = zappyAccessibilityScriptSrc;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-zappy-accessibility-toolbar', 'true');
        script.onload = function() {
            script.setAttribute('data-zappy-loaded', 'true');
            resolve();
        };
        script.onerror = function(error) {
            script.setAttribute('data-zappy-load-error', 'true');
            reject(error);
        };
        document.head.appendChild(script);
    }).then(function() {
        initZappyAccessibilityToolbar();
    }).catch(function() {
        zappyAccessibilityLoadPromise = null;
    });
    return zappyAccessibilityLoadPromise;
}

function initZappyAccessibilityToolbar() {

    try {
        if (window.__zappyAccessibilityInitialized) {
            return;
        }
        if (typeof window.MicAccessTool !== 'function') {
            zappyAccessibilityInitAttempts++;
            if (zappyAccessibilityInitAttempts < zappyAccessibilityMaxAttempts) {
                // Script load may already be settled; schedule another init pass
                // so we keep polling until MicAccessTool attaches.
                setTimeout(function() {
                    loadZappyAccessibilityToolbar().then(initZappyAccessibilityToolbar);
                }, 100);
            }
            return;
        }
        window.__zappyAccessibilityInitialized = true;
        // Detect current page language and direction from <html> element
        // so the toolbar matches the active language on multi-language sites.
        var htmlEl = document.documentElement;
        var pageLang = (htmlEl.getAttribute('lang') || 'he').toLowerCase().split('-')[0];
        var pageDir = (htmlEl.getAttribute('dir') || '').toLowerCase();
        var rtlLangs = ['he', 'ar', 'fa', 'ur', 'yi', 'iw'];
        var isPageRTL = pageDir === 'rtl' || rtlLangs.indexOf(pageLang) !== -1;
        var buttonSide = isPageRTL ? 'left' : 'right';

        var langMap = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-PT', nl: 'nl-NL', he: 'he-IL', ar: 'ar-SA' };
        var forceLang = langMap[pageLang] || 'he-IL';

        var iconPos = { bottom: { size: 50, units: 'px' }, type: 'fixed' };
        iconPos[buttonSide] = { size: 20, units: 'px' };

        window.micAccessTool = new MicAccessTool({
            buttonPosition: buttonSide,
            forceLang: forceLang,
            icon: {
                position: iconPos,
                backgroundColor: 'transparent',
                color: 'transparent',
                img: 'accessible',
                circular: false
            },
            menu: {
                dimensions: {
                    width: { size: 300, units: 'px' },
                    height: { size: 'auto', units: 'px' }
                }
            }
        });
        
    } catch (error) {
    }
    
    // Keyboard shortcut handler: ALT+A (Option+A on Mac) to toggle accessibility menu
    if (!window.__zappyAccessibilityShortcutBound) {
      window.__zappyAccessibilityShortcutBound = true;
      document.addEventListener('keydown', function(event) {
        var isAltOrOption = event.altKey;
        var isAKey = event.code === 'KeyA' || event.keyCode === 65 || event.which === 65 || 
                      (event.key && (event.key.toLowerCase() === 'a' || event.key === 'å' || event.key === 'Å'));
        
        if (isAltOrOption && isAKey) {
            event.preventDefault();
            event.stopPropagation();
            loadZappyAccessibilityToolbar().then(function() {
                var accessButton = document.getElementById('mic-access-tool-general-button');
                if (accessButton) {
                    accessButton.click();
                }
            });
        }
      }, true);
    }
}

function scheduleZappyAccessibilityLazyLoad() {
    var start = function() { loadZappyAccessibilityToolbar(); };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(start, { timeout: 8000 });
    } else {
        setTimeout(start, 8000);
    }
}

if (!window.__zappyAccessibilityShortcutBound) {
    window.__zappyAccessibilityShortcutBound = true;
    document.addEventListener('keydown', function(event) {
        var isAltOrOption = event.altKey;
        var isAKey = event.code === 'KeyA' || event.keyCode === 65 || event.which === 65 ||
                      (event.key && (event.key.toLowerCase() === 'a' || event.key === 'å' || event.key === 'Å'));
        if (isAltOrOption && isAKey) {
            event.preventDefault();
            event.stopPropagation();
            loadZappyAccessibilityToolbar().then(function() {
                var accessButton = document.getElementById('mic-access-tool-general-button');
                if (accessButton) accessButton.click();
            });
        }
    }, true);
}

if (document.readyState === 'complete') {
    scheduleZappyAccessibilityLazyLoad();
} else {
    window.addEventListener('load', scheduleZappyAccessibilityLazyLoad, { once: true });
}


// Zappy Contact Form API Integration (Fallback)
(function() {
    if (window.zappyContactFormLoaded) {
        console.log('📧 Zappy contact form already loaded');
        return;
    }
    window.zappyContactFormLoaded = true;

    function zappyNotify(message, type) {
        var existing = document.querySelectorAll('.zappy-notification');
        existing.forEach(function(el) { el.remove(); });
        var el = document.createElement('div');
        el.className = 'zappy-notification';
        var bg = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
        var fg = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
        var border = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb';
        var icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        el.style.cssText = 'position:fixed;top:20px;right:20px;max-width:400px;padding:16px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:14px;line-height:1.4;animation:slideInRight .3s ease-out;background:' + bg + ';color:' + fg + ';border:1px solid ' + border;
        el.innerHTML = '<span style="margin-right:8px">' + icon + '</span>' + message + '<button onclick="this.parentElement.remove()" style="background:none;border:none;font-size:18px;cursor:pointer;float:right;opacity:.7;padding:0 0 0 12px">&times;</button>';
        if (!document.getElementById('zappy-notify-anim')) {
            var s = document.createElement('style');
            s.id = 'zappy-notify-anim';
            s.textContent = '@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
            document.head.appendChild(s);
        }
        document.body.appendChild(el);
        setTimeout(function() { if (el.parentElement) el.remove(); }, type === 'error' ? 8000 : 5000);
    }

    function initContactFormIntegration() {
        console.log('📧 Zappy: Initializing contact form API integration...');

        // Exclude newsletter popup form (data-zappy-newsletter / #znl-form /
        // forms inside .znl-overlay) — they have their own submit handler that
        // posts to /api/newsletter/public/.../subscribe and must not be hijacked
        // by the contact-form integration.
        function isNewsletterPopupForm(f) {
            if (!f) return false;
            if (f.hasAttribute && f.hasAttribute('data-zappy-newsletter')) return true;
            if (f.id === 'znl-form' || (f.classList && f.classList.contains('znl-form'))) return true;
            if (f.closest && f.closest('.znl-overlay, [data-zappy-newsletter]')) return true;
            return false;
        }
        function pickContactForm() {
            var candidates = [
                document.querySelector('.contact-form'),
                document.querySelector('form[action*="contact"]'),
                document.querySelector('form#contact'),
                document.querySelector('form#contactForm'),
                document.getElementById('contactForm'),
                document.querySelector('section.contact form'),
                document.querySelector('section#contact form')
            ];
            for (var i = 0; i < candidates.length; i++) {
                if (candidates[i] && !isNewsletterPopupForm(candidates[i])) return candidates[i];
            }
            // Last-resort fallback: first <form> that isn't a newsletter popup form.
            var all = document.querySelectorAll('form');
            for (var j = 0; j < all.length; j++) {
                if (!isNewsletterPopupForm(all[j])) return all[j];
            }
            return null;
        }
        var contactForm = pickContactForm();

        if (!contactForm) {
            console.log('⚠️ Zappy: No contact form found on page');
            return;
        }
        
        console.log('✅ Zappy: Contact form found:', contactForm.className || contactForm.id || 'unnamed form');

    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Validate privacy consent checkbox if present (required for GDPR)
        var privacyCheckbox = this.querySelector('.privacy-consent-checkbox');
        if (privacyCheckbox && !privacyCheckbox.checked) {
            zappyNotify('Please accept the Terms & Conditions and Privacy Policy to continue', 'error');
            privacyCheckbox.focus();
            return;
        }

        // Collect form data with multi-value support (checkboxes, multi-selects)
        var formData = new FormData(this);
        var data = {};
        for (var pair of formData.entries()) {
            if (data[pair[0]] !== undefined) {
                if (Array.isArray(data[pair[0]])) data[pair[0]].push(pair[1]);
                else data[pair[0]] = [data[pair[0]], pair[1]];
            } else {
                data[pair[0]] = pair[1];
            }
        }

        // Smart field mapping
        var _coreNameFields = ['name','firstName','first_name','fname','lastName','last_name','lname'];
        var _coreEmailFields = ['email','emailAddress','mail','e-mail'];
        var _corePhoneFields = ['phone','tel','telephone','mobile','cellphone'];
        var _coreMsgFields = ['message','msg','comments','comment','description','details','notes','body','text','inquiry'];
        var _coreSubjectFields = ['subject','topic','regarding','re'];
        var _allCoreFields = [].concat(_coreNameFields, _coreEmailFields, _corePhoneFields, _coreMsgFields, _coreSubjectFields);

        var resolvedName = (data.name || '').trim()
            || [data.firstName || data.first_name || data.fname || '', data.lastName || data.last_name || data.lname || ''].filter(Boolean).join(' ').trim()
            || (data.email || data.emailAddress || data.mail || '').trim()
            || 'Anonymous';
        var resolvedEmail = (data.email || data.emailAddress || data.mail || data['e-mail'] || '').trim();
        var resolvedPhone = data.phone || data.tel || data.telephone || data.mobile || data.cellphone || null;
        var resolvedSubject = data.subject || data.topic || data.regarding || data.re || 'Contact Form Submission';
        var resolvedMessage = (data.message || data.msg || data.comments || data.comment || data.description || data.details || data.body || data.text || data.inquiry || '').trim();
        if (!resolvedMessage) {
            var extraEntries = Object.entries(data).filter(function(e) { return _allCoreFields.indexOf(e[0]) === -1; });
            if (extraEntries.length > 0) {
                resolvedMessage = extraEntries.map(function(e) {
                    var label = e[0].replace(/([A-Z])/g, ' $1').replace(/[_-]/g, ' ').trim();
                    var val = Array.isArray(e[1]) ? e[1].join(', ') : e[1];
                    return label + ': ' + val;
                }).join('\n');
            } else {
                resolvedMessage = 'Form submission from ' + window.location.pathname;
            }
        }

        var extraFields = {};
        for (var k of Object.keys(data)) {
            if (_allCoreFields.indexOf(k) === -1 && data[k] !== '' && data[k] !== null && data[k] !== undefined) {
                extraFields[k] = data[k];
            }
        }

        // Loading state
        var submitBtn = this.querySelector('button[type="submit"], input[type="submit"]');
        var originalText = submitBtn ? (submitBtn.value || submitBtn.textContent) : '';
        if (submitBtn) {
            if (submitBtn.tagName === 'INPUT') submitBtn.value = 'Sending...';
            else submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
        }

        var currentPagePath = window.location.pathname;
        if (window.ZAPPY_CONFIG && window.ZAPPY_CONFIG.currentPagePath) {
            currentPagePath = window.ZAPPY_CONFIG.currentPagePath;
        } else {
            try {
                var p = new URLSearchParams(window.location.search).get('page');
                if (p) currentPagePath = p;
            } catch (ignored) {}
        }

        var theForm = this;
        try {
            console.log('📧 Zappy: Sending contact form to backend API...');
            var apiBase = (window.ZAPPY_API_BASE || 'https://api.zappy5.com').replace(/\/$/, '');
            var payload = {
                websiteId: 'fee62a18-ed36-47d0-abb9-548b7196b8e8',
                name: resolvedName,
                email: resolvedEmail,
                subject: resolvedSubject,
                message: resolvedMessage,
                phone: resolvedPhone,
                currentPagePath: currentPagePath
            };
            if (Object.keys(extraFields).length > 0) {
                payload.extraFields = extraFields;
            }
            var response = await fetch(apiBase + '/api/email/contact-form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            var result = await response.json();
            
            if (result.success) {
                console.log('✅ Zappy: Contact form data sent successfully to backend');

                // Thank-you page redirect
                if (result.thankYouPagePath && result.ticketNumber) {
                    var ticketParam = 'ticket=' + encodeURIComponent(result.ticketNumber);
                    var isPreview = window.location.pathname.indexOf('/preview') !== -1;
                    var thankYouUrl;
                    if (isPreview && window.ZAPPY_CONFIG) {
                        var wid = window.ZAPPY_CONFIG.websiteId || 'fee62a18-ed36-47d0-abb9-548b7196b8e8';
                        var pt = window.location.pathname.indexOf('fullscreen') !== -1 ? 'preview-fullscreen' : 'preview';
                        thankYouUrl = window.location.origin + '/api/website/' + pt + '/' + wid + '?page=' + encodeURIComponent(result.thankYouPagePath) + '&' + ticketParam;
                        if (window.ZAPPY_CONFIG.authToken) thankYouUrl += '&auth_token=' + encodeURIComponent(window.ZAPPY_CONFIG.authToken);
                    } else {
                        thankYouUrl = result.thankYouPagePath + '?' + ticketParam;
                    }
                    window.location.href = thankYouUrl;
                    return;
                }

                var _siteLang = document.documentElement.lang || '';
                var _isHeSite = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
                var _isArSite = _siteLang === 'ar';
                var _successFallback = _isHeSite ? 'ההודעה שלך נשלחה בהצלחה! נחזור אליך בהקדם.' : _isArSite ? 'تم إرسال رسالتك بنجاح! سنرد عليك قريبًا.' : 'Thank you for your message! We\'ll get back to you soon.';
                zappyNotify(result.message || _successFallback, 'success');
                theForm.reset();
            } else {
                console.log('⚠️ Zappy: Backend returned error:', result.error);
                var _isHeSiteErr = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
                var _isArSiteErr = _siteLang === 'ar';
                var _errFallback = _isHeSiteErr ? 'שליחת ההודעה נכשלה. אנא נסו שוב.' : _isArSiteErr ? 'فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.' : 'Failed to send message. Please try again.';
                zappyNotify(result.error || _errFallback, 'error');
            }
        } catch (error) {
            console.error('❌ Zappy: Failed to send to backend API:', error);
            var _isHeSiteNet = _siteLang === 'he' || (_siteLang !== 'ar' && document.documentElement.dir === 'rtl');
            var _isArSiteNet = _siteLang === 'ar';
            var _netFallback = _isHeSiteNet ? 'לא ניתן לשלוח הודעה כרגע. אנא נסו שוב מאוחר יותר.' : _isArSiteNet ? 'لا يمكن إرسال الرسالة الآن. يرجى المحاولة مرة أخرى لاحقًا.' : 'Unable to send message right now. Please try again later.';
            zappyNotify(_netFallback, 'error');
        } finally {
            if (submitBtn) {
                if (submitBtn.tagName === 'INPUT') submitBtn.value = originalText;
                else submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
        }, true);

        console.log('✅ Zappy: Contact form API integration initialized');
    } // End of initContactFormIntegration
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContactFormIntegration);
    } else {
        initContactFormIntegration();
    }
})();


/* ZAPPY_PUBLISHED_LIGHTBOX_RUNTIME */
(function(){
  try {
    if (window.__zappyPublishedLightboxInit) return;
    window.__zappyPublishedLightboxInit = true;

    function safeText(s){ try { return String(s || '').replace(/"/g,'&quot;'); } catch(e){ return ''; } }

    function ensureOverlayForToggle(toggle){
      try {
        if (!toggle || !toggle.id) return;
        if (toggle.id.indexOf('zappy-lightbox-toggle-') !== 0) return;
        var elementId = toggle.id.replace('zappy-lightbox-toggle-','');
        var label = document.querySelector('label.zappy-lightbox-trigger[for="' + toggle.id + '"]');
        if (!label) return;

        // If toggle is inside the label (corrupted), move it before the label so the for attribute works consistently.
        try {
          if (label.contains(toggle) && label.parentNode) {
            label.parentNode.insertBefore(toggle, label);
          }
        } catch (e0) {}

        var lightboxId = 'zappy-lightbox-' + elementId;
        var lb = document.getElementById(lightboxId);
        if (lb && lb.parentNode !== document.body) {
          try { document.body.appendChild(lb); } catch (eMove) {}
        }

        if (!lb) {
          var img = null;
          try { img = label.querySelector('img'); } catch (eImg0) {}
          if (!img) {
            try { img = document.querySelector('img[data-element-id="' + elementId + '"]'); } catch (eImg1) {}
          }
          if (!img) return;

          lb = document.createElement('div');
          lb.id = lightboxId;
          lb.className = 'zappy-lightbox';
          lb.setAttribute('data-zappy-image-lightbox','true');
          lb.style.display = 'none';
          lb.innerHTML =
            '<label class="zappy-lightbox-backdrop" for="' + toggle.id + '" aria-label="Close"></label>' +
            '<div class="zappy-lightbox-content">' +
              '<label class="zappy-lightbox-close" for="' + toggle.id + '" aria-label="Close">×</label>' +
              '<img class="zappy-lightbox-image" src="' + safeText(img.currentSrc || img.src || img.getAttribute('src')) + '" alt="' + safeText(img.getAttribute('alt') || 'Image') + '">' +
            '</div>';
          document.body.appendChild(lb);
        }

        // Keep overlay image in sync at open time (in case src changed / responsive currentSrc)
        function syncOverlayImage(){
          try {
            var imgCur = label.querySelector('img');
            var imgLb = lb.querySelector('img');
            if (imgCur && imgLb) {
              imgLb.src = imgCur.currentSrc || imgCur.src || imgLb.src;
              imgLb.alt = imgCur.alt || imgLb.alt;
            }
          } catch (eSync) {}
        }

        if (!toggle.__zappyLbBound) {
          toggle.addEventListener('change', function(){
            if (toggle.checked) syncOverlayImage();
            lb.style.display = toggle.checked ? 'flex' : 'none';
          });
          toggle.__zappyLbBound = true;
        }

        if (!lb.__zappyLbBound) {
          lb.addEventListener('click', function(ev){
            try {
              var t = ev.target;
              if (!t) return;
              if (t.classList && (t.classList.contains('zappy-lightbox-backdrop') || t.classList.contains('zappy-lightbox-close'))) {
                ev.preventDefault();
                toggle.checked = false;
                lb.style.display = 'none';
              }
            } catch (e2) {}
          });
          lb.__zappyLbBound = true;
        }

        if (!label.__zappyLbClick) {
          label.addEventListener('click', function(ev){
            try {
              if (document.body && document.body.classList && document.body.classList.contains('zappy-edit-mode')) return;
              if (ev && ev.target && ev.target.closest && ev.target.closest('a[href],button,input,select,textarea')) return;
              ev.preventDefault();
              ev.stopPropagation();
              toggle.checked = true;
              syncOverlayImage();
              lb.style.display = 'flex';
            } catch (e3) {}
          }, true);
          label.__zappyLbClick = true;
        }
      } catch (e) {}
    }

    function ensureLightboxCss(){
      try {
        var head = document.head || document.querySelector('head');
        if (!head || head.querySelector('style[data-zappy-image-lightbox="true"]')) return;
        var s = document.createElement('style');
        s.setAttribute('data-zappy-image-lightbox','true');
        s.textContent =
          '.zappy-lightbox{position:fixed;inset:0;background:rgba(0,0,0,.72);display:none;align-items:center;justify-content:center;z-index:9999;padding:24px;}'+
          '.zappy-lightbox-content{position:relative;max-width:min(1100px,92vw);max-height:92vh;}'+
          '.zappy-lightbox-content img{max-width:92vw;max-height:92vh;display:block;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.45);}'+
          '.zappy-lightbox-close{position:absolute;top:-14px;right:-14px;width:32px;height:32px;border-radius:999px;background:#fff;color:#111;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer;}'+
          '.zappy-lightbox-backdrop{position:absolute;inset:0;display:block;cursor:pointer;}'+
          'input.zappy-lightbox-toggle{position:absolute;opacity:0;pointer-events:none;}'+
          'label.zappy-lightbox-trigger{display:contents;}'+
          'label.zappy-lightbox-trigger{cursor:zoom-in;}'+
          'label.zappy-lightbox-trigger [data-zappy-zoom-wrapper="true"],'+
          'label.zappy-lightbox-trigger img{cursor:zoom-in !important;}'+
          'input.zappy-lightbox-toggle:checked + label.zappy-lightbox-trigger + .zappy-lightbox{display:flex;}';
        head.appendChild(s);
      } catch(e){}
    }

    function initZappyPublishedLightboxes(){
      try {
        ensureLightboxCss();
        // Repair orphaned labels (label has for=toggleId but input is missing)
        var orphanLabels = document.querySelectorAll('label.zappy-lightbox-trigger[for^="zappy-lightbox-toggle-"]');
        for (var i=0;i<orphanLabels.length;i++){
          var lbl = orphanLabels[i];
          var forId = lbl && lbl.getAttribute ? lbl.getAttribute('for') : null;
          if (!forId) continue;
          if (!document.getElementById(forId)) {
            var t = document.createElement('input');
            t.type = 'checkbox';
            t.id = forId;
            t.className = 'zappy-lightbox-toggle';
            t.setAttribute('data-zappy-image-lightbox','true');
            if (lbl.parentNode) lbl.parentNode.insertBefore(t, lbl);
          }
        }

        var toggles = document.querySelectorAll('input.zappy-lightbox-toggle[id^="zappy-lightbox-toggle-"]');
        for (var j=0;j<toggles.length;j++){
          ensureOverlayForToggle(toggles[j]);
        }

        // Close on ESC if any lightbox is open
        if (!document.__zappyLbEscBound) {
          document.addEventListener('keydown', function(ev){
            try {
              if (!ev || ev.key !== 'Escape') return;
              var openLb = document.querySelector('.zappy-lightbox[style*="display: flex"]');
              if (openLb) {
                var openToggle = null;
                try {
                  var id = openLb.id || '';
                  if (id.indexOf('zappy-lightbox-') === 0) {
                    openToggle = document.getElementById('zappy-lightbox-toggle-' + id.replace('zappy-lightbox-',''));
                  }
                } catch (e4) {}
                if (openToggle) openToggle.checked = false;
                openLb.style.display = 'none';
              }
            } catch (e5) {}
          });
          document.__zappyLbEscBound = true;
        }
      } catch (eInit) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initZappyPublishedLightboxes, { once: true });
    } else {
      initZappyPublishedLightboxes();
    }
  } catch (eOuter) {}
})();
/* END ZAPPY_PUBLISHED_LIGHTBOX_RUNTIME */


/* ZAPPY_PUBLISHED_ZOOM_WRAPPER_RUNTIME_V4 */
(function(){
  try {
    if (window.__zappyPublishedZoomInitV4) return;
    window.__zappyPublishedZoomInitV4 = true;
    window.__zappyPublishedZoomInitV3 = true; // legacy guard — keep stale V3 copies inert

    function isHeroBgWrapper(wrapper) {
      var img = wrapper.querySelector('img');
      if (img && (img.getAttribute('data-hero-bg') === 'true' || img.getAttribute('data-hero-background') === 'true')) return true;
      var pos = (wrapper.style.position || '').replace(/\s*!important\s*/g, '').trim();
      var w = (wrapper.style.width || '').replace(/\s*!important\s*/g, '').trim();
      var h = (wrapper.style.height || '').replace(/\s*!important\s*/g, '').trim();
      if (pos === 'absolute' && w === '100%' && h === '100%') return true;
      return false;
    }

    // SYNC: These helpers must match sharedZoomCropMath.js
    function parseObjPos(op) {
      var x = null, y = null;
      try {
        if (typeof op === 'string' && op.trim()) {
          var tokens = op.trim().toLowerCase().split(/\s+/).slice(0, 2);
          for (var i = 0; i < tokens.length; i++) {
            var tok = tokens[i];
            var val;
            if (tok === 'left') { x = 0; continue; }
            if (tok === 'right') { x = 100; continue; }
            if (tok === 'top') { y = 0; continue; }
            if (tok === 'bottom') { y = 100; continue; }
            if (tok === 'center') val = 50;
            else if (/^-?\d*\.?\d+%$/.test(tok)) val = parseFloat(tok);
            else val = 50;
            if (x === null) x = val; else if (y === null) y = val;
          }
        }
      } catch (e) {}
      if (x === null || !isFinite(x)) x = 50; if (y === null || !isFinite(y)) y = 50;
      return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
    }

    function coverPercents(imgA, contA) {
      if (!isFinite(imgA) || imgA <= 0 || !isFinite(contA) || contA <= 0)
        return { w: 100, h: 100 };
      if (imgA >= contA) return { w: (imgA / contA) * 100, h: 100 };
      return { w: 100, h: (contA / imgA) * 100 };
    }
    function containPercents(imgA, contA) {
      if (!isFinite(imgA) || imgA <= 0 || !isFinite(contA) || contA <= 0)
        return { w: 100, h: 100 };
      if (imgA >= contA) return { w: 100, h: (contA / imgA) * 100 };
      return { w: (imgA / contA) * 100, h: 100 };
    }

    var IMAGE_SLOT_CLASS_TOKENS = ['image-wrap', 'image-tile', 'image-slot', 'card-image', 'card-media', 'media-wrap', 'portrait-wrap'];
    function classNameHasImageSlotMarker(className) {
      var raw = (className || '').toString().toLowerCase();
      if (!raw.trim()) return false;
      var classes = raw.split(/\s+/);
      for (var c = 0; c < classes.length; c++) {
        var segments = classes[c].split(/[^a-z0-9]+/).filter(function(s) { return !!s; });
        for (var t = 0; t < IMAGE_SLOT_CLASS_TOKENS.length; t++) {
          var tokenParts = IMAGE_SLOT_CLASS_TOKENS[t].split('-');
          for (var i = 0; i <= segments.length - tokenParts.length; i++) {
            var match = true;
            for (var j = 0; j < tokenParts.length; j++) {
              if (segments[i + j] !== tokenParts[j]) { match = false; break; }
            }
            if (match) return true;
          }
        }
      }
      return false;
    }

    function normalizeInsertedZoomParent(wrapper) {
      try {
        var parent = wrapper && wrapper.parentElement;
        if (!parent) return;
        var parentClass = (parent.className || '').toString();
        var isInserted = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + parentClass + ' ');
        if (!isInserted) return;
        parent.style.setProperty('width', '100%', 'important');
        parent.style.setProperty('max-width', '100%', 'important');
        parent.style.setProperty('height', 'auto', 'important');
        parent.style.setProperty('min-height', '0', 'important');
        parent.style.setProperty('max-height', 'none', 'important');
        parent.setAttribute('data-zappy-inserted-zoom-parent-normalized', '1');
      } catch (_e) {}
    }

    function findImageSlotContainerForZoomWrapper(wrapper, maxWalk) {
      try {
        if (!wrapper || !wrapper.parentElement) return null;
        var node = wrapper.parentElement;
        for (var walk = 0; walk < (maxWalk || 4) && node && node !== document.body; walk++) {
          var nodeClass = (node.className || '').toString();
          if (classNameHasImageSlotMarker(nodeClass)) return node;

          var nodeCS = window.getComputedStyle(node);
          var rawClass = (node.className || '').toString();
          var isThinAnchor = node.tagName === 'A' && nodeCS && nodeCS.display === 'contents';
          var isUnclassedDiv = node.tagName === 'DIV' && !rawClass.trim();
          var isInsertedEl = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + rawClass + ' ');
          if (!(isThinAnchor || isUnclassedDiv || isInsertedEl)) break;
          node = node.parentElement;
        }
      } catch (_e) {}
      return null;
    }

    function hasSyncedDecorativeImageFrame(wrapper) {
      try {
        if (!wrapper) return false;
        var node = wrapper.parentElement;
        for (var walk = 0; walk < 4 && node && node !== document.body; walk++) {
          if (node.getAttribute && node.getAttribute('data-zappy-image-frame-synced') === 'true') {
            return true;
          }
          var nodeCS = window.getComputedStyle(node);
          var rawClass = (node.className || '').toString();
          var isThinAnchor = node.tagName === 'A' && nodeCS && nodeCS.display === 'contents';
          var isUnclassedDiv = node.tagName === 'DIV' && !rawClass.trim();
          var isInsertedEl = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + rawClass + ' ');
          if (!(isThinAnchor || isUnclassedDiv || isInsertedEl)) break;
          node = node.parentElement;
        }
      } catch (_e) {}
      return false;
    }

    // FULL-BLEED FIRST-CHILD MEDIA: when the wrapper's parent (the image-wrap)
    // is the first visible child of a padded card, apply negative margins on all
    // sides equal to the card's padding so the image extends edge-to-edge of the
    // card. Without this, every padded card leaves a visible padding "frame"
    // around the image which users perceive as the image not filling the card.
    // Applies on BOTH desktop and mobile — this is a layout concern, not a
    // viewport-specific one. Skipped for hero backgrounds and full-width wrappers.
    function applyFirstChildBleed(wrapper) {
      try {
        if (!wrapper || isHeroBgWrapper(wrapper)) return;
        var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode');
        if (widthMode === 'full') return;
        // Bleed only recognized image-slot wrappers that are direct children
        // of padded card-like containers. This still handles editor-injected
        // wrappers (card -> image-wrap -> zappy-inserted-element -> wrapper)
        // but avoids bleeding media into full section/layout containers.
        var slotForBleed = null;
        var slotNode = wrapper.parentElement;
        for (var slotWalk = 0; slotWalk < 4 && slotNode && slotNode !== document.body; slotWalk++) {
          var slotNodeClass = (slotNode.className || '').toString();
          if (classNameHasImageSlotMarker(slotNodeClass)) {
            slotForBleed = slotNode;
            break;
          }
          var slotNodeCS = window.getComputedStyle(slotNode);
          var slotNodeRawClass = (slotNode.className || '').toString();
          var slotThinAnchor = slotNode.tagName === 'A' && slotNodeCS.display === 'contents';
          var slotUnclassedDiv = slotNode.tagName === 'DIV' && !slotNodeRawClass.trim();
          var slotInserted = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + slotNodeRawClass + ' ');
          if (!(slotThinAnchor || slotUnclassedDiv || slotInserted)) break;
          slotNode = slotNode.parentElement;
        }
        var directInsertedForBleed = null;
        if (!slotForBleed && wrapper.parentElement) {
          var directParentClass = (wrapper.parentElement.className || '').toString();
          var directParentIsInserted = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + directParentClass + ' ');
          var directCard = wrapper.parentElement.parentElement;
          var directCardClass = (directCard && directCard.className || '').toString().toLowerCase();
          if (directParentIsInserted && /(card|tile|article|post|news|mention|press|journey|philosophy|feature|service)/.test(directCardClass)) {
            directInsertedForBleed = wrapper.parentElement;
          }
        }
        var bleedTarget = slotForBleed || directInsertedForBleed;
        var card = bleedTarget && bleedTarget.parentElement;
        var cardClass = (card && card.className || '').toString().toLowerCase();
        var isCardLike = /(card|tile|article|post|news|mention|press|journey|philosophy|feature|service)/.test(cardClass);
        if (!bleedTarget || !card || card === document.body || !isCardLike) return;
        var firstVisibleChild = null;
        for (var ci = 0; ci < card.children.length; ci++) {
          var ch = card.children[ci];
          var chCS = window.getComputedStyle(ch);
          if (chCS.display !== 'none' && chCS.visibility !== 'hidden') {
            firstVisibleChild = ch;
            break;
          }
        }
        if (firstVisibleChild !== bleedTarget) return;
        var cardCS = window.getComputedStyle(card);
        var padT = parseFloat(cardCS.paddingTop) || 0;
        var padL = parseFloat(cardCS.paddingLeft) || 0;
        var padR = parseFloat(cardCS.paddingRight) || 0;
        if (padL <= 0 && padR <= 0 && padT <= 0) return;
        bleedTarget.style.setProperty('margin-left', '-' + padL + 'px', 'important');
        bleedTarget.style.setProperty('margin-right', '-' + padR + 'px', 'important');
        bleedTarget.style.setProperty('margin-top', '-' + padT + 'px', 'important');
        bleedTarget.style.setProperty('width', 'calc(100% + ' + (padL + padR) + 'px)', 'important');
        bleedTarget.style.setProperty('max-width', 'calc(100% + ' + (padL + padR) + 'px)', 'important');
        bleedTarget.style.setProperty('height', 'auto', 'important');
        bleedTarget.style.setProperty('min-height', '0', 'important');
        bleedTarget.style.setProperty('max-height', 'none', 'important');
        bleedTarget.setAttribute('data-zappy-mobile-bleed', '1');
        wrapper.style.setProperty('width', '100%', 'important');
        wrapper.style.setProperty('max-width', '100%', 'important');
        var bleedSW = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-width')) || 0;
        var bleedSH = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-height')) || 0;
        if (bleedSW > 0 && bleedSH > 0) {
          wrapper.style.setProperty('aspect-ratio', bleedSW + '/' + bleedSH, 'important');
          wrapper.style.setProperty('height', 'auto', 'important');
        }
      } catch (_e) {}
    }

    // FILL CARD-SLOT CONTAINER: stretch the wrapper to fill its parent when
    // the parent is a designed image-slot container (class includes
    // image-wrap / image-tile / image-slot / card-image / card-media /
    // portrait-wrap) AND the wrapper is materially narrower than the parent.
    // This handles the case where the saved desktop pixel width (e.g. 383px)
    // is smaller than the rendered card slot at certain viewports / card
    // variants (e.g. journey-card--short which is 790px wide while the saved
    // image is 383px), leaving large empty gaps on the sides.
    // Logos, footer brand marks, and intentionally smaller media are not
    // matched because their parents do not carry image-slot class names.
    // Skipped for hero backgrounds and full-width wrappers.
    function applyCardSlotFill(wrapper, img) {
      try {
        if (!wrapper || isHeroBgWrapper(wrapper)) return;
        var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode');
        if (widthMode === 'full') return;
        var forceCardSlotFill = widthMode === 'card-slot' || wrapper.getAttribute('data-zappy-card-slot-fill') === '1';
        if (hasSyncedDecorativeImageFrame(wrapper)) return;
        // Walk UP through editor-injected / "thin" wrappers to find the real
        // visual image-slot container. We tolerate at most 3 levels of:
        //   - <a style="display:contents">           (editor link wrap)
        //   - <div class="zappy-inserted-element">  (editor inserted media)
        //   - <div> with no class                    (anonymous inline wrap)
        var node = wrapper.parentElement;
        var slotEl = null;
        for (var walk = 0; walk < 3 && node && node !== document.body; walk++) {
          var nodeClass = (node.className || '').toString();
          if (classNameHasImageSlotMarker(nodeClass)) {
            slotEl = node;
            break;
          }
          var nodeCS = window.getComputedStyle(node);
          var nodeRawClass = (node.className || '').toString();
          var isThinAnchor = node.tagName === 'A' && nodeCS.display === 'contents';
          var isUnclassedDiv = node.tagName === 'DIV' && !nodeRawClass.trim();
          var isInsertedEl = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + nodeRawClass + ' ');
          if (!(isThinAnchor || isUnclassedDiv || isInsertedEl)) break;
          node = node.parentElement;
        }
        if (!slotEl) {
          if (forceCardSlotFill) {
            var forcedSW = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-width')) || 0;
            var forcedSH = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-height')) || 0;
            wrapper.style.setProperty('width', '100%', 'important');
            wrapper.style.setProperty('max-width', '100%', 'important');
            wrapper.style.setProperty('padding-bottom', '0', 'important');
            if (forcedSW > 0 && forcedSH > 0) {
              wrapper.style.setProperty('aspect-ratio', forcedSW + '/' + forcedSH, 'important');
              wrapper.style.setProperty('height', 'auto', 'important');
            }
            wrapper.setAttribute('data-zappy-card-slot-fill', '1');
          }
          // No image-slot found. Check if the walk stopped at a card-like
          // container and the saved width fills most of the card — this handles
          // user-replaced images where the original image-wrap is empty and the
          // new image is in a zappy-inserted-element sibling.
          if (node && node !== document.body && !wrapper.getAttribute('data-zappy-card-slot-fill')) {
            var caClass = (node.className || '').toString().toLowerCase();
            var caIsCard = /(card|tile|article|post|news|mention|press|journey|philosophy|feature|service)/.test(caClass);
            if (caIsCard) {
              var caSavedW = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-width')) || 0;
              var caSavedH = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-height')) || 0;
              var caRect = node.getBoundingClientRect();
              if (caSavedW > 0 && caRect.width > 0 && caSavedW >= caRect.width * 0.8) {
                wrapper.style.setProperty('width', '100%', 'important');
                wrapper.style.setProperty('max-width', '100%', 'important');
                if (caSavedH > 0) {
                  wrapper.style.setProperty('aspect-ratio', caSavedW + '/' + caSavedH, 'important');
                  wrapper.style.setProperty('height', 'auto', 'important');
                }
                wrapper.setAttribute('data-zappy-card-slot-fill', '1');
                var caInt = wrapper.parentElement;
                for (var cai = 0; cai < 3 && caInt && caInt !== node; cai++) {
                  var caiRaw = (caInt.className || '').toString();
                  if (/ zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + caiRaw + ' ')) {
                    var caHasBleed = caInt.getAttribute('data-zappy-mobile-bleed');
                    if (!caHasBleed) {
                      caInt.style.setProperty('width', '100%', 'important');
                      caInt.style.setProperty('max-width', '100%', 'important');
                    }
                    caInt.style.setProperty('height', 'auto', 'important');
                    caInt.style.setProperty('min-height', '0', 'important');
                    caInt.style.setProperty('max-height', 'none', 'important');
                    var caIsFirst = true;
                    var caPrev = caInt.previousElementSibling;
                    while (caPrev) {
                      if (caPrev.getBoundingClientRect().height > 1) { caIsFirst = false; break; }
                      caPrev = caPrev.previousElementSibling;
                    }
                    if (caIsFirst) {
                      if (!caHasBleed) {
                        caInt.style.setProperty('margin-top', '0', 'important');
                      }
                      caInt.style.setProperty('border-radius', 'var(--radius-card, 20px) var(--radius-card, 20px) 0 0', 'important');
                      caInt.style.setProperty('overflow', 'hidden', 'important');
                    }
                  }
                  caInt = caInt.parentElement;
                }
              }
            }
          }
          return;
        }
        var slotRect = slotEl.getBoundingClientRect();
        var wrapRect = wrapper.getBoundingClientRect();
        var slotCS = window.getComputedStyle(slotEl);
        var slotWidthGap = slotRect.width - wrapRect.width;
        var slotHeightGap = wrapRect.height - slotRect.height;
        if (!forceCardSlotFill && slotWidthGap <= 4 && !(slotHeightGap > 4 && slotRect.height > 0 && slotCS.overflow !== 'visible')) return;
        var swStr = wrapper.getAttribute('data-zappy-zoom-wrapper-width');
        var shStr = wrapper.getAttribute('data-zappy-zoom-wrapper-height');
        var swNum = parseFloat(swStr) || 0;
        var shNum = parseFloat(shStr) || 0;
        // If the slot's height is only as tall as the wrapper, that height is
        // content-driven by THIS wrapper (common for .home-feature-image-wrap
        // with no CSS height). Switching to height:100% then collapses on the
        // next layout pass because the absolute <img> no longer contributes
        // intrinsic height — the Artistic Epoxy / nwooda middle-card bug.
        var slotSizedByWrapper = Math.abs(slotRect.height - wrapRect.height) <= 2;
        var canFillSlotHeight = slotRect.height > 0 && !slotSizedByWrapper &&
          (forceCardSlotFill || (slotHeightGap > 4 && slotCS.overflow !== 'visible'));
        wrapper.style.setProperty('width', '100%', 'important');
        wrapper.style.setProperty('max-width', '100%', 'important');
        if (canFillSlotHeight) {
          wrapper.style.setProperty('height', '100%', 'important');
          wrapper.style.setProperty('aspect-ratio', 'auto', 'important');
          wrapper.style.setProperty('padding-bottom', '0', 'important');
          // Recompute image crop after changing the wrapper from stale saved
          // portrait dimensions to the real clipped slot height. Otherwise the
          // image may keep horizontal-overflow-only sizing, making vertical
          // object-position ineffective.
          if (img) {
            var finalRect = wrapper.getBoundingClientRect();
            var nW = img.naturalWidth || 0;
            var nH = img.naturalHeight || 0;
            if (finalRect && finalRect.width > 0 && finalRect.height > 0 && nW > 0 && nH > 0) {
              var finalCover = coverPercents(nW / nH, finalRect.width / finalRect.height);
              var zAttr = parseFloat(img.getAttribute('data-zappy-mobile-zoom') || img.getAttribute('data-zappy-zoom') || '1');
              var finalZoom = (isFinite(zAttr) && zAttr > 0) ? zAttr : 1;
              var finalW = 100;
              var finalH = 100;
              if (finalZoom >= 1) {
                finalW = finalCover.w * finalZoom;
                finalH = finalCover.h * finalZoom;
              } else {
                var finalT = (finalZoom - 0.5) / 0.5;
                if (!isFinite(finalT)) finalT = 0;
                finalT = Math.max(0, Math.min(1, finalT));
                finalW = 100 + finalT * (finalCover.w - 100);
                finalH = 100 + finalT * (finalCover.h - 100);
              }
              var finalPos = parseObjPos(img.getAttribute('data-zappy-mobile-object-position') || img.getAttribute('data-zappy-object-position') || img.style.objectPosition || '50% 50%');
              img.style.setProperty('position', 'absolute', 'important');
              img.style.setProperty('left', ((100 - finalW) * (finalPos.x / 100)) + '%', 'important');
              img.style.setProperty('top', ((100 - finalH) * (finalPos.y / 100)) + '%', 'important');
              img.style.setProperty('width', finalW + '%', 'important');
              img.style.setProperty('height', finalH + '%', 'important');
              img.style.setProperty('max-width', 'none', 'important');
              img.style.setProperty('max-height', 'none', 'important');
              img.style.setProperty('display', 'block', 'important');
              img.style.setProperty('object-fit', finalZoom < 1 ? 'fill' : 'cover', 'important');
              img.style.setProperty('margin', '0', 'important');
            }
          }
        } else if (swNum > 0 && shNum > 0) {
          // Heightless / content-sized slots (and already-collapsed wrappers):
          // keep width:100% and size via the saved aspect ratio so absolute
          // images remain visible after refresh.
          wrapper.style.setProperty('aspect-ratio', swNum + '/' + shNum, 'important');
          wrapper.style.setProperty('height', 'auto', 'important');
          wrapper.style.setProperty('padding-bottom', '0', 'important');
        }
        wrapper.setAttribute('data-zappy-card-slot-fill', '1');
        // Also stretch any intermediate .zappy-inserted-element ancestors up
        // to the slot, so an editor-inserted media wrapper with a saved
        // desktop pixel width doesn't constrain the wrapper we just stretched
        // to 100%.
        var intermediate = wrapper.parentElement;
        for (var iw = 0; iw < 3 && intermediate && intermediate !== slotEl; iw++) {
          var iwRawClass = (intermediate.className || '').toString();
          var iwIsInserted = / zappy-inserted-element |^zappy-inserted-element | zappy-inserted-element$|^zappy-inserted-element$/.test(' ' + iwRawClass + ' ');
          if (iwIsInserted) {
            intermediate.style.setProperty('width', '100%', 'important');
            intermediate.style.setProperty('max-width', '100%', 'important');
            intermediate.style.setProperty('height', 'auto', 'important');
            intermediate.style.setProperty('min-height', '0', 'important');
            intermediate.style.setProperty('max-height', 'none', 'important');
            intermediate.setAttribute('data-zappy-inserted-stretched', '1');
          }
          intermediate = intermediate.parentElement;
        }
      } catch (_fillErr) {}
    }

    function applyZoom(wrapper, img) {
      var zoom = parseFloat(img.getAttribute('data-zappy-zoom')) || 1;
      if (!(zoom > 0)) zoom = 1;

      var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode');
      if (widthMode === 'full') return;
      if (isHeroBgWrapper(wrapper)) return;
      normalizeInsertedZoomParent(wrapper);

      var isMobile = window.innerWidth <= 768;
      if (isMobile) {
        var mSrc = img.getAttribute('data-zappy-mobile-src');
        var mPos = img.getAttribute('data-zappy-mobile-object-position');
        var mZoomStr = img.getAttribute('data-zappy-mobile-zoom');
        var mZoom = parseFloat(mZoomStr);
        if (mSrc) img.src = mSrc;

        wrapper.style.setProperty('width', '100%', 'important');
        wrapper.style.setProperty('max-width', '100%', 'important');
        wrapper.style.setProperty('overflow', 'hidden', 'important');
        wrapper.style.setProperty('position', 'relative', 'important');

        var _sW = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-width')) || 0;
        var _sH = parseFloat(wrapper.getAttribute('data-zappy-zoom-wrapper-height')) || 0;
        var hasMobileOverrides = mPos || (isFinite(mZoom) && mZoom > 0);

        if (hasMobileOverrides && _sW > 0 && _sH > 0) {
          wrapper.style.setProperty('padding-bottom', '0', 'important');
          wrapper.style.setProperty('aspect-ratio', _sW + '/' + _sH, 'important');
          wrapper.style.setProperty('height', 'auto', 'important');

          function applyMobileZoomCrop(_img, _wrapper, _effPos, _effZoom) {
            var rect = _wrapper.getBoundingClientRect();
            if (!rect || !rect.width || !rect.height) return;
            var nW = _img.naturalWidth || 0, nH = _img.naturalHeight || 0;
            if (!(nW > 0 && nH > 0)) return;
            var imgA = nW / nH;
            var contA = rect.width / rect.height;
            var cover = coverPercents(imgA, contA);
            var wP = 100, hP = 100;
            if (_effZoom >= 1) { wP = cover.w * _effZoom; hP = cover.h * _effZoom; }
            else { var t2 = (_effZoom - 0.5) / 0.5; if (!isFinite(t2)) t2 = 0; t2 = Math.max(0, Math.min(1, t2)); wP = 100 + t2 * (cover.w - 100); hP = 100 + t2 * (cover.h - 100); }
            var p2 = parseObjPos(_effPos);
            var lP = (100 - wP) * (p2.x / 100);
            var tP = (100 - hP) * (p2.y / 100);
            _img.style.setProperty('position', 'absolute', 'important');
            _img.style.setProperty('left', lP + '%', 'important');
            _img.style.setProperty('top', tP + '%', 'important');
            _img.style.setProperty('width', wP + '%', 'important');
            _img.style.setProperty('height', hP + '%', 'important');
            _img.style.setProperty('max-width', 'none', 'important');
            _img.style.setProperty('max-height', 'none', 'important');
            _img.style.setProperty('display', 'block', 'important');
            _img.style.setProperty('object-fit', _effZoom < 1 ? 'fill' : 'cover', 'important');
            _img.style.setProperty('margin', '0', 'important');
          }

          var effZoom = (isFinite(mZoom) && mZoom > 0) ? mZoom : zoom;
          var effPos = mPos || img.getAttribute('data-zappy-object-position') || img.style.objectPosition || '50% 50%';
          applyMobileZoomCrop(img, wrapper, effPos, effZoom);
          if (!(img.complete && img.naturalWidth > 0)) {
            img.addEventListener('load', function _onLoad() {
              img.removeEventListener('load', _onLoad);
              try { applyMobileZoomCrop(img, wrapper, effPos, effZoom); } catch(e) {}
            });
          }
        } else if (_sW > 0 && _sH > 0) {
          // No mobile overrides but the wrapper has a saved desktop aspect ratio.
          // Preserve that crop frame at mobile width and use object-fit:cover with the
          // saved object-position. This keeps the visual layout consistent with desktop
          // (same crop, just narrower) without applying the percentage-offset math that
          // produced "image overflows wrapper" rendering on the previous build.
          var _savedObjPos = img.getAttribute('data-zappy-object-position') ||
                             img.style.objectPosition || '50% 50%';
          wrapper.style.setProperty('aspect-ratio', _sW + '/' + _sH, 'important');
          wrapper.style.setProperty('padding-bottom', '0', 'important');
          wrapper.style.setProperty('height', 'auto', 'important');
          img.style.setProperty('position', 'absolute', 'important');
          img.style.setProperty('top', '0', 'important');
          img.style.setProperty('left', '0', 'important');
          img.style.setProperty('width', '100%', 'important');
          img.style.setProperty('height', '100%', 'important');
          img.style.setProperty('max-width', '100%', 'important');
          img.style.setProperty('max-height', 'none', 'important');
          img.style.setProperty('display', 'block', 'important');
          img.style.setProperty('object-fit', 'cover', 'important');
          img.style.setProperty('object-position', _savedObjPos, 'important');
          img.style.removeProperty('right');
          img.style.removeProperty('bottom');
          img.style.setProperty('margin', '0', 'important');
        } else {
          // Legacy wrappers without saved dimensions — natural-aspect responsive image.
          wrapper.style.setProperty('aspect-ratio', 'auto', 'important');
          wrapper.style.setProperty('padding-bottom', '0', 'important');
          wrapper.style.setProperty('height', 'auto', 'important');
          img.style.setProperty('position', 'relative', 'important');
          img.style.setProperty('width', '100%', 'important');
          img.style.setProperty('height', 'auto', 'important');
          img.style.setProperty('max-width', '100%', 'important');
          img.style.setProperty('max-height', '300px', 'important');
          img.style.setProperty('display', 'block', 'important');
          img.style.setProperty('object-fit', 'cover', 'important');
          img.style.removeProperty('left');
          img.style.removeProperty('top');
          img.style.setProperty('margin', '0', 'important');
        }

        applyFirstChildBleed(wrapper);
        applyCardSlotFill(wrapper, img);
        return;
      }

      // Desktop zoom === 1: image fills the wrapper exactly — no crop math
      // needed. Always set 100%/100% to override any stale inline styles
      // that may have been baked in with incorrect values.
      if (zoom === 1) {
        wrapper.style.setProperty('overflow', 'hidden', 'important');
        wrapper.style.setProperty('position', 'relative', 'important');
        img.style.setProperty('position', 'absolute', 'important');
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', '100%', 'important');
        img.style.setProperty('left', '0%', 'important');
        img.style.setProperty('top', '0%', 'important');
        img.style.setProperty('max-width', 'none', 'important');
        img.style.setProperty('max-height', 'none', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.setProperty('display', 'block', 'important');
        img.style.setProperty('margin', '0', 'important');
        applyFirstChildBleed(wrapper);
        applyCardSlotFill(wrapper, img);
        return;
      }

      // Desktop zoom > 1: if the image already has zoom styles saved from
      // the editor (position:absolute + percentage-based width), trust
      // them.  Sites published before the zoom-out fix had wrong values
      // baked in for zoom < 1 (used cover*zoom instead of the
      // interpolation formula), so those must always be recalculated.
      var existingPos = (img.style.position || '').replace(/s*!importants*/g, '').trim();
      var existingW = (img.style.width || '').replace(/s*!importants*/g, '').trim();
      if (existingPos === 'absolute' && existingW.indexOf('%') !== -1 && zoom > 1) {
        wrapper.style.setProperty('overflow', 'hidden', 'important');
        wrapper.style.setProperty('position', 'relative', 'important');
        applyFirstChildBleed(wrapper);
        applyCardSlotFill(wrapper, img);
        return;
      }

      // Image lacks saved zoom styles — calculate from scratch
      var rect = wrapper.getBoundingClientRect();
      if (!rect || !rect.width || !rect.height) return;

      var nW = img.naturalWidth || 0, nH = img.naturalHeight || 0;
      if (!(nW > 0 && nH > 0)) return;

      var imgA = nW / nH;
      var contA = rect.width / rect.height;
      var cover = coverPercents(imgA, contA);
      var contain = containPercents(imgA, contA);

      var wPct = 100, hPct = 100;
      if (zoom >= 1) {
        wPct = cover.w * zoom;
        hPct = cover.h * zoom;
      } else if (zoom <= 0.5) {
        wPct = contain.w;
        hPct = contain.h;
      } else {
        var t = (zoom - 0.5) / 0.5;
        if (!isFinite(t)) t = 0;
        t = Math.max(0, Math.min(1, t));
        wPct = 100 + t * (cover.w - 100);
        hPct = 100 + t * (cover.h - 100);
      }

      var op = img.getAttribute('data-zappy-object-position') || img.style.objectPosition || window.getComputedStyle(img).objectPosition || '50% 50%';
      var pos = parseObjPos(op);
      var leftPct = (100 - wPct) * (pos.x / 100);
      var topPct = (100 - hPct) * (pos.y / 100);

      img.style.setProperty('position', 'absolute', 'important');
      img.style.setProperty('left', leftPct + '%', 'important');
      img.style.setProperty('top', topPct + '%', 'important');
      img.style.setProperty('width', wPct + '%', 'important');
      img.style.setProperty('height', hPct + '%', 'important');
      img.style.setProperty('max-width', 'none', 'important');
      img.style.setProperty('max-height', 'none', 'important');
      img.style.setProperty('display', 'block', 'important');
      img.style.setProperty('object-fit', zoom < 1 ? 'fill' : 'cover', 'important');
      img.style.setProperty('margin', '0', 'important');
      applyFirstChildBleed(wrapper);
      applyCardSlotFill(wrapper, img);
    }

    function fixOrphanedZoomImages() {
      if (window.innerWidth > 768) return;
      var zoomImgs = document.querySelectorAll('img[data-zappy-zoom]');
      for (var j = 0; j < zoomImgs.length; j++) {
        var img = zoomImgs[j];
        if (img.closest && img.closest('[data-zappy-zoom-wrapper="true"]')) continue;
        // Carousel slide imgs are absolute cover-fill inside their slide —
        // forcing position:relative + max-height here would collapse the slide.
        if (img.closest && img.closest('.zappy-carousel-slide')) continue;
        img.style.setProperty('position', 'relative', 'important');
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', 'auto', 'important');
        img.style.setProperty('max-width', '100%', 'important');
        img.style.setProperty('max-height', '300px', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.removeProperty('left');
        img.style.removeProperty('top');
      }
    }

    function restoreWrapperDimensions(wrapper) {
      var widthMode = wrapper.getAttribute('data-zappy-zoom-wrapper-width-mode') || 'px';
      if (widthMode === 'full' || widthMode === 'grid-responsive') return;
      if (isHeroBgWrapper(wrapper)) return;

      if ((widthMode === 'card-slot' || wrapper.getAttribute('data-zappy-card-slot-fill') === '1') &&
          !findImageSlotContainerForZoomWrapper(wrapper, 4) &&
          hasSyncedDecorativeImageFrame(wrapper)) {
        // Older published runtimes used substring matching and could persist
        // card-slot fill on decorative frames like "showcase-image-wrapper".
        // Clear that stale marker so saved pixel crop dimensions win again.
        wrapper.removeAttribute('data-zappy-card-slot-fill');
        if (widthMode === 'card-slot') {
          wrapper.setAttribute('data-zappy-zoom-wrapper-width-mode', 'px');
          widthMode = 'px';
        }
      }

      var storedW = wrapper.getAttribute('data-zappy-zoom-wrapper-width');
      var storedH = wrapper.getAttribute('data-zappy-zoom-wrapper-height');
      if (!storedW && !storedH) return;

      if (widthMode === 'px' && storedW) {
        var curW = (wrapper.style.width || '').replace(/s*!importants*/g, '').trim();
        var storedWNorm = storedW.replace(/s*!importants*/g, '').trim();
        if (!curW || curW === '100%' || curW.indexOf('%') !== -1 || curW !== storedWNorm) {
          wrapper.style.setProperty('width', storedW, 'important');
          wrapper.style.setProperty('max-width', '100%', 'important');
        }
      }
      if (storedH) {
        var curH = (wrapper.style.height || '').replace(/s*!importants*/g, '').trim();
        var storedHNorm = storedH.replace(/s*!importants*/g, '').trim();
        if (!curH || curH === 'auto' || curH === '100%' || curH.indexOf('%') !== -1 || curH !== storedHNorm) {
          wrapper.style.setProperty('height', storedH, 'important');
        }
      }
      wrapper.style.setProperty('overflow', 'hidden', 'important');
      wrapper.style.setProperty('position', 'relative', 'important');
    }

    function fixHeroBgWrapperStyles(wrapper) {
      if (!isHeroBgWrapper(wrapper)) return;
      wrapper.style.setProperty('position', 'absolute', 'important');
      wrapper.style.setProperty('top', '0', 'important');
      wrapper.style.setProperty('left', '0', 'important');
      wrapper.style.setProperty('width', '100%', 'important');
      wrapper.style.setProperty('height', '100%', 'important');
      wrapper.style.setProperty('max-width', 'none', 'important');
      wrapper.style.setProperty('overflow', 'hidden', 'important');
      wrapper.setAttribute('data-zappy-zoom-wrapper-width-mode', 'full');
      var img = wrapper.querySelector('img');
      if (img) {
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', '100%', 'important');
        img.style.setProperty('object-fit', 'cover', 'important');
        img.style.setProperty('position', 'relative', 'important');
        img.style.setProperty('top', '0', 'important');
        img.style.setProperty('left', '0', 'important');
        img.style.setProperty('max-width', 'none', 'important');
        img.style.setProperty('max-height', 'none', 'important');
        img.style.setProperty('display', 'block', 'important');
        if (window.innerWidth <= 768) {
          var mSrc = img.getAttribute('data-zappy-mobile-src');
          var mPos = img.getAttribute('data-zappy-mobile-object-position');
          var mZoom = parseFloat(img.getAttribute('data-zappy-mobile-zoom'));
          if (mSrc) img.src = mSrc;
          if (mPos) img.style.setProperty('object-position', mPos, 'important');
          if (mZoom > 1) {
            // Match the editor's wrapper-crop geometry (percentage pan window)
            // instead of transform:scale — the scale path zooms around the
            // focal point of the already-cropped view, which visibly diverges
            // from what the user framed in the editor's Mobile Only tab.
            var applyHeroMobileCrop = function() {
              var rect = wrapper.getBoundingClientRect();
              var nW = img.naturalWidth || 0, nH = img.naturalHeight || 0;
              if (!rect || !rect.width || !rect.height || !(nW > 0 && nH > 0)) {
                img.style.setProperty('transform', 'scale(' + mZoom + ')', 'important');
                img.style.setProperty('transform-origin', mPos || '50% 50%', 'important');
                return;
              }
              var cover = coverPercents(nW / nH, rect.width / rect.height);
              var wP = cover.w * mZoom, hP = cover.h * mZoom;
              var p = parseObjPos(mPos || img.getAttribute('data-zappy-object-position') || '50% 50%');
              img.style.setProperty('position', 'absolute', 'important');
              img.style.setProperty('left', ((100 - wP) * (p.x / 100)) + '%', 'important');
              img.style.setProperty('top', ((100 - hP) * (p.y / 100)) + '%', 'important');
              img.style.setProperty('width', wP + '%', 'important');
              img.style.setProperty('height', hP + '%', 'important');
              img.style.setProperty('object-fit', 'cover', 'important');
              img.style.removeProperty('transform');
              img.style.removeProperty('transform-origin');
            };
            if (img.complete && img.naturalWidth > 0) applyHeroMobileCrop();
            else img.addEventListener('load', applyHeroMobileCrop, { once: true });
          }
        }
      }
    }

    function initZoomWrappers() {
      var wrappers = document.querySelectorAll('[data-zappy-zoom-wrapper="true"]');
      for (var i = 0; i < wrappers.length; i++) {
        (function(wrapper) {
          var img = wrapper.querySelector('img');
          if (!img) return;
          if (wrapper.closest && wrapper.closest('.zappy-carousel-js-init, .zappy-carousel-active')) return;
          fixHeroBgWrapperStyles(wrapper);
          if (window.innerWidth > 768) restoreWrapperDimensions(wrapper);
          if (img.complete && img.naturalWidth > 0) {
            setTimeout(function() { applyZoom(wrapper, img); }, 0);
          } else {
            img.addEventListener('load', function onLoad() {
              img.removeEventListener('load', onLoad);
              applyZoom(wrapper, img);
            }, { once: true });
          }
        })(wrappers[i]);
      }
      fixOrphanedZoomImages();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initZoomWrappers, { once: true });
    } else {
      setTimeout(initZoomWrappers, 50);
    }
  } catch (eOuter) {}
})();
/* END ZAPPY_PUBLISHED_ZOOM_WRAPPER_RUNTIME */


/* ZAPPY_PUBLISHED_MOBILE_IMAGE_SWAP_V3 */
(function(){
  try {
    if (window.__zappyMobileImageSwapInitV3) return;
    window.__zappyMobileImageSwapInitV3 = true;
    window.__zappyMobileImageSwapInitV2 = true; // keep stale V2 copies inert
    var SEL = 'img[data-zappy-mobile-src],img[data-zappy-mobile-object-position],img[data-zappy-mobile-zoom]';
    var applied = false;
    function standalone(img){ return img && !img.closest('[data-zappy-zoom-wrapper="true"]'); }
    // SYNC: must match sharedZoomCropMath.js
    function parseOp(op){
      var x=null,y=null;
      try{
        if(typeof op==='string'&&op.trim()){
          var toks=op.trim().toLowerCase().split(/\s+/).slice(0,2);
          for(var i=0;i<toks.length;i++){
            var tk=toks[i],v;
            if(tk==='left'){x=0;continue;} if(tk==='right'){x=100;continue;}
            if(tk==='top'){y=0;continue;} if(tk==='bottom'){y=100;continue;}
            if(tk==='center')v=50; else if(/^-?\d*\.?\d+%$/.test(tk))v=parseFloat(tk); else v=50;
            if(x===null)x=v; else if(y===null)y=v;
          }
        }
      }catch(e){}
      if(x===null||!isFinite(x))x=50; if(y===null||!isFinite(y))y=50;
      return {x:Math.max(0,Math.min(100,x)),y:Math.max(0,Math.min(100,y))};
    }
    // Editor-parity mobile zoom: reproduce the zoom-wrapper crop geometry
    // using the img's PARENT as the crop box (the editor builds a transient
    // wrapper in preview, but cleanSectionHtmlForSave removes it when desktop
    // needs no zoom — so a mobile-only zoom ships as a standalone img).
    // Falls back to the legacy transform:scale approximation whenever the
    // geometry can't be measured, so something always applies.
    function applyStandaloneMobileZoom(img, mZoom, mPos){
      try {
        var p = img.parentElement;
        if (!p) return;
        if (!p._zappyDesktop) p._zappyDesktop = { style: p.getAttribute('style') };
        p.style.setProperty('overflow', 'hidden', 'important');
        function legacyScale(){
          img.style.setProperty('transform', 'scale(' + mZoom + ')', 'important');
          img.style.setProperty('transform-origin', mPos || '50% 50%', 'important');
        }
        function run(){
          try {
            var rect = p.getBoundingClientRect ? p.getBoundingClientRect() : null;
            var nW = img.naturalWidth || 0, nH = img.naturalHeight || 0;
            if (!rect || !(rect.width > 0) || !(rect.height > 0) || !(nW > 0 && nH > 0)) { legacyScale(); return; }
            // Lock the parent's current box BEFORE pulling the img out of flow,
            // otherwise the parent collapses when the img was its height source.
            try {
              var pcs = window.getComputedStyle(p);
              if (pcs && pcs.position === 'static') p.style.setProperty('position', 'relative', 'important');
              p.style.setProperty('aspect-ratio', String(Math.round((rect.width / rect.height) * 10000) / 10000), 'important');
            } catch(e0) {}
            var imgA = nW / nH, contA = rect.width / rect.height;
            var cw = 100, ch = 100;
            if (imgA >= contA) { cw = (imgA / contA) * 100; } else { ch = (contA / imgA) * 100; }
            var wP = cw * mZoom, hP = ch * mZoom;
            var pos = parseOp(mPos || img.getAttribute('data-zappy-object-position') || '50% 50%');
            img.style.setProperty('position', 'absolute', 'important');
            img.style.setProperty('left', ((100 - wP) * (pos.x / 100)) + '%', 'important');
            img.style.setProperty('top', ((100 - hP) * (pos.y / 100)) + '%', 'important');
            img.style.setProperty('width', wP + '%', 'important');
            img.style.setProperty('height', hP + '%', 'important');
            img.style.setProperty('max-width', 'none', 'important');
            img.style.setProperty('max-height', 'none', 'important');
            img.style.setProperty('object-fit', 'cover', 'important');
            img.style.setProperty('margin', '0', 'important');
            if (img.style.removeProperty) { img.style.removeProperty('transform'); img.style.removeProperty('transform-origin'); }
          } catch(e1) { try { legacyScale(); } catch(e2) {} }
        }
        if (img.complete && img.naturalWidth > 0) run();
        else if (typeof img.addEventListener === 'function') {
          legacyScale(); // immediate approximation, refined once dimensions load
          img.addEventListener('load', run, { once: true });
        } else legacyScale();
      } catch(eZ) {}
    }
    function applyMobile(){
      if (applied) return; applied = true;
      document.querySelectorAll(SEL).forEach(function(img){
        if (!standalone(img)) return;
        if (!img._zappyDesktop) img._zappyDesktop = { src: img.getAttribute('src'), style: img.getAttribute('style') };
        var mSrc = img.getAttribute('data-zappy-mobile-src');
        var mPos = img.getAttribute('data-zappy-mobile-object-position');
        var mZoom = parseFloat(img.getAttribute('data-zappy-mobile-zoom'));
        if (mSrc) img.src = mSrc;
        if (mPos) img.style.setProperty('object-position', mPos, 'important');
        if (isFinite(mZoom) && mZoom > 1) {
          applyStandaloneMobileZoom(img, mZoom, mPos);
        }
      });
    }
    function revertDesktop(){
      if (!applied) return; applied = false;
      document.querySelectorAll(SEL).forEach(function(img){
        if (!standalone(img)) return;
        if (img._zappyDesktop) {
          if (img._zappyDesktop.src != null) img.setAttribute('src', img._zappyDesktop.src);
          if (img._zappyDesktop.style != null) img.setAttribute('style', img._zappyDesktop.style);
          else img.removeAttribute('style');
        }
        var p = img.parentElement;
        if (p && p._zappyDesktop) {
          if (p._zappyDesktop.style != null) p.setAttribute('style', p._zappyDesktop.style);
          else p.removeAttribute('style');
        }
      });
    }
    function init(){
      var mq = window.matchMedia('(max-width:768px)');
      function onChange(e){ if (e.matches) applyMobile(); else revertDesktop(); }
      if (mq.matches) applyMobile();
      try { mq.addEventListener('change', onChange); } catch (e) { mq.addListener(onChange); }
    }
    // script.js loads at end of <body>, so the <img> elements already exist —
    // run immediately to minimise the desktop-image flash, with a
    // DOMContentLoaded fallback for the head-loaded edge case.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
  } catch (eOuter) {}
})();
/* END ZAPPY_PUBLISHED_MOBILE_IMAGE_SWAP_V3 */


/* ZAPPY_MOBILE_MENU_TOGGLE_V3 */
(function(){
  try {
    if (window.__zappyMobileMenuToggleInitV3) return;
    window.__zappyMobileMenuToggleInitV3 = true;
    window.__zappyMobileMenuToggleInit = true; // legacy guards

    function menuIsOpen(menu) {
      return !!(menu && (
        menu.classList.contains('active') ||
        menu.classList.contains('open') ||
        menu.style.display === 'block'
      ));
    }

    function closeMenu(menu) {
      if (!menu) return;
      menu.classList.remove('active');
      menu.classList.remove('open');
      menu.style.display = '';
    }

    function setClosedIcons(toggle) {
      if (!toggle) return;
      toggle.classList.remove('active');
      var hamburgerIcon = toggle.querySelector('.hamburger-icon');
      var closeIcon = toggle.querySelector('.close-icon');
      if (hamburgerIcon) hamburgerIcon.style.setProperty('display', 'block', 'important');
      if (closeIcon) closeIcon.style.setProperty('display', 'none', 'important');
    }

    function setOpenIcons(toggle) {
      if (!toggle) return;
      toggle.classList.add('active');
      var hamburgerIcon = toggle.querySelector('.hamburger-icon');
      var closeIcon = toggle.querySelector('.close-icon');
      if (hamburgerIcon) hamburgerIcon.style.setProperty('display', 'none', 'important');
      if (closeIcon) closeIcon.style.setProperty('display', 'block', 'important');
    }

    function initMobileToggle() {
      var toggle = document.querySelector('.mobile-toggle, #mobileToggle');
      var navMenu = document.querySelector('#navMenu, .nav-menu, .navbar-menu');
      if (!toggle || !navMenu) return;

      // Skip if this toggle already has a click handler from the site's own JS
      if (toggle.__zappyMobileToggleBound) return;
      toggle.__zappyMobileToggleBound = true;

      // Repair baked open-icon styles when the menu is actually closed.
      if (!menuIsOpen(navMenu)) setClosedIcons(toggle);

      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (menuIsOpen(navMenu)) {
          closeMenu(navMenu);
          setClosedIcons(toggle);
          document.body.style.overflow = '';
        } else {
          navMenu.classList.add('active');
          navMenu.classList.remove('open');
          navMenu.style.display = 'block';
          setOpenIcons(toggle);
          document.body.style.overflow = 'hidden';
        }
      }, true);

      // Close on clicking outside
      document.addEventListener('click', function(e) {
        if (!menuIsOpen(navMenu)) return;
        if (toggle.contains(e.target) || navMenu.contains(e.target)) return;
        closeMenu(navMenu);
        setClosedIcons(toggle);
        document.body.style.overflow = '';
      });

      // Close on Escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuIsOpen(navMenu)) {
          closeMenu(navMenu);
          setClosedIcons(toggle);
          document.body.style.overflow = '';
        }
      });

      // Close when clicking a nav link (navigating)
      navMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          closeMenu(navMenu);
          setClosedIcons(toggle);
          document.body.style.overflow = '';
        });
      });
    }

    function initPhoneButton() {
      var phoneBtn = document.querySelector('.phone-header-btn');
      if (!phoneBtn || phoneBtn.__zappyPhoneBound) return;
      phoneBtn.__zappyPhoneBound = true;

      phoneBtn.addEventListener('click', function() {
        var phoneNumber = phoneBtn.getAttribute('data-phone') || null;

        if (!phoneNumber) {
          var telLinks = document.querySelectorAll('a[href^="tel:"]');
          if (telLinks.length > 0) {
            phoneNumber = telLinks[0].getAttribute('href').replace('tel:', '');
          }
        }

        if (!phoneNumber) {
          var allLinks = document.querySelectorAll('a[href]');
          for (var i = 0; i < allLinks.length; i++) {
            var h = allLinks[i].getAttribute('href') || '';
            var cleaned = h.replace(/[-\s()]/g, '');
            if (/^(\+?\d{9,15}|0\d{8,9})$/.test(cleaned)) {
              phoneNumber = cleaned;
              break;
            }
          }
        }

        if (phoneNumber && phoneNumber.indexOf('[') === -1) {
          window.location.href = 'tel:' + phoneNumber;
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() { initMobileToggle(); initPhoneButton(); }, { once: true });
    } else {
      initMobileToggle();
      initPhoneButton();
    }
  } catch (e) {}
})();
/* END ZAPPY_MOBILE_MENU_TOGGLE */


/* ZAPPY_FAQ_ACCORDION_TOGGLE */
(function(){
  try {
    if (window.__zappyFaqToggleInit) return;
    window.__zappyFaqToggleInit = true;

    var answerSel = '[class*="faq-answer"], [class*="faq-content"], [class*="faq-body"], [class*="faq-item__answer"], .accordion-content, .accordion-body';

    // Pick the collapsible answer element for an item WITHOUT ever choosing a
    // wrapper that contains the question/header toggle. Some AI-generated FAQs
    // nest the clickable question INSIDE a .faq-content wrapper; collapsing that
    // wrapper (max-height:0/opacity:0) would hide the question itself, leaving
    // only the number visible and nothing to click to expand. Skipping any
    // candidate that contains the toggle keeps the header visible and collapses
    // only the real answer body.
    function pickAnswer(item, question) {
      var matches = item.querySelectorAll(answerSel);
      for (var i = 0; i < matches.length; i++) {
        var el = matches[i];
        if (el === question) continue;
        if (question && el.contains(question)) continue;
        return el;
      }
      // No safe collapsible found (only wrappers that hold the toggle): leave
      // the content expanded rather than hiding the question.
      return null;
    }

    function initFaqToggle() {
      var items = document.querySelectorAll('[class*="faq-item"], .accordion-item');
      if (!items.length) return;

      items.forEach(function(item) {
        if (item.closest(answerSel)) return;
        var question = item.querySelector(
          '[class*="faq-question"], [class*="faq-header"], [class*="faq-item__question"], [class*="faq-item__btn"], [class*="faq-btn"], .accordion-header, .accordion-toggle'
        );
        if (!question) return;
        if (question.__zappyFaqBound) return;
        if (question.hasAttribute('onclick')) question.removeAttribute('onclick');
        question.__zappyFaqBound = true;
        question.style.cursor = 'pointer';

        // Shared answer expand/collapse animation (used by both the <details>
        // toggle path and the generic click path) so the two stay identical.
        function expandFaqAnswer(answer) {
          if (!answer) return;
          answer.style.display = '';
          answer.style.paddingTop = '';
          answer.style.paddingBottom = '';
          var inners = answer.querySelectorAll(answerSel);
          inners.forEach(function(inn) {
            inn.style.maxHeight = '';
            inn.style.overflow = '';
            inn.style.opacity = '';
            inn.style.paddingTop = '';
            inn.style.paddingBottom = '';
          });
          answer.style.transition = 'none';
          answer.style.maxHeight = 'none';
          answer.style.opacity = '0';
          var realH = answer.scrollHeight;
          answer.style.maxHeight = '0';
          answer.offsetHeight;
          answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
          answer.style.maxHeight = realH + 'px';
          answer.style.overflow = 'hidden';
          answer.style.opacity = '1';
        }
        function collapseFaqAnswer(answer) {
          if (!answer) return;
          answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
          answer.style.maxHeight = '0';
          answer.style.overflow = 'hidden';
          answer.style.opacity = '0';
          answer.style.paddingTop = '0';
          answer.style.paddingBottom = '0';
        }

        // Native <details>/<summary> accordions: the browser hides the answer
        // whenever the <details> lacks the `open` attribute, so animating
        // max-height alone is NOT enough — and a click handler that
        // preventDefault()s the summary blocks the native open toggle, leaving
        // the answer permanently clamped (max-height:0 inside a closed details).
        // Drive the animation off the native `toggle` event instead — it fires
        // no matter WHERE inside the summary the user clicks (text, icon,
        // padding) — and let the browser own the `open` state. This is the
        // modern FAQ markup the legacy click+preventDefault path never handled.
        var detailsEl = (item.tagName === 'DETAILS')
          ? item
          : (question.closest ? question.closest('details') : null);
        if (detailsEl) {
          if (detailsEl.__zappyFaqToggleBound) return;
          detailsEl.__zappyFaqToggleBound = true;
          detailsEl.addEventListener('toggle', function() {
            var isActive = detailsEl.open;
            item.classList.toggle('active', isActive);
            question.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            if (isActive) {
              // Single-open accordion: close the OTHER open <details> in this
              // FAQ list. Match by the SAME faq-item selector (NOT
              // `details[class*="faq-item"]`) and resolve each item's
              // <details>, because the faq-item / accordion-item class
              // frequently lives on a WRAPPER (e.g.
              // `<div class="faq-item"><details>…</details></div>`) rather
              // than on the <details> itself — querying for class-bearing
              // <details> would miss those siblings and let multiple answers
              // stay open.
              var parent = item.parentElement;
              if (parent) {
                var sibItems = parent.querySelectorAll('[class*="faq-item"], .accordion-item');
                sibItems.forEach(function(sibItem) {
                  if (sibItem === item) return;
                  var sibDetails = (sibItem.tagName === 'DETAILS') ? sibItem : sibItem.querySelector('details');
                  if (sibDetails && sibDetails !== detailsEl && sibDetails.open) sibDetails.open = false;
                });
              }
              expandFaqAnswer(pickAnswer(item, question));
            } else {
              collapseFaqAnswer(pickAnswer(item, question));
            }
            var chevron = question.querySelector('[class*="chevron"], [class*="icon"], svg');
            if (chevron) {
              chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
              chevron.style.transition = 'transform 0.3s ease';
            }
          });
          if (detailsEl.open) { item.classList.add('active'); expandFaqAnswer(pickAnswer(item, question)); }
          return;
        }

        question.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var parent = item.parentElement;
          if (parent) {
            var siblings = parent.querySelectorAll('[class*="faq-item"], .accordion-item');
            siblings.forEach(function(sib) {
              if (sib !== item && sib.classList.contains('active')) {
                sib.classList.remove('active');
                var sibQ = sib.querySelector('[class*="faq-question"], [class*="faq-header"], [class*="faq-item__question"], [class*="faq-item__btn"], [class*="faq-btn"], .accordion-header');
                if (sibQ) sibQ.setAttribute('aria-expanded', 'false');
                var sibA = pickAnswer(sib, sibQ);
                if (sibA) {
                  sibA.style.maxHeight = '0';
                  sibA.style.overflow = 'hidden';
                  sibA.style.opacity = '0';
                  sibA.style.paddingTop = '0';
                  sibA.style.paddingBottom = '0';
                }
              }
            });
          }

          var isActive = item.classList.toggle('active');
          question.setAttribute('aria-expanded', isActive ? 'true' : 'false');

          var answer = pickAnswer(item, question);
          if (answer) {
            if (isActive) {
              answer.style.display = '';
              answer.style.paddingTop = '';
              answer.style.paddingBottom = '';
              var inners = answer.querySelectorAll(answerSel);
              inners.forEach(function(inn) {
                inn.style.maxHeight = '';
                inn.style.overflow = '';
                inn.style.opacity = '';
                inn.style.paddingTop = '';
                inn.style.paddingBottom = '';
              });
              answer.style.transition = 'none';
              answer.style.maxHeight = 'none';
              answer.style.opacity = '0';
              var realH = answer.scrollHeight;
              answer.style.maxHeight = '0';
              answer.offsetHeight;
              answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
              answer.style.maxHeight = realH + 'px';
              answer.style.overflow = 'hidden';
              answer.style.opacity = '1';
            } else {
              answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
              answer.style.maxHeight = '0';
              answer.style.overflow = 'hidden';
              answer.style.opacity = '0';
              answer.style.paddingTop = '0';
              answer.style.paddingBottom = '0';
            }
          }

          var chevron = question.querySelector('[class*="chevron"], [class*="icon"], svg');
          if (chevron) {
            chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
            chevron.style.transition = 'transform 0.3s ease';
          }
        });
      });

      items.forEach(function(item) {
        if (item.classList.contains('active')) return;
        // Native <details> manage their own open/closed visibility; never clamp
        // an open one to max-height:0 (its toggle handler already expanded it).
        if (item.tagName === 'DETAILS' && item.open) return;
        if (item.closest(answerSel)) return;
        var question = item.querySelector('[class*="faq-question"], [class*="faq-header"], [class*="faq-item__question"], [class*="faq-item__btn"], [class*="faq-btn"], .accordion-header, .accordion-toggle');
        // No clickable question/header toggle exists → this is a STATIC FAQ
        // (e.g. a grid of badge + always-visible content), not an accordion.
        // Collapsing it here would hide the content with no way to expand it,
        // since no click handler was bound above. Leave it fully visible.
        if (!question) return;
        var answer = pickAnswer(item, question);
        if (answer) {
          answer.style.maxHeight = '0';
          answer.style.overflow = 'hidden';
          answer.style.opacity = '0';
          answer.style.paddingTop = '0';
          answer.style.paddingBottom = '0';
          answer.style.transition = 'max-height 0.35s ease, opacity 0.25s ease, padding 0.25s ease';
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFaqToggle, { once: true });
    } else {
      initFaqToggle();
    }
  } catch (e) {}
})();
/* END ZAPPY_FAQ_ACCORDION_TOGGLE */


/* ZAPPY_RUNTIME_CONTRAST_FIX */
(function(){
  try {
/**
 * Shared runtime contrast-fix IIFE body.
 *
 * This file is the SINGLE SOURCE OF TRUTH for the client-side WCAG contrast
 * fixer that runs on both preview (02-navigation.js) and published sites
 * (githubService.js → ensureRuntimeContrastFix). Any fix applied here
 * automatically propagates to both surfaces.
 *
 * IMPORTANT: This file is read as a string template by Node, NOT executed
 * directly. It contains raw browser-side JavaScript (ES5-compat, no require,
 * no import). The consumers wrap it in an IIFE and append their own trigger
 * (preview: setTimeout; publish: DOMContentLoaded).
 *
 * To add/change the contrast logic, edit THIS file and run:
 *   node server/tests/sectionBackgroundTextColorSync.test.js
 * The test pins that both consumers include the shared code.
 */

if (window.__zappyContrastFixInit) return;
window.__zappyContrastFixInit = true;

function getLum(r,g,b){
  var a=[r,g,b].map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);});
  return a[0]*0.2126+a[1]*0.7152+a[2]*0.0722;
}
function contrastRatio(c1,c2){
  var l1=getLum(c1.r,c1.g,c1.b),l2=getLum(c2.r,c2.g,c2.b);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
function parseRGB(c){
  if(!c)return null;var m=c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m?{r:+m[1],g:+m[2],b:+m[3]}:null;
}
function effectiveBg(el){
  var e=el;
  while(e){
    var cs=window.getComputedStyle(e);
    var bi=cs.backgroundImage;
    if(bi&&bi!=='none'){
      if(bi.indexOf('url(')>=0) return null;
      var isRgba=bi.match(/rgba\(/);
      if(!isRgba){
        var gm=bi.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/);
        if(gm) return 'rgb('+gm[1]+','+gm[2]+','+gm[3]+')';
      }
    }
    var bg=cs.backgroundColor;
    if(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'){
      var am=bg.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)/);
      if(!am||parseFloat(am[1])>=0.6) return bg;
    }
    e=e.parentElement;
  }
  return 'rgb(255,255,255)';
}

function isElementVisible(el,stopAt){
  var n=el;
  while(n&&n!==stopAt&&n!==document.body){
    var s=window.getComputedStyle(n);
    if(s.display==='none'||s.visibility==='hidden') return false;
    if(parseFloat(s.opacity||'1')<=0.1) return false;
    n=n.parentElement;
  }
  return true;
}

function hasImageOrVideoBackground(el){
  var e=el;
  while(e&&e!==document.body){
    if(e.getAttribute){
      var bgType=e.getAttribute('data-zappy-bg-type');
      if(bgType==='image'||bgType==='video') return true;
    }
    var cs=window.getComputedStyle(e);
    var bi=cs.backgroundImage;
    if(bi&&bi.indexOf('url(')>=0) return true;
    e=e.parentElement;
  }
  var section=el.closest&&el.closest(
    'section,article,[data-zappy-section],[data-zappy-component],[class*="hero"],[class*="section"]'
  );
  if(section){
    var bgChild=section.querySelector(
      'img[data-hero-bg],.zappy-section-video-bg,.zappy-section-video,'+
      'img[class*="hero-bg"],img[class*="bg-image"],img[class*="background-image"],'+
      'video[class*="bg"],video[autoplay][loop]'
    );
    if(bgChild&&isElementVisible(bgChild,section)){
      return true;
    }
  }
  return false;
}

function resolveVar(val){
  if(!val||val.indexOf('var(')===-1)return val;
  var m=val.match(/var\(--([^,)]+)/);
  if(!m)return val;
  return getComputedStyle(document.documentElement).getPropertyValue('--'+m[1]).trim()||val;
}

// An explicit inline `color:` on the element itself means the colour is
// intentional and must not be auto-"fixed" (handled in the loop). The SAME
// intent applies when an ANCESTOR set an explicit inline colour and this element
// merely inherits it (e.g. a panel whose <h3 style="color:#fff"> wraps a <span>
// that inherits white). Without this, removing a child's own colour to let it
// inherit would make the child eligible for the fixer, which on a mid-tone
// background can compute black > white contrast and flip intentional white text
// to black with !important (the "white flash then black" bug). Respecting the
// ancestor's explicit colour keeps the fixer for genuinely un-styled text only.
function ancestorHasExplicitColor(el){
  var n=el&&el.parentElement;
  while(n&&n!==document.body){
    var st=n.getAttribute&&n.getAttribute('style');
    if(st&&/(?:^|;)\s*color\s*:/i.test(st))return true;
    n=n.parentElement;
  }
  return false;
}

// Respect deliberate author-level `color: ... !important` rules. The runtime
// fixer runs late and writes inline `!important`, so without this check it can
// override an explicit user/AI styling request (e.g. white FAQ text on a brand
// orange card) simply because black has a slightly higher WCAG ratio. We still
// fix ordinary generated CSS, but an author `!important` colour is intentional.
function elementMatchesColorRule(el, importantOnly){
  if(!el||!el.matches)return false;
  function ruleApplies(rule){
    if(!rule)return false;
    if(rule.type===1){
      try{
        if(rule.style&&rule.style.getPropertyValue('color')&&
          (!importantOnly||rule.style.getPropertyPriority('color')==='important')&&
          el.matches(rule.selectorText)){
          return true;
        }
      }catch(e){return false;}
    }
    if(rule.cssRules){
      try{
        for(var ri=0;ri<rule.cssRules.length;ri++){
          if(ruleApplies(rule.cssRules[ri]))return true;
        }
      }catch(e2){return false;}
    }
    return false;
  }
  for(var si=0;si<document.styleSheets.length;si++){
    var rules=null;
    try{rules=document.styleSheets[si].cssRules;}catch(e3){continue;}
    if(!rules)continue;
    for(var i=0;i<rules.length;i++){
      if(ruleApplies(rules[i]))return true;
    }
  }
  return false;
}
function elementMatchesImportantColorRule(el){
  return elementMatchesColorRule(el,true);
}
function elementMatchesAuthorColorRule(el){
  return elementMatchesColorRule(el,false);
}
function selfOrAncestorHasImportantAuthorColor(el){
  var n=el;
  while(n&&n!==document.body){
    if(elementMatchesImportantColorRule(n))return true;
    n=n.parentElement;
  }
  return false;
}
function selfOrAncestorHasAuthorColor(el){
  var n=el;
  while(n&&n!==document.body){
    if(elementMatchesAuthorColorRule(n))return true;
    n=n.parentElement;
  }
  return false;
}

function isDecorativeAccentText(el){
  if(!el||!el.matches)return false;
  if(el.matches('.font-accent,.hero-logotype,.hero-logotype-line,[class*="script"],[class*="accent-line"],[class*="subheadline"]'))return true;
  if(el.closest('.font-accent,.hero-logotype,.hero-logotype-line,[class*="script"],[class*="accent-line"],[class*="subheadline"]'))return true;
  if(el.matches('.display-xl,.display-1,.display-2,[class*="hero-word"],[class*="hero-pizza"],[class*="hero-anywhere"],[class*="pizza-word"],[class*="anywhere-word"],[class*="headline-pizza"],[class*="headline-anywhere"],[class*="headline-on-the"],[class*="headline-move"],[class*="logotype"],[class*="wordmark"]'))return true;
  if(el.closest('[class*="hero-word"],[class*="hero-pizza"],[class*="hero-anywhere"],[class*="pizza-word"],[class*="anywhere-word"],[class*="headline-pizza"],[class*="headline-anywhere"],[class*="headline-on-the"],[class*="headline-move"],[class*="logotype"],[class*="wordmark"]'))return true;
  if(el.closest('h1.display-xl,h2.display-xl,h1.display-1,h2.display-1,h1.display-2,h2.display-2'))return true;
  return false;
}

function fixContrast(){
  var root=getComputedStyle(document.documentElement);
  var dark=root.getPropertyValue('--text-dark').trim()||root.getPropertyValue('--text').trim()||'#1a1a1a';
  var light=root.getPropertyValue('--text-light').trim()||root.getPropertyValue('--background').trim()||'#ffffff';
  var darkRGB=parseRGB(dark);
  if(!darkRGB){
    var d=document.createElement('div');d.style.color=dark;document.body.appendChild(d);
    darkRGB=parseRGB(getComputedStyle(d).color);d.remove();
  }
  var lightRGB=parseRGB(light);
  if(!lightRGB){
    var d2=document.createElement('div');d2.style.color=light;document.body.appendChild(d2);
    lightRGB=parseRGB(getComputedStyle(d2).color);d2.remove();
  }
  if(!darkRGB)darkRGB={r:26,g:26,b:26};
  if(!lightRGB)lightRGB={r:255,g:255,b:255};

  var TEXT_SEL='h1,h2,h3,h4,h5,h6,p,span,a,button,li,label,td,th,dt,dd,figcaption';
  var mainEl=document.querySelector('main')||document.body;
  var els=[];
  var mainNodes=mainEl.querySelectorAll(TEXT_SEL);
  for(var mi=0;mi<mainNodes.length;mi++)els.push(mainNodes[mi]);
  // The page footer (e.g. <footer class="site-footer">) usually lives OUTSIDE
  // <main>, so it would never be scanned otherwise. Pull in any footer not
  // already covered by mainEl so its (often muted-on-dark) text is fixed too.
  var extraFooters=document.querySelectorAll('footer,.site-footer,.zappy-footer');
  for(var fi=0;fi<extraFooters.length;fi++){
    var ft=extraFooters[fi];
    if(mainEl.contains(ft))continue;
    var fNodes=ft.querySelectorAll(TEXT_SEL);
    for(var fj=0;fj<fNodes.length;fj++)els.push(fNodes[fj]);
  }
  // The navbar CTA pill (.nav-cta-btn / .cta-button) is a SOLID-FILL button, so
  // unlike plain nav links (which are transparent over the managed navbar bg and
  // are intentionally skipped below) its text contrast is well-defined against
  // its own fill. It lives OUTSIDE <main>, so add it + its text nodes explicitly.
  var ctaPills=document.querySelectorAll('.nav-cta-btn,.cta-button');
  for(var ci=0;ci<ctaPills.length;ci++){
    var cp=ctaPills[ci];
    if(mainEl.contains(cp))continue;
    els.push(cp);
    var cpNodes=cp.querySelectorAll(TEXT_SEL);
    for(var cj=0;cj<cpNodes.length;cj++)els.push(cpNodes[cj]);
  }
  var fixed=0;
  for(var i=0;i<els.length;i++){
    var el=els[i];
    // Skip the navbar/header only — those are managed by the navbar contrast
    // helpers. Footers are NOT skipped: the page footer (e.g. .site-footer) is
    // often a dark band with muted/grey text, AND the LLM frequently uses a
    // semantic <footer> for citation/role text INSIDE testimonial/blockquote
    // cards — both need the same computed-background contrast fix as body text.
    // The navbar CTA pill is the ONE nav element we DO fix: it's a solid-fill
    // button whose text/bg contrast is self-contained (the AI sometimes paints
    // the label the same hue as the fill → invisible until hover).
    if(el.closest('nav,header,.zappy-header')&&!el.closest('.nav-cta-btn,.cta-button'))continue;
    if(isDecorativeAccentText(el))continue;
    if(hasImageOrVideoBackground(el))continue;
    var inlineStyle=el.getAttribute('style')||'';
    if(/(?:^|;\s*)color\s*:/i.test(inlineStyle))continue;
    if(ancestorHasExplicitColor(el))continue;
    if(selfOrAncestorHasImportantAuthorColor(el))continue;
    if(el.tagName==='FONT'&&el.hasAttribute('color'))continue;
    var txt=el.textContent?el.textContent.trim():'';
    if(!txt)continue;
    var r=el.getBoundingClientRect();
    if(r.width===0||r.height===0)continue;
    var cs=getComputedStyle(el);
    var col=resolveVar(cs.color);
    var bg=effectiveBg(el);
    var cRGB=parseRGB(col),bRGB=parseRGB(bg);
    if(!cRGB||!bRGB)continue;
    var ratio=contrastRatio(cRGB,bRGB);
    if(ratio<4.5){
      if(ratio>=3&&selfOrAncestorHasAuthorColor(el))continue;
      var darkC=contrastRatio(darkRGB,bRGB);
      var lightC=contrastRatio(lightRGB,bRGB);
      var best=darkC>=lightC?dark:light;
      var bestRatio=Math.max(darkC,lightC);
      if(bestRatio<4.5){
        var blackC=contrastRatio({r:0,g:0,b:0},bRGB);
        var whiteC=contrastRatio({r:255,g:255,b:255},bRGB);
        best=blackC>=whiteC?'#000000':'#ffffff';
      }
      el.style.setProperty('color',best,'important');
      fixed++;
    }
  }
  if(fixed>0)console.log('[Contrast Fix] Fixed '+fixed+' low-contrast elements');
}

    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',fixContrast,{once:true});
    } else {
      fixContrast();
    }
  }catch(e){}
})();
/* END ZAPPY_RUNTIME_CONTRAST_FIX */

// ZAPPY_CARD_IMAGE_BLEED
(function(){
  function run(){
    var cards=document.querySelectorAll('article,[class*="card"],[class*="tile"]');
    cards.forEach(function(card){
      var cs=window.getComputedStyle(card);
      var padL=parseFloat(cs.paddingLeft)||0;
      var padR=parseFloat(cs.paddingRight)||0;
      var padT=parseFloat(cs.paddingTop)||0;
      if(padL<8&&padR<8)return;
      var fv=null;
      for(var i=0;i<card.children.length;i++){
        var ch=card.children[i];
        var chCs=window.getComputedStyle(ch);
        if(chCs.display!=='none'&&chCs.visibility!=='hidden'&&ch.getBoundingClientRect().height>0){fv=ch;break;}
      }
      if(!fv)return;
      if(fv.getAttribute('data-zappy-mobile-bleed'))return;
      if(fv.querySelector('[data-zappy-zoom-wrapper]'))return;
      var img=fv.querySelector('img');
      if(!img)return;
      var ir=img.getBoundingClientRect();
      var cw=card.clientWidth-padL-padR;
      if(cw<=0||ir.width<cw*0.8)return;
      fv.style.setProperty('margin-left','-'+padL+'px','important');
      fv.style.setProperty('margin-right','-'+padR+'px','important');
      if(padT>0)fv.style.setProperty('margin-top','-'+padT+'px','important');
      fv.style.setProperty('width','calc(100% + '+(padL+padR)+'px)','important');
      fv.style.setProperty('max-width','calc(100% + '+(padL+padR)+'px)','important');
      fv.setAttribute('data-zappy-mobile-bleed','1');
      if(window.getComputedStyle(img).objectFit==='contain'){img.style.setProperty('object-fit','cover','important');}
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',function(){setTimeout(run,200);});}
  else{setTimeout(run,200);}
})();


/* ZAPPY_NAV_SCROLL_PADDING */
(function(){
  try {
    if (window.__zappyNavScrollPaddingInit) return;
    window.__zappyNavScrollPaddingInit = true;
    function updateScrollPadding() {
      var nav = document.querySelector('nav.navbar') || document.querySelector('nav') || document.querySelector('header');
      if (!nav) return;
      var s = window.getComputedStyle(nav);
      if (s.position !== 'fixed' && s.position !== 'sticky') return;
      var h = nav.offsetHeight;
      if (h > 0) document.documentElement.style.scrollPaddingTop = h + 'px';
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateScrollPadding, { once: true });
    } else {
      updateScrollPadding();
    }
    window.addEventListener('resize', updateScrollPadding, { passive: true });
  } catch (e) {}
})();
/* END ZAPPY_NAV_SCROLL_PADDING */


/* ZAPPY_CONTACT_FORM_PREVENT_DEFAULT */
(function(){
  try {
    var _kw=['contact','booking','inquiry','enquiry','register','signup','sign-up','order','request','apply'];
    function isContactForm(form) {
      var cls=(form.className||'').toLowerCase();
      var id=(form.id||'').toLowerCase();
      var act=(form.getAttribute('action')||'').toLowerCase();
      if(_kw.some(function(k){return cls.indexOf(k)!==-1||id.indexOf(k)!==-1||act.indexOf(k)!==-1;})) return true;
      var sec=form.closest&&form.closest('section');
      if(sec){
        var sc=(sec.className||'').toLowerCase();
        var si=(sec.id||'').toLowerCase();
        if(_kw.some(function(k){return sc.indexOf(k)!==-1||si.indexOf(k)!==-1;})) return true;
        if(sc.indexOf('form-section')!==-1||sc.indexOf('form_section')!==-1) return true;
      }
      if(window.zappyContactFormLoaded){
        var inputs=form.querySelectorAll('input,textarea,select');
        var hasEmail=false,hasPassword=false,visibleCount=0;
        for(var i=0;i<inputs.length;i++){
          var inp=inputs[i];
          var t=(inp.type||'').toLowerCase();
          var n=(inp.name||'').toLowerCase();
          if(t==='hidden'||t==='submit'||t==='button'||t==='reset') continue;
          visibleCount++;
          if(t==='email'||n.indexOf('email')!==-1||n.indexOf('mail')!==-1) hasEmail=true;
          if(t==='password') hasPassword=true;
        }
        if(hasEmail&&visibleCount>=2&&!hasPassword) return true;
      }
      return false;
    }

    function showFormFeedback(form, msg, type) {
      var old = form.querySelector('.zappy-form-feedback');
      if (old) old.remove();

      var bg = type==='success'?'#d4edda':type==='error'?'#f8d7da':'#d1ecf1';
      var fg = type==='success'?'#155724':type==='error'?'#721c24':'#0c5460';
      var bd = type==='success'?'#c3e6cb':type==='error'?'#f5c6cb':'#bee5eb';
      var ic = type==='success'?'\u2705':type==='error'?'\u274C':'\u2139\uFE0F';

      var el = document.createElement('div');
      el.className = 'zappy-form-feedback';
      el.setAttribute('role', 'alert');
      el.style.cssText = 'padding:14px 18px;border-radius:8px;margin:12px 0 0;font-size:14px;line-height:1.5;background:'+bg+';color:'+fg+';border:1px solid '+bd+';text-align:center;font-family:inherit;';
      el.innerHTML = '<span style="margin-inline-end:6px">'+ic+'</span>'+msg;

      if (type === 'success') {
        form.reset();
        var formChildren = form.children;
        for (var i = 0; i < formChildren.length; i++) {
          if (formChildren[i] !== el) formChildren[i].style.display = 'none';
        }
        form.appendChild(el);
        el.style.cssText += 'padding:32px 24px;font-size:16px;';
      } else {
        var btn = form.querySelector('button[type="submit"],input[type="submit"]');
        if (btn) btn.parentNode.insertBefore(el, btn.nextSibling);
        else form.appendChild(el);
        setTimeout(function(){ if(el.parentElement) el.remove(); }, 8000);
      }
    }

    var _coreNameFields=['name','firstName','first_name','fname','lastName','last_name','lname'];
    var _coreEmailFields=['email','emailAddress','mail','e-mail'];
    var _corePhoneFields=['phone','tel','telephone','mobile','cellphone'];
    var _coreMsgFields=['message','msg','comments','comment','description','details','notes','body','text','inquiry'];
    var _coreSubjectFields=['subject','topic','regarding','re'];
    var _allCoreFields=[].concat(_coreNameFields,_coreEmailFields,_corePhoneFields,_coreMsgFields,_coreSubjectFields);

    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (!form || form.tagName !== 'FORM' || !isContactForm(form)) return;
      e.preventDefault();
      e.stopPropagation();

      var origSubmit = form.submit;
      form.submit = function(){ };

      if (form.__zappySubmitting) return;
      form.__zappySubmitting = true;

      var oldFeedback = form.querySelector('.zappy-form-feedback');
      if (oldFeedback) oldFeedback.remove();

      var btn = form.querySelector('button[type="submit"],input[type="submit"]');
      var origText = btn ? (btn.value || btn.textContent) : '';
      if (btn) {
        if (btn.tagName === 'INPUT') btn.value = 'Sending...';
        else btn.textContent = 'Sending...';
        btn.disabled = true;
      }

      var fd = new FormData(form);
      var data = {};
      for(var pair of fd.entries()){
        if(data[pair[0]]!==undefined){
          if(Array.isArray(data[pair[0]])) data[pair[0]].push(pair[1]);
          else data[pair[0]]=[data[pair[0]],pair[1]];
        } else data[pair[0]]=pair[1];
      }

      var resolvedName=(data.name||'').trim()
        ||[data.firstName||data.first_name||data.fname||'',data.lastName||data.last_name||data.lname||''].filter(Boolean).join(' ').trim()
        ||(data.email||data.emailAddress||data.mail||'').trim()
        ||'Anonymous';
      var resolvedEmail=(data.email||data.emailAddress||data.mail||data['e-mail']||'').trim();
      var resolvedPhone=data.phone||data.tel||data.telephone||data.mobile||data.cellphone||null;
      var resolvedSubject=data.subject||data.topic||data.regarding||data.re||'Contact Form Submission';
      var resolvedMsg=(data.message||data.msg||data.comments||data.comment||data.description||data.details||data.notes||data.body||data.text||data.inquiry||'').trim();
      if(!resolvedMsg){
        var _extra=Object.entries(data).filter(function(e){return _allCoreFields.indexOf(e[0])===-1;});
        if(_extra.length>0) resolvedMsg=_extra.map(function(e){var l=e[0].replace(/([A-Z])/g,' $1').replace(/[_-]/g,' ').trim();var v=Array.isArray(e[1])?e[1].join(', '):e[1];return l+': '+v;}).join('\n');
        else resolvedMsg='Form submission from '+window.location.pathname;
      }

      var extraFields={};
      Object.keys(data).forEach(function(k){if(_allCoreFields.indexOf(k)===-1&&data[k]!==''&&data[k]!=null) extraFields[k]=data[k];});

      var currentPath = window.location.pathname;
      try { var pg=new URLSearchParams(window.location.search).get('page'); if(pg) currentPath=pg; } catch(x){}

      var wid = 'fee62a18-ed36-47d0-abb9-548b7196b8e8';

      var apiBase = (window.ZAPPY_API_BASE || 'https://api.zappy5.com').replace(/\/$/,'');
      apiBase = apiBase + '/api/email/contact-form';

      var payload={
        websiteId: wid,
        name: resolvedName,
        email: resolvedEmail,
        subject: resolvedSubject,
        message: resolvedMsg,
        phone: resolvedPhone,
        currentPagePath: currentPath
      };
      if(Object.keys(extraFields).length>0) payload.extraFields=extraFields;

      fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function(r){ return r.json(); }).then(function(result){
        if (result.success) {
          if (result.thankYouPagePath && result.ticketNumber) {
            window.location.href = result.thankYouPagePath + '?ticket=' + encodeURIComponent(result.ticketNumber);
            return;
          }
          showFormFeedback(form, result.message || 'Thank you! We will get back to you soon.', 'success');
        } else {
          showFormFeedback(form, result.error || 'Failed to send. Please try again.', 'error');
        }
      }).catch(function(){
        showFormFeedback(form, 'Unable to send message right now. Please try again later.', 'error');
      }).finally(function(){
        form.__zappySubmitting = false;
        form.submit = origSubmit;
        if (btn) {
          if (btn.tagName === 'INPUT') btn.value = origText;
          else btn.textContent = origText;
          btn.disabled = false;
        }
      });
    }, true);
  } catch (e) {}
})();
/* END ZAPPY_CONTACT_FORM_PREVENT_DEFAULT */


/* ZAPPY_PUBLISHED_GRID_CENTERING_V2 */
(function(){
  try {
    if (window.__zappyGridCenteringInit) return;
    window.__zappyGridCenteringInit = true;

    function centerPartialGridRows() {
      var grids = document.querySelectorAll('[data-zappy-explicit-columns="true"], [data-zappy-auto-grid="true"]');
      for (var g = 0; g < grids.length; g++) {
        try {
          var container = grids[g];

          // Clear previous centering so we can recalculate (e.g. after i18n direction change)
          if (container.getAttribute('data-zappy-grid-centered') === 'true') {
            var prevItems = Array.from(container.children);
            for (var p = 0; p < prevItems.length; p++) {
              if (prevItems[p].getAttribute && prevItems[p].getAttribute('data-zappy-gc') === '1') {
                prevItems[p].style.transform = prevItems[p].getAttribute('data-zappy-gc-orig') || '';
                prevItems[p].removeAttribute('data-zappy-gc');
                prevItems[p].removeAttribute('data-zappy-gc-orig');
              }
            }
            container.removeAttribute('data-zappy-grid-centered');
          }

          // List grids (<ul>/<ol>) read in document order and align to the start
          // (first column); centering a checklist's lonely last item breaks its
          // column alignment with the rows above. Cards (div grids) still center.
          // The cleanup above already reverted any prior centering, so a list
          // centered before this runtime shipped snaps back to its natural spot.
          var containerTag = (container.tagName || '').toLowerCase();
          if (containerTag === 'ul' || containerTag === 'ol') continue;

          var items = [];
          for (var c = 0; c < container.children.length; c++) {
            var ch = container.children[c];
            if (!ch || !ch.tagName) continue;
            var tag = ch.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style') continue;
            if (ch.getAttribute('aria-hidden') === 'true') continue;
            if (ch.getAttribute('data-zappy-internal') === 'true') continue;
            var pos = window.getComputedStyle(ch).position;
            if (pos === 'absolute' || pos === 'fixed') continue;
            items.push(ch);
          }
          var totalItems = items.length;
          if (totalItems === 0) continue;

          var cs = window.getComputedStyle(container);
          if (cs.display !== 'grid') continue;
          var gta = (cs.gridTemplateAreas || '').trim();
          if (gta && gta !== 'none') continue;
          var gtc = (cs.gridTemplateColumns || '').trim();
          if (!gtc || gtc === 'none') continue;
          var colWidths = gtc.split(' ').filter(function(v) { return v && parseFloat(v) > 0; });
          var colCount = colWidths.length;
          if (colCount <= 1) continue;

          var itemsInLastRow = totalItems % colCount;
          if (itemsInLastRow === 0) continue;

          var colWidth = parseFloat(colWidths[0]) || 0;
          var gap = parseFloat(cs.columnGap);
          if (isNaN(gap)) gap = parseFloat(cs.gap) || 0;

          // Skip non-uniform column widths (mirrors preview autoCenterAllGrids).
          // Centering assumes equal columns; mixed tracks produce wrong offsets.
          var parsedWidths = colWidths.map(function(w) { return parseFloat(w) || 0; });
          if (Math.max.apply(null, parsedWidths) > Math.min.apply(null, parsedWidths) * 1.5) continue;

          // Skip multi-span items (e.g. grid-column: 1 / -1 full-bleed cards, or
          // bento tiles with span 2+). totalItems % colCount cannot account for
          // spanned tracks, so a lone full-span card in a 4-col auto-fit grid was
          // mis-classified as a 1-of-4 orphan and shifted by translateX(~459px).
          var singleColThreshold = colWidth * 1.5 + gap;
          var anyMultiSpan = items.some(function(it) {
            return it.getBoundingClientRect().width > singleColThreshold;
          });
          if (anyMultiSpan) continue;

          var missingCols = colCount - itemsInLastRow;
          var offset = missingCols * (colWidth + gap) / 2;

          // Detect RTL — use the computed direction which already accounts for
          // CSS cascade, html[dir], and inheritance. Do NOT walk up checking inline
          // styles because multi-language sites may have stale direction:rtl on
          // parent elements from the primary language while serving an LTR page.
          var dir = cs.direction || 'ltr';
          var translateValue = dir === 'rtl' ? -offset : offset;

          var startIndex = totalItems - itemsInLastRow;
          var savedTransitions = [];
          for (var i = startIndex; i < totalItems; i++) {
            var item = items[i];
            savedTransitions.push(item.style.transition);
            item.style.transition = 'none';
            var existingTransform = item.style.transform || '';
            item.setAttribute('data-zappy-gc-orig', existingTransform);
            var newTransform = existingTransform
              ? existingTransform + ' translateX(' + translateValue + 'px)'
              : 'translateX(' + translateValue + 'px)';
            item.style.transform = newTransform;
            item.setAttribute('data-zappy-gc', '1');
          }

          void container.offsetHeight;

          for (var j = startIndex; j < totalItems; j++) {
            items[j].style.transition = savedTransitions[j - startIndex];
          }

          container.setAttribute('data-zappy-grid-centered', 'true');
        } catch(e) {}
      }
    }

    if (document.readyState === 'complete') {
      centerPartialGridRows();
    } else {
      window.addEventListener('load', centerPartialGridRows);
    }

    // Re-center when i18n script changes the page direction
    try {
      var dirObs = new MutationObserver(function() { centerPartialGridRows(); });
      dirObs.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    } catch(e) {}
  } catch(e) {}
})();


/* ZAPPY_CONTENT_ALIGNMENT_RUNTIME */
(function(){
  try {
    if (window.__zappyContentAlignInit) return;
    window.__zappyContentAlignInit = true;

    var vShiftMap = { top: -0.5, upper: -0.25, center: 0, lower: 0.25, bottom: 0.5 };
    var hShiftMap = { left: -0.5, 'mid-left': -0.25, center: 0, 'mid-right': 0.25, right: 0.5 };

    function restoreContentAlignments() {
      var sections = document.querySelectorAll('[data-zappy-content-align]');
      for (var i = 0; i < sections.length; i++) {
        try { applyAlignment(sections[i]); } catch(e) {}
      }
    }

    function applyAlignment(section) {
      var target = section.querySelector('[data-zappy-align-target]');
      if (!target) return;

      var align = section.getAttribute('data-zappy-content-align') || 'center-center';
      var idx = align.indexOf('-');
      if (idx === -1) return;
      var vAlign = align.substring(0, idx) || 'center';
      var hAlign = align.substring(idx + 1) || 'center';

      if (!section.id) {
        section.id = 'zappy-section-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      }
      var sel = '#' + section.id;

      var old = section.querySelector('style[data-zappy-align-style]');
      if (old) old.remove();

      var ts = window.getComputedStyle(target);
      var isFlex = (ts.display === 'flex' || ts.display === 'inline-flex');
      var isColumn = (ts.flexDirection === 'column' || ts.flexDirection === 'column-reverse');

      var sectionRect = section.getBoundingClientRect();
      var sW = sectionRect.width || section.offsetWidth || 0;
      var sH = sectionRect.height || section.offsetHeight || 0;

      var orig = target.style.cssText;
      target.style.setProperty('width', 'fit-content', 'important');
      target.style.setProperty('height', 'auto', 'important');
      target.style.setProperty('min-height', '0', 'important');
      target.style.setProperty('max-height', 'none', 'important');
      target.style.setProperty('align-self', 'flex-start', 'important');
      target.style.setProperty('flex', 'none', 'important');
      var tRect = target.getBoundingClientRect();
      var tW = tRect.width || 0;
      var tH = tRect.height || 0;
      target.style.cssText = orig;

      var freeH = Math.max(0, sW - tW);
      var freeV = Math.max(0, sH - tH);
      var hPx = Math.round((hShiftMap[hAlign] || 0) * freeH);
      var vPx = Math.round((vShiftMap[vAlign] || 0) * freeV);

      var t = [];
      t.push('margin:auto!important');
      if (hPx !== 0 || vPx !== 0) {
        t.push('transform:translate(' + hPx + 'px,' + vPx + 'px)!important');
      }
      if (isFlex) {
        t.push('align-items:center!important');
        t.push('justify-content:center!important');
      } else {
        t.push('display:flex!important');
        t.push('flex-direction:column!important');
        t.push('align-items:center!important');
      }

      var c = ['justify-content:center!important'];
      if (hAlign === 'center') {
        c.push('margin-left:auto!important');
        c.push('margin-right:auto!important');
        c.push('text-align:center!important');
      }
      if (!isFlex && hAlign !== 'center') {
        c.push('min-width:33.33%!important');
        c.push('text-align:start!important');
      }

      var css = '';
      if (hPx !== 0 || vPx !== 0) css += sel + '{overflow:hidden!important}';
      if (hAlign === 'center') {
        css += sel + '{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important}';
        t.push('text-align:center!important');
      }
      css += sel + ' [data-zappy-align-target]{' + t.join(';') + '}';
      css += sel + ' [data-zappy-align-target]>*{' + c.join(';') + '}';
      css += '@media(max-width:768px){' +
        sel + ' [data-zappy-align-target]{align-items:center!important;margin-left:auto!important;margin-right:auto!important;' +
        (vPx !== 0 ? 'transform:translateY(' + vPx + 'px)!important' : 'transform:none!important') +
        '}' + sel + ' [data-zappy-align-target]>*{margin-left:auto!important;margin-right:auto!important}}';

      var s = document.createElement('style');
      s.setAttribute('data-zappy-align-style', 'true');
      s.textContent = css;
      section.insertBefore(s, section.firstChild);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', restoreContentAlignments);
    } else {
      restoreContentAlignments();
    }

    var _timer = null;
    window.addEventListener('resize', function() {
      clearTimeout(_timer);
      _timer = setTimeout(restoreContentAlignments, 200);
    });
    window.addEventListener('orientationchange', function() {
      clearTimeout(_timer);
      _timer = setTimeout(restoreContentAlignments, 200);
    });
  } catch(e) {}
})();


/* ZAPPY_SECTION_ID_FROM_CLASS */
(function(){
  function assignIds(){
    document.querySelectorAll('section').forEach(function(s){
      if(s.id)return;
      var cls=(s.className||'').split(/\s+/)[0];
      if(cls && !document.getElementById(cls)){s.id=cls;}
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',assignIds,{once:true});}
  else{assignIds();}
})();
/* END ZAPPY_SECTION_ID_FROM_CLASS */


/* ZAPPY_EMPTY_SUBMENU_HIDDEN */
(function(){
  function markEmpty(){
    document.querySelectorAll('.sub-menu, .dropdown-menu').forEach(function(ul){
      var hasVisible=false;
      for(var i=0;i<ul.children.length;i++){
        if(window.getComputedStyle(ul.children[i]).display!=='none'){hasVisible=true;break;}
      }
      ul.classList.toggle('zappy-empty-submenu',!hasVisible);
    });
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',markEmpty,{once:true});}
  else{markEmpty();}
})();
/* END ZAPPY_EMPTY_SUBMENU_HIDDEN */


/* ZAPPY_INTERNAL_LINKS_NO_NEW_TAB */
(function(){
  try {
    function fixLinks(){
      var docRe=/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|odt|ods|odp)(\?|$)/i;
      document.querySelectorAll('a[target="_blank"]').forEach(function(a){
        var h=a.getAttribute('href');
        if(!h)return;
        if(h.indexOf('://')!==-1||h.indexOf('mailto:')===0||h.indexOf('tel:')===0)return;
        if(docRe.test(h))return;
        a.removeAttribute('target');
        a.removeAttribute('rel');
      });
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fixLinks)}
    else{fixLinks()}
  }catch(e){}
})();


/* ZAPPY_IOS_VIEWPORT_GAP_FIX */
(function(){
  try {
    if (window.__zappyIosViewportGapInit) return;
    window.__zappyIosViewportGapInit = true;

    function update() {
      try {
        var visual = window.innerWidth;
        var layout = document.documentElement.clientWidth;
        var gap = Math.max(0, (visual || 0) - (layout || 0));
        document.documentElement.style.setProperty('--ios-viewport-gap', gap + 'px');

        // Also publish the navbar bottom so the mobile dropdown menu CSS can
        // anchor `top` below announcement bars + fixed navbar. This is needed because
        // older v2 patches set `top: 100% !important` on .nav-menu, which
        // with position:fixed resolves against the viewport (=height of
        // screen) instead of the navbar. --zappy-navbar-bottom gives the
        // v3 CSS something concrete to override that with.
        var nav = document.querySelector('nav.navbar, .navbar, header nav, header.navbar');
        if (nav) {
          var rect = nav.getBoundingClientRect();
          var bottom = Math.round(rect.bottom);
          if (bottom > 0) {
            document.documentElement.style.setProperty('--zappy-navbar-bottom', bottom + 'px');
          }
        }
      } catch (e) {}
    }

    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
    }
    document.addEventListener('DOMContentLoaded', update);
    window.addEventListener('load', update);
    // Re-measure after the navbar layout settles (fonts, images, logo load).
    setTimeout(update, 250);
    setTimeout(update, 1000);
  } catch (e) {}
})();


/* ZAPPY_STOREFRONT_RUNTIME_V1 — appended from preview-scripts/00-config.js for preview/live parity */
;(function() {
  'use strict';
  // ===== DESKTOP NAVBAR FIX =====
  // Clear mobile-only positioning inline styles on desktop viewport
  // This fixes sites generated with old code that applied these styles unconditionally
  function clearMobileNavbarStyles() {
    if (window.innerWidth > 768) {
      var mobileToggle = document.querySelector('.mobile-toggle');
      var phoneBtn = document.querySelector('.phone-header-btn');
      
      if (mobileToggle) {
        mobileToggle.style.removeProperty('position');
        mobileToggle.style.removeProperty('top');
        mobileToggle.style.removeProperty('transform');
        mobileToggle.style.removeProperty('z-index');
        mobileToggle.style.removeProperty('left');
        mobileToggle.style.removeProperty('right');
      }
      
      if (phoneBtn) {
        phoneBtn.style.removeProperty('position');
        phoneBtn.style.removeProperty('top');
        phoneBtn.style.removeProperty('transform');
        phoneBtn.style.removeProperty('z-index');
        phoneBtn.style.removeProperty('left');
        phoneBtn.style.removeProperty('right');
      }
      
      console.log('📦 [00-config] Cleared mobile navbar inline styles on desktop');
    }
  }
  
  // Run on load and resize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearMobileNavbarStyles);
  } else {
    clearMobileNavbarStyles();
  }
  window.addEventListener('load', clearMobileNavbarStyles);
  window.addEventListener('resize', clearMobileNavbarStyles);

  // ===== LAYOUT SECTION NORMALIZATION =====
  // Ensure layout sections create a block formatting context so that child
  // element margins (e.g. <h2> default margin-top) don't collapse outside
  // the section. Without this, sections render differently in edit mode
  // (where .zappy-removable adds position:relative) vs view mode.
  (function() {
    var layoutNormStyle = document.createElement('style');
    layoutNormStyle.id = 'zappy-layout-norm';
    layoutNormStyle.textContent = 'section.layout-section { overflow: hidden; }';
    document.head.appendChild(layoutNormStyle);
  })();

  // ===== GRID CELL MULTI-CHILD FIX =====
  // Grid cells (inserted elements inside horizontal grids) that contain multiple
  // child inserted elements must use flex-direction: column so children stack
  // vertically. This can be lost if inline styles are overwritten during editing.
  (function() {
    function fixGridCellFlexDirection() {
      try {
        var cells = document.querySelectorAll('.zappy-inserted-element');
        for (var i = 0; i < cells.length; i++) {
          var cell = cells[i];
          var style = cell.getAttribute('style') || '';
          if (style.indexOf('display: flex') === -1 && style.indexOf('display:flex') === -1) continue;
          if (style.indexOf('flex-direction') !== -1) continue;
          var childInserted = cell.querySelector('.zappy-inserted-element');
          if (!childInserted) continue;
          cell.style.flexDirection = 'column';
          cell.style.alignItems = 'center';
        }
      } catch (e) {}
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixGridCellFlexDirection);
    } else {
      fixGridCellFlexDirection();
    }
  })();

  // ===== E-COMMERCE VARIANT SELECTION FIX =====
  // Inject CSS for variant option states:
  //   .disabled        = non-existent combination OR out-of-stock → gray + text strikethrough, always clickable
  //   .out-of-stock    = same visual as disabled, used for stock-specific logic
  // This ensures existing sites get the correct styling without regeneration.
  (function() {
    // 1) Inject CSS immediately (uses separate ID so fixVariantSelection doesn't remove it)
    if (!document.getElementById('zappy-variant-visual-css')) {
      var s = document.createElement('style');
      s.id = 'zappy-variant-visual-css';
      s.textContent =
        /* False variant options: gray + text strikethrough */
        '.variant-option.disabled { opacity: 0.4 !important; cursor: pointer !important; text-decoration: line-through !important; }' +
        '.variant-option.disabled::after, .variant-option.disabled::before { content: none !important; }' +
        /* Color swatches: only opacity, no strikethrough */
        '.variant-option.color-swatch.disabled { text-decoration: none !important; }' +
        /* Out-of-stock: same treatment */
        '.variant-option.out-of-stock { opacity: 0.4 !important; cursor: pointer !important; text-decoration: line-through !important; }' +
        '.variant-option.out-of-stock::after, .variant-option.out-of-stock::before { content: none !important; }' +
        '.variant-option.color-swatch.out-of-stock { text-decoration: none !important; }' +
        /* Incomplete selection prompt (must not look like hard OOS) */
        '.product-info .product-stock.select-required { color: #d97706 !important; }';
      document.head.appendChild(s);
    }

    // 2) Override initVariantSelection early to prevent the page's default selection behavior.
    // The page's initVariantSelection calls .click() on first options, auto-selecting defaults.
    // We replace it with a version that only does setup (CSS, sorting, handlers) but skips auto-select.
    // Ticket-style multi-qty products keep the baked initMultiQuantitySelection path.
    var _initOverridden = false;
    var _origInitVariantSelection = null;
    function _isMultiQtyProduct(p) {
      return !!(p && p.card_variants && p.card_variants.multiQuantity)
        || !!(typeof window.isProductMultiQuantity === 'function' && window.isProductMultiQuantity(p))
        || !!document.querySelector('[data-multi-quantity="true"]');
    }
    function _overrideInitVariantSelection() {
      if (_initOverridden) return;
      // Wait until the page defines initVariantSelection so we can keep a real
      // original for multi-qty products (ticket-style per-value steppers).
      if (typeof window.initVariantSelection !== 'function') return;
      _initOverridden = true;
      _origInitVariantSelection = window.initVariantSelection;
      window.initVariantSelection = function(product, t) {
        if (_isMultiQtyProduct(product)) {
          if (typeof _origInitVariantSelection === 'function') {
            return _origInitVariantSelection.call(this, product, t);
          }
          return;
        }
        // Store product data for our fix (variants[] OR card_variants.matrix)
        if (product && ((product.variants && product.variants.length > 0) || _hasMatrix(product))) {
          _variantProduct = _augmentProductFromCardVariants(product);
          var trans = t || {};
          // Ensure pleaseSelect is available (for sites generated before this key was added)
          if (!trans.pleaseSelect) {
            var isRTL = document.documentElement.getAttribute('dir') === 'rtl' || document.body.getAttribute('dir') === 'rtl';
            trans.pleaseSelect = isRTL ? 'נא לבחור' : 'Please select';
          }
          _variantTranslations = trans;
          // Re-trigger fixVariantSelection here. Our scheduled setTimeout(..., 100) and
          // setTimeout(..., 2000) may have already fired before the product API resolved
          // (slow DB / large payloads), in which case both calls bailed at the
          // `if (!product || !product.variants...) return;` guard and never repaired
          // truncated data-value attributes nor auto-selected single-option groups.
          // Running it again now (deferred so DOM mutations from the page's own init
          // settle first) ensures the fix executes exactly once for late-arriving data.
          setTimeout(function() { try { fixVariantSelection(); } catch (e) {} }, 0);
        }
        // Do NOT call the original (which would auto-select defaults and inject conflicting CSS).
        // Our fixVariantSelection handles all setup.
      };
    }
    _overrideInitVariantSelection();
    
    // 3) Document-level click delegation for variant options.
    // Uses capture phase on document so it fires before any element-level handlers
    // and works regardless of when variant buttons are created/recreated.
    var selectedAttributes = {};
    var _variantProduct = null;
    var _variantTranslations = {};
    
    function _getVariants() {
      if (!_variantProduct) return [];
      var rows = (_variantProduct.variants || []).filter(function(v) { return v && v.is_active !== false; });
      if (rows.length) return rows;
      // Matrix-only / incomplete variants[] — same fallback as updateVariantUI / V12 overlay.
      var m = _variantProduct.card_variants && Array.isArray(_variantProduct.card_variants.matrix)
        ? _variantProduct.card_variants.matrix : [];
      return m.filter(function(r) { return r && r.is_active !== false; });
    }

    function _hasMatrix(p) {
      return !!(p && p.card_variants && Array.isArray(p.card_variants.matrix) && p.card_variants.matrix.length > 0);
    }

    /** True when any purchasable variant/matrix row remains (incomplete-selection gate). */
    function _anyVariantAvailable() {
      var rows = _getVariants();
      if (rows.some(function(v) { return !_isOOS(v); })) return true;
      var p = _variantProduct || window.currentProduct;
      var m = p && p.card_variants && Array.isArray(p.card_variants.matrix) ? p.card_variants.matrix : [];
      if (m.length) return m.some(function(r) { return r && r.available !== false && r.is_active !== false; });
      return false;
    }

    function _selectVariantMessage() {
      var t = _variantTranslations || {};
      if (typeof getEcomText === 'function') return getEcomText('selectVariant', t.selectVariant || 'Select option');
      var rtl = document.documentElement.getAttribute('dir') === 'rtl' || document.body.getAttribute('dir') === 'rtl';
      return t.selectVariant || (rtl ? 'בחר אפשרות' : 'Select option');
    }

    function _augmentProductFromCardVariants(product) {
      if (!product || !product.card_variants || !Array.isArray(product.card_variants.matrix)) return product;
      var byId = {};
      (Array.isArray(product.variants) ? product.variants : []).forEach(function(v) {
        if (v && v.id != null) byId[String(v.id)] = v;
      });
      product.card_variants.matrix.forEach(function(row) {
        if (!row || row.id == null) return;
        var existing = byId[String(row.id)] || {};
        byId[String(row.id)] = Object.assign({}, existing, {
          id: row.id,
          attributes: row.attributes || existing.attributes || {},
          price: row.price != null ? row.price : existing.price,
          image: row.image || existing.image,
          sku: row.sku || existing.sku,
          custom_fields: existing.custom_fields || existing.customFields || row.custom_fields || row.customFields || {},
          available: typeof row.available === 'boolean' ? row.available : existing.available,
          is_active: existing.is_active !== false
        });
      });
      product.variants = Object.keys(byId).map(function(id) { return byId[id]; });
      return product;
    }

    function _variantCssUrl(value) {
      return String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n|\r/g, '');
    }

    function _cardVariantSwatchStyle(value) {
      if (typeof window.zappyCardSwatchStyle === 'function') return window.zappyCardSwatchStyle(value);
      if (value && (value.swatchImage || value.image)) {
        var resolver = window.resolveProductImageUrl || function(src) { return src; };
        return "background-image:url('" + _variantCssUrl(resolver(value.swatchImage || value.image)) + "');background-size:" + (value.imageSize || 'cover') + ';background-position:' + (value.imagePosition || '50% 50%') + ';';
      }
      if (value && value.hex2) return 'background:linear-gradient(90deg,' + (value.hex || '#94a3b8') + ' 0 50%,' + value.hex2 + ' 50% 100%);';
      return 'background:' + ((value && (value.hex || value.value)) || '#94a3b8') + ';';
    }

    function _translateVariantOptionLabel(product, key, value, fallback) {
      if (typeof window.zappyTranslateVariantValue === 'function') {
        return window.zappyTranslateVariantValue(product, key, value, fallback);
      }
      var lang = '';
      try {
        lang = String((typeof getCurrentEcomLanguage === 'function' ? getCurrentEcomLanguage() : (document.documentElement.lang || '')) || '').split('-')[0].toLowerCase();
      } catch (e) {}
      function translateKnownColor(rawValue) {
        if (lang !== 'he') return '';
        if (String(key || '').toLowerCase().indexOf('color') === -1 && String(key || '').toLowerCase() !== 'colour') return '';
        var raw = String(rawValue == null ? '' : rawValue).trim();
        if (!raw || /[\u0590-\u05FF]/.test(raw)) return '';
        var map = { black:'שחור', white:'לבן', gray:'אפור', grey:'אפור', red:'אדום', green:'ירוק', blue:'כחול', navy:'כחול כהה', pink:'ורוד', purple:'סגול', yellow:'צהוב', orange:'כתום', brown:'חום', beige:'בז׳', gold:'זהב', silver:'כסף', teal:'טורקיז', mint:'מנטה', cream:'קרם', ivory:'שנהב' };
        var direct = map[raw.toLowerCase().replace(/\s+/g, ' ')];
        if (direct) return direct;
        var parts = raw.split(/\s*-\s*/).filter(Boolean);
        if (parts.length > 1) {
          var translated = parts.map(function(part) { return map[String(part).toLowerCase().replace(/\s+/g, ' ')]; });
          if (translated.every(Boolean)) return translated.join('-');
        }
        return '';
      }
      var wanted = String(value);
      var variants = product && Array.isArray(product.variants) ? product.variants : [];
      for (var i = 0; i < variants.length; i++) {
        var variant = variants[i] || {};
        var attrs = variant.attributes_source || variant.attributes || {};
        if (!attrs || String(attrs[key]) !== wanted) continue;
        var translatedAttrs = variant.attributes_translations && lang && variant.attributes_translations[lang];
        if (translatedAttrs && translatedAttrs[key]) return translateKnownColor(translatedAttrs[key]) || String(translatedAttrs[key]);
        var displayAttrs = variant.attributes_display || {};
        if (displayAttrs && displayAttrs[key]) return translateKnownColor(displayAttrs[key]) || String(displayAttrs[key]);
      }
      var matrix = product && product.card_variants && Array.isArray(product.card_variants.matrix) ? product.card_variants.matrix : [];
      for (var j = 0; j < matrix.length; j++) {
        var row = matrix[j] || {};
        var rowAttrs = row.attributes || {};
        if (rowAttrs && String(rowAttrs[key]) === wanted && row.attributes_display && row.attributes_display[key]) {
          return translateKnownColor(row.attributes_display[key]) || String(row.attributes_display[key]);
        }
      }
      return translateKnownColor(fallback) || fallback;
    }

    function _ensureCardVariantOptionButtons() {
      var product = _variantProduct || window.currentProduct;
      var cv = product && product.card_variants;
      if (!cv || !Array.isArray(cv.options)) return;
      cv.options.forEach(function(option) {
        if (!option || !option.key || !Array.isArray(option.values)) return;
        var group = null;
        document.querySelectorAll('.variant-group').forEach(function(candidate) {
          if (candidate.getAttribute('data-group') === option.key) group = candidate;
        });
        var container = group && group.querySelector('.variant-options');
        if (!container) return;
        var isColor = option.type === 'color' || String(option.key).toLowerCase().indexOf('color') !== -1;
        option.values.forEach(function(entry) {
          if (!entry || entry.value == null) return;
          var displayLabel = String(entry.label || entry.value);
          displayLabel = _translateVariantOptionLabel(product, option.key, entry.value, displayLabel);
          var existingButton = null;
          container.querySelectorAll('.variant-option').forEach(function(btn) {
            if (btn.getAttribute('data-value') === String(entry.value)) existingButton = btn;
          });
          if (existingButton) {
            existingButton.setAttribute('data-display-value', displayLabel);
            existingButton.title = displayLabel;
            if (isColor) existingButton.style.cssText = _cardVariantSwatchStyle(entry);
            else existingButton.textContent = displayLabel;
            return;
          }
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'variant-option' + (isColor ? ' color-swatch' : '');
          btn.setAttribute('data-attr', option.key);
          btn.setAttribute('data-value', String(entry.value));
          btn.setAttribute('data-display-value', displayLabel);
          btn.title = displayLabel;
          if (isColor) btn.style.cssText = _cardVariantSwatchStyle(entry);
          else btn.textContent = displayLabel;
          container.appendChild(btn);
        });
      });
    }
    
    function _getAttributeKeys() {
      var keys = [], seen = {};
      document.querySelectorAll('.variant-option').forEach(function(btn) {
        var k = btn.getAttribute('data-attr');
        if (k && !seen[k]) { seen[k] = true; keys.push(k); }
      });
      return keys;
    }
    
    // Wildcard semantics, shared with window.zappyVariantMatrix (baked storefront
    // JS) when present; the inline fallback mirrors it so preview (which may not
    // load the baked module) and publish never diverge on strict-vs-wildcard.
    function _matchesAll(v, selections) {
      if (!v || !v.attributes || v.is_active === false) return false;
      for (var k in selections) {
        if (!selections.hasOwnProperty(k)) continue;
        if (v.attributes.hasOwnProperty(k) && v.attributes[k] !== selections[k]) return false;
      }
      return true;
    }

    function _comboExists(selections) {
      if (window.zappyVariantMatrix) return window.zappyVariantMatrix.filterMatching(_getVariants(), selections).length > 0;
      return _getVariants().some(function(v) { return _matchesAll(v, selections); });
    }
    
    function _findMatching(selections) {
      if (window.zappyVariantMatrix) return window.zappyVariantMatrix.filterMatching(_getVariants(), selections);
      return _getVariants().filter(function(v) { return _matchesAll(v, selections); });
    }
    
    function _isOOS(v) {
      if (window.zappyVariantMatrix) return window.zappyVariantMatrix.isUnavailable(v);
      if (!v) return true;
      // Matrix rows often only set `available` (no stock_status / inventory).
      if (typeof v.available === 'boolean') return !v.available;
      if (v.is_active === false) return true;
      if (v.stock_status === 'out_of_stock') return true;
      var i = v.inventory_quantity != null ? v.inventory_quantity : v.inventoryQuantity;
      if (i != null && i !== '') {
        var n = parseFloat(i);
        if (isFinite(n)) return n <= 0;
      }
      var s = v.stock_quantity;
      if (s != null && s !== '') {
        var m = parseFloat(s);
        if (isFinite(m)) return m <= 0;
      }
      return false;
    }
    
    function _updateVisuals() {
      var variants = _getVariants();
      if (variants.length === 0) return;
      document.querySelectorAll('.variant-option').forEach(function(btn) {
        var ak = btn.getAttribute('data-attr');
        var av = btn.getAttribute('data-value');
        var test = {};
        for (var k in selectedAttributes) {
          if (selectedAttributes.hasOwnProperty(k) && k !== ak) test[k] = selectedAttributes[k];
        }
        test[ak] = av;
        var matching = _findMatching(test);
        var globalMatching = _findMatching((function() { var any = {}; any[ak] = av; return any; })());
        btn.classList.remove('disabled', 'out-of-stock');
        btn.disabled = false;
        if (matching.length === 0) {
          btn.classList.add('disabled');
          btn.disabled = globalMatching.length === 0;
        } else if (matching.every(function(v) { return _isOOS(v); })) {
          btn.classList.add('disabled');
          btn.classList.add('out-of-stock');
          btn.disabled = true;
        }
      });
    }

    function _hasAvailableCombination(selections) {
      return _findMatching(selections).filter(function(v) { return !_isOOS(v); }).length > 0;
    }

    function _syncSelectedDom() {
      document.querySelectorAll('.variant-option').forEach(function(btn) {
        var key = btn.getAttribute('data-attr');
        var value = btn.getAttribute('data-value');
        btn.classList.toggle('selected', !!key && selectedAttributes[key] === value);
      });
    }

    function _reconcileSelectedAttributes(changedKey) {
      var keys = _getAttributeKeys();
      var next = {};
      if (changedKey && selectedAttributes[changedKey]) {
        var changedOnly = {};
        changedOnly[changedKey] = selectedAttributes[changedKey];
        if (_hasAvailableCombination(changedOnly)) next[changedKey] = selectedAttributes[changedKey];
      }
      keys.forEach(function(key) {
        if (key === changedKey || !selectedAttributes.hasOwnProperty(key)) return;
        var candidate = Object.assign({}, next);
        candidate[key] = selectedAttributes[key];
        if (_hasAvailableCombination(candidate)) next[key] = selectedAttributes[key];
      });
      selectedAttributes = next;
      var guard = 0;
      var changed = true;
      while (changed && guard++ < keys.length + 2) {
        changed = false;
        keys.forEach(function(key) {
          if (selectedAttributes.hasOwnProperty(key)) return;
          var viable = [];
          document.querySelectorAll('.variant-option[data-attr="' + key + '"]').forEach(function(candidateBtn) {
            var val = candidateBtn.getAttribute('data-value');
            if (!val) return;
            var candidate = Object.assign({}, selectedAttributes);
            candidate[key] = val;
            if (_hasAvailableCombination(candidate)) viable.push(candidateBtn);
          });
          if (viable.length === 1) {
            selectedAttributes[key] = viable[0].getAttribute('data-value');
            changed = true;
          }
        });
      }
      _syncSelectedDom();
    }
    
    function _updateProductDisplay() {
      var t = _variantTranslations;
      var product = _variantProduct;
      if (!product) return;
      var keys = _getAttributeKeys();
      // keys.length===0 must NOT vacuous-true allSelected — that used to resolve
      // the first (often OOS) variant and flash "Out of Stock" before a pick.
      var allSelected = keys.length > 0 && keys.every(function(k) { return selectedAttributes.hasOwnProperty(k); });
      var stockDisplay = document.getElementById('product-stock-display');
      var priceDisplay = document.getElementById('product-price-display');
      var addBtn = document.getElementById('add-to-cart-btn');
      keys.forEach(function(k) {
        var sp = document.querySelector('.variant-group[data-group="' + k + '"] .variant-selected-value');
        if (sp) {
          var selBtn = document.querySelector('.variant-option[data-attr="' + k + '"].selected');
          sp.textContent = (selBtn && selBtn.getAttribute('data-display-value')) || selectedAttributes[k] || '';
        }
      });
      var mainImage = document.getElementById('product-main-image');
      if (mainImage && !window._originalMainImageSrc) {
        window._originalMainImageSrc = mainImage.src;
      }
      if (allSelected) {
        var matching = _findMatching(selectedAttributes);
        if (matching.length > 0) {
          var v = matching[0];
          // Set window.selectedVariant so the page's addProductToCart can use it
          window.selectedVariant = v;
          if (_isOOS(v)) {
            if (stockDisplay) {
              stockDisplay.className = 'product-stock out-of-stock';
              stockDisplay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' + (t.outOfStock || 'Out of Stock');
            }
            if (addBtn) { addBtn.disabled = true; addBtn.style.opacity = '0.5'; addBtn.style.cursor = 'not-allowed'; }
          } else {
            if (stockDisplay) {
              stockDisplay.className = 'product-stock in-stock';
              stockDisplay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>' + (t.inStock || 'In Stock');
            }
            if (addBtn) { addBtn.disabled = false; addBtn.style.opacity = ''; addBtn.style.cursor = ''; }
          }
          // Always update price when a variant is matched.
          //
          // CUSTOMER-DISCOUNT AWARENESS (per-customer percentage off):
          // When the active shopper has a customer-specific percentage discount
          // configured (delivered into window.__zappyCustomerDiscountConfig by
          // the storefront's customer-discount runtime), we MUST apply it here
          // too — otherwise variant clicks in the fullscreen-preview editor
          // overwrite the discounted price with the raw variant price, leaving
          // merchants unable to preview "what their customer sees" while
          // editing. This mirrors the V2 patch in
          // githubService.ensureVariantSelectionFix that runs on the published
          // site; the two click-handler paths must stay in sync since the
          // editor's capture-phase handler (this one) runs first and
          // stopImmediatePropagation()s the published-site V2 handler. Pinned
          // by server/tests/previewVariantDisplayCustomerDiscount.test.js.
          if (priceDisplay) {
            var currency = product.currency || t.currency || '₪';
            var baseP = window.productBasePrice || parseFloat(product.price) || 0;
            var origP = window.productOriginalPrice || parseFloat(product.compare_at_price || product.original_price || 0);
            var hasSale = window.productHasSalePrice;
            var finalPrice = (v.price != null) ? parseFloat(v.price) : baseP;
            var _cdApplied = false;
            var _cdOrig = finalPrice;
            if (typeof window.__zappyApplyCustomerPercentToPrice === 'function' && product && product.id) {
              var _cdRes = window.__zappyApplyCustomerPercentToPrice(finalPrice, product.id);
              if (_cdRes && _cdRes.applied) {
                _cdApplied = true;
                _cdOrig = finalPrice;
                finalPrice = _cdRes.price;
              }
            }
            var html = currency + finalPrice.toFixed(2);
            if (_cdApplied) {
              html += ' <span class="original-price">' + currency + _cdOrig.toFixed(2) + '</span>';
            } else if (v.price != null) {
              if (origP && origP > finalPrice) {
                html += ' <span class="original-price">' + currency + origP.toFixed(2) + '</span>';
              }
            } else if (hasSale && origP > finalPrice) {
              html += ' <span class="original-price">' + currency + origP.toFixed(2) + '</span>';
            }
            priceDisplay.innerHTML = html;
          }
          // Update price-per-unit if the function exists. Feed the discounted
          // price (when a customer discount applied) so per-unit math matches
          // the headline price.
          if (typeof updatePricePerUnitDisplay === 'function') {
            var effPrice = (v.price != null) ? parseFloat(v.price) : (window.productBasePrice || parseFloat(product.price) || 0);
            if (typeof window.__zappyApplyCustomerPercentToPrice === 'function' && product && product.id) {
              var _cdResUnit = window.__zappyApplyCustomerPercentToPrice(effPrice, product.id);
              if (_cdResUnit && _cdResUnit.applied) effPrice = _cdResUnit.price;
            }
            updatePricePerUnitDisplay(effPrice, product, t);
          }
          // Update SKU: prefer variant SKU, fall back to base product SKU.
          // Resolve the label through getEcomText so it follows the active
          // storefront language — `t.sku || 'SKU'` alone returns Hebrew
          // ("מק״ט") on every English page because the static `t` dictionary
          // baked at server-render time is the merchant's source language
          // (Hebrew, in the artori-design case) and a Hebrew string is
          // truthy, so the English fallback is never reached.
          var skuDisplay = document.getElementById('product-sku-display');
          if (skuDisplay) {
            var skuLabel = (typeof getEcomText === 'function') ? getEcomText('sku', t.sku || 'SKU') : (t.sku || 'SKU');
            if (v.sku) {
              skuDisplay.textContent = skuLabel + ': ' + v.sku;
            } else if (product.sku) {
              skuDisplay.textContent = skuLabel + ': ' + product.sku;
            }
          }
          // Update main image if variant has a specific image
          if (mainImage && v.image) {
            var variantImgSrc = v.image;
            if (window.resolveProductImageUrl) {
              variantImgSrc = window.resolveProductImageUrl(v.image);
            }
            mainImage.src = variantImgSrc;
          } else if (mainImage && window._originalMainImageSrc) {
            mainImage.src = window._originalMainImageSrc;
          }
          if (typeof updateProductSpecificationsForVariant === 'function') {
            updateProductSpecificationsForVariant(v, product);
          }
        }
      } else {
        window.selectedVariant = null;
        // Reset SKU to base product SKU
        var skuDisplay2 = document.getElementById('product-sku-display');
        if (skuDisplay2 && product.sku) {
          var skuLabel2 = (typeof getEcomText === 'function') ? getEcomText('sku', t.sku || 'SKU') : (t.sku || 'SKU');
          skuDisplay2.textContent = skuLabel2 + ': ' + product.sku;
        }
        // Incomplete selection: prompt to pick an option when any variant is still
        // purchasable. Never echo parent stock_status / blanket "In Stock" here —
        // that flashed OOS or In Stock before the shopper chose (preview path).
        var avail = _anyVariantAvailable();
        if (stockDisplay) {
          if (avail) {
            stockDisplay.className = 'product-stock select-required';
            stockDisplay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' + _selectVariantMessage();
          } else {
            stockDisplay.className = 'product-stock out-of-stock';
            stockDisplay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' + (t.outOfStock || 'Out of Stock');
          }
        }
        if (addBtn) {
          if (avail) { addBtn.disabled = false; addBtn.style.opacity = ''; addBtn.style.cursor = ''; }
          else { addBtn.disabled = true; addBtn.style.opacity = '0.5'; addBtn.style.cursor = 'not-allowed'; }
        }
        // Reset price to initial state (Starting at / base price). Same
        // customer-discount path as the variant-matched branch above; without
        // this, partially-selecting a variant and then deselecting another
        // wipes the customer's discount until they re-pick a full combo.
        if (priceDisplay) {
          var currency = product.currency || t.currency || '₪';
          var baseP = window.productBasePrice || parseFloat(product.price) || 0;
          var origP = window.productOriginalPrice || parseFloat(product.compare_at_price || product.original_price || 0);
          var hasSale = window.productHasSalePrice;
          var hasRange = window.productHasVariantPriceRange;
          var minP = window.productVariantMinPrice;
          var _cdFn = (typeof window.__zappyApplyCustomerPercentToPrice === 'function' && product && product.id)
            ? window.__zappyApplyCustomerPercentToPrice
            : null;
          if (hasRange && minP != null && isFinite(minP)) {
            var startLabel = (typeof getEcomText === 'function') ? getEcomText('startingAt', t.startingAt || 'Starting at') : (t.startingAt || 'Starting at');
            if (_cdFn) {
              var _cdRange = _cdFn(minP, product.id);
              if (_cdRange && _cdRange.applied) {
                priceDisplay.innerHTML = startLabel + ' ' + currency + _cdRange.price.toFixed(2) +
                  ' <span class="original-price">' + currency + minP.toFixed(2) + '</span>';
              } else {
                priceDisplay.textContent = startLabel + ' ' + currency + minP.toFixed(2);
              }
            } else {
              priceDisplay.textContent = startLabel + ' ' + currency + minP.toFixed(2);
            }
          } else if (_cdFn) {
            var _cdBase = _cdFn(baseP, product.id);
            if (_cdBase && _cdBase.applied) {
              priceDisplay.innerHTML = currency + _cdBase.price.toFixed(2) +
                ' <span class="original-price">' + currency + baseP.toFixed(2) + '</span>';
            } else if (hasSale && origP > baseP) {
              priceDisplay.innerHTML = currency + baseP.toFixed(2) +
                ' <span class="original-price">' + currency + origP.toFixed(2) + '</span>';
            } else {
              priceDisplay.textContent = currency + baseP.toFixed(2);
            }
          } else if (hasSale && origP > baseP) {
            priceDisplay.innerHTML = currency + baseP.toFixed(2) + ' <span class="original-price">' + currency + origP.toFixed(2) + '</span>';
          } else {
            priceDisplay.textContent = currency + baseP.toFixed(2);
          }
        }
        // Reset price-per-unit (apply customer discount when active so the
        // per-unit math matches the headline reset price).
        if (typeof updatePricePerUnitDisplay === 'function') {
          var hasRange2 = window.productHasVariantPriceRange;
          var minP2 = window.productVariantMinPrice;
          var baseP2 = window.productBasePrice || parseFloat(product.price) || 0;
          var resetPrice = (hasRange2 && minP2 != null && isFinite(minP2)) ? minP2 : baseP2;
          if (typeof window.__zappyApplyCustomerPercentToPrice === 'function' && product && product.id) {
            var _cdResetUnit = window.__zappyApplyCustomerPercentToPrice(resetPrice, product.id);
            if (_cdResetUnit && _cdResetUnit.applied) resetPrice = _cdResetUnit.price;
          }
          updatePricePerUnitDisplay(resetPrice, product, t);
        }
        // Restore original image when no variant is fully selected
        if (mainImage && window._originalMainImageSrc) {
          mainImage.src = window._originalMainImageSrc;
        }
        if (typeof updateProductSpecificationsForVariant === 'function') {
          updateProductSpecificationsForVariant(null, product);
        }
      }
    }
    
    // Document-level capture handler - fires BEFORE any element-level handlers
    document.addEventListener('click', function(e) {
      if (_isMultiQtyProduct(_variantProduct || window.currentProduct)) return;
      var btn = e.target.closest ? e.target.closest('.variant-option') : null;
      if (!btn) return;
      if (!_variantProduct || _getVariants().length === 0) return;
      
      e.preventDefault();
      e.stopImmediatePropagation();
      
      var ak = btn.getAttribute('data-attr');
      var av = btn.getAttribute('data-value');
      if (!ak || !av) return;
      if (btn.disabled || (btn.classList.contains('disabled') && _findMatching((function() { var any = {}; any[ak] = av; return any; })()).length === 0)) return;
      
      // If already selected, do nothing (no manual deselect)
      if (selectedAttributes[ak] === av) {
        return;
      }
      // Select new option in this group
      document.querySelectorAll('.variant-option[data-attr="' + ak + '"]').forEach(function(b) { b.classList.remove('selected'); });
      selectedAttributes[ak] = av;
      btn.classList.add('selected');
      _reconcileSelectedAttributes(ak);
      
      _updateVisuals();
      _updateProductDisplay();
    }, true); // capture phase
    
    // Document-level add-to-cart interceptor (capture phase)
    // This fires before any element-level onclick or inline onclick handlers,
    // preventing the page's original alert()-based validation.
    document.addEventListener('click', function(e) {
      if (_isMultiQtyProduct(_variantProduct || window.currentProduct)) return;
      var addBtn = e.target.closest ? e.target.closest('.add-to-cart-btn, .add-to-cart, #add-to-cart-btn, [onclick*="addProductToCart"]') : null;
      if (!addBtn) return;
      if (!_variantProduct || _getVariants().length === 0) return;
      
      var t = _variantTranslations || {};
      var keys = _getAttributeKeys();
      
      // Sequential validation: check each variant group in order
      for (var i = 0; i < keys.length; i++) {
        if (!selectedAttributes.hasOwnProperty(keys[i])) {
          e.preventDefault();
          e.stopImmediatePropagation();
          var grp = document.querySelector('.variant-group[data-group="' + keys[i] + '"]');
          var lbl = grp ? grp.querySelector('.variant-group-label') : null;
          var name = lbl ? lbl.textContent.replace(/[:\s]+$/, '').trim() : keys[i];
          var sd = document.getElementById('product-stock-display');
          if (sd) {
            // select-required (not out-of-stock): i18n patch must not rewrite
            // "Please select Material" → "Out of Stock".
            sd.className = 'product-stock select-required';
            sd.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
              (t.pleaseSelect || 'Please select') + ' ' + name;
          }
          if (grp) {
            grp.style.transition = 'background 0.3s';
            grp.style.background = 'rgba(255,0,0,0.05)';
            grp.style.borderRadius = '8px';
            setTimeout(function() { grp.style.background = ''; }, 2000);
          }
          return;
        }
      }
      
      // All selected: check if combo is out of stock
      var matching = _findMatching(selectedAttributes);
      if (matching.length > 0 && matching.every(function(v) { return _isOOS(v); })) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      // Valid selection - let the click through to the original handler
    }, true); // capture phase
    
    // Post-load init: sort options, clear selections, override addProductToCart
    function fixVariantSelection() {
      // Re-assert initVariantSelection override in case it was redefined
      _overrideInitVariantSelection();
      
      var product = _variantProduct || window.currentProduct;
      var t = _variantTranslations || window.productTranslations || {};
      if (!product) return;
      if (_isMultiQtyProduct(product)) return;
      if ((!product.variants || product.variants.length === 0) && !_hasMatrix(product)) return;
      if (document.querySelectorAll('.variant-option').length === 0) return;
      if (window._zappyVariantFixed) return;
      window._zappyVariantFixed = true;
      
      _variantProduct = _augmentProductFromCardVariants(product);
      // Ensure pleaseSelect translation exists (for sites generated before this key was added)
      if (!t.pleaseSelect) {
        var isRTL = document.documentElement.getAttribute('dir') === 'rtl' || document.body.getAttribute('dir') === 'rtl';
        t.pleaseSelect = isRTL ? 'נא לבחור' : 'Please select';
      }
      _variantTranslations = t;
      
      // Remove old dynamic CSS injected by the original initVariantSelection
      var oldStyle = document.getElementById('zappy-variant-state-css');
      if (oldStyle) oldStyle.remove();
      document.querySelectorAll('.variant-option').forEach(function(btn) {
        btn.style.display = '';
        btn.disabled = false;
      });

      // Repair variant button attributes that were truncated by the browser
      // when the (pre-fix) renderProductDetail in older website.content.js
      // serialized values containing " (e.g. Hebrew sizes like '19  מ"מ',
      // US sizes 5'10") into data-value/data-display-value without HTML
      // escaping. We rebuild data-value, data-display-value, and the visible
      // text from _variantProduct.variants[*].attributes — the unbroken
      // source of truth from the API. Pairs buttons to values by index after
      // applying the same sort that fixVariantSelection uses below, so the
      // mapping survives even when buttons render in a different order than
      // the variants array.
      function _repairVariantButtons() {
        if (!_variantProduct || !_variantProduct.variants) return;
        var vs = _getVariants();
        if (vs.length === 0) return;
        var _so = {'xxxs':0,'xxs':1,'xs':2,'s':3,'m':4,'l':5,'xl':6,'xxl':7,'2xl':7,'xxxl':8,'3xl':8,'4xl':9,'5xl':10};
        function _cmp(a, b) {
          var sa = _so[String(a).toLowerCase()], sb = _so[String(b).toLowerCase()];
          var na = sa === undefined ? parseFloat(a) : NaN;
          var nb = sb === undefined ? parseFloat(b) : NaN;
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          if (sa !== undefined && sb !== undefined) return sa - sb;
          var ca = !isNaN(na) ? 0 : sa !== undefined ? 1 : 2;
          var cb = !isNaN(nb) ? 0 : sb !== undefined ? 1 : 2;
          if (ca !== cb) return ca - cb;
          return String(a).localeCompare(String(b));
        }
        document.querySelectorAll('.variant-group').forEach(function(grp) {
          var ak = grp.getAttribute('data-group');
          if (!ak || ak === 'variant') return;
          var btns = Array.prototype.slice.call(grp.querySelectorAll('.variant-option'));
          if (btns.length === 0) return;
          var seen = {}, vals = [];
          vs.forEach(function(v) {
            if (v.attributes && Object.prototype.hasOwnProperty.call(v.attributes, ak)) {
              var val = v.attributes[ak];
              if (val != null && !seen[val]) { seen[val] = true; vals.push(val); }
            }
          });
          if (vals.length === 0 || vals.length !== btns.length) return;
          vals.sort(_cmp);
          btns.forEach(function(btn, i) {
            var correct = String(vals[i]);
            var current = btn.getAttribute('data-value') || '';
            if (current === correct) return;
            btn.setAttribute('data-value', correct);
            btn.setAttribute('data-display-value', correct);
            if (!btn.classList.contains('color-swatch')) { btn.textContent = correct; }
            if (btn.title) { btn.title = correct; }
          });
        });
      }
      _ensureCardVariantOptionButtons();
      _repairVariantButtons();

      // Sort variant options (numeric, then known sizes, then alphabetical)
      var _sizeOrder = {'xxxs':0,'xxs':1,'xs':2,'s':3,'m':4,'l':5,'xl':6,'xxl':7,'2xl':7,'xxxl':8,'3xl':8,'4xl':9,'5xl':10};
      document.querySelectorAll('.variant-options').forEach(function(container) {
        var btns = Array.from(container.querySelectorAll('.variant-option'));
        if (btns.length < 2) return;
        btns.sort(function(a, b) {
          var va = a.getAttribute('data-value') || '', vb = b.getAttribute('data-value') || '';
          var sa = _sizeOrder[va.toLowerCase()], sb = _sizeOrder[vb.toLowerCase()];
          var na = sa === undefined ? parseFloat(va) : NaN;
          var nb = sb === undefined ? parseFloat(vb) : NaN;
          if (!isNaN(na) && !isNaN(nb)) return na - nb;
          if (sa !== undefined && sb !== undefined) return sa - sb;
          var ca = !isNaN(na) ? 0 : sa !== undefined ? 1 : 2;
          var cb = !isNaN(nb) ? 0 : sb !== undefined ? 1 : 2;
          if (ca !== cb) return ca - cb;
          return va.localeCompare(vb);
        });
        btns.forEach(function(b) { container.appendChild(b); });
      });
      
      // Also override addProductToCart as a safety net
      var origAddToCart = window.addProductToCart;
      window.addProductToCart = function() {
        if (_isMultiQtyProduct(window.currentProduct)) {
          if (origAddToCart) return origAddToCart.apply(this, arguments);
          return;
        }
        var keys = _getAttributeKeys();
        for (var i = 0; i < keys.length; i++) {
          if (!selectedAttributes.hasOwnProperty(keys[i])) {
            var grp = document.querySelector('.variant-group[data-group="' + keys[i] + '"]');
            var lbl = grp ? grp.querySelector('.variant-group-label') : null;
            var name = lbl ? lbl.textContent.replace(/[:\s]+$/, '').trim() : keys[i];
            var sd = document.getElementById('product-stock-display');
            if (sd) {
              sd.className = 'product-stock select-required';
              sd.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>' +
                (t.pleaseSelect || 'Please select') + ' ' + name;
            }
            if (grp) {
              grp.style.transition = 'background 0.3s';
              grp.style.background = 'rgba(255,0,0,0.05)';
              grp.style.borderRadius = '8px';
              setTimeout(function() { grp.style.background = ''; }, 2000);
            }
            return;
          }
        }
        var matching = _findMatching(selectedAttributes);
        if (matching.length > 0 && matching.every(function(v) { return _isOOS(v); })) return;
        if (origAddToCart) origAddToCart.apply(this, arguments);
      };
      
      // Clear all, update visuals
      selectedAttributes = {};
      document.querySelectorAll('.variant-option').forEach(function(b) {
        b.classList.remove('selected', 'disabled', 'out-of-stock');
        b.disabled = false;
      });

      // Auto-select any variant group that only has one possible value, so a
      // shopper choosing the remaining options gets a fully-matched variant
      // (image/SKU/price update) instead of being silently blocked because a
      // single-option dimension was left implicitly unselected.
      function _autoSelectSingles() {
        document.querySelectorAll('.variant-group').forEach(function(grp) {
          var ak = grp.getAttribute('data-group');
          if (!ak || ak === 'variant') return;
          if (grp.querySelector('.variant-option.selected')) return;
          var btns = Array.prototype.slice.call(grp.querySelectorAll('.variant-option')).filter(function(b) {
            return b.getAttribute('data-attr')
              && b.getAttribute('data-value')
              && !b.classList.contains('disabled')
              && !b.classList.contains('out-of-stock');
          });
          if (btns.length !== 1) return;
          var btn = btns[0];
          var av = btn.getAttribute('data-value');
          btn.classList.add('selected');
          selectedAttributes[ak] = av;
          var sp = grp.querySelector('.variant-selected-value');
          if (sp) sp.textContent = btn.getAttribute('data-display-value') || av;
        });
      }

      _autoSelectSingles();
      _updateVisuals();
      // Re-run after availability has been recomputed: a multi-option group may
      // have collapsed to a single non-disabled choice once cross-group stock
      // constraints were applied.
      _autoSelectSingles();
      _updateProductDisplay();
    }
    
    function tryFix() { setTimeout(fixVariantSelection, 100); }
    if (document.readyState === 'complete') {
      tryFix();
    } else {
      window.addEventListener('load', tryFix);
    }
    setTimeout(fixVariantSelection, 2000);
  })();

  // ===== CHECKOUT TERMS CHECKBOX FIX =====
  // Ensure the terms checkbox label is properly styled on all sites (including those generated
  // before these styles were added). Injects missing CSS for proper flex layout and spacing.
  (function() {
    if (document.getElementById('zappy-terms-checkbox-css')) return;
    var s = document.createElement('style');
    s.id = 'zappy-terms-checkbox-css';
    s.textContent =
      '.terms-checkbox-wrapper { margin: 16px 0; padding: 12px; background: var(--surface-color, var(--surface, #f9fafb)); border-radius: 8px; }' +
      '.terms-checkbox-label { display: flex !important; align-items: center !important; gap: 10px !important; cursor: pointer; font-size: 14px; color: var(--text-color, var(--text, #374151)); }' +
      '.terms-checkbox { width: 18px; height: 18px; cursor: pointer; accent-color: var(--primary-color, var(--primary, #ff0083)); flex-shrink: 0; }' +
      '.terms-link { color: var(--primary-color, var(--primary, #ff0083)); text-decoration: underline; font-weight: 500; }';
    document.head.appendChild(s);
  })();

  // ===== CART COLOR SWATCH PATCH =====
  // Replace color text in cart items with a color circle swatch.
  // Observes the cart drawer for changes and converts color attribute text to circles.
  (function() {
    function patchCartColorSwatches(container) {
      if (!container) return;
      var attrs = container.querySelectorAll('.cart-item-attr');
      attrs.forEach(function(span) {
        if (span.querySelector('.cart-item-color-swatch')) return; // already patched
        var labelEl = span.querySelector('.cart-item-attr-label');
        if (!labelEl) return;
        var labelText = (labelEl.textContent || '').replace(/[:\s]+$/, '').toLowerCase();
        // Match color-related labels in multiple languages
        var colorLabels = ['color', 'colour', 'צבע', 'لون', 'farbe', 'couleur', 'color', 'colore'];
        if (colorLabels.indexOf(labelText) === -1) return;
        // The color value is the text after the label
        var fullText = span.textContent || '';
        var labelFull = labelEl.textContent || '';
        var colorValue = fullText.replace(labelFull, '').trim();
        if (!colorValue) return;
        var bgColor = colorValue;
        if (!/^#[0-9A-Fa-f]{3,6}$/.test(colorValue)) {
          var lc = colorValue.toLowerCase();
          var _clr = {'dark grey':'#555','dark gray':'#555','light grey':'#d3d3d3','light gray':'#d3d3d3','light blue':'lightblue','dark blue':'darkblue','light green':'lightgreen','dark green':'darkgreen','dark red':'darkred','light pink':'lightpink','dark orange':'darkorange','sky blue':'skyblue','royal blue':'royalblue','navy blue':'navy','forest green':'forestgreen','olive green':'olivedrab','hot pink':'hotpink','deep pink':'deeppink','dark violet':'darkviolet','slate grey':'slategrey','slate gray':'slategray','dim grey':'dimgrey','dim gray':'dimgray','off white':'#f5f5f0','burgundy':'#800020','charcoal':'#36454f','champagne':'#f7e7ce','sand':'#c2b280','taupe':'#483c32','wine':'#722f37','rust':'#b7410e','sage':'#bcb88a','mint':'#98ff98','peach':'#ffcba4','cream':'#fffdd0','mauve':'#e0b0ff'};
          bgColor = _clr[lc] || lc;
        }
        var swatch = document.createElement('span');
        swatch.className = 'cart-item-color-swatch';
        swatch.title = colorValue;
        swatch.style.cssText = 'display:inline-block;width:14px;height:14px;border-radius:50%;background-color:' + bgColor + ';border:1px solid rgba(0,0,0,0.15);vertical-align:middle;margin-inline-start:4px;';
        // Remove the text value, keep only label + swatch
        span.textContent = '';
        span.appendChild(labelEl.cloneNode(true));
        span.appendChild(document.createTextNode(' '));
        span.appendChild(swatch);
      });
    }

    // Observe the cart drawer for content changes
    function observeCartDrawer() {
      var drawer = document.getElementById('cart-drawer') || document.getElementById('cart-drawer-items');
      if (!drawer) return;
      patchCartColorSwatches(drawer);
      var observer = new MutationObserver(function() { patchCartColorSwatches(drawer); });
      observer.observe(drawer, { childList: true, subtree: true });
    }

    // Try on load and also watch for the drawer being added to DOM
    if (document.readyState === 'complete') {
      setTimeout(observeCartDrawer, 200);
    } else {
      window.addEventListener('load', function() { setTimeout(observeCartDrawer, 200); });
    }
    // Safety net: also observe body for the drawer being dynamically added
    var bodyObserver = new MutationObserver(function() {
      var d = document.getElementById('cart-drawer');
      if (d) { observeCartDrawer(); bodyObserver.disconnect(); }
    });
    if (document.body) {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        bodyObserver.observe(document.body, { childList: true, subtree: true });
      });
    }
  })();

  // ===== CART FORMATTED PRICE TOTAL PATCH =====
  // Older generated storefront scripts used parseFloat directly, which returns NaN for
  // persisted cart prices such as "₪55.00". Keep existing preview carts accurate until
  // the site is refreshed with the generated-code fix.
  (function() {
    function parseCartPrice(value) {
      if (value === null || value === undefined || value === '') return NaN;
      if (typeof value === 'number') return isFinite(value) ? value : NaN;
      var normalized = String(value).replace(/[^\d.,-]/g, '').replace(/,/g, '');
      var parsed = parseFloat(normalized);
      return isFinite(parsed) ? parsed : NaN;
    }

    function getItemPrice(item) {
      if (!item) return 0;
      if (item.selectedVariant && item.selectedVariant.price !== null && item.selectedVariant.price !== undefined && item.selectedVariant.price !== '') {
        var variantPrice = parseCartPrice(item.selectedVariant.price);
        if (isFinite(variantPrice)) return variantPrice;
      }
      var displayPrice = parseCartPrice(item.displayPrice);
      if (isFinite(displayPrice)) return displayPrice;
      var regularPrice = parseCartPrice(item.price);
      var salePrice = parseCartPrice(item.sale_price);
      if (isFinite(salePrice) && isFinite(regularPrice) && salePrice < regularPrice) return salePrice;
      return isFinite(regularPrice) ? regularPrice : 0;
    }

    function getLineTotal(item) {
      var price = getItemPrice(item);
      var quantity = parseFloat(item && item.quantity) || 1;
      var step = parseFloat((item && (item.quantityStep || item.quantity_step))) || 1;
      var unit = (item && (item.quantityUnit || item.quantity_unit)) || 'piece';
      return unit === 'piece' ? price * quantity : price * (quantity / step);
    }

    function getCartItems() {
      var websiteId = window.ZAPPY_WEBSITE_ID || (window.CONFIG && window.CONFIG.websiteId);
      if (!websiteId) return [];
      try {
        return JSON.parse(localStorage.getItem('zappy_cart_' + websiteId) || '[]');
      } catch (e) {
        return [];
      }
    }

    function convertDisplayAmount(baseAmount, exchangeRate) {
      var n = parseFloat(baseAmount);
      if (!isFinite(n)) n = 0;
      var rate = parseFloat(exchangeRate);
      if (!isFinite(rate) || rate <= 0) rate = 1;
      var converted = n * rate;
      if (rate === 1) return Math.round(converted * 100) / 100;
      return Math.round(converted * 10) / 10;
    }

    function formatCartDisplayAmount(amount) {
      if (typeof window.zappyFormatMoney === 'function') {
        return window.zappyFormatMoney(amount);
      }
      var n = parseFloat(amount);
      if (!isFinite(n)) n = 0;
      var sym = (window.ZAPPY_CURRENCY_SYMBOL || '').trim() || '₪';
      var rate = getCartDisplayExchangeRate();
      try {
        if (window.ZAPPY_MULTI_CURRENCY && window.ZAPPY_MULTI_CURRENCY.enabled) {
          var lang = '';
          try { lang = new URLSearchParams(window.location.search).get('lang') || ''; } catch (e) {}
          if (!lang && window.zappyI18n && typeof window.zappyI18n.getCurrentLanguage === 'function') {
            lang = window.zappyI18n.getCurrentLanguage();
          }
          if (!lang) lang = document.documentElement.getAttribute('lang') || '';
          lang = String(lang).split('-')[0].toLowerCase();
          var langs = window.ZAPPY_MULTI_CURRENCY.languages || {};
          if (lang && langs[lang]) {
            if (langs[lang].symbol) sym = langs[lang].symbol;
          } else if (window.ZAPPY_MULTI_CURRENCY.base && window.ZAPPY_MULTI_CURRENCY.base.symbol) {
            sym = window.ZAPPY_MULTI_CURRENCY.base.symbol;
          }
        }
      } catch (e) {}
      return sym + convertDisplayAmount(n, rate).toFixed(2);
    }

    function getCartDisplayExchangeRate() {
      var rate = 1;
      try {
        if (window.ZAPPY_MULTI_CURRENCY && window.ZAPPY_MULTI_CURRENCY.enabled) {
          var lang = '';
          try { lang = new URLSearchParams(window.location.search).get('lang') || ''; } catch (e) {}
          if (!lang && window.zappyI18n && typeof window.zappyI18n.getCurrentLanguage === 'function') {
            lang = window.zappyI18n.getCurrentLanguage();
          }
          if (!lang) lang = document.documentElement.getAttribute('lang') || '';
          lang = String(lang).split('-')[0].toLowerCase();
          var langs = window.ZAPPY_MULTI_CURRENCY.languages || {};
          if (lang && langs[lang]) {
            var r = parseFloat(langs[lang].exchangeRate);
            if (isFinite(r) && r > 0) rate = r;
          }
        }
      } catch (e) {}
      return rate;
    }

    function parseDisplayedCartAmount(text) {
      var match = String(text || '').match(/-?[\d,.]+/);
      if (!match) return NaN;
      var parsed = parseFloat(match[0].replace(/,/g, ''));
      if (!isFinite(parsed)) return NaN;
      var rate = getCartDisplayExchangeRate();
      return rate > 0 ? Math.abs(parsed) / rate : Math.abs(parsed);
    }

    function getCartTotalTarget(drawer) {
      if (!drawer) return null;
      var totalEl = document.getElementById('cart-drawer-total');
      if (totalEl) return totalEl;
      var legacyTotal = drawer.querySelector('.cart-drawer-total');
      if (!legacyTotal) return null;
      var existingText = legacyTotal.textContent || '';
      var labelMatch = existingText.match(/^([^:]+):/);
      var label = labelMatch ? labelMatch[1].trim() : (window.zappyI18n && window.zappyI18n.t ? window.zappyI18n.t('ecom_total') : 'Total');
      if (!label || label === 'ecom_total') label = existingText.indexOf('סה') !== -1 ? 'סה"כ' : 'Total';
      legacyTotal.innerHTML = '<span>' + label + ':</span><span id="cart-drawer-total">' + formatCartDisplayAmount(0) + '</span>';
      return document.getElementById('cart-drawer-total');
    }

    /** Auto discounts already rendered by updateCartDrawerSummary (bundle, seasonal, customer, etc.). */
    function readDrawerAutoDiscount(totalEl) {
      if (totalEl) {
        var attrDiscount = parseFloat(totalEl.getAttribute('data-zappy-auto-discount'));
        if (isFinite(attrDiscount) && attrDiscount > 0.005) return attrDiscount;
      }

      var subtotalEl = document.getElementById('cart-drawer-subtotal');
      if (subtotalEl && totalEl) {
        var subtotal = parseDisplayedCartAmount(subtotalEl.textContent);
        var renderedTotal = parseDisplayedCartAmount(totalEl.textContent);
        if (isFinite(subtotal) && isFinite(renderedTotal) && subtotal >= renderedTotal) {
          var renderedDiscount = subtotal - renderedTotal;
          if (renderedDiscount > 0.005) return renderedDiscount;
        }
      }

      var discount = 0;
      var discountRows = document.querySelectorAll('#cart-drawer .zappy-cart-discount-row');
      for (var i = 0; i < discountRows.length; i++) {
        var row = discountRows[i];
        if (!row || row.style.display === 'none') continue;
        var valueEl = row.querySelector('span:last-child') || row;
        var amount = parseDisplayedCartAmount(valueEl.textContent);
        if (isFinite(amount)) discount += amount;
      }
      if (discount > 0.005) return discount;

      var bundleRow = document.querySelector('.cart-drawer-bundle-discount');
      if (!bundleRow || bundleRow.style.display === 'none') return 0;
      var bundleEl = document.getElementById('cart-drawer-bundle-discount');
      if (!bundleEl) return 0;
      var bundleAmount = parseDisplayedCartAmount(bundleEl.textContent);
      return isFinite(bundleAmount) ? bundleAmount : 0;
    }

    function patchCartTotals() {
      var drawer = document.getElementById('cart-drawer');
      if (!drawer) return;
      var items = getCartItems();
      if (!items.length) return;
      var totalEl = getCartTotalTarget(drawer);
      var total = 0;
      var priceEls = drawer.querySelectorAll('.cart-item-price, .cart-drawer-item-price');
      items.forEach(function(item, index) {
        var lineTotal = getLineTotal(item);
        total += lineTotal;
        if (priceEls[index]) {
          var nextText = formatCartDisplayAmount(lineTotal);
          if (priceEls[index].textContent !== nextText) {
            priceEls[index].textContent = nextText;
          }
        }
      });
      if (totalEl) {
        var autoDiscount = readDrawerAutoDiscount(totalEl);
        var displayTotal = Math.max(0, total - autoDiscount);
        var nextTotal = formatCartDisplayAmount(displayTotal);
        if (totalEl.textContent !== nextTotal) totalEl.textContent = nextTotal;
      }
    }

    function observeCartTotals() {
      patchCartTotals();
      var drawer = document.getElementById('cart-drawer') || document.body;
      if (!drawer) return;
      var scheduled = false;
      var observer = new MutationObserver(function() {
        if (scheduled) return;
        scheduled = true;
        setTimeout(function() {
          scheduled = false;
          patchCartTotals();
        }, 0);
      });
      observer.observe(drawer, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'complete') {
      setTimeout(observeCartTotals, 250);
    } else {
      window.addEventListener('load', function() { setTimeout(observeCartTotals, 250); });
    }
  })();

  // ===== PRODUCT DETAIL RUNTIME I18N PATCH =====
  // Existing preview product pages can keep source-language labels for stock and
  // variant groups after switching languages. Keep those labels tied to runtime lang.
  (function() {
    var TEXT = {
      en: {
        inStock: 'In Stock',
        outOfStock: 'Out of Stock',
        selectVariant: 'Select option',
        pleaseSelect: 'Please select',
        color: 'Color',
        size: 'Size',
        material: 'Material',
        style: 'Style',
        weight: 'Weight',
        capacity: 'Capacity',
        length: 'Length'
      },
      he: {
        inStock: 'במלאי',
        outOfStock: 'אזל מהמלאי',
        selectVariant: 'בחר אפשרות',
        pleaseSelect: 'נא לבחור',
        color: 'צבע',
        size: 'מידה',
        material: 'חומר',
        style: 'סגנון',
        weight: 'משקל',
        capacity: 'קיבולת',
        length: 'אורך'
      }
    };

    function getLang() {
      if (window.zappyI18n && typeof window.zappyI18n.getCurrentLanguage === 'function') {
        var runtimeLang = String(window.zappyI18n.getCurrentLanguage() || '').split('-')[0].toLowerCase();
        if (runtimeLang) return runtimeLang;
      }
      var htmlLang = String(document.documentElement.lang || '').split('-')[0].toLowerCase();
      if (htmlLang) return htmlLang;
      try {
        var storedLang = String(localStorage.getItem('zappy_lang') || localStorage.getItem('zappy-language') || localStorage.getItem('selectedLanguage') || '').split('-')[0].toLowerCase();
        if (storedLang) return storedLang;
      } catch (e) {}
      return 'en';
    }

    function getText(key) {
      var lang = getLang();
      if (TEXT[lang] && TEXT[lang][key]) return TEXT[lang][key];
      if (window.zappyI18n && typeof window.zappyI18n.t === 'function') {
        var translated = window.zappyI18n.t('ecom_' + key);
        if (translated && translated !== 'ecom_' + key) return translated;
      }
      return (TEXT.en && TEXT.en[key]) || key;
    }

    function getVariantValueTranslation(attr, sourceValue) {
      var product = window.currentProduct;
      var variants = product && Array.isArray(product.variants) ? product.variants : [];
      var lang = getLang();
      function translateKnownColor(rawValue) {
        if (lang !== 'he') return '';
        if (String(attr || '').toLowerCase().indexOf('color') === -1 && String(attr || '').toLowerCase() !== 'colour') return '';
        var raw = String(rawValue == null ? '' : rawValue).trim();
        if (!raw || /[\u0590-\u05FF]/.test(raw)) return '';
        var map = { black:'שחור', white:'לבן', gray:'אפור', grey:'אפור', red:'אדום', green:'ירוק', blue:'כחול', navy:'כחול כהה', pink:'ורוד', purple:'סגול', yellow:'צהוב', orange:'כתום', brown:'חום', beige:'בז׳', gold:'זהב', silver:'כסף', teal:'טורקיז', mint:'מנטה', cream:'קרם', ivory:'שנהב' };
        var direct = map[raw.toLowerCase().replace(/\s+/g, ' ')];
        if (direct) return direct;
        var parts = raw.split(/\s*-\s*/).filter(Boolean);
        if (parts.length > 1) {
          var translated = parts.map(function(part) { return map[String(part).toLowerCase().replace(/\s+/g, ' ')]; });
          if (translated.every(Boolean)) return translated.join('-');
        }
        return '';
      }
      for (var i = 0; i < variants.length; i++) {
        var variant = variants[i];
        var attrs = variant && (variant.attributes_source || variant.attributes || {});
        if (String(attrs[attr]) !== String(sourceValue)) continue;
        var translatedAttrs = variant.attributes_translations && variant.attributes_translations[lang];
        if (translatedAttrs && translatedAttrs[attr]) return translateKnownColor(translatedAttrs[attr]) || translatedAttrs[attr];
        var displayAttrs = variant.attributes_display || {};
        if (displayAttrs[attr]) return translateKnownColor(displayAttrs[attr]) || displayAttrs[attr];
      }
      return translateKnownColor(sourceValue) || sourceValue;
    }

    function patchProductDetailI18n() {
      if (typeof window.getVariantAttributeLabels === 'function' && !window.getVariantAttributeLabels.__zappyRuntimeI18nWrapped) {
        var originalGetVariantAttributeLabels = window.getVariantAttributeLabels;
        window.getVariantAttributeLabels = function(source, t) {
          var labels = originalGetVariantAttributeLabels(source, t) || {};
          ['color', 'size', 'material', 'style', 'weight', 'capacity', 'length'].forEach(function(key) {
            labels[key] = getText(key);
          });
          return labels;
        };
        window.getVariantAttributeLabels.__zappyRuntimeI18nWrapped = true;
      }

      function getVariantGroupLabel(attr) {
        var product = window.currentProduct;
        var t = window.productTranslations || {};
        if (typeof window.getVariantAttributeLabels === 'function' && product) {
          var attrLabels = window.getVariantAttributeLabels(product, t) || {};
          var resolved = attrLabels[attr] || attrLabels[String(attr).toLowerCase()];
          if (resolved) return resolved;
        }
        return getText(String(attr).toLowerCase());
      }

      document.querySelectorAll('.variant-group').forEach(function(group) {
        var attr = group.getAttribute('data-group');
        if (!attr) return;
        var labelText = getVariantGroupLabel(attr);
        var label = group.querySelector('.variant-group-label');
        if (label) {
          var selected = label.querySelector('.variant-selected-value');
          var selectedText = selected ? selected.textContent : '';
          if ((label.textContent || '').trim() !== (labelText + ': ' + selectedText).trim()) {
            label.textContent = labelText + ': ';
            if (selected) label.appendChild(selected);
          }
        }
        group.querySelectorAll('.variant-option').forEach(function(option) {
          var value = option.getAttribute('data-value');
          var translatedValue = getVariantValueTranslation(attr, value);
          if (option.getAttribute('data-display-value') !== translatedValue) option.setAttribute('data-display-value', translatedValue);
          if (option.getAttribute('title') !== translatedValue) option.setAttribute('title', translatedValue);
          if (!option.classList.contains('color-swatch') && option.textContent !== translatedValue) option.textContent = translatedValue;
        });
      });

      var stock = document.getElementById('product-stock-display');
      if (stock) {
        // Three-state: in-stock / out-of-stock / select-required.
        // Also preserve "Please select <Attr>" prompts (ATC validation) — those
        // used to ship with class out-of-stock, and this rewriter then replaced
        // them with "Out of Stock" ~100ms later via MutationObserver.
        var svg = stock.querySelector('svg');
        var current = (stock.textContent || '').trim();
        var please = getText('pleaseSelect');
        var isPleasePrompt = !!(current && (
          current.indexOf(please) === 0
          || /^please select\b/i.test(current)
          || current.indexOf('נא לבחור') === 0
        ));
        var nextText;
        if (isPleasePrompt) {
          nextText = current;
        } else if (stock.classList.contains('select-required')) {
          nextText = (typeof getEcomText === 'function')
            ? getEcomText('selectVariant', getText('selectVariant'))
            : getText('selectVariant');
        } else if (stock.classList.contains('in-stock') && !stock.classList.contains('out-of-stock')) {
          nextText = getText('inStock');
        } else {
          nextText = getText('outOfStock');
        }
        if (current !== nextText) {
          stock.textContent = '';
          if (svg) stock.appendChild(svg);
          stock.appendChild(document.createTextNode(nextText));
        }
      }
    }

    function schedulePatch() {
      setTimeout(patchProductDetailI18n, 100);
      setTimeout(patchProductDetailI18n, 500);
    }

    if (document.readyState === 'complete') {
      schedulePatch();
    } else {
      window.addEventListener('load', schedulePatch);
    }
    if (window.zappyI18n && typeof window.zappyI18n.onLanguageChange === 'function') {
      window.zappyI18n.onLanguageChange(schedulePatch);
    }
    var observer = new MutationObserver(function() { schedulePatch(); });
    if (document.body) observer.observe(document.body, { childList: true, subtree: true });
  })();

  // ===== CHECKOUT RUNTIME I18N PATCH =====
  // Existing generated checkout pages may have Hebrew UI fragments baked into dynamic
  // totals and shipping rows. Patch them from the active runtime language in preview.
  (function() {
    var TEXT = {
      en: {
        agreeToTerms: 'I agree to the',
        termsAndConditions: 'Terms of Use',
        subtotal: 'Subtotal',
        vatIncluded: 'Including VAT',
        shipping: 'Shipping',
        pickup: 'Pickup',
        discount: 'Discount',
        totalToPay: 'Total to Pay',
        days: 'days',
        free: 'Free'
      },
      he: {
        agreeToTerms: 'אני מסכים/ה ל',
        termsAndConditions: 'תנאי השימוש',
        subtotal: 'סכום ביניים',
        vatIncluded: 'כולל מע"מ',
        shipping: 'משלוח',
        pickup: 'איסוף',
        discount: 'הנחה',
        totalToPay: 'סה"כ לתשלום',
        days: 'ימים',
        free: 'חינם'
      }
    };

    function getLang() {
      if (window.zappyI18n && typeof window.zappyI18n.getCurrentLanguage === 'function') {
        var runtimeLang = String(window.zappyI18n.getCurrentLanguage() || '').split('-')[0].toLowerCase();
        if (runtimeLang) return runtimeLang;
      }
      var htmlLang = String(document.documentElement.lang || '').split('-')[0].toLowerCase();
      if (htmlLang) return htmlLang;
      try {
        var storedLang = String(localStorage.getItem('zappy_lang') || '').split('-')[0].toLowerCase();
        if (storedLang) return storedLang;
      } catch (e) {}
      return 'en';
    }

    function getText(key) {
      var lang = getLang();
      return (TEXT[lang] && TEXT[lang][key]) || (TEXT.en && TEXT.en[key]) || '';
    }

    function setLabelForValue(valueSelector, key) {
      var valueEl = document.querySelector(valueSelector);
      if (!valueEl || !valueEl.parentElement) return;
      var labelEl = valueEl.parentElement.querySelector('span:first-child');
      if (labelEl && labelEl !== valueEl) {
        var nextLabel = getText(key) + ':';
        if (labelEl.textContent !== nextLabel) labelEl.textContent = nextLabel;
      }
    }

    function ensureCheckoutTotalsStructure() {
      var rows = document.querySelectorAll('.order-totals-row');
      if (!rows.length) return;
      var specs = [
        { key: 'subtotal', id: 'subtotal', fallback: '₪0' },
        { key: 'vatIncluded', id: 'vat-amount', fallback: '₪0' },
        { key: 'shipping', id: 'shipping-cost', fallback: '₪0' },
        { key: 'discount', id: 'checkout-discount-amount', fallback: '₪0.00' },
        { key: 'totalToPay', id: 'order-total', fallback: '₪0' }
      ];
      specs.forEach(function(spec, index) {
        var row = rows[index];
        if (!row || row.querySelector('#' + spec.id)) return;
        var text = row.textContent || '';
        var valueMatch = text.match(/-?\s*[₪$€£]\s*\d[\d,.]*/);
        var value = valueMatch ? valueMatch[0].replace(/\s+/g, '') : spec.fallback;
        row.innerHTML = '<span data-ecom-label="' + spec.key + '">' + getText(spec.key) + ':</span><span id="' + spec.id + '">' + value + '</span>';
      });
    }

    function parseMoney(value) {
      var normalized = String(value || '').replace(/[^\d.,-]/g, '').replace(/,/g, '');
      var parsed = parseFloat(normalized);
      return isFinite(parsed) ? parsed : 0;
    }

    function getCheckoutDisplaySymbol() {
      var subtotalEl = document.getElementById('subtotal');
      if (subtotalEl) {
        var m = (subtotalEl.textContent || '').match(/^[^\d\s.-]+/);
        if (m && m[0]) return m[0];
      }
      try {
        if (window.ZAPPY_MULTI_CURRENCY && window.ZAPPY_MULTI_CURRENCY.enabled) {
          var lang = getLang();
          var langs = window.ZAPPY_MULTI_CURRENCY.languages || {};
          if (lang && langs[lang] && langs[lang].symbol) return langs[lang].symbol;
          if (window.ZAPPY_MULTI_CURRENCY.base && window.ZAPPY_MULTI_CURRENCY.base.symbol) {
            return window.ZAPPY_MULTI_CURRENCY.base.symbol;
          }
        }
      } catch (e) {}
      return window.ZAPPY_CURRENCY_SYMBOL || '₪';
    }

    function normalizeCheckoutValues() {
      var discountEl = document.getElementById('checkout-discount-amount') || document.getElementById('discount');
      var discountRow = document.getElementById('discount-row') || (discountEl && discountEl.closest('.discount-row, .order-totals-row'));
      if (discountEl && Math.abs(parseMoney(discountEl.textContent)) < 0.005) {
        if (discountRow) discountRow.classList.add('zappy-discount-hidden');
        var sym = getCheckoutDisplaySymbol();
        var zeroDiscountText = sym + '0.00';
        if (discountEl.textContent !== zeroDiscountText) discountEl.textContent = zeroDiscountText;
      } else if (discountRow) {
        discountRow.classList.remove('zappy-discount-hidden');
      }
      var shippingCost = document.getElementById('shipping-cost');
      if (shippingCost && /^(חינם|FREE)$/i.test((shippingCost.textContent || '').trim())) {
        var freeText = getText('free');
        if (shippingCost.textContent !== freeText) shippingCost.textContent = freeText;
      }
    }

    function transliterateKnownAddress(value) {
      if (!value) return '';
      return String(value)
        .replace(/הוד השרון/g, 'Hod Hasharon')
        .replace(/הרדוף/g, 'Harduf');
    }

    function formatPickupAddress(method) {
      var address = method && method.pickup_address;
      if (!address || !address.street) return '';
      var lang = getLang();
      if (address.translations && address.translations[lang]) {
        address = Object.assign({}, address, address.translations[lang]);
      }
      var street = address.street;
      var city = address.city;
      if (lang === 'en') {
        street = transliterateKnownAddress(street);
        city = transliterateKnownAddress(city);
      }
      return [street, city].filter(Boolean).join(', ');
    }

    function isPickupShippingSelected() {
      // Prefer the live checkout flag set by updateOrderTotals / zappySelectShipping.
      if (typeof window.__zappySelectedShippingIsPickup === 'boolean') {
        return window.__zappySelectedShippingIsPickup;
      }
      var checked = document.querySelector('input[name="shipping"]:checked');
      var option = checked
        ? checked.closest('.shipping-option')
        : document.querySelector('.shipping-option.selected');
      if (!option) return false;
      var attr = option.getAttribute('data-is-pickup');
      if (attr === 'true') return true;
      if (attr === 'false') return false;
      if (option.querySelector('.shipping-address')) return true;
      var methodId = (checked && checked.value) || option.getAttribute('data-method-id');
      var cached = window.__zappyShippingMethodsCache;
      if (methodId && Array.isArray(cached)) {
        for (var i = 0; i < cached.length; i++) {
          if (String(cached[i].id) === String(methodId)) return !!cached[i].is_pickup;
        }
      }
      return false;
    }

    function patchCheckoutStaticText() {
      ensureCheckoutTotalsStructure();
      var agree = document.querySelector('[data-i18n="ecom_agreeToTerms"]') || document.querySelector('.terms-checkbox-label > span > span:first-child');
      if (agree && agree.textContent !== getText('agreeToTerms')) agree.textContent = getText('agreeToTerms');
      var terms = document.querySelector('[data-i18n="ecom_termsAndConditions"]') || document.querySelector('.terms-checkbox-label .terms-link');
      if (terms && terms.textContent !== getText('termsAndConditions')) terms.textContent = getText('termsAndConditions');
      setLabelForValue('#subtotal', 'subtotal');
      setLabelForValue('#vat-amount', 'vatIncluded');
      // Must NOT force "Shipping:" over a selected pickup method — the MutationObserver
      // re-runs this after updateOrderTotals sets "Pickup:" and was flipping it back.
      setLabelForValue('#shipping-cost', isPickupShippingSelected() ? 'pickup' : 'shipping');
      setLabelForValue('#checkout-discount-amount', 'discount');
      setLabelForValue('#discount', 'discount');
      setLabelForValue('#order-total', 'totalToPay');
      var shippingCost = document.getElementById('shipping-cost');
      if (shippingCost && /^(חינם|FREE)$/i.test((shippingCost.textContent || '').trim())) {
        shippingCost.textContent = getText('free');
      }
      normalizeCheckoutValues();
    }

    var shippingPatchInFlight = false;
    async function patchShippingMethods() {
      var container = document.getElementById('shipping-methods');
      var websiteId = window.ZAPPY_WEBSITE_ID || (window.CONFIG && window.CONFIG.websiteId);
      if (!container || !websiteId || shippingPatchInFlight) return;
      shippingPatchInFlight = true;
      try {
        var lang = getLang();
        var apiBase = window.ZAPPY_API_BASE || '';
        var res = await fetch(apiBase + '/api/ecommerce/storefront/shipping?websiteId=' + encodeURIComponent(websiteId) + '&lang=' + encodeURIComponent(lang));
        var data = await res.json();
        var methods = data && data.data ? data.data : [];
        window.__zappyShippingMethodsCache = methods;
        methods.forEach(function(method) {
          var block = container.querySelector('.shipping-method-block[data-method-id="' + method.id + '"]');
          if (!block) return;
          var nameEl = block.querySelector('.shipping-name');
          if (nameEl && method.name) nameEl.textContent = method.name;
          var descEl = block.querySelector('.shipping-desc');
          var daysText = method.estimated_days ? String(method.estimated_days) + ' ' + getText('days') : '';
          var description = method.description || '';
          var descText = description && daysText ? description + ' (' + daysText + ')' : (description || daysText);
          if (descEl) {
            descEl.textContent = descText;
          } else if (descText) {
            var info = block.querySelector('.shipping-info');
            if (info) {
              var created = document.createElement('div');
              created.className = 'shipping-desc';
              created.textContent = descText;
              info.appendChild(created);
            }
          }
          var priceEl = block.querySelector('.shipping-price.free');
          if (priceEl) priceEl.textContent = getText('free');
          var addressEl = block.querySelector('.shipping-address');
          var addressText = formatPickupAddress(method);
          if (addressEl && addressText) addressEl.textContent = addressText;
        });
      } catch (e) {
        // Non-blocking compatibility patch.
      } finally {
        shippingPatchInFlight = false;
      }
    }

    function patchCheckoutI18n() {
      patchCheckoutStaticText();
      patchShippingMethods();
      normalizeCheckoutValues();
    }

    var style = document.createElement('style');
    style.id = 'zappy-checkout-runtime-i18n-css';
    style.textContent = '.checkout-order-details .order-totals-row{display:flex!important;justify-content:space-between!important;align-items:baseline!important;gap:12px!important}.checkout-order-details .order-totals-row.zappy-discount-hidden{display:none!important}.checkout-order-details .order-totals-row span:first-child{flex:1 1 auto;min-width:0}.checkout-order-details .order-totals-row span:last-child{flex:0 0 auto;text-align:end}';
    if (!document.getElementById(style.id)) document.head.appendChild(style);

    if (document.readyState === 'complete') {
      setTimeout(patchCheckoutI18n, 300);
    } else {
      window.addEventListener('load', function() { setTimeout(patchCheckoutI18n, 300); });
    }
    setTimeout(patchCheckoutI18n, 1500);
    setTimeout(patchCheckoutI18n, 3500);
    var scheduled = false;
    var observer = new MutationObserver(function() {
      if (scheduled) return;
      scheduled = true;
      setTimeout(function() {
        scheduled = false;
        patchCheckoutStaticText();
      }, 50);
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (window.zappyI18n && typeof window.zappyI18n.onLanguageChange === 'function') {
      window.zappyI18n.onLanguageChange(function() { setTimeout(patchCheckoutI18n, 300); });
    }
  })();

  function reviveCanonicalHeroBackgroundWrappers() {
    try {
      var imgs = document.querySelectorAll('img[data-hero-bg], img[data-hero-background="true"]');
      for (var i = 0; i < imgs.length; i++) {
        var img = imgs[i];
        var parent = img.parentElement;
        while (parent && parent !== document.body && parent.tagName !== 'SECTION') {
          parent.style.display = '';
          parent.removeAttribute('data-zappy-original-bg');
          parent.removeAttribute('data-zappy-preview-hidden');
          parent = parent.parentElement;
        }
        img.removeAttribute('data-zappy-original-bg');
      }
    } catch (e) {}
  }

  function scheduleCanonicalHeroWrapperRevival() {
    reviveCanonicalHeroBackgroundWrappers();
    [100, 500, 1500, 3000, 6000, 10000].forEach(function(delay) {
      setTimeout(reviveCanonicalHeroBackgroundWrappers, delay);
    });
    try {
      if (window.__zappyHeroWrapperRevivalObserver) return;
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var target = mutations[i].target;
          if (!target || !target.querySelector) continue;
          if (
            (target.matches && target.matches('img[data-hero-bg], img[data-hero-background="true"]')) ||
            target.querySelector('img[data-hero-bg], img[data-hero-background="true"]')
          ) {
            reviveCanonicalHeroBackgroundWrappers();
            break;
          }
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'data-zappy-original-bg', 'data-zappy-preview-hidden']
      });
      window.__zappyHeroWrapperRevivalObserver = observer;
      setTimeout(function() {
        try {
          observer.disconnect();
          if (window.__zappyHeroWrapperRevivalObserver === observer) {
            window.__zappyHeroWrapperRevivalObserver = null;
          }
        } catch (e) {}
      }, 15000);
    } catch (e) {}
  }

  scheduleCanonicalHeroWrapperRevival();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleCanonicalHeroWrapperRevival, { once: true });
  }
  window.addEventListener('load', scheduleCanonicalHeroWrapperRevival, { once: true });

})();


/* ZAPPY_ECOM_LANGUAGE_ROUTING_RUNTIME_V25 */
(function() {
  if (window.__zappyEcomLanguageRoutingRuntime >= 25) return;
  window.__zappyEcomLanguageRoutingRuntime = 25;

  // Routing strategy: use path-based language URLs for ALL storefront pages
  // (including dynamic /product/:slug and /category/:slug). The publish
  // pipeline pre-renders /<lang>/product/:slug/index.html with the correct
  // navbar / catalog / lang-switcher baked in, and render.yaml rewrites
  // /<lang>/product/* → that file. The script.js loaded inside is
  // language-aware (reads the active language from the URL prefix) so dynamic
  // labels (Add to Cart, In Stock, etc.) render in the right language too.
  // This eliminates the source-language flash entirely — no runtime
  // translation needed.

  function getPathLang() {
    return (window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/i) || [])[1];
  }

  function getQueryLang() {
    try {
      return new URLSearchParams(window.location.search).get('lang');
    } catch (e) {
      return null;
    }
  }

  function getBakedDefaultLang() {
    try {
      if (typeof window.__zappyDefaultLang === 'string' && window.__zappyDefaultLang) return window.__zappyDefaultLang.toLowerCase();
      if (typeof zappyAdditionalDefaultLanguage === 'string' && zappyAdditionalDefaultLanguage) return zappyAdditionalDefaultLanguage.toLowerCase();
      if (typeof zappyEcomDefaultLanguage === 'string' && zappyEcomDefaultLanguage) return zappyEcomDefaultLanguage.toLowerCase();
    } catch (e) {}
    var htmlLang = document.documentElement.getAttribute('lang');
    return htmlLang ? htmlLang.split('-')[0].toLowerCase() : 'he';
  }

  // Seed the runtime language so any code that reads localStorage / html lang
  // ends up agreeing with the URL the user actually loaded. URLs are the
  // source of truth here:
  //   /<lang>/...   → that prefix language
  //   ?lang=<x>     → that query language (legacy / preview)
  //   /            (no prefix) → site's baked-in default language
  // Without the no-prefix branch, visiting the default-language root with a
  // stale localStorage from an earlier session (e.g. user toggled to English
  // last week) keeps the dynamic catalog/featured/category fetches in the
  // stale language, which is the "catalog menu stays in English on the
  // Hebrew page" bug.
  (function seedLanguageFromUrl() {
    var urlLang = getQueryLang() || getPathLang() || getBakedDefaultLang();
    if (!urlLang) return;
    urlLang = String(urlLang).split('-')[0].toLowerCase();
    try {
      localStorage.setItem('zappy_lang', urlLang);
      localStorage.setItem('zappy-language', urlLang);
      localStorage.setItem('selectedLanguage', urlLang);
      localStorage.setItem('language', urlLang);
    } catch (e) {}
    document.documentElement.setAttribute('lang', urlLang);
    document.documentElement.setAttribute('dir', urlLang === 'he' || urlLang === 'ar' || urlLang === 'iw' ? 'rtl' : 'ltr');
  })();

  // Backward-compat soft redirect: any in-flight bookmarks / external links of
  // the form /product/<slug>?lang=en (issued by older builds) get rewritten
  // immediately to the path-based equivalent /en/product/<slug>. Done before
  // the rest of the runtime so the user lands on the correct pre-rendered HTML
  // instead of seeing the source-language navbar flash. Skipped when we are
  // already on a language-prefixed path (no redirect loop).
  (function softRedirectQueryLangToPath() {
    var queryLang = getQueryLang();
    if (!queryLang) return;
    var pathLang = getPathLang();
    if (pathLang) return;
    var path = window.location.pathname || '';
    if (!/^\/(product|category)(?:\/|$)/i.test(path)) return;
    try {
      var url = new URL(window.location.href);
      url.searchParams.delete('lang');
      var nextPath = '/' + queryLang.toLowerCase() + path;
      var nextHref = url.origin + nextPath + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
      window.location.replace(nextHref);
    } catch (e) {}
  })();

  function getLang() {
    try {
      if (window.zappyI18n && typeof window.zappyI18n.getCurrentLanguage === 'function') {
        var i18nLang = window.zappyI18n.getCurrentLanguage();
        if (i18nLang) return String(i18nLang).split('-')[0].toLowerCase();
      }
      if (window.zappyI18n && window.zappyI18n.language) {
        return String(window.zappyI18n.language).split('-')[0].toLowerCase();
      }
    } catch (e) {}
    var queryLang = getQueryLang();
    if (queryLang) return queryLang.toLowerCase();
    var pathLang = getPathLang();
    if (pathLang) return pathLang.toLowerCase();
    var htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) return htmlLang.split('-')[0].toLowerCase();
    try {
      var stored = localStorage.getItem('zappy_lang') || localStorage.getItem('zappy-language') || localStorage.getItem('selectedLanguage') || localStorage.getItem('language');
      if (stored) return String(stored).split('-')[0].toLowerCase();
    } catch (e) {}
    return '';
  }

  function getDefaultLang() {
    // Must mirror getBakedDefaultLang() so buildPath() agrees with the
    // zappyAdditionalDefaultLanguage / zappyEcomDefaultLanguage baked at
    // generation time. A hardcoded 'he' fallback here caused English-only
    // sites (post language removal) to rewrite /products → /en/products.
    return getBakedDefaultLang();
  }

  function buildPath(path) {
    if (!path || /^https?:\/\//i.test(path) || path.charAt(0) === '#') return path;
    var normalized = path.charAt(0) === '/' ? path : '/' + path;
    var lang = getLang();
    var defaultLang = getDefaultLang();
    if (!lang || lang === defaultLang) return normalized.replace(/^\/[a-z]{2}(?=\/)/i, '');
    // Always use path-based language prefix — including dynamic
    // /product/:slug + /category/:slug, which the publish pipeline serves via
    // pre-rendered /<lang>/<base>/:slug/index.html. No more ?lang= query.
    var withoutLang = normalized.replace(/^\/[a-z]{2}(?=\/)/i, '');
    var prefix = '/' + lang;
    return withoutLang === prefix || withoutLang.indexOf(prefix + '/') === 0 ? withoutLang : prefix + withoutLang;
  }

  function isStorefrontPath(href) {
    // Includes the static account/login/cart/checkout pages (in addition to
    // product/category/products) so the navbar login/account icon, the
    // "please sign in" CTA, etc. keep the active language prefix — otherwise
    // an English shopper clicking the account icon lands on the unprefixed
    // default-language /account static file (Hebrew navbar + footer + body).
    return /^\/(?:[a-z]{2}\/)?(?:product|category|products|account|login|cart|checkout)(?:\/|\?|#|$)/i.test(href || '');
  }

  function patchLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('a[href]').forEach(function(anchor) {
      var href = anchor.getAttribute('href');
      if (!isStorefrontPath(href)) return;
      var next = buildPath(href);
      if (href !== next) anchor.setAttribute('href', next);
    });
  }

  function ensureProductsChevron() {
    var trigger = document.querySelector('.zappy-products-dropdown > a');
    if (!trigger) return;
    trigger.setAttribute('href', buildPath('/products'));
    if (trigger.querySelector('svg.dropdown-arrow')) return;
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'dropdown-arrow');
    svg.setAttribute('width', '12');
    svg.setAttribute('height', '12');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9l6 6 6-6');
    svg.appendChild(path);
    trigger.appendChild(document.createTextNode(' '));
    trigger.appendChild(svg);
  }

  // On mobile the inline chevron (rendered inside the <a>) is unusable: tapping
  // it just navigates to /products instead of expanding the submenu, and it sits
  // hugged to the link text instead of on the far side of the row. The
  // generation pipelines for e-commerce per-language pages do not inject the
  // shared initMobileSubmenuToggles helper, so we own that here. Below 768px
  // we materialise a dedicated <button class="mobile-submenu-toggle"> as a
  // sibling of the link; existing styles.css already styles its chevron and
  // expands .sub-menu.mobile-expanded, and our V5 ensureRuntimeCssInjected
  // pins the button to the far edge of the row (right in LTR, left in RTL).
  // Above 768px we tear it back down so the desktop hover dropdown is intact.
  function ensureMobileSubmenuToggles() {
    var isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;

    if (!isMobile) {
      document.querySelectorAll('.mobile-submenu-toggle[data-zappy-runtime="ecom-routing"]').forEach(function(btn) {
        btn.remove();
      });
      document.querySelectorAll('.sub-menu.mobile-expanded').forEach(function(menu) {
        menu.classList.remove('mobile-expanded');
      });
      document.querySelectorAll('.zappy-products-dropdown > a > svg.dropdown-arrow[data-zappy-mobile-hidden="1"]').forEach(function(arrow) {
        arrow.style.display = '';
        arrow.removeAttribute('data-zappy-mobile-hidden');
      });
      return;
    }

    var dropdowns = document.querySelectorAll('.zappy-products-dropdown, .menu-item-has-children, .nav-menu li:has(> .sub-menu), nav li:has(> .sub-menu)');
    dropdowns.forEach(function(li) {
      if (!li || !li.querySelector) return;
      var submenu = li.querySelector(':scope > .sub-menu');
      var trigger = li.querySelector(':scope > a') || li.querySelector(':scope > .menu-group-title');
      if (!submenu || !trigger) return;

      // Hide the inline SVG chevron on mobile so we don't render two chevrons.
      var inlineArrow = trigger.querySelector('svg.dropdown-arrow');
      if (inlineArrow && !inlineArrow.hasAttribute('data-zappy-mobile-hidden')) {
        inlineArrow.style.display = 'none';
        inlineArrow.setAttribute('data-zappy-mobile-hidden', '1');
      }

      var btn = li.querySelector(':scope > .mobile-submenu-toggle');
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-submenu-toggle';
        btn.setAttribute('aria-label', 'Toggle submenu');
        trigger.insertAdjacentElement('afterend', btn);
      }
      btn.setAttribute('aria-expanded', submenu.classList.contains('mobile-expanded') ? 'true' : 'false');
      btn.setAttribute('data-zappy-runtime', 'ecom-routing');

      if (btn.getAttribute('data-zappy-runtime-bound') === '1') return;
      btn.setAttribute('data-zappy-runtime-bound', '1');

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

        // Close any other open submenus so only one is open at a time.
        document.querySelectorAll('.sub-menu.mobile-expanded').forEach(function(other) {
          if (other === submenu) return;
          other.classList.remove('mobile-expanded');
          var otherBtn = other.parentElement && other.parentElement.querySelector(':scope > .mobile-submenu-toggle');
          if (otherBtn) {
            otherBtn.classList.remove('expanded');
            otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        var willOpen = !submenu.classList.contains('mobile-expanded');
        submenu.classList.toggle('mobile-expanded', willOpen);
        btn.classList.toggle('expanded', willOpen);
        btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        normalizeMobileSubmenuLayout();
      }, true);
    });
    normalizeMobileSubmenuLayout();
  }

  function setImportant(el, prop, value) {
    if (!el || !el.style || !el.style.setProperty) return;
    el.style.setProperty(prop, value, 'important');
  }

  function normalizeMobileSubmenuLayout() {
    var isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : window.innerWidth <= 768;
    if (!isMobile) return;
    var isRtl = (document.documentElement.getAttribute('dir') || document.body.getAttribute('dir')) === 'rtl';
    document.querySelectorAll('.nav-menu li:has(> .sub-menu), nav li:has(> .sub-menu), .navbar li:has(> .sub-menu)').forEach(function(li) {
      var submenu = li.querySelector(':scope > .sub-menu');
      var trigger = li.querySelector(':scope > a') || li.querySelector(':scope > .menu-group-title');
      var btn = li.querySelector(':scope > .mobile-submenu-toggle');
      if (!submenu || !trigger || !btn) return;

      // Keep the layout direction LTR even on RTL pages. Flexbox otherwise
      // places the full-width submenu from the right edge and clips it outside
      // the mobile drawer; text direction is restored on the children below.
      setImportant(li, 'direction', 'ltr');
      setImportant(li, 'display', 'flex');
      setImportant(li, 'flex-wrap', 'wrap');
      setImportant(li, 'align-items', 'flex-start');
      setImportant(li, 'width', '100%');
      setImportant(li, 'max-width', '100%');
      setImportant(li, 'min-width', '0');
      setImportant(li, 'overflow', 'visible');
      setImportant(li, 'box-sizing', 'border-box');

      // Match ensureMobileNavMenuItemPadding (12px 16px / 44px tap target).
      // Legacy padding-inline:8px + CSS padding:0 on .menu-group-title
      // squashed group labels (סיום והעברות / בלוג) vs sibling <a> rows.
      setImportant(trigger, 'display', 'flex');
      setImportant(trigger, 'align-items', 'center');
      setImportant(trigger, 'direction', isRtl ? 'rtl' : 'ltr');
      setImportant(trigger, 'flex', '1 1 0');
      setImportant(trigger, 'min-width', '0');
      setImportant(trigger, 'max-width', 'calc(100% - 48px)');
      setImportant(trigger, 'width', 'auto');
      setImportant(trigger, 'box-sizing', 'border-box');
      setImportant(trigger, 'white-space', 'normal');
      setImportant(trigger, 'overflow-wrap', 'anywhere');
      setImportant(trigger, 'padding', '12px 16px');
      setImportant(trigger, 'min-height', '44px');
      setImportant(trigger, 'line-height', '1.4');
      setImportant(trigger, 'font-weight', '600');
      setImportant(trigger, 'text-align', isRtl ? 'right' : 'left');
      setImportant(trigger, 'order', isRtl ? '2' : '1');

      // Open mobile drawer: paint .menu-group-title like sibling links.
      // Scrolled-nav CSS often sets titles to --frosted-text (near-black),
      // which is invisible on the dark full-bleed panel (Dubai Plus 2026-07).
      var menuRoot = li.closest('.nav-menu, #navMenu');
      if (menuRoot && (menuRoot.classList.contains('active') || menuRoot.classList.contains('open'))) {
        var sampleLink = menuRoot.querySelector(':scope > li > a');
        var linkColor = '';
        try { linkColor = sampleLink ? (window.getComputedStyle(sampleLink).color || '') : ''; } catch (e) {}
        if (!linkColor || linkColor === 'rgba(0, 0, 0, 0)') {
          try {
            linkColor = (window.getComputedStyle(menuRoot).getPropertyValue('--nav-text') || '').trim()
              || (window.getComputedStyle(document.documentElement).getPropertyValue('--nav-text') || '').trim()
              || '#fff7ed';
          } catch (e2) { linkColor = '#fff7ed'; }
        }
        setImportant(trigger, 'color', linkColor);
      }

      setImportant(btn, 'display', 'flex');
      setImportant(btn, 'position', 'static');
      setImportant(btn, 'flex', '0 0 48px');
      setImportant(btn, 'width', '48px');
      setImportant(btn, 'height', '44px');
      setImportant(btn, 'min-height', '44px');
      setImportant(btn, 'align-items', 'center');
      setImportant(btn, 'justify-content', 'center');
      setImportant(btn, 'margin', '0');
      setImportant(btn, 'padding', '0');
      setImportant(btn, 'background', 'transparent');
      setImportant(btn, 'border', 'none');
      setImportant(btn, 'order', isRtl ? '1' : '2');

      setImportant(submenu, 'order', '3');
      setImportant(submenu, 'direction', isRtl ? 'rtl' : 'ltr');
      setImportant(submenu, 'text-align', isRtl ? 'right' : 'left');
      setImportant(submenu, 'flex', '0 0 100%');
      setImportant(submenu, 'width', '100%');
      setImportant(submenu, 'min-width', '0');
      setImportant(submenu, 'max-width', '100%');
      setImportant(submenu, 'box-sizing', 'border-box');
      setImportant(submenu, 'margin', '0');
      setImportant(submenu, 'transform', 'none');
      setImportant(submenu, 'left', 'auto');
      setImportant(submenu, 'right', 'auto');
      setImportant(submenu, 'inset-inline-start', 'auto');
      setImportant(submenu, 'inset-inline-end', 'auto');
      if (submenu.classList.contains('mobile-expanded')) {
        setImportant(submenu, 'padding', '8px 0');
      }

      submenu.querySelectorAll('a, .menu-group-title').forEach(function(item) {
        var parentItem = item.closest && item.closest('li');
        setImportant(item, 'display', 'block');
        setImportant(item, 'direction', isRtl ? 'rtl' : 'ltr');
        setImportant(item, 'width', '100%');
        setImportant(item, 'min-width', '0');
        setImportant(item, 'max-width', '100%');
        setImportant(item, 'box-sizing', 'border-box');
        setImportant(item, 'white-space', 'normal');
        setImportant(item, 'overflow-wrap', 'anywhere');
        setImportant(item, 'padding', '10px 8px');
        setImportant(item, 'text-align', isRtl ? 'right' : 'left');
        if (parentItem && parentItem.classList && parentItem.classList.contains('zappy-nav-parent')) {
          setImportant(item, 'font-weight', '700');
        }
        if (parentItem && parentItem.classList && parentItem.classList.contains('zappy-nav-child')) {
          setImportant(item, 'padding-left', isRtl ? '16px' : '36px');
          setImportant(item, 'padding-right', isRtl ? '36px' : '16px');
          setImportant(item, 'font-size', '0.94em');
          setImportant(item, 'opacity', '0.85');
        }
      });
    });
  }

  function scheduleMobileSubmenuRefresh() {
    [0, 60, 160, 320, 700, 1200, 2200].forEach(function(delay) {
      setTimeout(function() {
        ensureMobileSubmenuToggles();
        normalizeMobileSubmenuLayout();
      }, delay);
    });
  }

  function installMobileMenuRefreshHooks() {
    if (window.__zappyMobileSubmenuRefreshHooksInstalled) return;
    window.__zappyMobileSubmenuRefreshHooksInstalled = true;

    document.addEventListener('click', function(e) {
      var target = e.target && e.target.closest && e.target.closest(
        '.mobile-toggle,.menu-toggle,.hamburger,.navbar-toggle,.mobile-submenu-toggle,[aria-label="תפריט"],[aria-label="Menu"],[aria-label="menu"]'
      );
      if (target) scheduleMobileSubmenuRefresh();
    }, true);

    if (!window.MutationObserver) return;
    var observeNav = function() {
      var nav = document.getElementById('navMenu') || document.querySelector('.nav-menu');
      if (!nav || nav.getAttribute('data-zappy-mobile-submenu-observed') === '1') return;
      nav.setAttribute('data-zappy-mobile-submenu-observed', '1');
      var handleMutations = function(mutations) {
        var shouldRefresh = mutations.some(function(mutation) {
          if (mutation.type === 'attributes') return mutation.attributeName === 'class' || mutation.attributeName === 'style';
          return Array.prototype.some.call(mutation.addedNodes || [], function(node) {
            return node.nodeType === 1 && (
              node.classList && node.classList.contains('mobile-submenu-toggle')
              || node.querySelector && node.querySelector('.mobile-submenu-toggle')
            );
          });
        });
        if (shouldRefresh) scheduleMobileSubmenuRefresh();
      };
      var navObserver = new MutationObserver(handleMutations);
      navObserver.observe(nav, { attributes: true, attributeFilter: ['class', 'style'], childList: true });
      var childObserver = new MutationObserver(handleMutations);
      childObserver.observe(nav, { childList: true, subtree: true });
    };
    observeNav();
    setTimeout(observeNav, 500);
  }

  var __zappyMobileSubmenuResizeTimer = null;
  window.addEventListener('resize', function() {
    if (__zappyMobileSubmenuResizeTimer) clearTimeout(__zappyMobileSubmenuResizeTimer);
    __zappyMobileSubmenuResizeTimer = setTimeout(ensureMobileSubmenuToggles, 200);
  }, { passive: true });

  function patchCatalogDirection() {
    var catalog = document.getElementById('zappy-catalog-menu');
    if (!catalog) return;
    var dir = document.documentElement.getAttribute('dir') || (getLang() === 'he' ? 'rtl' : 'ltr');
    catalog.classList.toggle('rtl', dir === 'rtl');
    catalog.classList.toggle('ltr', dir !== 'rtl');
    catalog.setAttribute('dir', dir);
    catalog.querySelectorAll('.catalog-menu-item, .sub-menu').forEach(function(el) {
      el.setAttribute('dir', dir);
    });
  }

  // Inject the small CSS rules we need at runtime. Doing this from JS instead of
  // a separate CSS ensure step makes us robust to clean-css comment stripping +
  // declaration merging that was eating the standalone CSS injection.
  function ensureRuntimeCssInjected() {
    var existing = document.getElementById('zappy-ecom-routing-runtime-css');
    if (existing && existing.getAttribute('data-v') === '30') return;
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = 'zappy-ecom-routing-runtime-css';
    style.setAttribute('data-zappy-runtime', 'ecom-routing');
    style.setAttribute('data-v', '30');
    style.textContent =
      '@media (min-width: 769px){' +
        'html[dir="ltr"] .nav-container > .nav-brand,body[dir="ltr"] .nav-container > .nav-brand,html[dir="ltr"] .nav-right-group > .nav-brand,body[dir="ltr"] .nav-right-group > .nav-brand{order:-1!important}' +
        'html[dir="ltr"] .nav-container > .nav-menu,body[dir="ltr"] .nav-container > .nav-menu,html[dir="ltr"] .nav-right-group > .nav-menu,body[dir="ltr"] .nav-right-group > .nav-menu{order:1!important;margin-inline-start:0!important;flex:1 1 0!important;min-width:0!important;overflow:visible!important;align-items:center!important}' +
        'html[dir="ltr"] .nav-container > .nav-menu > li,body[dir="ltr"] .nav-container > .nav-menu > li,html[dir="ltr"] .nav-right-group > .nav-menu > li,body[dir="ltr"] .nav-right-group > .nav-menu > li{flex:0 0 auto!important}' +
        'html[dir="ltr"] .nav-container > .lang-switcher,body[dir="ltr"] .nav-container > .lang-switcher,html[dir="ltr"] .nav-container > .nav-ecommerce-icons,body[dir="ltr"] .nav-container > .nav-ecommerce-icons,html[dir="ltr"] .nav-container > .nav-cta-container,body[dir="ltr"] .nav-container > .nav-cta-container,html[dir="ltr"] .nav-right-group > .lang-switcher,body[dir="ltr"] .nav-right-group > .lang-switcher,html[dir="ltr"] .nav-right-group > .nav-ecommerce-icons,body[dir="ltr"] .nav-right-group > .nav-ecommerce-icons,html[dir="ltr"] .nav-right-group > .nav-cta-container,body[dir="ltr"] .nav-right-group > .nav-cta-container{order:2!important;flex:0 0 auto!important;min-width:max-content!important}' +
        'html[dir="ltr"] .nav-container > .nav-ecommerce-icons.nav-icons-left,body[dir="ltr"] .nav-container > .nav-ecommerce-icons.nav-icons-left,html[dir="ltr"] .nav-right-group > .nav-ecommerce-icons.nav-icons-left,body[dir="ltr"] .nav-right-group > .nav-ecommerce-icons.nav-icons-left{margin-inline-start:auto!important;flex:0 0 auto!important;min-width:max-content!important}' +
        'html[dir="rtl"] .nav-container > .nav-menu,body[dir="rtl"] .nav-container > .nav-menu,html[dir="rtl"] .nav-right-group > .nav-menu,body[dir="rtl"] .nav-right-group > .nav-menu{flex:1 1 0!important;min-width:0!important;overflow:visible!important;align-items:center!important}' +
        'html[dir="rtl"] .nav-container > .nav-menu > li,body[dir="rtl"] .nav-container > .nav-menu > li,html[dir="rtl"] .nav-right-group > .nav-menu > li,body[dir="rtl"] .nav-right-group > .nav-menu > li{flex:0 0 auto!important}' +
        'html[dir="rtl"] .nav-container > .nav-ecommerce-icons,body[dir="rtl"] .nav-container > .nav-ecommerce-icons,html[dir="rtl"] .nav-right-group > .nav-ecommerce-icons,body[dir="rtl"] .nav-right-group > .nav-ecommerce-icons,html[dir="rtl"] .nav-container > .nav-ecommerce-icons.nav-icons-left,body[dir="rtl"] .nav-container > .nav-ecommerce-icons.nav-icons-left,html[dir="rtl"] .nav-right-group > .nav-ecommerce-icons.nav-icons-left,body[dir="rtl"] .nav-right-group > .nav-ecommerce-icons.nav-icons-left{flex:0 0 auto!important;min-width:max-content!important}' +
        'html[dir="ltr"] .nav-search-btn,body[dir="ltr"] .nav-search-btn{position:absolute!important;left:auto!important;right:4px!important}' +
        'html[dir="ltr"] .nav-search-input,body[dir="ltr"] .nav-search-input,html[dir="ltr"] .nav-search-box input,body[dir="ltr"] .nav-search-box input{direction:ltr!important;text-align:left!important;padding-left:14px!important;padding-right:40px!important}' +
        '.nav-right-group>.nav-menu,.nav-container>.nav-menu{min-width:0!important;flex-shrink:1!important}' +
        'html[dir="ltr"] .zappy-products-dropdown > a .dropdown-arrow,body[dir="ltr"] .zappy-products-dropdown > a .dropdown-arrow{display:inline-block!important;flex:0 0 auto!important;margin-inline-start:6px!important}' +
        'html[dir="ltr"] .zappy-catalog-menu,html[dir="ltr"] .zappy-catalog-menu .catalog-menu-container,html[dir="ltr"] .zappy-catalog-menu .catalog-menu-categories{direction:ltr!important}' +
        'html[dir="ltr"] .zappy-catalog-menu .catalog-menu-container{align-items:flex-start!important}' +
        'html[dir="ltr"] .zappy-catalog-menu .catalog-menu-categories{display:flex!important;align-items:flex-start!important;align-content:flex-start!important;row-gap:4px!important;column-gap:2px!important}' +
        'html[dir="ltr"] .zappy-catalog-menu .catalog-menu-item{padding-inline:10px!important}' +
        'html[dir="ltr"] .zappy-catalog-menu .catalog-menu-all{margin-top:0!important;align-self:flex-start!important}' +
        '.navbar .nav-menu>li:has(>.sub-menu),nav.navbar .nav-menu>li:has(>.sub-menu),#navMenu>li:has(>.sub-menu){position:relative!important}' +
        /* Desktop flyouts: wrap long labels (Hebrew kosher titles etc). nowrap +
           overflow-x:hidden + max-width:280px clipped mid-sentence (2026-07). */
        '.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu,nav.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu,#navMenu>li:not(.zappy-nav-more-item)>.sub-menu{display:block!important;position:absolute!important;top:100%!important;inset-inline-start:0!important;inset-inline-end:auto!important;min-width:220px!important;max-width:min(420px,calc(100vw - 24px))!important;width:max-content!important;max-height:calc(100vh - 150px)!important;overflow-x:hidden!important;overflow-y:auto!important;border-radius:12px!important;box-shadow:0 8px 30px rgba(0,0,0,.15),0 2px 8px rgba(0,0,0,.06)!important;padding:8px!important;margin:0!important;list-style:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(6px)!important;z-index:100001!important;box-sizing:border-box!important}' +
        '.navbar .nav-menu>li:not(.zappy-nav-more-item):hover>.sub-menu,.navbar .nav-menu>li:not(.zappy-nav-more-item):focus-within>.sub-menu,nav.navbar .nav-menu>li:not(.zappy-nav-more-item):hover>.sub-menu,nav.navbar .nav-menu>li:not(.zappy-nav-more-item):focus-within>.sub-menu,#navMenu>li:not(.zappy-nav-more-item):hover>.sub-menu,#navMenu>li:not(.zappy-nav-more-item):focus-within>.sub-menu{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0)!important}' +
        '.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu>li,nav.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu>li,#navMenu>li:not(.zappy-nav-more-item)>.sub-menu>li{display:block!important;width:100%!important;list-style:none!important;margin:0!important;padding:0!important}' +
        '.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu a,nav.navbar .nav-menu>li:not(.zappy-nav-more-item)>.sub-menu a,#navMenu>li:not(.zappy-nav-more-item)>.sub-menu a{display:block!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;max-width:100%!important;padding:10px 16px!important;border-radius:8px!important;text-decoration:none!important;box-sizing:border-box!important}' +
        '.nav-menu .zappy-products-dropdown>.sub-menu,#navMenu .zappy-products-dropdown>.sub-menu{left:50%!important;right:auto!important;transform:translateX(-50%) translateY(8px)!important}' +
        '.nav-menu .zappy-products-dropdown:hover>.sub-menu,#navMenu .zappy-products-dropdown:hover>.sub-menu,.nav-menu .zappy-products-dropdown:focus-within>.sub-menu,#navMenu .zappy-products-dropdown:focus-within>.sub-menu{transform:translateX(-50%) translateY(0)!important}' +
        '.nav-menu.zappy-desktop-wrap,#navMenu.zappy-desktop-wrap{flex-wrap:wrap!important;max-height:44px!important;align-content:flex-start!important;row-gap:4px!important}' +
      '}' +
      '@media (max-width:768px){' +
        '.nav-menu li:has(.sub-menu),.navbar li:has(.sub-menu),nav li:has(.sub-menu){direction:ltr!important;display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;max-width:100%!important;width:100%!important;overflow:visible!important;box-sizing:border-box!important}' +
        // Beat any ".nav-menu.active > li { display:block }" (preview/generated)
        // so non-products dropdowns keep the chevron beside the label.
        '.navbar .nav-menu.active>li:has(>.sub-menu),nav.navbar .nav-menu.active>li:has(>.sub-menu),#navMenu.active>li:has(>.sub-menu),.nav-menu.open>li:has(>.sub-menu),.navbar .nav-menu.active>li.menu-item-has-children,nav.navbar .nav-menu.active>li.menu-item-has-children,#navMenu.active>li.menu-item-has-children,.nav-menu.open>li.menu-item-has-children{display:flex!important;flex-wrap:wrap!important;align-items:center!important;position:relative!important}' +
        '.nav-menu li:has(.sub-menu)>a,.navbar li:has(.sub-menu)>a,nav li:has(.sub-menu)>a,li:has(.sub-menu)>.menu-group-title{display:flex!important;align-items:center!important;flex:1 1 0!important;order:1!important;width:auto!important;min-width:0!important;max-width:calc(100% - 48px)!important;padding:12px 16px!important;min-height:44px!important;box-sizing:border-box!important;white-space:normal!important;overflow-wrap:anywhere!important;line-height:1.4!important;font-weight:600!important;text-align:left!important;direction:ltr!important}' +
        /* Open drawer: beat .navbar.scrolled frosted-text on .menu-group-title
           (dark-on-dark missing labels on non-home pages). */
        '.navbar .nav-menu.active>li>.menu-group-title,.navbar #navMenu.active>li>.menu-group-title,.nav-menu.open>li>.menu-group-title,html body .navbar.scrolled .nav-menu.active>li>.menu-group-title,html body .navbar.scrolled #navMenu.active>li>.menu-group-title{color:var(--nav-text,var(--text-light,#fff7ed))!important}' +
        'html[dir="rtl"] .nav-menu li:has(.sub-menu)>a,body[dir="rtl"] .nav-menu li:has(.sub-menu)>a,html[dir="rtl"] .navbar li:has(.sub-menu)>a,body[dir="rtl"] .navbar li:has(.sub-menu)>a,html[dir="rtl"] nav li:has(.sub-menu)>a,body[dir="rtl"] nav li:has(.sub-menu)>a,html[dir="rtl"] li:has(.sub-menu)>.menu-group-title,body[dir="rtl"] li:has(.sub-menu)>.menu-group-title{direction:rtl!important;text-align:right!important;order:2!important}' +
        '.nav-menu li:has(.sub-menu)>.mobile-submenu-toggle,.navbar li:has(.sub-menu)>.mobile-submenu-toggle,nav li:has(.sub-menu)>.mobile-submenu-toggle{display:flex!important;position:static!important;flex:0 0 48px!important;order:2!important;width:48px!important;height:44px!important;min-height:44px!important;align-items:center!important;justify-content:center!important;z-index:5!important;pointer-events:auto!important;margin:0!important;padding:0!important;background:transparent!important;border:none!important}' +
        'html[dir="rtl"] .nav-menu li:has(.sub-menu)>.mobile-submenu-toggle,body[dir="rtl"] .nav-menu li:has(.sub-menu)>.mobile-submenu-toggle,html[dir="rtl"] .navbar li:has(.sub-menu)>.mobile-submenu-toggle,body[dir="rtl"] .navbar li:has(.sub-menu)>.mobile-submenu-toggle,html[dir="rtl"] nav li:has(.sub-menu)>.mobile-submenu-toggle,body[dir="rtl"] nav li:has(.sub-menu)>.mobile-submenu-toggle{order:1!important}' +
        '.nav-menu li:has(.sub-menu)>.sub-menu,.navbar li:has(.sub-menu)>.sub-menu,nav li:has(.sub-menu)>.sub-menu{order:3!important;flex:0 0 100%!important;width:100%!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;margin:0!important;transform:none!important;left:auto!important;right:auto!important;inset-inline-start:auto!important;inset-inline-end:auto!important}' +
        '.nav-menu .sub-menu.mobile-expanded,.navbar .sub-menu.mobile-expanded,nav .sub-menu.mobile-expanded{padding:8px 0!important}' +
        '.sub-menu a,.sub-menu .menu-group-title{display:block!important;width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important;min-width:0!important;max-width:100%!important;box-sizing:border-box!important;padding:10px 8px!important}' +
        '.zappy-products-dropdown>.sub-menu .zappy-nav-parent>a,.zappy-products-dropdown>.sub-menu .zappy-nav-parent>.menu-group-title{font-weight:700!important}' +
        '.zappy-products-dropdown>.sub-menu .zappy-nav-child>a,.zappy-products-dropdown>.sub-menu .zappy-nav-child>.menu-group-title{padding-left:36px!important;padding-right:16px!important;font-size:.94em!important;opacity:.85!important}' +
        'html[dir="rtl"] .zappy-products-dropdown>.sub-menu .zappy-nav-child>a,body[dir="rtl"] .zappy-products-dropdown>.sub-menu .zappy-nav-child>a,html[dir="rtl"] .zappy-products-dropdown>.sub-menu .zappy-nav-child>.menu-group-title,body[dir="rtl"] .zappy-products-dropdown>.sub-menu .zappy-nav-child>.menu-group-title{padding-left:16px!important;padding-right:36px!important}' +
      '}';
    (document.head || document.documentElement).appendChild(style);
  }

  function tuneDesktopNavWrapping() {
    if (window.innerWidth <= 768) return;
    // The "More" overflow runtime (ZAPPY_NAV_OVERFLOW_MENU_V1) fully supersedes
    // the legacy two-line wrapping: it collapses overflowing items into a
    // "More" dropdown and strips zappy-desktop-wrap on every reflow. When it is
    // active we MUST NOT re-add the wrap class here — this patch() pass runs at
    // 1500ms, AFTER the overflow runtime's final reflow (1200ms), and nothing
    // reflows the overflow menu again, so re-adding zappy-desktop-wrap would
    // regress the desktop nav to the clipped/wrapped layout permanently. Defer
    // entirely: strip any stale class and let the overflow runtime own overflow.
    if (window.__zappyNavOverflowInit) {
      document.querySelectorAll('.nav-menu.zappy-desktop-wrap, #navMenu.zappy-desktop-wrap').forEach(function(menu) {
        menu.classList.remove('zappy-desktop-wrap');
      });
      return;
    }
    document.querySelectorAll('.nav-container > .nav-menu, .nav-right-group > .nav-menu, .nav-container > #navMenu, .nav-right-group > #navMenu').forEach(function(menu) {
      if (!menu || !menu.querySelectorAll) return;
      menu.classList.remove('zappy-desktop-wrap');

      var styles = window.getComputedStyle(menu);
      var gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      var items = Array.prototype.filter.call(menu.children || [], function(child) {
        return child && child.nodeType === 1 && child.tagName !== 'SCRIPT' && child.tagName !== 'STYLE';
      });
      if (items.length < 2) return;

      var required = items.reduce(function(total, item) {
        return total + item.getBoundingClientRect().width;
      }, 0) + (items.length - 1) * gap;

      // A tiny tolerance prevents sub-pixel/browser-font differences from
      // wrapping a menu that visually fits in the editor preview.
      if (required > menu.getBoundingClientRect().width + 8) {
        menu.classList.add('zappy-desktop-wrap');
      }
    });
  }

  function patch() {
    ensureRuntimeCssInjected();
    installMobileMenuRefreshHooks();
    patchLinks(document);
    ensureProductsChevron();
    ensureMobileSubmenuToggles();
    patchCatalogDirection();
    tuneDesktopNavWrapping();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patch);
  } else {
    patch();
  }
  window.addEventListener('popstate', function() { setTimeout(patch, 0); });
  window.addEventListener('zappy:languageChanged', function() { setTimeout(patch, 0); });
  window.addEventListener('languageChanged', function() { setTimeout(patch, 0); });
  window.addEventListener('resize', function() { setTimeout(tuneDesktopNavWrapping, 100); }, { passive: true });
  new MutationObserver(function(mutations) {
    var shouldPatch = mutations.some(function(mutation) {
      // Re-patch when a storefront anchor's href is RESET by other runtime code
      // after our initial patch. The baked-in updateHeaderAuthState (shipped in
      // the stored script.js, which re-publishing does NOT regenerate) pins the
      // navbar account/login icon back to the unprefixed default-language page
      // once the customer profile finishes loading — often AFTER our scheduled
      // patch() passes. On courses pages there is no language signal in the URL
      // (language lives in localStorage), so the clobbered icon sends an English
      // shopper to the Hebrew /account static file. Watching href mutations lets
      // us immediately re-prefix it. The href !== buildPath(href) guard makes
      // our own corrective setAttribute idempotent (no observer loop).
      if (mutation.type === 'attributes') {
        var tgt = mutation.target;
        if (tgt && tgt.nodeType === 1 && tgt.tagName === 'A') {
          var href = tgt.getAttribute('href');
          return isStorefrontPath(href) && href !== buildPath(href);
        }
        return false;
      }
      return Array.prototype.some.call(mutation.addedNodes || [], function(node) {
        return node.nodeType === 1 && (
          (node.matches && node.matches('a[href], .zappy-products-dropdown, #zappy-catalog-menu')) ||
          (node.querySelector && node.querySelector('a[href], .zappy-products-dropdown, #zappy-catalog-menu'))
        );
      });
    });
    if (shouldPatch) setTimeout(patch, 0);
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href'] });
  setTimeout(patch, 250);
  setTimeout(patch, 1500);
})();
/* ZAPPY_CHECKOUT_FOCUS_UX_V2 */
(function(){
  if (window.__zappyCheckoutFocusUX >= 2) return;
  window.__zappyCheckoutFocusUX = 2;

  var CSS =
    'body.zappy-cart-open #cc-main,body.zappy-cart-open #zappy-cookie-banner{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    'body.zappy-checkout-page #zappy-cookie-banner{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-menu,' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-links,' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-cta,' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-right-group .nav-menu,' +
    'body.zappy-checkout-page .lang-switcher,' +
    'body.zappy-checkout-page .nav-icons-right,' +
    'body.zappy-checkout-page .nav-search-box,' +
    'body.zappy-checkout-page .nav-search-toggle,' +
    'body.zappy-checkout-page #mobile-search-toggle,' +
    'body.zappy-checkout-page .mobile-search-panel,' +
    'body.zappy-checkout-page .login-link.nav-login,' +
    'body.zappy-checkout-page .nav-ecommerce-icons>*:not(.cart-link),' +
    'body.zappy-checkout-page .mobile-hamburger-btn,' +
    'body.zappy-checkout-page .mobile-toggle,' +
    'body.zappy-checkout-page .hamburger,' +
    'body.zappy-checkout-page .menu-toggle,' +
    'body.zappy-checkout-page #mobileToggle,' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .phone-header-btn,' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .mobile-close-btn{display:none!important;visibility:hidden!important;pointer-events:none!important}' +
    'body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-container{display:flex!important;align-items:center!important;justify-content:space-between!important;width:100%!important}' +
    'body.zappy-checkout-page .nav-brand,body.zappy-checkout-page .cart-link.nav-cart,body.zappy-checkout-page #cart-drawer-toggle{display:flex!important;visibility:visible!important;pointer-events:auto!important}' +
    'body.zappy-checkout-page .nav-ecommerce-icons{display:inline-flex!important;align-items:center!important;margin-inline-start:auto!important}' +
    '@media (max-width:768px){body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-menu,body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-menu.active,body.zappy-checkout-page nav.navbar:not(.zappy-catalog-menu) .nav-menu.open{display:none!important;visibility:hidden!important}}' +
    'body.zappy-checkout-page .site-footer>*:not(.footer-bottom),body.zappy-checkout-page footer.site-footer>*:not(.footer-bottom){display:none!important;visibility:hidden!important}' +
    'body.zappy-checkout-page .site-footer .footer-bottom,body.zappy-checkout-page footer.site-footer .footer-bottom{display:block!important;visibility:visible!important}' +
    'body.zappy-checkout-page .site-footer:not(:has(.footer-bottom)),body.zappy-checkout-page footer.site-footer:not(:has(.footer-bottom)){display:none!important}';

  function resolvePagePath() {
    var pagePath = window.location.pathname || '';
    try {
      var pageParam = new URLSearchParams(window.location.search).get('page');
      if (pageParam) pagePath = pageParam;
    } catch (e) {}
    return pagePath.toLowerCase();
  }

  function applyCheckoutFocusState() {
    var path = resolvePagePath();
    var isCheckoutPage = path.indexOf('/checkout') !== -1;
    var isFocusedPage = (
      path.indexOf('/product/') !== -1 ||
      path === '/product' ||
      path.indexOf('/cart') !== -1 ||
      isCheckoutPage ||
      path.indexOf('/order-success') !== -1 ||
      path.indexOf('/order') !== -1
    );
    document.body.classList.toggle('zappy-focused-page', isFocusedPage);
    document.body.classList.toggle('zappy-checkout-page', isCheckoutPage);
  }

  function injectCss() {
    var existing = document.getElementById('zappy-checkout-focus-ux-css');
    if (existing && existing.getAttribute('data-v') === '2') return;
    if (existing) existing.remove();
    var style = document.createElement('style');
    style.id = 'zappy-checkout-focus-ux-css';
    style.setAttribute('data-zappy-runtime', 'checkout-focus');
    style.setAttribute('data-v', '2');
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function syncCartOpenFromDom() {
    var drawer = document.getElementById('cart-drawer');
    var overlay = document.getElementById('cart-drawer-overlay');
    var isOpen = (drawer && drawer.classList.contains('active')) ||
      (overlay && overlay.classList.contains('active'));
    document.body.classList.toggle('zappy-cart-open', !!isOpen);
  }

  function watchCartDrawer() {
    syncCartOpenFromDom();
    var obs = new MutationObserver(function() { syncCartOpenFromDom(); });
    ['cart-drawer', 'cart-drawer-overlay'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    document.addEventListener('click', function(e) {
      var t = e.target && e.target.closest
        ? e.target.closest('#cart-drawer-toggle,.cart-link.nav-cart,a.nav-cart,[data-cart-toggle],.cart-drawer-close,#cart-drawer-overlay')
        : null;
      if (t) setTimeout(syncCartOpenFromDom, 0);
    }, true);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') setTimeout(syncCartOpenFromDom, 0);
    });
  }

  function boot() {
    injectCss();
    applyCheckoutFocusState();
    watchCartDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('popstate', function() { setTimeout(applyCheckoutFocusState, 0); });
  setTimeout(boot, 250);
  setTimeout(boot, 1500);
})();


/* ZAPPY_ACCESSIBILITY_RUNTIME_V2 — self-loads Mickidum after publish strips stored third-party tags */

/* Mickidum Accessibility Toolbar Initialization - Zappy Style */

var zappyAccessibilityInitAttempts = 0;
var zappyAccessibilityMaxAttempts = 50;
var zappyAccessibilityScriptSrc = 'https://cdn.jsdelivr.net/gh/mickidum/acc_toolbar/acctoolbar/acctoolbar.min.js';
var zappyAccessibilityLoadPromise = null;

function loadZappyAccessibilityToolbar() {
    if (typeof window.MicAccessTool === 'function') {
        return Promise.resolve();
    }
    if (zappyAccessibilityLoadPromise) {
        return zappyAccessibilityLoadPromise;
    }
    zappyAccessibilityLoadPromise = new Promise(function(resolve, reject) {
        var existing = document.querySelector('script[data-zappy-accessibility-toolbar="true"]');
        if (existing) {
            // A previously failed/already-complete tag never fires load again.
            if (existing.getAttribute('data-zappy-load-error') === 'true') {
                existing.parentNode && existing.parentNode.removeChild(existing);
            } else if (existing.getAttribute('data-zappy-loaded') === 'true' || existing.readyState === 'complete') {
                resolve();
                return;
            } else {
                existing.addEventListener('load', function() {
                    existing.setAttribute('data-zappy-loaded', 'true');
                    resolve();
                }, { once: true });
                existing.addEventListener('error', function(error) {
                    existing.setAttribute('data-zappy-load-error', 'true');
                    reject(error);
                }, { once: true });
                return;
            }
        }
        var script = document.createElement('script');
        script.src = zappyAccessibilityScriptSrc;
        script.async = true;
        script.defer = true;
        script.setAttribute('data-zappy-accessibility-toolbar', 'true');
        script.onload = function() {
            script.setAttribute('data-zappy-loaded', 'true');
            resolve();
        };
        script.onerror = function(error) {
            script.setAttribute('data-zappy-load-error', 'true');
            reject(error);
        };
        document.head.appendChild(script);
    }).then(function() {
        initZappyAccessibilityToolbar();
    }).catch(function() {
        zappyAccessibilityLoadPromise = null;
    });
    return zappyAccessibilityLoadPromise;
}

function initZappyAccessibilityToolbar() {

    try {
        if (window.__zappyAccessibilityInitialized) {
            return;
        }
        if (typeof window.MicAccessTool !== 'function') {
            zappyAccessibilityInitAttempts++;
            if (zappyAccessibilityInitAttempts < zappyAccessibilityMaxAttempts) {
                // Script load may already be settled; schedule another init pass
                // so we keep polling until MicAccessTool attaches.
                setTimeout(function() {
                    loadZappyAccessibilityToolbar().then(initZappyAccessibilityToolbar);
                }, 100);
            }
            return;
        }
        window.__zappyAccessibilityInitialized = true;
        // Detect current page language and direction from <html> element
        // so the toolbar matches the active language on multi-language sites.
        var htmlEl = document.documentElement;
        var pageLang = (htmlEl.getAttribute('lang') || 'en').toLowerCase().split('-')[0];
        var pageDir = (htmlEl.getAttribute('dir') || '').toLowerCase();
        var rtlLangs = ['he', 'ar', 'fa', 'ur', 'yi', 'iw'];
        var isPageRTL = pageDir === 'rtl' || rtlLangs.indexOf(pageLang) !== -1;
        var buttonSide = isPageRTL ? 'left' : 'right';

        var langMap = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-PT', nl: 'nl-NL', he: 'he-IL', ar: 'ar-SA' };
        var forceLang = langMap[pageLang] || 'en-US';

        var iconPos = { bottom: { size: 50, units: 'px' }, type: 'fixed' };
        iconPos[buttonSide] = { size: 20, units: 'px' };

        window.micAccessTool = new MicAccessTool({
            buttonPosition: buttonSide,
            forceLang: forceLang,
            icon: {
                position: iconPos,
                backgroundColor: 'transparent',
                color: 'transparent',
                img: 'accessible',
                circular: false
            },
            menu: {
                dimensions: {
                    width: { size: 300, units: 'px' },
                    height: { size: 'auto', units: 'px' }
                }
            }
        });
        
    } catch (error) {
    }
    
    // Keyboard shortcut handler: ALT+A (Option+A on Mac) to toggle accessibility menu
    if (!window.__zappyAccessibilityShortcutBound) {
      window.__zappyAccessibilityShortcutBound = true;
      document.addEventListener('keydown', function(event) {
        var isAltOrOption = event.altKey;
        var isAKey = event.code === 'KeyA' || event.keyCode === 65 || event.which === 65 || 
                      (event.key && (event.key.toLowerCase() === 'a' || event.key === 'å' || event.key === 'Å'));
        
        if (isAltOrOption && isAKey) {
            event.preventDefault();
            event.stopPropagation();
            loadZappyAccessibilityToolbar().then(function() {
                var accessButton = document.getElementById('mic-access-tool-general-button');
                if (accessButton) {
                    accessButton.click();
                }
            });
        }
      }, true);
    }
}

function scheduleZappyAccessibilityLazyLoad() {
    var start = function() { loadZappyAccessibilityToolbar(); };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(start, { timeout: 8000 });
    } else {
        setTimeout(start, 8000);
    }
}

if (!window.__zappyAccessibilityShortcutBound) {
    window.__zappyAccessibilityShortcutBound = true;
    document.addEventListener('keydown', function(event) {
        var isAltOrOption = event.altKey;
        var isAKey = event.code === 'KeyA' || event.keyCode === 65 || event.which === 65 ||
                      (event.key && (event.key.toLowerCase() === 'a' || event.key === 'å' || event.key === 'Å'));
        if (isAltOrOption && isAKey) {
            event.preventDefault();
            event.stopPropagation();
            loadZappyAccessibilityToolbar().then(function() {
                var accessButton = document.getElementById('mic-access-tool-general-button');
                if (accessButton) accessButton.click();
            });
        }
    }, true);
}

if (document.readyState === 'complete') {
    scheduleZappyAccessibilityLazyLoad();
} else {
    window.addEventListener('load', scheduleZappyAccessibilityLazyLoad, { once: true });
}

/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_RUNTIME */
/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_RUNTIME_V2 */
(function(){
  try {
    function injectMobileNavIconAlignmentFix() {
      if (document.getElementById('zappy-mobile-nav-icon-alignment-fix')) return;
      var style = document.createElement('style');
      style.id = 'zappy-mobile-nav-icon-alignment-fix';
      style.textContent = "\n\n/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_FIX */\n/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_FIX_V3 */\n/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_FIX_V4 */\n/* ZAPPY_MOBILE_NAV_ICON_ALIGNMENT_FIX_V5 */\n/* The mobile hamburger / phone buttons are absolutely positioned. Keep the\n   navbar itself as a non-collapsing containing block so auto-margin centering\n   stays aligned even when generated mobile CSS moves every nav child out of flow. */\n@media (max-width: 768px) {\n  .navbar,\n  nav.navbar {\n    min-height: 70px !important;\n  }\n\n  /* V5: Desktop .nav-search-box must stay hidden on mobile. AI/customization CSS\n     often force-shows it with higher specificity than the generator's plain\n     .nav-search-box { display:none } (e.g. .navbar .nav-ecommerce-icons.nav-icons-left\n     .nav-search-box { display:flex; background: cream }), which paints an empty\n     cream/white square left of the cart on RTL ecommerce navs. Beat that chain. */\n  html body .navbar .nav-search-box,\n  html body nav.navbar .nav-search-box,\n  html body .navbar .nav-ecommerce-icons .nav-search-box,\n  html body .navbar .nav-ecommerce-icons.nav-icons-left .nav-search-box,\n  html body .navbar .nav-container .nav-ecommerce-icons.nav-icons-left .nav-search-box {\n    display: none !important;\n    visibility: hidden !important;\n    width: 0 !important;\n    height: 0 !important;\n    min-width: 0 !important;\n    max-width: 0 !important;\n    overflow: hidden !important;\n    padding: 0 !important;\n    margin: 0 !important;\n    border: none !important;\n    background: transparent !important;\n    pointer-events: none !important;\n  }\n\n  /* V5: Search-toggle SVG is frequently recolored to --nav-text (cream/white) by\n     AI customization at .navbar .nav-container .nav-ecommerce-icons.nav-icons-right\n     .nav-search-toggle svg, while the pill button itself keeps the correct\n     contrasting color from the luminance-aware pill rules. Inherit that color\n     with a selector that out-ranks the nav-text stroke paint so the icon stays\n     legible on light AND dark pills (no hardcoded text-dark). */\n  html body .navbar .nav-container .nav-ecommerce-icons.nav-icons-right .nav-search-toggle svg,\n  html body .navbar .nav-container .nav-ecommerce-icons.nav-icons-right .nav-search-toggle svg *,\n  html body .navbar .nav-ecommerce-icons.nav-icons-right .nav-search-toggle svg,\n  html body .navbar .nav-ecommerce-icons.nav-icons-right .nav-search-toggle svg * {\n    color: inherit !important;\n    stroke: currentColor !important;\n    fill: none !important;\n  }\n\n  /* V5: Keep the three mobile icon couples on one baseline — absolute groups +\n     hamburger all center against the same navbar box. */\n  html body .navbar .nav-ecommerce-icons.nav-icons-left,\n  html body .navbar .nav-ecommerce-icons.nav-icons-right,\n  html body .navbar .nav-icons-left,\n  html body .navbar .nav-icons-right {\n    top: 50% !important;\n    bottom: auto !important;\n    transform: translateY(-50%) !important;\n    align-items: center !important;\n  }\n  html body .navbar .nav-ecommerce-icons.nav-icons-right .nav-search-toggle,\n  html body .navbar .nav-search-toggle {\n    width: 36px !important;\n    height: 36px !important;\n    min-width: 36px !important;\n    padding: 0 !important;\n    margin: 0 !important;\n    border-radius: 9999px !important;\n    align-self: center !important;\n  }\n\n  /* E-commerce mobile navbar icon-group alignment.\n     The icon couples (search after the hamburger; login+cart at the end edge)\n     are absolutely positioned with inset-inline offsets — inset-inline-start:52px\n     to clear the 36px hamburger that sits at left:12px on the .navbar, and\n     inset-inline-end:12px to hug the end edge. Those offsets are authored in the\n     NAVBAR's full-width coordinate space (the hamburger uses the same one). But\n     the offsets are resolved against the nearest positioned ancestor, and the\n     generated CSS makes .nav-container position:relative. When .nav-container is\n     ALSO inset by the navbar's horizontal padding (max-width / padding from the\n     LLM-authored navbar), the groups resolve to that inset box instead of the\n     full-width navbar: the search drifts ~20px away from the hamburger and the\n     cart leaves a fat asymmetric gap before the screen edge. Dropping\n     .nav-container out of the containing-block chain on mobile makes both couples\n     resolve to .navbar (always full-bleed) so they line up tightly with the\n     hamburger and sit symmetrically against both edges regardless of any\n     navbar/container padding. Scoped via :has() to navbars that actually carry\n     the e-commerce icon couples so non-ecommerce navs are untouched. */\n  .navbar:has(.nav-ecommerce-icons) .nav-container,\n  nav.navbar:has(.nav-ecommerce-icons) .nav-container,\n  header:has(.nav-ecommerce-icons) .nav-container {\n    position: static !important;\n  }\n\n  /* Some generated RTL nav CSS sets both left:50% and right:50% on the\n     absolute .nav-brand. That collapses it to 0px wide, so the logo flows\n     left from the center instead of being centered on it. */\n  .navbar .nav-brand,\n  nav.navbar .nav-brand,\n  html[dir=\"rtl\"] .navbar .nav-brand,\n  html[dir=\"rtl\"] nav.navbar .nav-brand,\n  html[lang=\"he\"] .navbar .nav-brand,\n  html[lang=\"he\"] nav.navbar .nav-brand,\n  html[lang=\"ar\"] .navbar .nav-brand,\n  html[lang=\"ar\"] nav.navbar .nav-brand {\n    position: absolute !important;\n    left: 50% !important;\n    right: auto !important;\n    top: 50% !important;\n    width: auto !important;\n    min-width: max-content !important;\n    max-width: calc(100% - 168px) !important;\n    transform: translate(-50%, -50%) !important;\n    margin: 0 !important;\n    text-align: center !important;\n    justify-content: center !important;\n  }\n\n  .navbar .nav-brand .logo-link,\n  nav.navbar .nav-brand .logo-link,\n  .navbar .nav-brand a,\n  nav.navbar .nav-brand a {\n    display: inline-flex !important;\n    justify-content: center !important;\n    align-items: center !important;\n    margin-left: auto !important;\n    margin-right: auto !important;\n  }\n\n  .navbar > .mobile-toggle,\n  nav.navbar > .mobile-toggle,\n  .navbar .mobile-toggle,\n  nav.navbar .mobile-toggle,\n  #mobileToggle,\n  .navbar > .phone-header-btn,\n  nav.navbar > .phone-header-btn,\n  .navbar .phone-header-btn,\n  nav.navbar .phone-header-btn {\n    position: absolute !important;\n    top: 0 !important;\n    bottom: 0 !important;\n    transform: none !important;\n    margin-top: auto !important;\n    margin-bottom: auto !important;\n    align-self: center !important;\n    align-items: center !important;\n    justify-content: center !important;\n    line-height: 0 !important;\n  }\n\n  .navbar > .mobile-toggle,\n  nav.navbar > .mobile-toggle,\n  .navbar .mobile-toggle,\n  nav.navbar .mobile-toggle,\n  #mobileToggle {\n    display: flex !important;\n  }\n\n  html:not([data-zappy-site-type=\"ecommerce\"]) .navbar > .phone-header-btn,\n  html:not([data-zappy-site-type=\"ecommerce\"]) nav.navbar > .phone-header-btn,\n  html:not([data-zappy-site-type=\"ecommerce\"]) .navbar .phone-header-btn,\n  html:not([data-zappy-site-type=\"ecommerce\"]) nav.navbar .phone-header-btn {\n    display: flex !important;\n  }\n\n  html[data-zappy-site-type=\"ecommerce\"] .phone-header-btn,\n  body[data-zappy-site-type=\"ecommerce\"] .phone-header-btn,\n  html[data-zappy-site-type=\"ecommerce\"] header .phone-header-btn,\n  html[data-zappy-site-type=\"ecommerce\"] nav .phone-header-btn {\n    display: none !important;\n    visibility: hidden !important;\n    width: 0 !important;\n    height: 0 !important;\n    min-width: 0 !important;\n    overflow: hidden !important;\n  }\n}\n";
      document.head.appendChild(style);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectMobileNavIconAlignmentFix);
    } else {
      injectMobileNavIconAlignmentFix();
    }
    window.addEventListener('load', injectMobileNavIconAlignmentFix);
    setTimeout(injectMobileNavIconAlignmentFix, 250);
    setTimeout(injectMobileNavIconAlignmentFix, 1000);
  } catch (e) {}
})();


/* ZAPPY_NAV_OVERFLOW_MENU_V1 */
(function(){
  try {
    if (window.__zappyNavOverflowInit) return;
    window.__zappyNavOverflowInit = true;

    var MORE_LABELS = {en:'More',he:'עוד',es:'Más',fr:'Plus',de:'Mehr',it:'Altro',pt:'Mais',ar:'المزيد',ru:'Ещё',nl:'Meer',pl:'Więcej',tr:'Daha',ja:'その他',zh:'更多',hi:'और',sv:'Mer',uk:'Ще',ro:'Mai mult',cs:'Více',da:'Mere',fi:'Lisää',no:'Mer',el:'Περισσότερα'};
    var TOL = 2;
    var mo = null;

    function moreLabel() {
      var lang = (document.documentElement.getAttribute('lang') || 'en').slice(0,2).toLowerCase();
      return MORE_LABELS[lang] || 'More';
    }

    function injectCss() {
      // Always (re)append so our !important rules win the cascade against
      // later site <style> blocks that also target .navbar .sub-menu with
      // position:absolute !important (bug 2026-07: nested dropdowns drained
      // into More stayed absolute and painted over later siblings like Contact).
      var s = document.getElementById('zappy-nav-overflow-css');
      if (!s) {
        s = document.createElement('style');
        s.id = 'zappy-nav-overflow-css';
      }
      s.textContent =
        '@media (min-width:769px){' +
          '.zappy-nav-more-item{position:relative!important;flex:0 0 auto!important;}' +
          '.zappy-nav-more-item>.zappy-nav-more-toggle{cursor:pointer;display:inline-flex!important;align-items:center;gap:6px;white-space:nowrap;}' +
          /* pointer-events:none!important while closed is critical: nested
             flattened submenus used to set pointer-events:auto and re-enable
             hit-testing under an invisible More panel (hover 100px+ below
             still opened עוד). */
          '.navbar .zappy-nav-more-item>.sub-menu{display:block!important;left:auto!important;right:0!important;min-width:200px!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;transform:translateY(6px);transition:opacity .18s ease,visibility .18s ease,transform .18s ease;}' +
          /* Keep right:0 in RTL too. The old left:0 flip made the panel grow
             rightward over the nav links; on RTL More sits on the left of the
             item cluster so the panel must open left under עוד. */
          '.navbar .zappy-nav-more-item:hover>.sub-menu,.navbar .zappy-nav-more-item:focus-within>.sub-menu,.navbar .zappy-nav-more-item.open>.sub-menu{opacity:1!important;visibility:visible!important;pointer-events:auto!important;transform:translateY(0)!important;}' +
          '.zappy-nav-more-item>.sub-menu>li{display:block!important;width:100%!important;flex:0 0 auto!important;}' +
          /* Mobile-only items (hamburger-overlay contact CTA) must never render
             inside the desktop More panel — the display:block above would
             otherwise resurrect them there (duplicate CTA bug, 2026-07). */
          '.zappy-nav-more-item>.sub-menu>li.mobile-contact-link,.zappy-nav-more-item>.sub-menu>li.nav-cta-mobile-item,.zappy-nav-more-item>.sub-menu>li.mobile-only{display:none!important;}' +
          /* Wrap long labels — nowrap + max-content from ecom-routing caused a
             horizontal scrollbar inside More (publish screenshot 2026-07). */
          '.zappy-nav-more-item>.sub-menu{width:min(420px,calc(100vw - 24px))!important;max-width:min(420px,calc(100vw - 24px))!important;overflow-x:hidden!important;overflow-y:auto!important;box-sizing:border-box!important;}' +
          '.zappy-nav-more-item>.sub-menu>li>a{display:block!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;padding:10px 16px!important;max-width:100%!important;box-sizing:border-box!important;}' +
          /* Nested dropdowns inside More stay in normal flow (not absolute
             flyouts that cover Contact). Collapsed by default — expand only
             when the parent row has .zappy-more-nested-open (chevron toggle). */
          'html body .navbar .zappy-nav-more-item .sub-menu .sub-menu,' +
          'html body .navbar .zappy-nav-more-item > .sub-menu > li > .sub-menu,' +
          'html body nav.navbar .zappy-nav-more-item .sub-menu ul.sub-menu,' +
          'html body .zappy-nav-more-item .sub-menu .sub-menu{' +
            'position:static!important;top:auto!important;left:auto!important;right:auto!important;' +
            'transform:none!important;box-shadow:none!important;min-width:0!important;' +
            'width:100%!important;max-width:100%!important;margin:0!important;' +
            'display:none!important;opacity:0!important;visibility:hidden!important;' +
            'pointer-events:none!important;height:0!important;overflow:hidden!important;padding:0!important;' +
          '}' +
          'html body .navbar .zappy-nav-more-item .zappy-more-nested-open > .sub-menu,' +
          'html body .navbar .zappy-nav-more-item > .sub-menu > li.zappy-more-nested-open > .sub-menu,' +
          'html body .zappy-nav-more-item .zappy-more-nested-open > .sub-menu{' +
            'display:block!important;opacity:1!important;visibility:visible!important;' +
            'pointer-events:auto!important;height:auto!important;' +
            'overflow-x:hidden!important;overflow-y:visible!important;' +
            'padding-inline-start:12px!important;' +
          '}' +
          /* Chevron for nested parents inside More (desktop accordion).
             width:100% + margin-inline-start:auto pins the chevron to the
             inline-start edge of the row in both LTR and RTL (matches preview). */
          '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-parent>a{' +
            'display:flex!important;align-items:center!important;justify-content:space-between!important;' +
            'gap:8px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;' +
          '}' +
          '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-parent>a .dropdown-arrow{' +
            'display:inline-block!important;flex:0 0 auto!important;width:12px!important;height:12px!important;' +
            'margin-inline-start:auto!important;pointer-events:auto!important;cursor:pointer!important;' +
            'transition:transform .2s ease!important;opacity:1!important;visibility:visible!important;' +
          '}' +
          '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-open>a .dropdown-arrow{transform:rotate(180deg)!important;}' +
        '}' +
        '@media (max-width:768px){.zappy-nav-more-item{display:none!important;}}';
      (document.head || document.documentElement).appendChild(s);
    }

    // Belt-and-suspenders: when a dropdown parent is drained into More, force
    // its nested .sub-menu into normal flow via inline !important so site CSS
    // cannot resurrect position:absolute and cover later More siblings.
    // Do NOT set pointer-events/opacity/visibility here — those must follow
    // the More panel open/closed state (see CSS above) or an invisible nested
    // submenu re-enables hover far below the trigger.
    function flattenNestedSubmenusForMore(li) {
      if (!li || !li.querySelectorAll) return;
      var nested = li.querySelectorAll('.sub-menu');
      for (var i = 0; i < nested.length; i++) {
        var ul = nested[i];
        if (ul.classList && ul.classList.contains('zappy-nav-more-menu')) continue;
        ul.setAttribute('data-zappy-more-flattened', '1');
        ul.style.setProperty('position', 'static', 'important');
        ul.style.setProperty('top', 'auto', 'important');
        ul.style.setProperty('left', 'auto', 'important');
        ul.style.setProperty('right', 'auto', 'important');
        ul.style.setProperty('transform', 'none', 'important');
        ul.style.setProperty('box-shadow', 'none', 'important');
        ul.style.setProperty('min-width', '0', 'important');
        ul.style.setProperty('width', '100%', 'important');
        // Clear any prior pe/opacity/visibility inline locks from older runtimes.
        ul.style.removeProperty('pointer-events');
        ul.style.removeProperty('opacity');
        ul.style.removeProperty('visibility');
        ul.style.removeProperty('display');
        ul.style.removeProperty('height');
      }
    }

    function unflattenNestedSubmenusFromMore(li) {
      if (!li || !li.querySelectorAll) return;
      var nested = li.querySelectorAll('[data-zappy-more-flattened]');
      for (var i = 0; i < nested.length; i++) {
        var ul = nested[i];
        ul.removeAttribute('data-zappy-more-flattened');
        ul.style.removeProperty('position');
        ul.style.removeProperty('top');
        ul.style.removeProperty('left');
        ul.style.removeProperty('right');
        ul.style.removeProperty('opacity');
        ul.style.removeProperty('visibility');
        ul.style.removeProperty('pointer-events');
        ul.style.removeProperty('transform');
        ul.style.removeProperty('box-shadow');
        ul.style.removeProperty('min-width');
        ul.style.removeProperty('width');
        ul.style.removeProperty('display');
        ul.style.removeProperty('height');
      }
      if (li.classList) {
        li.classList.remove('zappy-more-nested-open', 'zappy-more-nested-parent');
        // Restore dropdown class stripped while nested under More so mobile
        // chevron CSS (.menu-item-has-children > .mobile-submenu-toggle) matches.
        var hasDirectSub = false;
        for (var c = 0; c < li.children.length; c++) {
          if (li.children[c].tagName === 'UL') { hasDirectSub = true; break; }
        }
        if (hasDirectSub) li.classList.add('menu-item-has-children');
      }
    }

    /** Wire chevron accordion for nested dropdowns drained into More (desktop). */
    function ensureMoreNestedAccordion(moreLi) {
      if (!moreLi) return;
      var topSub = moreLi.querySelector(':scope > .sub-menu');
      if (!topSub) return;
      var kids = topSub.children;
      for (var i = 0; i < kids.length; i++) {
        var li = kids[i];
        if (!li || li.tagName !== 'LI') continue;
        var nested = null;
        for (var c = 0; c < li.children.length; c++) {
          if (li.children[c].tagName === 'UL') { nested = li.children[c]; break; }
        }
        if (!nested) {
          li.classList.remove('zappy-more-nested-parent', 'zappy-more-nested-open');
          continue;
        }
        li.classList.add('zappy-more-nested-parent');
        // Always start collapsed when (re)wired after overflow reflow.
        if (!li.__zappyMoreNestedUserOpened) li.classList.remove('zappy-more-nested-open');
        var trigger = li.querySelector(':scope > a');
        if (!trigger) continue;
        var arrow = trigger.querySelector('svg.dropdown-arrow');
        if (!arrow) {
          arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          arrow.setAttribute('class', 'dropdown-arrow');
          arrow.setAttribute('width', '12');
          arrow.setAttribute('height', '12');
          arrow.setAttribute('viewBox', '0 0 24 24');
          arrow.setAttribute('fill', 'none');
          arrow.setAttribute('stroke', 'currentColor');
          arrow.setAttribute('stroke-width', '2');
          arrow.setAttribute('aria-hidden', 'true');
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M6 9l6 6 6-6');
          arrow.appendChild(path);
          trigger.appendChild(arrow);
        }
        if (li.__zappyMoreNestedBound) continue;
        li.__zappyMoreNestedBound = true;
        (function(parentLi, arrowEl) {
          arrowEl.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var open = parentLi.classList.toggle('zappy-more-nested-open');
            parentLi.__zappyMoreNestedUserOpened = open;
          });
        })(li, arrow);
      }
    }

    function getMenu() {
      return document.querySelector('.nav-container > .nav-menu, .nav-right-group > .nav-menu')
        || document.getElementById('navMenu')
        || document.querySelector('.nav-menu');
    }

    // Visual extent (px) of just the IN-FLOW top-level <li> items — the true
    // width the menu's content needs. Measured from the left-most item edge to
    // the right-most item edge so the REAL gaps are captured by geometry (never
    // guessed). Absolutely-positioned dropdown sub-menus (the auto "More" panel,
    // the Products/Categories dropdowns) are excluded: they hang out of flow yet
    // still inflate menu.scrollWidth, which was the false signal that drained
    // almost every item into "More" on a near-empty navbar (bug 2026-06).
    function inflowItemsExtent(menu) {
      var left = Infinity, right = -Infinity, found = false, kids = menu.children;
      for (var i = 0; i < kids.length; i++) {
        var li = kids[i];
        if (!li || li.tagName !== 'LI') continue;
        var pos = '';
        try { pos = getComputedStyle(li).position; } catch (e) {}
        if (pos === 'absolute' || pos === 'fixed') continue;
        var r = li.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // skip display:none items
        if (r.left < left) left = r.left;
        if (r.right > right) right = r.right;
        found = true;
      }
      return found ? (right - left) : 0;
    }

    // Drop any width/flex sizing override we previously pinned on the menu so
    // the next reflow re-measures from the site's natural layout. flex-basis +
    // flex-grow are cleared alongside width/flex-shrink: many navbars (V2
    // ecommerce, RTL) ship .nav-menu{flex:1 1 0% important}, and a DEFINITE
    // flex-basis (0%) makes the width property a no-op for the flex item's
    // main size (CSS Flexbox spec). Without neutralizing flex-basis/flex-grow
    // our width pin was silently ignored — the menu kept its flex-distributed
    // box while its items spilled over the search/cart icons, and the overflow
    // detector measured the capped box (not the overflowing items) so it never
    // drained anything into "More" (bug 2026-06, RTL navbars).
    function clearMenuWidthOverride(menu) {
      if (!menu) return;
      menu.style.removeProperty('width');
      menu.style.removeProperty('flex-shrink');
      menu.style.removeProperty('flex-basis');
      menu.style.removeProperty('flex-grow');
      menu.removeAttribute('data-zappy-nav-fitted');
    }

    // Force the menu so its inline width actually governs the flex item's main
    // size, regardless of any flex:1 1 0% the site baked in. Sets flex-shrink:0
    // (don't compress), flex-grow:0 (don't stretch) and flex-basis:auto (so width
    // wins). Returns a token array to pass to restoreMenuSizing(). Pass the
    // desired width (px) or null to only freeze the flex triplet.
    function forceMenuSizing(menu, widthPx) {
      var saved = [
        menu.style.getPropertyValue('width'), menu.style.getPropertyPriority('width'),
        menu.style.getPropertyValue('flex-shrink'), menu.style.getPropertyPriority('flex-shrink'),
        menu.style.getPropertyValue('flex-grow'), menu.style.getPropertyPriority('flex-grow'),
        menu.style.getPropertyValue('flex-basis'), menu.style.getPropertyPriority('flex-basis')
      ];
      menu.style.setProperty('flex-shrink', '0', 'important');
      menu.style.setProperty('flex-grow', '0', 'important');
      menu.style.setProperty('flex-basis', 'auto', 'important');
      if (widthPx != null) menu.style.setProperty('width', widthPx + 'px', 'important');
      return saved;
    }

    function restoreMenuSizing(menu, saved) {
      if (saved[0]) menu.style.setProperty('width', saved[0], saved[1]); else menu.style.removeProperty('width');
      if (saved[2]) menu.style.setProperty('flex-shrink', saved[2], saved[3]); else menu.style.removeProperty('flex-shrink');
      if (saved[4]) menu.style.setProperty('flex-grow', saved[4], saved[5]); else menu.style.removeProperty('flex-grow');
      if (saved[6]) menu.style.setProperty('flex-basis', saved[6], saved[7]); else menu.style.removeProperty('flex-basis');
    }

    // The NATURAL (un-shrunk) content width the menu's in-flow items need. The
    // menu carries flex-shrink:1 (and often flex:1 1 0%), so on a tight navbar
    // the browser compresses/expands its box and a plain inflowItemsExtent()
    // read can under-report. Force the flex triplet (shrink:0, grow:0,
    // basis:auto) + a huge width so the items lay out at full size, read the
    // real span (gaps captured by geometry, abs sub-menus excluded), restore.
    function naturalMenuWidth(menu) {
      var saved = forceMenuSizing(menu, 100000);
      var ext = inflowItemsExtent(menu);
      restoreMenuSizing(menu, saved);
      return ext;
    }

    // Would the navbar ROW overflow its container if the menu were sized to
    // widthPx? This is the authoritative "do the items fit?" test. It is
    // deliberately NOT based on container.scrollWidth > clientWidth, which is
    // unreliable here for THREE reasons:
    //   (a) abs-positioned dropdown sub-menus inflate the menu's own scrollWidth,
    //   (b) RTL: a flex child overflowing past the container's edge does NOT grow
    //       the container scrollWidth (measured: menu right=942 over an 817 box,
    //       scrollWidth still 817) — the original bug that left RTL navbars with
    //       no "More" and overlapping links, and
    //   (c) a flexible sibling (the search/cart icon group) silently CRUSHES to
    //       absorb the overflow, hiding it from scrollWidth entirely.
    // Instead we pin the menu to widthPx AND freeze every in-flow sibling at
    // flex-shrink:0 (so none can crush), then measure the geometric UNION SPAN of
    // all in-flow children (leftmost edge → rightmost edge) and compare it to the
    // container's content width. This is fully direction-agnostic (LTR + RTL) and
    // immune to scrollWidth quirks. margin:auto gaps collapse to 0 exactly at
    // the fit boundary, so a row WITH free space spans ≈ clientWidth (not over)
    // while a genuinely too-wide row spans past it. Styles restored exactly.
    //
    // The MENU must be frozen with the full flex triplet (shrink:0, grow:0,
    // basis:auto) — not just flex-shrink:0 — so widthPx actually sizes its box.
    // A navbar that baked .nav-menu{flex:1 1 0%} has a DEFINITE flex-basis,
    // which makes width a no-op: without this the menu kept its narrow
    // flex-distributed box, getBoundingClientRect read that capped box (NOT the
    // overflowing items), the span stayed inside the container, and "More" was
    // never triggered (bug 2026-06). Siblings keep flex-shrink:0 + natural width.
    function rowOverflowsAtWidth(menu, widthPx) {
      var c = menu.parentElement;
      if (!c) return false;
      var saved = [];
      function freezeSibling(el) {
        saved.push([
          el,
          el.style.getPropertyValue('flex-shrink'), el.style.getPropertyPriority('flex-shrink')
        ]);
        el.style.setProperty('flex-shrink', '0', 'important');
      }
      var kids = c.children, i, ch, pos;
      var menuSaved = forceMenuSizing(menu, widthPx);
      for (i = 0; i < kids.length; i++) {
        ch = kids[i];
        if (ch === menu) continue;
        pos = '';
        try { pos = getComputedStyle(ch).position; } catch (e) {}
        if (pos === 'absolute' || pos === 'fixed') continue;
        freezeSibling(ch); // flex-shrink:0 only — keep the sibling's natural width
      }
      var left = Infinity, right = -Infinity, b;
      for (i = 0; i < kids.length; i++) {
        ch = kids[i];
        pos = '';
        try { pos = getComputedStyle(ch).position; } catch (e) {}
        if (pos === 'absolute' || pos === 'fixed') continue;
        b = ch.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        if (b.left < left) left = b.left;
        if (b.right > right) right = b.right;
      }
      var span = (right > left) ? (right - left) : 0;
      var over = span > c.clientWidth + TOL;
      for (i = saved.length - 1; i >= 0; i--) {
        var s = saved[i], el = s[0];
        if (s[1]) el.style.setProperty('flex-shrink', s[1], s[2]); else el.style.removeProperty('flex-shrink');
      }
      restoreMenuSizing(menu, menuSaved);
      return over;
    }

    function makeMoreItem() {
      var li = document.createElement('li');
      li.className = 'menu-item-has-children zappy-nav-more-item';
      li.setAttribute('data-zappy-nav-more', '1');
      var a = document.createElement('a');
      a.href = '#';
      a.className = 'zappy-nav-more-toggle nav-link';
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
      a.innerHTML = '<span class="zappy-nav-more-label"></span><svg class="dropdown-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg>';
      a.querySelector('.zappy-nav-more-label').textContent = moreLabel();
      var ul = document.createElement('ul');
      ul.className = 'sub-menu zappy-nav-more-menu';
      ul.setAttribute('role', 'menu');
      li.appendChild(a);
      li.appendChild(ul);
      a.addEventListener('click', function(e) {
        e.preventDefault();
        var open = li.classList.toggle('open');
        a.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      return li;
    }

    function restore(menu) {
      var more = menu.querySelector(':scope > .zappy-nav-more-item');
      if (!more) return;
      var sub = more.querySelector('.sub-menu');
      while (sub && sub.firstElementChild) {
        var child = sub.firstElementChild;
        unflattenNestedSubmenusFromMore(child);
        menu.insertBefore(child, more);
      }
      more.remove();
    }

    // Is this anchor href the site home/root? Handles BOTH the preview shape
    // (.../preview-fullscreen/<id>?page=%2F) and the published shape (/, /index.html,
    // /en/, etc.), language prefixes and absolute origins included.
    function isHomeHref(href) {
      if (!href) return false;
      href = ('' + href).trim();
      if (!href || href.charAt(0) === '#') return false;
      var pIdx = href.indexOf('page=');
      if (pIdx !== -1) {
        var val = href.slice(pIdx + 5);
        var stop = val.search(/[&#]/);
        if (stop !== -1) val = val.slice(0, stop);
        try { val = decodeURIComponent(val); } catch (e) {}
        val = val.replace(/index\.html$/i, '').replace(/^\/[a-z]{2}\/$/i, '/');
        return val === '/' || val === '';
      }
      var clean = href.split('?')[0].split('#')[0].trim();
      clean = clean.replace(/^https?:\/\/[^/]+/i, '').replace(/^\.\//, '/').replace(/index\.html$/i, '');
      if (clean === '' || clean === '/') return true;
      return /^\/[a-z]{2}\/?$/i.test(clean);
    }

    // The "Home" link must always be the FIRST top-level nav item. The
    // ecommerce generator injects the auto-built Products dropdown by replacing
    // the catalog/products link IN PLACE, so when the LLM happened to emit that
    // link before "Home" the dropdown rendered first (bug 2026-06: "Products,
    // Home, ..." across e-commerce sites). This deterministically hoists the
    // Home item back to the front on every reflow — runs before the overflow
    // pass so Home can never be pushed into "More".
    function reorderHomeFirst(menu) {
      var home = menu.querySelector(':scope > li.nav-home-item');
      if (!home) {
        var lis = Array.prototype.filter.call(menu.children, function (el) {
          return el.tagName === 'LI' && !(el.classList && el.classList.contains('zappy-nav-more-item'));
        });
        for (var i = 0; i < lis.length; i++) {
          var a = lis[i].querySelector(':scope > a');
          if (a && isHomeHref(a.getAttribute('href'))) { home = lis[i]; break; }
        }
      }
      if (home && menu.firstElementChild !== home) {
        menu.insertBefore(home, menu.firstElementChild);
      }
    }

    function reflow() {
      var menu = getMenu();
      if (!menu) return;
      if (mo) mo.disconnect();
      try {
        menu.classList.remove('zappy-desktop-wrap');
        clearMenuWidthOverride(menu);
        restore(menu);
        reorderHomeFirst(menu);
        if (window.innerWidth <= 768) return;

        // Drain trailing items into "More" until the items, AT THEIR NATURAL
        // CONTENT WIDTH, fit the navbar row. Using the row-fit test (instead of
        // the menu's own scrollWidth/clientWidth) means we never over-drain on a
        // navbar that actually has room: the abs-positioned dropdown panels no
        // longer count, and the flex gap intrinsic-sizing quirk (a content-
        // sized menu under-reporting its width by the total gap) no longer
        // matters. "More" is appended last and items leave from the END, so the
        // maximum number of items stays visible before "More".
        var more = null, sub = null, guard = 0;
        while (guard < 200) {
          guard++;
          if (!rowOverflowsAtWidth(menu, Math.ceil(naturalMenuWidth(menu)))) break;
          var reals = Array.prototype.filter.call(menu.children, function(li) {
            if (li === more || li.tagName !== 'LI') return false;
            // Never drain mobile-only items (the hamburger-overlay contact CTA
            // <li class="mobile-contact-link nav-cta-mobile-item">): they are
            // display:none on desktop and take no row space, but once moved
            // into the More panel its display:block li rule made them visible,
            // duplicating the navbar CTA inside "More" (bug 2026-07).
            if (li.classList && (li.classList.contains('mobile-contact-link') || li.classList.contains('nav-cta-mobile-item') || li.classList.contains('mobile-only'))) return false;
            try { if (getComputedStyle(li).display === 'none') return false; } catch (e) {}
            return true;
          });
          if (reals.length <= 1) break;
          if (!more) {
            more = makeMoreItem();
            menu.appendChild(more);
            sub = more.querySelector('.sub-menu');
          }
          var drained = reals[reals.length - 1];
          flattenNestedSubmenusForMore(drained);
          sub.insertBefore(drained, sub.firstChild);
        }
        if (more && sub && !sub.firstElementChild) more.remove();
        if (more) ensureMoreNestedAccordion(more);

        // The site's flex gap is excluded from a flex-basis:auto menu's
        // intrinsic width, so the menu box can be narrower than its items and
        // they spill over the search/cart icons. Pin the menu to its real
        // NATURAL content extent (only when it currently under-fits) so every
        // remaining item is fully visible. We drained until the row fits at this
        // natural width, so the pin is always safe. Cleared on the next reflow /
        // resize. Using naturalMenuWidth (not the possibly-shrunk inflow extent)
        // is what makes this correct on a tight RTL navbar.
        var ext = naturalMenuWidth(menu);
        if (ext > menu.clientWidth + TOL) {
          // forceMenuSizing pins width + neutralizes flex-grow/flex-basis so the
          // pin holds even under .nav-menu{flex:1 1 0%}. Cleared on next reflow.
          forceMenuSizing(menu, Math.ceil(ext));
          menu.setAttribute('data-zappy-nav-fitted', '1');
        }
      } finally {
        observe();
      }
    }

    function relabel() {
      var menu = getMenu();
      if (!menu) return;
      var lbl = menu.querySelector('.zappy-nav-more-label');
      if (lbl) lbl.textContent = moreLabel();
    }

    var t = null;
    function schedule() {
      if (t) clearTimeout(t);
      t = setTimeout(reflow, 150);
    }

    function observe() {
      if (!window.MutationObserver) return;
      var menu = getMenu();
      if (!menu) return;
      if (!mo) mo = new MutationObserver(function() { schedule(); });
      mo.observe(menu, { childList: true, subtree: true });
    }

    function init() {
      injectCss();
      reflow();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
    window.addEventListener('load', function() { injectCss(); reflow(); });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    window.addEventListener('popstate', function() { setTimeout(reflow, 0); });
    window.addEventListener('zappy:languageChanged', function() { setTimeout(function() { relabel(); reflow(); }, 0); });
    window.addEventListener('languageChanged', function() { setTimeout(function() { relabel(); reflow(); }, 0); });
    document.addEventListener('click', function(e) {
      var menu = getMenu();
      if (!menu) return;
      var more = menu.querySelector(':scope > .zappy-nav-more-item');
      if (more && more.classList.contains('open') && !more.contains(e.target)) {
        more.classList.remove('open');
        var tog = more.querySelector('.zappy-nav-more-toggle');
        if (tog) tog.setAttribute('aria-expanded', 'false');
      }
    }, true);
    setTimeout(reflow, 300);
    setTimeout(reflow, 1200);
  } catch (e) {}
})();

/* ZAPPY_NAV_MORE_POINTER_FIX_V4 */
(function(){
  try {
    if (window.__zappyNavMorePointerFixV4) return;
    window.__zappyNavMorePointerFixV4 = true;
    window.__zappyNavMorePointerFixV3 = true;
    window.__zappyNavMorePointerFixV2 = true;
    window.__zappyNavMorePointerFixV1 = true;

    var STYLE_ID = 'zappy-nav-more-pointer-fix';
    var applying = false;
    var cssText =
      '@media (min-width:769px){' +
        'html[dir="rtl"] body .navbar .zappy-nav-more-item > .sub-menu,' +
        'html[dir="rtl"] body .navbar .zappy-nav-more-item:hover > .sub-menu,' +
        'html[dir="rtl"] body .navbar .zappy-nav-more-item:focus-within > .sub-menu,' +
        'html[dir="rtl"] body .navbar .zappy-nav-more-item.open > .sub-menu{' +
          'left:auto!important;right:0!important;' +
        '}' +
        'html body .navbar .zappy-nav-more-item:not(:hover):not(:focus-within):not(.open) > .sub-menu,' +
        'html body .navbar .zappy-nav-more-item:not(:hover):not(:focus-within):not(.open) > .sub-menu *{' +
          'pointer-events:none!important;' +
        '}' +
        /* Constrain More panel: ecom-routing gives width:max-content + nowrap
           + overflow-y:auto (which promotes overflow-x:auto) → horizontal
           scrollbar on long Hebrew nested titles. */
        'html body .navbar .zappy-nav-more-item > .sub-menu{' +
          'width:min(420px,calc(100vw - 24px))!important;max-width:min(420px,calc(100vw - 24px))!important;' +
          'overflow-x:hidden!important;overflow-y:auto!important;box-sizing:border-box!important;' +
        '}' +
        'html body .navbar .zappy-nav-more-item > .sub-menu a{' +
          'white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;' +
          'max-width:100%!important;box-sizing:border-box!important;' +
        '}' +
        'html body .navbar .zappy-nav-more-item .sub-menu .sub-menu,' +
        'html body .navbar .zappy-nav-more-item > .sub-menu > li > .sub-menu,' +
        'html body .zappy-nav-more-item [data-zappy-more-flattened]{' +
          'position:static!important;display:none!important;opacity:0!important;visibility:hidden!important;' +
          'pointer-events:none!important;height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;' +
          'box-shadow:none!important;transform:none!important;width:100%!important;max-width:100%!important;' +
        '}' +
        'html body .navbar .zappy-nav-more-item .zappy-more-nested-open > .sub-menu,' +
        'html body .navbar .zappy-nav-more-item > .sub-menu > li.zappy-more-nested-open > .sub-menu{' +
          'display:block!important;opacity:1!important;visibility:visible!important;' +
          'pointer-events:auto!important;height:auto!important;' +
          'overflow-x:hidden!important;overflow-y:visible!important;' +
          'padding-inline-start:12px!important;width:100%!important;max-width:100%!important;' +
        '}' +
        '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-parent>a{' +
          'display:flex!important;align-items:center!important;justify-content:space-between!important;' +
          'gap:8px!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;' +
        '}' +
        '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-parent>a .dropdown-arrow{' +
          'display:inline-block!important;flex:0 0 auto!important;width:12px!important;height:12px!important;' +
          'margin-inline-start:auto!important;pointer-events:auto!important;cursor:pointer!important;' +
          'transition:transform .2s ease!important;opacity:1!important;visibility:visible!important;' +
        '}' +
        '.zappy-nav-more-item>.sub-menu>li.zappy-more-nested-open>a .dropdown-arrow{transform:rotate(180deg)!important;}' +
        'html body .navbar .zappy-nav-more-item:hover > .sub-menu,' +
        'html body .navbar .zappy-nav-more-item:focus-within > .sub-menu,' +
        'html body .navbar .zappy-nav-more-item.open > .sub-menu{' +
          'pointer-events:auto!important;' +
        '}' +
      '}';

    function ensureCss() {
      var s = document.getElementById(STYLE_ID);
      if (!s) {
        s = document.createElement('style');
        s.id = STYLE_ID;
      }
      if (s.textContent !== cssText) s.textContent = cssText;
      if (s.parentNode !== (document.head || document.documentElement)) {
        (document.head || document.documentElement).appendChild(s);
      } else if (s.nextSibling) {
        (document.head || document.documentElement).appendChild(s);
      }
    }

    function scrubFlattenedInlineLocks() {
      var nodes = document.querySelectorAll('[data-zappy-more-flattened]');
      for (var i = 0; i < nodes.length; i++) {
        var ul = nodes[i];
        if (ul.style.getPropertyValue('pointer-events')) ul.style.removeProperty('pointer-events');
        if (ul.style.getPropertyValue('opacity')) ul.style.removeProperty('opacity');
        if (ul.style.getPropertyValue('visibility')) ul.style.removeProperty('visibility');
        if (ul.style.getPropertyValue('display')) ul.style.removeProperty('display');
      }
    }

    function wireMoreNestedAccordion() {
      var more = document.querySelector('.zappy-nav-more-item');
      if (!more) return;
      var topSub = more.querySelector(':scope > .sub-menu');
      if (!topSub) return;
      var kids = topSub.children;
      for (var i = 0; i < kids.length; i++) {
        var li = kids[i];
        if (!li || li.tagName !== 'LI') continue;
        var nested = null;
        for (var c = 0; c < li.children.length; c++) {
          if (li.children[c].tagName === 'UL') { nested = li.children[c]; break; }
        }
        if (!nested) {
          li.classList.remove('zappy-more-nested-parent', 'zappy-more-nested-open');
          continue;
        }
        li.classList.add('zappy-more-nested-parent');
        if (!li.__zappyMoreNestedUserOpened) li.classList.remove('zappy-more-nested-open');
        var trigger = null;
        for (var t = 0; t < li.children.length; t++) {
          if (li.children[t].tagName === 'A') { trigger = li.children[t]; break; }
        }
        if (!trigger) continue;
        var arrow = trigger.querySelector('svg.dropdown-arrow');
        if (!arrow) {
          arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          arrow.setAttribute('class', 'dropdown-arrow');
          arrow.setAttribute('width', '12');
          arrow.setAttribute('height', '12');
          arrow.setAttribute('viewBox', '0 0 24 24');
          arrow.setAttribute('fill', 'none');
          arrow.setAttribute('stroke', 'currentColor');
          arrow.setAttribute('stroke-width', '2');
          arrow.setAttribute('aria-hidden', 'true');
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M6 9l6 6 6-6');
          arrow.appendChild(path);
          trigger.appendChild(arrow);
        }
        if (li.__zappyMoreNestedBound) continue;
        li.__zappyMoreNestedBound = true;
        (function(parentLi, arrowEl) {
          arrowEl.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var open = parentLi.classList.toggle('zappy-more-nested-open');
            parentLi.__zappyMoreNestedUserOpened = open;
          });
        })(li, arrow);
      }
    }

    function apply() {
      if (applying) return;
      applying = true;
      try {
        ensureCss();
        scrubFlattenedInlineLocks();
        wireMoreNestedAccordion();
      } finally {
        applying = false;
      }
    }

    var scheduled = false;
    function scheduleApply() {
      if (scheduled || applying) return;
      scheduled = true;
      setTimeout(function() {
        scheduled = false;
        apply();
      }, 0);
    }

    apply();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scheduleApply);
    }
    if (typeof MutationObserver === 'function') {
      var mo = new MutationObserver(scheduleApply);
      mo.observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'data-zappy-more-flattened']
      });
    }
  } catch (e) {}
})();

/* ZAPPY_ANNOUNCEMENT_HEADER_SYNC_V4 */
(function(){
  if (window.__zappyAnnouncementHeaderSyncV4) return;
  window.__zappyAnnouncementHeaderSyncV4 = true;
  window.__zappyAnnouncementHeaderSyncV3 = true;
  window.__zappyAnnouncementHeaderSyncV2 = true;
  window.__zappyAnnouncementHeaderSyncV1 = true; // legacy guards

  function primaryHeader() {
    var selectors = [
      'nav#navbar',
      'nav.navbar',
      '.navbar:not(.zappy-catalog-menu)',
      'nav[class*="nav"]',
      'header.navbar',
      'header:not([class*="gallery"]):not([class*="hero"]):not([class*="section"])'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (!el) continue;
      if (el.classList && el.classList.contains('zappy-catalog-menu')) continue;
      if (el.id === 'zappy-catalog-menu') continue;
      if (el.classList && el.classList.contains('mobile-search-panel')) continue;
      if (el.tagName === 'HEADER' && el.closest('section')) continue;
      if (el.classList && (
        el.classList.contains('lookbook-gallery-header') ||
        el.classList.contains('hero-header') ||
        el.classList.contains('section-header') ||
        el.classList.contains('page-header')
      )) continue;
      return el;
    }
    return null;
  }

  function visibleHeight(el) {
    if (!el) return 0;
    var cs;
    try { cs = window.getComputedStyle(el); } catch (e) {}
    if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return 0;
    var r = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    return Math.ceil((r && r.height) || el.offsetHeight || 0);
  }

  function sync() {
    var header = primaryHeader();
    var bar = document.querySelector('.zappy-announcement-bar');
    var catalog = document.querySelector('.zappy-catalog-menu');
    var barHeight = visibleHeight(bar);
    if (!header) {
      if (barHeight > 0) document.body.style.setProperty('padding-top', barHeight + 'px', 'important');
      return;
    }

    header.style.setProperty('position', 'fixed', 'important');
    header.style.setProperty('top', barHeight + 'px', 'important');
    header.style.setProperty('left', '0', 'important');
    header.style.setProperty('right', '0', 'important');
    header.style.setProperty('z-index', '100000', 'important');
    header.style.marginBottom = '0';

    var headerHeight = visibleHeight(header);
    var totalHeight = barHeight + headerHeight;
    if (catalog && visibleHeight(catalog) > 0) {
      catalog.style.marginTop = '0';
      catalog.style.setProperty('top', totalHeight + 'px', 'important');
      totalHeight += visibleHeight(catalog);
    }

    document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
    document.documentElement.style.setProperty('--total-header-height', totalHeight + 'px');
    document.documentElement.style.setProperty('--zappy-mobile-menu-top', (barHeight + headerHeight) + 'px');
    document.documentElement.style.setProperty('--zappy-announcement-height', barHeight + 'px');
    document.documentElement.style.setProperty('--zappy-header-stack-height', totalHeight + 'px');
    document.body.style.setProperty('padding-top', totalHeight + 'px', 'important');

    // Transparent nav: pull hero behind the fixed stack immediately.
    // Measure the navbar itself rather than trusting --nav-bg, which can be
    // absent on older published pages or during stylesheet failure. Critical
    // CSS also paints known opaque navbar colors before this runtime executes.
    // Keep selectors aligned with ZAPPY_ANNOUNCEMENT_HEADER_OFFSET_CSS_V3 —
    // never underlap bare main>section:first-child (catalog /products pages).
    var heroEl = document.querySelector('section[data-hero-type^="fullscreen"], .index-hero-section, main > section[class*="hero"]:first-of-type');
    if (heroEl && totalHeight > 0) {
      var headerIsTransparent = false;
      try {
        var headerStyle = getComputedStyle(header);
        var backgroundColor = headerStyle.backgroundColor || '';
        var backgroundImage = headerStyle.backgroundImage || 'none';
        var alphaMatch = backgroundColor.match(/rgba?\([^)]*[,\s]([0-9.]+)\s*\)$/i);
        headerIsTransparent =
          backgroundImage === 'none' &&
          (backgroundColor === 'transparent' || (alphaMatch && parseFloat(alphaMatch[1]) < 0.3));
      } catch (e) {}
      if (headerIsTransparent) {
        heroEl.style.setProperty('margin-top', '-' + totalHeight + 'px', 'important');
        heroEl.style.setProperty('padding-top', totalHeight + 'px', 'important');
        heroEl.setAttribute('data-zappy-nav-underlap', 'true');
      } else if (
        heroEl.getAttribute('data-zappy-nav-underlap') === 'true' ||
        (heroEl.style.marginTop === '-' + totalHeight + 'px' && heroEl.style.paddingTop === totalHeight + 'px')
      ) {
        heroEl.style.removeProperty('margin-top');
        heroEl.style.removeProperty('padding-top');
        heroEl.removeAttribute('data-zappy-nav-underlap');
      }
    }
  }

  var timer = null;
  function schedule(delay) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(sync, delay || 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ schedule(0); });
  } else {
    schedule(0);
  }
  window.addEventListener('load', function(){ schedule(0); });
  window.addEventListener('resize', function(){ schedule(50); }, { passive: true });
  window.addEventListener('zappy:languageChanged', function(){ schedule(50); });
  window.addEventListener('languageChanged', function(){ schedule(50); });
  [50, 150, 350, 750, 1500, 3000].forEach(function(ms){ setTimeout(sync, ms); });

  try {
    new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        var t = mutation.target;
        var classes = t && t.classList;
        if (mutation.type === 'childList') {
          for (var j = 0; j < mutation.addedNodes.length; j++) {
            var node = mutation.addedNodes[j];
            var nodeClasses = node && node.classList;
            if (nodeClasses && (
              nodeClasses.contains('zappy-announcement-bar') ||
              nodeClasses.contains('zappy-catalog-menu') ||
              nodeClasses.contains('navbar')
            )) {
              schedule(0);
              return;
            }
          }
        }
        if (
          (t === document.body && mutation.attributeName === 'class') ||
          (classes && (
          classes.contains('zappy-announcement-bar') ||
          classes.contains('zappy-catalog-menu')
        ))
        ) {
          schedule(0);
          return;
        }
      }
    }).observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  } catch (e) {}
})();

/* ZAPPY_MOBILE_MENU_CLOSED_ICONS_V1 */
(function(){
  if (window.__zappyMobileMenuClosedIconsV1) return;
  window.__zappyMobileMenuClosedIconsV1 = true;
  function reset() {
    var toggle = document.querySelector('.mobile-toggle, #mobileToggle');
    if (!toggle) return;
    var menu = document.querySelector('#navMenu, .nav-menu, .navbar-menu');
    var isOpen = !!(menu && (menu.classList.contains('active') || menu.classList.contains('open') || menu.style.display === 'block'));
    if (isOpen) return;
    toggle.classList.remove('active');
    var hi = toggle.querySelector('.hamburger-icon');
    var ci = toggle.querySelector('.close-icon');
    if (hi) hi.style.setProperty('display', 'block', 'important');
    if (ci) ci.style.setProperty('display', 'none', 'important');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reset);
  } else {
    reset();
  }
  [50, 200, 500].forEach(function(ms){ setTimeout(reset, ms); });
})();


/* ZAPPY_MOBILE_CATEGORIES_SUBMENU_GUARD_V1 */
(function(){
  if (window.__zappyMobileCategoriesSubmenuGuardV1) return;
  window.__zappyMobileCategoriesSubmenuGuardV1 = true;

  function injectCss() {
    if (document.getElementById('zappy-mobile-categories-submenu-css')) return;
    var s = document.createElement('style');
    s.id = 'zappy-mobile-categories-submenu-css';
    s.textContent =
      '.mobile-categories-submenu{display:none!important}' +
      '.mobile-categories-submenu.active{display:block!important}';
    (document.head || document.documentElement).appendChild(s);
  }

  function scrubOrphans() {
    document.querySelectorAll('.zappy-products-dropdown > .mobile-categories-submenu:not(.active), li.menu-item-has-children > .mobile-categories-submenu:not(.active)').forEach(function(el) {
      var parent = el.parentElement;
      if (parent && parent.querySelector(':scope > .sub-menu, :scope > ul.sub-menu')) {
        el.remove();
      }
    });
  }

  function wrapLegacyInit() {
    var orig = null;
    try {
      if (typeof window.initMobileCategoriesSubmenu === 'function') orig = window.initMobileCategoriesSubmenu;
    } catch (e) {}
    if (!orig) {
      try { if (typeof initMobileCategoriesSubmenu === 'function') orig = initMobileCategoriesSubmenu; } catch (e2) {}
    }
    if (!orig) return;
    var wrapped = function() {
      if (document.querySelector('.zappy-products-dropdown > .sub-menu, .zappy-products-dropdown > ul.sub-menu, #zappy-nav-category-links')) {
        scrubOrphans();
        return;
      }
      return orig.apply(this, arguments);
    };
    try { window.initMobileCategoriesSubmenu = wrapped; } catch (e3) {}
    try { initMobileCategoriesSubmenu = wrapped; } catch (e4) {}
  }

  injectCss();
  wrapLegacyInit();
  scrubOrphans();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ wrapLegacyInit(); scrubOrphans(); });
  }
  [50, 200, 800, 1600, 3200].forEach(function(ms){ setTimeout(function(){ wrapLegacyInit(); scrubOrphans(); }, ms); });
})();


/* ZAPPY_CUSTOMER_DISCOUNT_DELAYED_REFRESH_V1 */

/* ZAPPY_ECOM_STARTUP_PERF_GUARDS_V4 */

/* ZAPPY_ECOM_STARTUP_PERF_GUARDS_V1 */


/* ZAPPY_CUSTOMER_DISCOUNT_RUNTIME_V1 */
;(function() {
  if (window.__zappyCustomerDiscountRuntimeV1) return;
  window.__zappyCustomerDiscountRuntimeV1 = true;

  function apiUrl(path) {
    var base = window.ZAPPY_API_BASE || '';
    if (base.endsWith('/')) base = base.slice(0, -1);
    return base + path;
  }

  function getDiscount(productId) {
    var cfg = window.__zappyCustomerDiscountConfig;
    if (!cfg || !cfg.discountPercent) return null;
    var excluded = cfg.excludedProductIds || [];
    if (excluded.indexOf(productId) !== -1) return null;
    return cfg;
  }

  function applyPercent(basePrice, productId) {
    var d = getDiscount(productId);
    if (!d || !Number.isFinite(basePrice) || basePrice <= 0) {
      return { price: basePrice, applied: false };
    }
    var discounted = basePrice - (basePrice * parseFloat(d.discountPercent) / 100);
    if (!Number.isFinite(discounted) || discounted >= basePrice) {
      return { price: basePrice, applied: false };
    }
    return { price: discounted, applied: true, originalPrice: basePrice };
  }

  window.__zappyApplyCustomerPercentToPrice = applyPercent;

  function currencyFromText(text) {
    var m = String(text || '').match(/[₪$€£]/);
    return m ? m[0] : '₪';
  }

  function isPriceAlreadyCustomerDiscounted(priceEl, productId) {
    if (!priceEl) return true;
    if (priceEl.getAttribute('data-customer-discount-applied')) return true;
    // Sale / seasonal strikethrough also uses .original-price — only skip when the
    // visible price already matches a customer discount computed from the
    // strikethrough base (generator path that omits data-customer-discount-applied).
    var origEl = priceEl.querySelector('.original-price');
    if (!origEl || !productId) return false;
    var raw = priceEl.textContent || '';
    var nums = raw.match(/[\d,.]+/g);
    if (!nums || !nums.length) return false;
    var displayed = parseFloat(nums[0].replace(/,/g, ''));
    var origNums = (origEl.textContent || '').match(/[\d,.]+/g);
    if (!origNums || !origNums.length) return false;
    var preCustomerBase = parseFloat(origNums[origNums.length - 1].replace(/,/g, ''));
    if (!Number.isFinite(displayed) || !Number.isFinite(preCustomerBase)) return false;
    var adj = applyPercent(preCustomerBase, productId);
    if (!adj.applied) return false;
    return Math.abs(displayed - adj.price) < 0.02;
  }

  function applyPricesToCards() {
    if (!window.__zappyCustomerDiscountConfig || !window.__zappyCustomerDiscountConfig.discountPercent) return;
    document.querySelectorAll('[data-product-id]').forEach(function(card) {
      var pid = card.getAttribute('data-product-id');
      var priceEl = card.querySelector('.price') || card.querySelector('.product-price');
      if (!priceEl || isPriceAlreadyCustomerDiscounted(priceEl, pid)) return;
      var raw = priceEl.textContent || '';
      var starting = /(?:Starting at|החל מ)/i.test(raw);
      var nums = raw.match(/[\d,.]+/g);
      if (!nums || !nums.length) return;
      var base = parseFloat(nums[0].replace(/,/g, ''));
      if (!Number.isFinite(base) || base <= 0) return;
      var adj = applyPercent(base, pid);
      if (!adj.applied) return;
      var sym = currencyFromText(raw);
      if (starting) {
        var prefix = raw.match(/(?:Starting at|החל מ)/i);
        var label = prefix ? prefix[0] : 'Starting at';
        priceEl.innerHTML = label + ' ' + sym + adj.price.toFixed(2) + ' <span class="original-price">' + sym + base.toFixed(2) + '</span>';
      } else {
        priceEl.innerHTML = sym + adj.price.toFixed(2) + ' <span class="original-price">' + sym + base.toFixed(2) + '</span>';
      }
      priceEl.setAttribute('data-customer-discount-applied', '1');
    });
  }

  function refreshProductDetailPrice() {
    if (!window.currentProduct || !window.__zappyCustomerDiscountConfig) return;
    if (typeof window.__zappyUpdateVariantUI === 'function' && window.productTranslations) {
      window.__zappyUpdateVariantUI(window.selectedVariant || null, window.currentProduct, window.productTranslations, {});
      return;
    }
    var priceEl = document.getElementById('product-price-display');
    if (!priceEl || isPriceAlreadyCustomerDiscounted(priceEl, window.currentProduct.id)) return;
    var raw = priceEl.textContent || '';
    var starting = /(?:Starting at|החל מ)/i.test(raw);
    var nums = raw.match(/[\d,.]+/g);
    if (!nums || !nums.length) return;
    var base = parseFloat((starting && nums.length > 1 ? nums[nums.length - 1] : nums[0]).replace(/,/g, ''));
    if (!Number.isFinite(base) || base <= 0) return;
    var adj = applyPercent(base, window.currentProduct.id);
    if (!adj.applied) return;
    var sym = currencyFromText(raw);
    if (starting) {
      var prefix = raw.match(/(?:Starting at|החל מ)/i);
      var label = prefix ? prefix[0] : 'Starting at';
      priceEl.innerHTML = label + ' ' + sym + adj.price.toFixed(2) + ' <span class="original-price">' + sym + base.toFixed(2) + '</span>';
    } else {
      priceEl.innerHTML = sym + adj.price.toFixed(2) + ' <span class="original-price">' + sym + base.toFixed(2) + '</span>';
    }
    priceEl.setAttribute('data-customer-discount-applied', '1');
  }

  async function syncCustomerDiscount() {
    if (typeof window.__zappyFetchCustomerDiscount === 'function') {
      try {
        await window.__zappyFetchCustomerDiscount();
      } catch (e) {
        console.warn('[ZAPPY] Customer discount runtime delegate failed', e);
      }
      applyPricesToCards();
      refreshProductDetailPrice();
      if (typeof window.loadProducts === 'function') {
        try { window.loadProducts(); } catch (e) {}
      }
      if (typeof window.__zappyScheduleDynamicProductGridsDiscountRefresh === 'function') {
        try { window.__zappyScheduleDynamicProductGridsDiscountRefresh(); } catch (e) {}
      }
      [800, 2500].forEach(function(ms) {
        setTimeout(refreshProductDetailPrice, ms);
      });
      return;
    }
    var wid = window.ZAPPY_WEBSITE_ID;
    if (!wid) return;
    var token = localStorage.getItem('zappy_customer_token_' + wid);
    if (!token) {
      window.__zappyCustomerDiscountConfig = null;
      return;
    }
    try {
      var res = await fetch(apiUrl('/api/ecommerce/storefront/customer-discount?websiteId=' + encodeURIComponent(wid)), {
        headers: { Authorization: 'Bearer ' + token }
      });
      var data = await res.json();
      if (data.success && data.data && data.data.discountPercent > 0) {
        window.__zappyCustomerDiscountConfig = data.data;
      } else {
        window.__zappyCustomerDiscountConfig = null;
      }
    } catch (e) {
      console.warn('[ZAPPY] Customer discount runtime fetch failed', e);
      window.__zappyCustomerDiscountConfig = null;
    }
    applyPricesToCards();
    refreshProductDetailPrice();
    if (typeof window.loadProducts === 'function') {
      try { window.loadProducts(); } catch (e) {}
    }
    if (typeof window.__zappyScheduleDynamicProductGridsDiscountRefresh === 'function') {
      try { window.__zappyScheduleDynamicProductGridsDiscountRefresh(); } catch (e) {}
    }
    [800, 2500].forEach(function(ms) {
      setTimeout(refreshProductDetailPrice, ms);
    });
  }

  function boot() {
    syncCustomerDiscount();
    var detail = document.getElementById('product-detail');
    if (detail && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function() {
        refreshProductDetailPrice();
      }).observe(detail, { childList: true, subtree: true });
    }
    var grid = document.getElementById('zappy-product-grid');
    if (grid && typeof MutationObserver !== 'undefined') {
      new MutationObserver(function() {
        applyPricesToCards();
      }).observe(grid, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

/* ZAPPY_CART_BUNDLE_DISCOUNT_V4 */
;(function() {
  if (window.__zappyCartAutomaticDiscountRuntimeV4) return;
  window.__zappyCartAutomaticDiscountRuntimeV4 = true;

  function getWebsiteId() {
    return window.ZAPPY_WEBSITE_ID || document.body.getAttribute('data-website-id') || document.documentElement.getAttribute('data-website-id') || '';
  }

  function apiUrl(path) {
    var base = window.ZAPPY_API_BASE || window.location.origin || '';
    if (base.endsWith('/')) base = base.slice(0, -1);
    return base + path;
  }

  function readCart() {
    var wid = getWebsiteId();
    if (!wid) return [];
    try {
      var cart = JSON.parse(localStorage.getItem('zappy_cart_' + wid) || '[]');
      return Array.isArray(cart) ? cart : [];
    } catch (e) {
      return [];
    }
  }

  function formatMoney(amount) {
    if (typeof window.zappyFormatMoney === 'function') {
      try { return window.zappyFormatMoney(amount); } catch (e) {}
    }
    var sym = '₪';
    try {
      if (window.zappyStoreSettings && window.zappyStoreSettings.currencySymbol) {
        sym = window.zappyStoreSettings.currencySymbol;
      }
    } catch (e) {}
    return sym + (parseFloat(amount) || 0).toFixed(2);
  }

  function getEcomLabel(key, fallback) {
    if (typeof getEcomText === 'function') {
      try {
        var v = getEcomText(key, fallback);
        if (v) return v;
      } catch (e) {}
    }
    return fallback;
  }

  function getUnitPrice(item) {
    if (item && item.selectedVariant && item.selectedVariant.price != null && item.selectedVariant.price !== '') {
      var vp = parseFloat(item.selectedVariant.price);
      if (Number.isFinite(vp)) return vp;
    }
    if (item && item.displayPrice != null && item.displayPrice !== '') {
      var dp = parseFloat(item.displayPrice);
      if (Number.isFinite(dp)) return dp;
    }
    var reg = parseFloat(item && item.price);
    var sale = parseFloat(item && item.sale_price);
    if (Number.isFinite(sale) && Number.isFinite(reg) && sale < reg) return sale;
    return Number.isFinite(reg) ? reg : 0;
  }

  function getLineTotal(item) {
    var price = getUnitPrice(item);
    var qty = parseInt(item.quantity, 10) || 1;
    var step = parseFloat(item.quantityStep || item.quantity_step) || 1;
    var unit = (item.quantityUnit || item.quantity_unit || 'piece');
    if (unit === 'piece') return price * qty;
    return price * (qty / step);
  }

  function getProductId(item) {
    return String((item && (item.productId || item.id)) || '');
  }

  function idListContains(ids, id) {
    var idStr = String(id || '');
    for (var i = 0; i < ids.length; i++) {
      if (String(ids[i]) === idStr) return true;
    }
    return false;
  }

  function getCartSubtotal(cart) {
    var total = 0;
    for (var i = 0; i < cart.length; i++) total += getLineTotal(cart[i]);
    return total;
  }

  function calcBestBundleGroupDiscount(groupBundles, unitPrices) {
    if (!groupBundles.length || !unitPrices.length) return 0;
    unitPrices.sort(function(a, c) { return c - a; });

    var prefixSums = [0];
    for (var i = 0; i < unitPrices.length; i++) {
      prefixSums.push(prefixSums[prefixSums.length - 1] + unitPrices[i]);
    }

    var dp = [0];
    for (var n = 1; n <= unitPrices.length; n++) {
      var best = dp[n - 1] || 0;
      for (var b = 0; b < groupBundles.length; b++) {
        var tier = groupBundles[b];
        if (n < tier.qty) continue;
        var groupSum = prefixSums[n] - prefixSums[n - tier.qty];
        var saving = Math.max(0, groupSum - tier.bPrice);
        if (saving <= 0) continue;
        best = Math.max(best, (dp[n - tier.qty] || 0) + saving);
      }
      dp[n] = best;
    }
    return dp[unitPrices.length] || 0;
  }

  function calcBundleDiscount(bundles, cart) {
    var groups = {};
    for (var i = 0; i < bundles.length; i++) {
      var b = bundles[i];
      var qty = parseInt(b.quantity, 10);
      var bPrice = parseFloat(b.bundlePrice);
      if (!qty || qty < 2 || !Number.isFinite(bPrice) || bPrice < 0) continue;

      var ids = Array.isArray(b.eligibleProductIds) ? b.eligibleProductIds.map(function(id) { return String(id || ''); }).filter(Boolean).sort() : [];
      var appliesToAll = b.appliesTo === 'all';
      if (!appliesToAll && ids.length === 0) continue;

      var key = appliesToAll ? 'all' : ('products:' + ids.join('|'));
      if (!groups[key]) groups[key] = { appliesToAll: appliesToAll, ids: ids, bundles: [] };
      groups[key].bundles.push({ qty: qty, bPrice: bPrice });
    }

    var totalDiscount = 0;
    Object.keys(groups).forEach(function(key) {
      var group = groups[key];
      var unitPrices = [];
      for (var j = 0; j < cart.length; j++) {
        var item = cart[j];
        var itemId = getProductId(item);
        if (!group.appliesToAll && !idListContains(group.ids, itemId)) continue;
        var uPrice = getUnitPrice(item);
        var itemQty = parseInt(item.quantity, 10) || 1;
        for (var k = 0; k < itemQty; k++) unitPrices.push(uPrice);
      }
      totalDiscount += calcBestBundleGroupDiscount(group.bundles, unitPrices);
    });
    return totalDiscount;
  }

  function calcSeasonalDiscount(discounts, cart) {
    var totalDiscount = 0;
    for (var i = 0; i < discounts.length; i++) {
      var d = discounts[i];
      var ids = Array.isArray(d.product_ids) ? d.product_ids : [];
      var appliesToAll = d.applies_to === 'all' || ids.length === 0;
      var eligibleSubtotal = 0;

      for (var j = 0; j < cart.length; j++) {
        var item = cart[j];
        if (appliesToAll || idListContains(ids, getProductId(item))) {
          eligibleSubtotal += getLineTotal(item);
        }
      }

      var value = parseFloat(d.value);
      if (!Number.isFinite(value) || eligibleSubtotal <= 0) continue;
      if (d.type === 'percentage') {
        totalDiscount += (eligibleSubtotal * value) / 100;
      } else if (d.type === 'fixed') {
        totalDiscount += Math.min(value, eligibleSubtotal);
      }
    }
    return totalDiscount;
  }

  function calcCustomerDiscount(cart) {
    var cfg = window.__zappyCustomerDiscountConfig;
    var percent = parseFloat(cfg && (cfg.discountPercent || cfg.discount_percent));
    if (!Number.isFinite(percent) || percent <= 0) return 0;

    var excluded = Array.isArray(cfg.excludedProductIds)
      ? cfg.excludedProductIds
      : (Array.isArray(cfg.excluded_product_ids) ? cfg.excluded_product_ids : []);
    var eligibleSubtotal = 0;
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      if (!idListContains(excluded, getProductId(item))) {
        eligibleSubtotal += getLineTotal(item);
      }
    }
    return eligibleSubtotal > 0 ? (eligibleSubtotal * percent) / 100 : 0;
  }

  function injectCss() {
    var css =
      '.cart-drawer-footer .zappy-cart-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:.95rem;margin-bottom:8px}' +
      '.cart-drawer-footer .cart-drawer-subtotal,.cart-drawer-footer .cart-drawer-subtotal span{color:var(--zappy-cart-drawer-total-color,var(--text-light,#f9fafb))}' +
      '.cart-drawer-footer .zappy-cart-discount-row{color:var(--primary-color,var(--accent,var(--primary,#059669)));font-weight:500}' +
      '.cart-drawer-subtotal,.cart-drawer-bundle-discount,.cart-drawer-seasonal-discount,.cart-drawer-customer-discount{display:none}';
    var style = document.getElementById('zappy-cart-bundle-discount-css');
    if (style) {
      style.textContent = css;
      return;
    }
    style = document.createElement('style');
    style.id = 'zappy-cart-bundle-discount-css';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function ensureSummaryRows() {
    var footer = document.querySelector('#cart-drawer .cart-drawer-footer');
    if (!footer) return null;
    var totalRow = footer.querySelector('.cart-drawer-total');
    if (!totalRow) return null;

    var subtotalRow = footer.querySelector('.cart-drawer-subtotal');
    if (!subtotalRow) {
      subtotalRow = document.createElement('div');
      subtotalRow.className = 'cart-drawer-subtotal zappy-cart-summary-row';
      subtotalRow.innerHTML = '<span class="cart-drawer-subtotal-label"></span><span id="cart-drawer-subtotal"></span>';
      footer.insertBefore(subtotalRow, totalRow);
    }

    var bundleRow = footer.querySelector('.cart-drawer-bundle-discount');
    if (!bundleRow) {
      bundleRow = document.createElement('div');
      bundleRow.className = 'cart-drawer-bundle-discount zappy-cart-summary-row zappy-cart-discount-row';
      bundleRow.innerHTML = '<span class="cart-drawer-bundle-discount-label"></span><span id="cart-drawer-bundle-discount"></span>';
      footer.insertBefore(bundleRow, totalRow);
    }

    var seasonalRow = footer.querySelector('.cart-drawer-seasonal-discount');
    if (!seasonalRow) {
      seasonalRow = document.createElement('div');
      seasonalRow.className = 'cart-drawer-seasonal-discount zappy-cart-summary-row zappy-cart-discount-row';
      seasonalRow.innerHTML = '<span class="cart-drawer-seasonal-discount-label"></span><span id="cart-drawer-seasonal-discount"></span>';
      footer.insertBefore(seasonalRow, totalRow);
    }

    var customerRow = footer.querySelector('.cart-drawer-customer-discount');
    if (!customerRow) {
      customerRow = document.createElement('div');
      customerRow.className = 'cart-drawer-customer-discount zappy-cart-summary-row zappy-cart-discount-row';
      customerRow.innerHTML = '<span class="cart-drawer-customer-discount-label"></span><span id="cart-drawer-customer-discount"></span>';
      footer.insertBefore(customerRow, totalRow);
    }

    return { subtotalRow: subtotalRow, bundleRow: bundleRow, seasonalRow: seasonalRow, customerRow: customerRow, totalRow: totalRow };
  }

  function getDrawerTotalEl() {
    var el = document.getElementById('cart-drawer-total');
    if (el) return el;
    var legacy = document.querySelector('#cart-drawer .cart-drawer-total');
    if (!legacy) return null;
    legacy.innerHTML = '<span>' + getEcomLabel('total', 'Total') + ':</span><span id="cart-drawer-total">' + formatMoney(0) + '</span>';
    return document.getElementById('cart-drawer-total');
  }

  var bundlesCache = null;
  var bundlesLoading = null;
  var seasonalCache = null;
  var seasonalLoading = null;
  var customerLoading = null;

  function loadBundles() {
    if (bundlesCache) return Promise.resolve(bundlesCache);
    if (bundlesLoading) return bundlesLoading;
    var wid = getWebsiteId();
    if (!wid) return Promise.resolve([]);
    bundlesLoading = fetch(apiUrl('/api/ecommerce/storefront/quantity-bundles?websiteId=' + encodeURIComponent(wid)))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        bundlesCache = (data && data.success && Array.isArray(data.data)) ? data.data : [];
        return bundlesCache;
      })
      .catch(function() {
        bundlesCache = [];
        return bundlesCache;
      })
      .finally(function() { bundlesLoading = null; });
    return bundlesLoading;
  }

  function loadSeasonalDiscounts() {
    if (seasonalCache) return Promise.resolve(seasonalCache);
    if (seasonalLoading) return seasonalLoading;
    var wid = getWebsiteId();
    if (!wid) return Promise.resolve([]);
    seasonalLoading = fetch(apiUrl('/api/ecommerce/storefront/seasonal-discounts?websiteId=' + encodeURIComponent(wid)))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        seasonalCache = (data && data.success && Array.isArray(data.data)) ? data.data : [];
        return seasonalCache;
      })
      .catch(function() {
        seasonalCache = [];
        return seasonalCache;
      })
      .finally(function() { seasonalLoading = null; });
    return seasonalLoading;
  }

  function hasActiveCustomerDiscount() {
    var cfg = window.__zappyCustomerDiscountConfig;
    var percent = parseFloat(cfg && (cfg.discountPercent || cfg.discount_percent));
    return Number.isFinite(percent) && percent > 0;
  }

  function loadCustomerDiscount() {
    var wid = getWebsiteId();
    if (!wid) return Promise.resolve(null);
    var token = null;
    try { token = localStorage.getItem('zappy_customer_token_' + wid); } catch (e) {}
    if (!token) {
      window.__zappyCustomerDiscountConfig = null;
      return Promise.resolve(null);
    }
    if (hasActiveCustomerDiscount()) {
      return Promise.resolve(window.__zappyCustomerDiscountConfig);
    }
    if (customerLoading) return customerLoading;

    if (typeof window.__zappyFetchCustomerDiscount === 'function') {
      customerLoading = Promise.resolve(window.__zappyFetchCustomerDiscount())
        .then(function() { return window.__zappyCustomerDiscountConfig || null; })
        .catch(function() { return null; })
        .finally(function() { customerLoading = null; });
      return customerLoading;
    }

    customerLoading = fetch(apiUrl('/api/ecommerce/storefront/customer-discount?websiteId=' + encodeURIComponent(wid)), {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        window.__zappyCustomerDiscountConfig = (data && data.success && data.data && data.data.discountPercent > 0) ? data.data : null;
        return window.__zappyCustomerDiscountConfig;
      })
      .catch(function() {
        window.__zappyCustomerDiscountConfig = null;
        return null;
      })
      .finally(function() { customerLoading = null; });
    return customerLoading;
  }

  function updateCartDrawerSummary() {
    injectCss();
    var drawerTotal = getDrawerTotalEl();
    var rows = ensureSummaryRows();
    if (!drawerTotal || !rows) return;
    try {
      var totalColor = window.getComputedStyle(rows.totalRow || drawerTotal).color;
      if (totalColor) {
        rows.subtotalRow.style.setProperty('--zappy-cart-drawer-total-color', totalColor);
      }
    } catch (e) {}

    var cart = readCart();
    if (!cart.length) {
      rows.subtotalRow.style.display = 'none';
      rows.bundleRow.style.display = 'none';
      rows.seasonalRow.style.display = 'none';
      rows.customerRow.style.display = 'none';
      drawerTotal.setAttribute('data-zappy-auto-discount', '0');
      drawerTotal.textContent = formatMoney(0);
      return;
    }

    var subtotal = getCartSubtotal(cart);
    var bundleDisc = calcBundleDiscount(bundlesCache || [], cart);
    var seasonalDisc = calcSeasonalDiscount(seasonalCache || [], cart);
    var customerDisc = calcCustomerDiscount(cart);
    var autoDiscount = (bundleDisc || 0) + (seasonalDisc || 0) + (customerDisc || 0);
    if (autoDiscount > subtotal) autoDiscount = subtotal;
    var finalTotal = subtotal - autoDiscount;
    var showBreakdown = autoDiscount > 0.005;
    var remainingDiscount = autoDiscount;
    var displayBundleDiscount = Math.min(Math.max(bundleDisc || 0, 0), remainingDiscount);
    remainingDiscount -= displayBundleDiscount;
    var displaySeasonalDiscount = Math.min(Math.max(seasonalDisc || 0, 0), remainingDiscount);
    remainingDiscount -= displaySeasonalDiscount;
    var displayCustomerDiscount = Math.min(Math.max(customerDisc || 0, 0), remainingDiscount);

    rows.subtotalRow.style.display = showBreakdown ? 'flex' : 'none';
    rows.bundleRow.style.display = displayBundleDiscount > 0.005 ? 'flex' : 'none';
    rows.seasonalRow.style.display = displaySeasonalDiscount > 0.005 ? 'flex' : 'none';
    rows.customerRow.style.display = displayCustomerDiscount > 0.005 ? 'flex' : 'none';

    if (showBreakdown) {
      var subLabel = rows.subtotalRow.querySelector('.cart-drawer-subtotal-label');
      if (subLabel) subLabel.textContent = getEcomLabel('subtotal', 'Subtotal') + ':';
      var subEl = document.getElementById('cart-drawer-subtotal');
      if (subEl) subEl.textContent = formatMoney(subtotal);
    }

    if (displayBundleDiscount > 0.005) {
      var bundleLabel = rows.bundleRow.querySelector('.cart-drawer-bundle-discount-label');
      if (bundleLabel) bundleLabel.textContent = getEcomLabel('bundleDiscount', 'Bundle Discount') + ':';
      var bundleEl = document.getElementById('cart-drawer-bundle-discount');
      if (bundleEl) bundleEl.textContent = '-' + formatMoney(displayBundleDiscount);
    }

    if (displaySeasonalDiscount > 0.005) {
      var seasonalLabel = rows.seasonalRow.querySelector('.cart-drawer-seasonal-discount-label');
      if (seasonalLabel) seasonalLabel.textContent = getEcomLabel('seasonalDiscount', 'Seasonal Discount') + ':';
      var seasonalEl = document.getElementById('cart-drawer-seasonal-discount');
      if (seasonalEl) seasonalEl.textContent = '-' + formatMoney(displaySeasonalDiscount);
    }

    if (displayCustomerDiscount > 0.005) {
      var customerLabel = rows.customerRow.querySelector('.cart-drawer-customer-discount-label');
      if (customerLabel) customerLabel.textContent = getEcomLabel('customerDiscount', 'Customer Discount') + ':';
      var customerEl = document.getElementById('cart-drawer-customer-discount');
      if (customerEl) customerEl.textContent = '-' + formatMoney(displayCustomerDiscount);
    }

    drawerTotal.setAttribute('data-zappy-auto-discount', String(autoDiscount));
    drawerTotal.textContent = formatMoney(finalTotal);
  }

  function refreshSummary() {
    Promise.all([loadBundles(), loadSeasonalDiscounts(), loadCustomerDiscount()]).then(function() {
      updateCartDrawerSummary();
    });
  }

  function wrapRenderCartDrawer() {
    var orig = window.zappyRenderCartDrawer;
    if (typeof orig === 'function' && !orig.__zappyAutomaticDiscountWrappedV4) {
      window.zappyRenderCartDrawer = function() {
        var result = orig.apply(this, arguments);
        refreshSummary();
        return result;
      };
      window.zappyRenderCartDrawer.__zappyAutomaticDiscountWrappedV4 = true;
    }
  }

  function wrapFn(name) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__zappyAutomaticDiscountWrappedV4) return;
    window[name] = function() {
      var result = orig.apply(this, arguments);
      refreshSummary();
      return result;
    };
    window[name].__zappyAutomaticDiscountWrappedV4 = true;
  }

  function wrapCartMutators() {
    // addToCart/saveCart call the closure's renderCartDrawer directly (not
    // window.zappyRenderCartDrawer), so wrap zappyAddToCart too — otherwise
    // adding a line while the drawer is already open leaves discount rows stale.
    wrapFn('zappyAddToCart');
    wrapFn('zappyUpdateQty');
    wrapFn('zappyRemoveFromCart');
    wrapRenderCartDrawer();
  }

  // Ignore MutationObserver callbacks caused by our own summary DOM writes so
  // we can watch cart line item updates (childList) without the V3 feedback loop.
  var summaryWriteDepth = 0;
  var _updateCartDrawerSummary = updateCartDrawerSummary;
  updateCartDrawerSummary = function() {
    summaryWriteDepth++;
    try {
      return _updateCartDrawerSummary.apply(this, arguments);
    } finally {
      summaryWriteDepth--;
    }
  };

  function watchCartDrawer() {
    var drawer = document.getElementById('cart-drawer');
    if (!drawer || drawer.__zappyAutomaticDiscountObservedV4) return;
    drawer.__zappyAutomaticDiscountObservedV4 = true;
    // Also stamp V3 so a leftover V3 IIFE cannot attach the looping observer.
    drawer.__zappyAutomaticDiscountObservedV3 = true;
    var scheduled = false;
    var obs = new MutationObserver(function() {
      if (!drawer.classList.contains('active')) return;
      if (summaryWriteDepth > 0) return;
      if (scheduled) return;
      scheduled = true;
      setTimeout(function() {
        scheduled = false;
        if (summaryWriteDepth > 0) return;
        refreshSummary();
      }, 0);
    });
    // class = open/close; childList/subtree = line-item re-renders from the
    // closure's renderCartDrawer (addToCart while drawer already open).
    // Do NOT observe characterData without the summaryWriteDepth guard — and
    // never call refreshSummary synchronously from the observer (V3 freeze).
    obs.observe(drawer, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
  }

  function boot() {
    wrapCartMutators();
    watchCartDrawer();
    refreshSummary();
  }

  boot();
  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', function() { setTimeout(boot, 100); });
  setTimeout(boot, 500);
  setTimeout(boot, 1500);
  document.addEventListener('click', function(event) {
    if (event.target && event.target.closest && event.target.closest('#cart-drawer-toggle, [data-cart-toggle], .cart-link.nav-cart, a.nav-cart')) {
      setTimeout(refreshSummary, 50);
      setTimeout(refreshSummary, 400);
    }
  }, true);
})();

/* ZAPPY_CART_BUNDLE_SUMMARY_COLOR_V3 */
;(function(){var id='zappy-cart-bundle-summary-color-css';var css='.cart-drawer-footer .zappy-cart-summary-row{display:flex;justify-content:space-between;align-items:center;font-size:.95rem;margin-bottom:8px}.cart-drawer-footer .cart-drawer-subtotal,.cart-drawer-footer .cart-drawer-subtotal span{color:var(--zappy-cart-drawer-total-color,var(--text-light,#f9fafb))}.cart-drawer-footer .zappy-cart-discount-row{color:var(--primary-color,var(--accent,var(--primary,#059669)));font-weight:500}';var el=document.getElementById(id);if(el){el.textContent=css;}else{var s=document.createElement('style');s.id=id;s.textContent=css;(document.head||document.documentElement).appendChild(s);}function sync(){var f=document.querySelector('.cart-drawer-footer');var total=document.querySelector('.cart-drawer-footer .cart-drawer-total');if(!f||!total)return;try{var c=getComputedStyle(total).color;if(c)f.style.setProperty('--zappy-cart-drawer-total-color',c);}catch(e){}}sync();document.addEventListener('DOMContentLoaded',sync);window.addEventListener('load',sync);setTimeout(sync,50);setTimeout(sync,500);})();
