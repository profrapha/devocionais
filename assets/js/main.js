// Configurações globais
const CONFIG = {
    dataUrl: 'data/devocionais.json',
    imagesPath: 'assets/images/',
    defaultImage: null,
    animationDuration: 300
};

// Estado da aplicação
let appState = {
    devocionais: {},
    currentDay: 1,
    isLoading: false,
    searchResults: []
};

// Elementos DOM
const elements = {
    currentDate: document.getElementById('currentDate'),
    dayCounter: document.getElementById('dayCounter'),
    devocionalTitle: document.getElementById('devocionalTitle'),
    principioCentral: document.getElementById('principioCentral'),
    versiculoDia: document.getElementById('versiculoDia'),
    penseNisso: document.getElementById('penseNisso'),
    conectandoPontos: document.getElementById('conectandoPontos'),
    desafioPratico: document.getElementById('desafioPratico'),
    oracaoGuia: document.getElementById('oracaoGuia'),
    dateSelector: document.getElementById('dateSelector'),
    searchInput: document.getElementById('searchInput'),
    imageContainer: document.getElementById('imageContainer'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// Utilitários
const utils = {
    // Obter dia do ano
    getDayOfYear(date = new Date()) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    },

    // Formatar data
    formatDate(date) {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Capitalizar primeira letra
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Debounce para busca
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Sanitizar HTML
    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Converter texto para HTML com quebras de linha
    textToHtml(text) {
        return text.replace(/\n/g, '<br>');
    }
};

// Gerenciador de loading
const loadingManager = {
    show() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('active');
        }
        appState.isLoading = true;
    },

    hide() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('active');
        }
        appState.isLoading = false;
    }
};

// Gerenciador de dados
const dataManager = {
    async loadDevocionais() {
        try {
            loadingManager.show();
            
            const response = await fetch(CONFIG.dataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            appState.devocionais = data;
            
            console.log('Devocionais carregados:', Object.keys(data).length);
            return data;
        } catch (error) {
            console.error('Erro ao carregar devocionais:', error);
            this.loadDefaultData();
            return appState.devocionais;
        } finally {
            loadingManager.hide();
        }
    },

    loadDefaultData() {
        // Dados padrão caso não consiga carregar do arquivo
        appState.devocionais = {
            1: {
                data: "1º de Janeiro",
                titulo: "Novo Começo",
                principioCentral: "Soli Deo Gloria (A Glória Somente a Deus)",
                versiculoDia: "\"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais.\" - Jeremias 29:11",
                penseNisso: "Um novo ano se inicia, trazendo consigo esperanças, sonhos e a oportunidade de recomeçar. Como educadores cristãos, sabemos que cada novo dia é uma dádiva de Deus e uma chance de impactar vidas para a eternidade.",
                conectandoPontos: "A teologia reformada nos ensina que Deus é soberano sobre todas as coisas, incluindo nosso futuro. Quando confiamos em Seus planos, podemos enfrentar o novo ano com esperança e determinação, sabendo que Ele está no controle.",
                desafioPratico: "Hoje, dedique alguns minutos para orar pelo novo ano que se inicia. Peça a Deus sabedoria para as decisões que virão e coragem para ser uma luz em sua área de atuação.",
                oracaoGuia: "\"Senhor, obrigado por este novo ano que se inicia. Ajuda-me a confiar em Teus planos e a ser um instrumento de Tua graça em tudo que fizer. Que minha vida traga glória ao Teu nome. Amém.\"",
                imagem: null
            }
        };
        
        // Gerar dados padrão para todos os 366 dias
        for (let i = 2; i <= 366; i++) {
            const date = new Date(2025, 0, i);
            appState.devocionais[i] = {
                data: utils.formatDate(date),
                titulo: `Devocional do Dia ${i}`,
                principioCentral: "Soli Deo Gloria (A Glória Somente a Deus)",
                versiculoDia: "\"Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus.\" - Efésios 2:8",
                penseNisso: `Este é o espaço para a história do dia ${i}. Aqui você pode incluir uma situação do cotidiano escolar que se relacione com o princípio bíblico do dia.`,
                conectandoPontos: `Esta é a reflexão pastoral para o dia ${i}. Aqui conectamos a história com os princípios da teologia reformada, mostrando como aplicar a Palavra de Deus em nossa vida diária.`,
                desafioPratico: `Este é o desafio prático para o dia ${i}. Uma ação concreta que pode ser aplicada hoje mesmo.`,
                oracaoGuia: `\"Senhor, obrigado por este dia ${i}. Ajuda-me a viver de acordo com Tua Palavra e a ser uma bênção para todos ao meu redor. Amém.\"`,
                imagem: null
            };
        }
    }
};

// Gerenciador de imagens
const imageManager = {
    updateImage(day) {
        const devocional = appState.devocionais[day];
        const container = elements.imageContainer;
        
        if (!container) return;
        
        if (devocional && devocional.imagem) {
            const imagePath = CONFIG.imagesPath + devocional.imagem;
            container.innerHTML = `
                <img src="${imagePath}" 
                     alt="Imagem do devocional: ${devocional.titulo}" 
                     class="devocional-image"
                     onerror="this.parentElement.innerHTML = this.parentElement.querySelector('.image-placeholder').outerHTML">
                <div class="image-placeholder" style="display: none;">
                    <span class="placeholder-icon">🌅</span>
                    <p class="placeholder-text">Espaço reservado para imagem</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="image-placeholder">
                    <span class="placeholder-icon">🌅</span>
                    <p class="placeholder-text">Espaço reservado para imagem</p>
                </div>
            `;
        }
    }
};

// Gerenciador de exibição
const displayManager = {
    updateDevocional(day) {
        const devocional = appState.devocionais[day];
        
        if (!devocional) {
            this.showError(`Devocional ${day} não encontrado`);
            return;
        }

        // Atualizar estado
        appState.currentDay = day;

        // Atualizar elementos
        if (elements.devocionalTitle) {
            elements.devocionalTitle.textContent = devocional.titulo;
        }
        
        if (elements.principioCentral) {
            elements.principioCentral.textContent = devocional.principioCentral;
        }
        
        if (elements.versiculoDia) {
            elements.versiculoDia.innerHTML = devocional.versiculoDia;
        }
        
        if (elements.penseNisso) {
            elements.penseNisso.innerHTML = utils.textToHtml(devocional.penseNisso);
        }
        
        if (elements.conectandoPontos) {
            elements.conectandoPontos.innerHTML = utils.textToHtml(devocional.conectandoPontos);
        }
        
        if (elements.desafioPratico) {
            elements.desafioPratico.innerHTML = utils.textToHtml(devocional.desafioPratico);
        }
        
        if (elements.oracaoGuia) {
            elements.oracaoGuia.innerHTML = utils.textToHtml(devocional.oracaoGuia);
        }
        
        if (elements.dayCounter) {
            elements.dayCounter.textContent = `Dia ${day}`;
        }
        
        if (elements.currentDate) {
            elements.currentDate.textContent = devocional.data;
        }

        // Atualizar seletor de data
        this.updateDateSelector(day);
        
        // Atualizar imagem
        imageManager.updateImage(day);
        
        // Scroll para o topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    updateDateSelector(day) {
        if (!elements.dateSelector) return;
        
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, 0, day);
        elements.dateSelector.value = date.toISOString().split('T')[0];
    },

    showError(message) {
        console.error(message);
        
        if (elements.devocionalTitle) {
            elements.devocionalTitle.textContent = 'Erro';
        }
        
        if (elements.penseNisso) {
            elements.penseNisso.innerHTML = `<p style="color: var(--danger-color);">${message}</p>`;
        }
    }
};

// Gerenciador de navegação
const navigationManager = {
    goToToday() {
        const today = utils.getDayOfYear();
        displayManager.updateDevocional(today);
    },

    previousDay() {
        const newDay = appState.currentDay > 1 ? appState.currentDay - 1 : 366;
        displayManager.updateDevocional(newDay);
    },

    nextDay() {
        const newDay = appState.currentDay < 366 ? appState.currentDay + 1 : 1;
        displayManager.updateDevocional(newDay);
    },

    goToDate() {
        if (!elements.dateSelector) return;
        
        const selectedDate = new Date(elements.dateSelector.value);
        const dayOfYear = utils.getDayOfYear(selectedDate);
        displayManager.updateDevocional(dayOfYear);
    },

    randomDay() {
        const randomDay = Math.floor(Math.random() * 366) + 1;
        displayManager.updateDevocional(randomDay);
    }
};

// Gerenciador de busca
const searchManager = {
    search: utils.debounce(function(term) {
        if (!term || term.length < 2) {
            appState.searchResults = [];
            return;
        }

        const results = [];
        const searchTerm = term.toLowerCase();

        for (let day = 1; day <= 366; day++) {
            const devocional = appState.devocionais[day];
            if (!devocional) continue;

            const searchableText = [
                devocional.titulo,
                devocional.principioCentral,
                devocional.versiculoDia,
                devocional.penseNisso,
                devocional.conectandoPontos,
                devocional.desafioPratico,
                devocional.oracaoGuia
            ].join(' ').toLowerCase();

            if (searchableText.includes(searchTerm)) {
                results.push({
                    day: day,
                    title: devocional.titulo,
                    relevance: this.calculateRelevance(searchableText, searchTerm)
                });
            }
        }

        // Ordenar por relevância
        results.sort((a, b) => b.relevance - a.relevance);
        appState.searchResults = results;

        // Ir para o primeiro resultado
        if (results.length > 0) {
            displayManager.updateDevocional(results[0].day);
        }
    }, 300),

    calculateRelevance(text, term) {
        const occurrences = (text.match(new RegExp(term, 'g')) || []).length;
        const titleBonus = text.includes(term) ? 10 : 0;
        return occurrences + titleBonus;
    },

    handleSearchInput(event) {
        const term = event.target.value.trim();
        
        if (event.key === 'Enter') {
            this.search(term);
        }
    }
};

// Funções globais para os botões
window.goToToday = () => navigationManager.goToToday();
window.previousDay = () => navigationManager.previousDay();
window.nextDay = () => navigationManager.nextDay();
window.goToDate = () => navigationManager.goToDate();
window.randomDay = () => navigationManager.randomDay();
window.searchDevocionais = (event) => searchManager.handleSearchInput(event);

// Event listeners
function setupEventListeners() {
    // Navegação por teclado
    document.addEventListener('keydown', (event) => {
        if (appState.isLoading) return;
        
        switch (event.key) {
            case 'ArrowLeft':
                if (!event.target.matches('input')) {
                    event.preventDefault();
                    navigationManager.previousDay();
                }
                break;
            case 'ArrowRight':
                if (!event.target.matches('input')) {
                    event.preventDefault();
                    navigationManager.nextDay();
                }
                break;
            case 'Home':
                if (!event.target.matches('input')) {
                    event.preventDefault();
                    navigationManager.goToToday();
                }
                break;
        }
    });

    // Busca em tempo real
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', utils.debounce((event) => {
            const term = event.target.value.trim();
            if (term.length >= 2) {
                searchManager.search(term);
            }
        }, 500));
    }
}

// Inicialização
async function init() {
    try {
        console.log('Inicializando aplicação...');
        
        // Configurar event listeners
        setupEventListeners();
        
        // Carregar dados
        await dataManager.loadDevocionais();
        
        // Ir para o dia de hoje
        navigationManager.goToToday();
        
        console.log('Aplicação inicializada com sucesso!');
    } catch (error) {
        console.error('Erro na inicialização:', error);
        displayManager.showError('Erro ao carregar a aplicação. Tente recarregar a página.');
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Service Worker para cache (opcional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado: ', registration);
            })
            .catch(registrationError => {
                console.log('SW falhou: ', registrationError);
            });
    });
}

