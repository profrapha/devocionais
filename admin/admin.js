// Configurações administrativas
const ADMIN_CONFIG = {
    defaultPassword: 'devocionais2025', // Senha padrão - DEVE ser alterada
    storageKeys: {
        password: 'admin_password',
        isLoggedIn: 'admin_logged_in',
        devocionais: 'devocionais_data',
        lastBackup: 'last_backup'
    },
    itemsPerPage: 12
};

// Estado administrativo
let adminState = {
    isLoggedIn: false,
    currentTab: 'list',
    currentPage: 1,
    editingDay: null,
    searchTerm: '',
    devocionais: {}
};

// Elementos DOM administrativos
const adminElements = {
    loginScreen: document.getElementById('loginScreen'),
    adminInterface: document.getElementById('adminInterface'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    passwordInput: document.getElementById('password'),
    devocionaisGrid: document.getElementById('devocionaisGrid'),
    adminSearch: document.getElementById('adminSearch'),
    pagination: document.getElementById('pagination'),
    editForm: document.getElementById('editForm'),
    previewModal: document.getElementById('previewModal'),
    previewContent: document.getElementById('previewContent')
};

// Utilitários administrativos
const adminUtils = {
    // Hash simples para senha
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    },

    // Validar senha
    validatePassword(password) {
        const storedPassword = localStorage.getItem(ADMIN_CONFIG.storageKeys.password) || 
                              this.hashPassword(ADMIN_CONFIG.defaultPassword);
        return this.hashPassword(password) === storedPassword;
    },

    // Gerar CSV
    generateCSV(data) {
        const headers = ['dia', 'data', 'titulo', 'principioCentral', 'versiculoDia', 'penseNisso', 'conectandoPontos', 'desafioPratico', 'oracaoGuia'];
        const csvContent = [
            headers.join(','),
            ...Object.entries(data).map(([day, devocional]) => {
                return headers.map(header => {
                    const value = header === 'dia' ? day : (devocional[header] || '');
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',');
            })
        ].join('\n');
        return csvContent;
    },

    // Parse CSV
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
        const data = {};

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = this.parseCSVLine(lines[i]);
            if (values.length !== headers.length) continue;

            const day = values[0];
            const devocional = {};
            
            for (let j = 1; j < headers.length; j++) {
                devocional[headers[j]] = values[j];
            }
            
            data[day] = devocional;
        }
        
        return data;
    },

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    },

    // Download de arquivo
    downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    // Formatar data para exibição
    formatDateForDisplay(dayNumber) {
        const date = new Date(2025, 0, dayNumber);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long'
        });
    }
};

// Gerenciador de autenticação
const authManager = {
    init() {
        const isLoggedIn = localStorage.getItem(ADMIN_CONFIG.storageKeys.isLoggedIn) === 'true';
        if (isLoggedIn) {
            this.showAdminInterface();
        } else {
            this.showLoginScreen();
        }
    },

    showLoginScreen() {
        adminElements.loginScreen.style.display = 'flex';
        adminElements.adminInterface.style.display = 'none';
        adminState.isLoggedIn = false;
    },

    showAdminInterface() {
        adminElements.loginScreen.style.display = 'none';
        adminElements.adminInterface.style.display = 'block';
        adminState.isLoggedIn = true;
        adminDataManager.loadData();
        adminUI.updateStats();
    },

    login(password) {
        if (adminUtils.validatePassword(password)) {
            localStorage.setItem(ADMIN_CONFIG.storageKeys.isLoggedIn, 'true');
            this.showAdminInterface();
            return true;
        } else {
            adminElements.loginError.textContent = 'Senha incorreta. Tente novamente.';
            return false;
        }
    },

    logout() {
        localStorage.removeItem(ADMIN_CONFIG.storageKeys.isLoggedIn);
        this.showLoginScreen();
        adminElements.loginError.textContent = '';
        adminElements.passwordInput.value = '';
    },

    changePassword(newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem.');
            return false;
        }
        
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return false;
        }

        const hashedPassword = adminUtils.hashPassword(newPassword);
        localStorage.setItem(ADMIN_CONFIG.storageKeys.password, hashedPassword);
        alert('Senha alterada com sucesso!');
        return true;
    }
};

// Gerenciador de dados administrativos
const adminDataManager = {
    loadData() {
        try {
            const savedData = localStorage.getItem(ADMIN_CONFIG.storageKeys.devocionais);
            if (savedData) {
                adminState.devocionais = JSON.parse(savedData);
            } else {
                // Carregar dados padrão
                this.loadDefaultData();
            }
            adminUI.renderDevocionaisList();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            this.loadDefaultData();
        }
    },

    loadDefaultData() {
        // Gerar estrutura básica para todos os 366 dias
        adminState.devocionais = {};
        for (let i = 1; i <= 366; i++) {
            adminState.devocionais[i] = {
                data: adminUtils.formatDateForDisplay(i),
                titulo: '',
                principioCentral: 'Soli Deo Gloria (A Glória Somente a Deus)',
                versiculoDia: '',
                penseNisso: '',
                conectandoPontos: '',
                desafioPratico: '',
                oracaoGuia: '',
                imagem: null
            };
        }
        this.saveData();
    },

    saveData() {
        try {
            localStorage.setItem(ADMIN_CONFIG.storageKeys.devocionais, JSON.stringify(adminState.devocionais));
            // Também salvar no formato público
            this.savePublicData();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            alert('Erro ao salvar dados. Verifique o espaço de armazenamento.');
        }
    },

    savePublicData() {
        // Filtrar apenas devocionais completos para o site público
        const publicData = {};
        Object.entries(adminState.devocionais).forEach(([day, devocional]) => {
            if (devocional.titulo && devocional.versiculoDia && devocional.penseNisso) {
                publicData[day] = devocional;
            }
        });
        
        // Em um ambiente real, isso seria enviado para o servidor
        // Por enquanto, vamos simular salvando no localStorage
        localStorage.setItem('public_devocionais', JSON.stringify(publicData));
    },

    exportData() {
        const csvContent = adminUtils.generateCSV(adminState.devocionais);
        const timestamp = new Date().toISOString().split('T')[0];
        adminUtils.downloadFile(csvContent, `devocionais-backup-${timestamp}.csv`, 'text/csv');
    },

    importData(csvContent) {
        try {
            const importedData = adminUtils.parseCSV(csvContent);
            
            // Mesclar com dados existentes
            Object.assign(adminState.devocionais, importedData);
            
            this.saveData();
            adminUI.renderDevocionaisList();
            adminUI.updateStats();
            
            alert(`${Object.keys(importedData).length} devocionais importados com sucesso!`);
        } catch (error) {
            console.error('Erro na importação:', error);
            alert('Erro ao importar dados. Verifique o formato do arquivo.');
        }
    },

    getDevocional(day) {
        return adminState.devocionais[day] || null;
    },

    saveDevocional(day, data) {
        adminState.devocionais[day] = { ...data };
        this.saveData();
    },

    deleteDevocional(day) {
        if (confirm(`Tem certeza que deseja excluir o devocional do dia ${day}?`)) {
            // Não deletar, apenas limpar os campos
            adminState.devocionais[day] = {
                data: adminUtils.formatDateForDisplay(day),
                titulo: '',
                principioCentral: 'Soli Deo Gloria (A Glória Somente a Deus)',
                versiculoDia: '',
                penseNisso: '',
                conectandoPontos: '',
                desafioPratico: '',
                oracaoGuia: '',
                imagem: null
            };
            this.saveData();
            adminUI.renderDevocionaisList();
            adminUI.showTab('list');
            return true;
        }
        return false;
    }
};

// Gerenciador de interface administrativa
const adminUI = {
    showTab(tabName) {
        // Atualizar abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

        // Atualizar conteúdo
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        adminState.currentTab = tabName;

        // Ações específicas por aba
        switch (tabName) {
            case 'list':
                this.renderDevocionaisList();
                break;
            case 'settings':
                this.updateStats();
                break;
        }
    },

    renderDevocionaisList() {
        const grid = adminElements.devocionaisGrid;
        if (!grid) return;

        const filteredDevocionais = this.getFilteredDevocionais();
        const startIndex = (adminState.currentPage - 1) * ADMIN_CONFIG.itemsPerPage;
        const endIndex = startIndex + ADMIN_CONFIG.itemsPerPage;
        const pageItems = filteredDevocionais.slice(startIndex, endIndex);

        grid.innerHTML = pageItems.map(([day, devocional]) => {
            const isComplete = devocional.titulo && devocional.versiculoDia && devocional.penseNisso;
            const preview = devocional.penseNisso ? 
                devocional.penseNisso.substring(0, 100) + '...' : 
                'Devocional não preenchido';

            return `
                <div class="devocional-card-admin">
                    <div class="card-admin-header">
                        <span class="card-day-number">Dia ${day}</span>
                        <span class="card-status ${isComplete ? 'status-complete' : 'status-incomplete'}">
                            ${isComplete ? 'Completo' : 'Incompleto'}
                        </span>
                    </div>
                    <h3 class="card-admin-title">${devocional.titulo || `Devocional ${day}`}</h3>
                    <p class="card-admin-preview">${preview}</p>
                    <div class="card-admin-actions">
                        <button class="btn btn-primary btn-small" onclick="editDevocional(${day})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="previewDevocional(${day})">
                            👁️ Ver
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.renderPagination(filteredDevocionais.length);
    },

    getFilteredDevocionais() {
        const searchTerm = adminState.searchTerm.toLowerCase();
        return Object.entries(adminState.devocionais).filter(([day, devocional]) => {
            if (!searchTerm) return true;
            
            const searchableText = [
                day,
                devocional.titulo,
                devocional.principioCentral,
                devocional.versiculoDia,
                devocional.penseNisso
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
    },

    renderPagination(totalItems) {
        const pagination = adminElements.pagination;
        if (!pagination) return;

        const totalPages = Math.ceil(totalItems / ADMIN_CONFIG.itemsPerPage);
        const currentPage = adminState.currentPage;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        paginationHTML += `
            <button class="pagination-btn" onclick="changePage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}>
                ← Anterior
            </button>
        `;

        // Números das páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                paginationHTML += `
                    <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                            onclick="changePage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Botão próximo
        paginationHTML += `
            <button class="pagination-btn" onclick="changePage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled' : ''}>
                Próximo →
            </button>
        `;

        pagination.innerHTML = paginationHTML;
    },

    loadDevocionalForEdit(day) {
        const devocional = adminDataManager.getDevocional(day);
        if (!devocional) return;

        document.getElementById('editDay').value = day;
        document.getElementById('editData').value = devocional.data || '';
        document.getElementById('editTitulo').value = devocional.titulo || '';
        document.getElementById('editPrincipio').value = devocional.principioCentral || 'Soli Deo Gloria (A Glória Somente a Deus)';
        document.getElementById('editVersiculo').value = devocional.versiculoDia || '';
        document.getElementById('editPenseNisso').value = devocional.penseNisso || '';
        document.getElementById('editConectando').value = devocional.conectandoPontos || '';
        document.getElementById('editDesafio').value = devocional.desafioPratico || '';
        document.getElementById('editOracao').value = devocional.oracaoGuia || '';

        // Mostrar/esconder botão de excluir
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.style.display = devocional.titulo ? 'inline-flex' : 'none';
        }

        adminState.editingDay = day;
    },

    saveCurrentDevocional() {
        const day = document.getElementById('editDay').value;
        if (!day || day < 1 || day > 366) {
            alert('Dia inválido. Deve ser entre 1 e 366.');
            return false;
        }

        const data = {
            data: document.getElementById('editData').value,
            titulo: document.getElementById('editTitulo').value,
            principioCentral: document.getElementById('editPrincipio').value,
            versiculoDia: document.getElementById('editVersiculo').value,
            penseNisso: document.getElementById('editPenseNisso').value,
            conectandoPontos: document.getElementById('editConectando').value,
            desafioPratico: document.getElementById('editDesafio').value,
            oracaoGuia: document.getElementById('editOracao').value,
            imagem: adminState.devocionais[day]?.imagem || null
        };

        adminDataManager.saveDevocional(day, data);
        this.renderDevocionaisList();
        this.updateStats();
        
        alert('Devocional salvo com sucesso!');
        return true;
    },

    showPreview(day) {
        const devocional = adminDataManager.getDevocional(day);
        if (!devocional) return;

        const previewHTML = `
            <div class="devocional-preview">
                <div class="preview-header">
                    <h2>${devocional.titulo || `Devocional ${day}`}</h2>
                    <div class="preview-principio">${devocional.principioCentral}</div>
                </div>
                
                <div class="preview-section">
                    <h3>Versículo do Dia</h3>
                    <blockquote>${devocional.versiculoDia || 'Não preenchido'}</blockquote>
                </div>
                
                <div class="preview-section">
                    <h3>Pense Nisso</h3>
                    <p>${devocional.penseNisso || 'Não preenchido'}</p>
                </div>
                
                <div class="preview-section">
                    <h3>Conectando os Pontos</h3>
                    <p>${devocional.conectandoPontos || 'Não preenchido'}</p>
                </div>
                
                <div class="preview-section">
                    <h3>Desafio Prático</h3>
                    <p>${devocional.desafioPratico || 'Não preenchido'}</p>
                </div>
                
                <div class="preview-section">
                    <h3>Oração Guia</h3>
                    <p>${devocional.oracaoGuia || 'Não preenchido'}</p>
                </div>
            </div>
        `;

        adminElements.previewContent.innerHTML = previewHTML;
        adminElements.previewModal.classList.add('active');
    },

    updateStats() {
        const totalElement = document.getElementById('totalDevocionais');
        const completedElement = document.getElementById('completedDevocionais');
        const withImagesElement = document.getElementById('withImages');

        if (!totalElement) return;

        const total = Object.keys(adminState.devocionais).length;
        let completed = 0;
        let withImages = 0;

        Object.values(adminState.devocionais).forEach(devocional => {
            if (devocional.titulo && devocional.versiculoDia && devocional.penseNisso) {
                completed++;
            }
            if (devocional.imagem) {
                withImages++;
            }
        });

        totalElement.textContent = total;
        completedElement.textContent = completed;
        withImagesElement.textContent = withImages;
    }
};

// Funções globais para a interface administrativa
window.showTab = (tabName) => adminUI.showTab(tabName);
window.logout = () => authManager.logout();
window.changePage = (page) => {
    adminState.currentPage = page;
    adminUI.renderDevocionaisList();
};

window.editDevocional = (day) => {
    adminUI.loadDevocionalForEdit(day);
    adminUI.showTab('edit');
};

window.createNewDevocional = () => {
    // Encontrar o primeiro dia vazio
    let emptyDay = 1;
    for (let i = 1; i <= 366; i++) {
        const devocional = adminState.devocionais[i];
        if (!devocional.titulo) {
            emptyDay = i;
            break;
        }
    }
    editDevocional(emptyDay);
};

window.saveDevocional = () => adminUI.saveCurrentDevocional();

window.deleteDevocional = () => {
    if (adminState.editingDay) {
        adminDataManager.deleteDevocional(adminState.editingDay);
    }
};

window.previewDevocional = (day) => {
    if (typeof day === 'undefined' && adminState.editingDay) {
        day = adminState.editingDay;
    }
    adminUI.showPreview(day);
};

window.closePreview = () => {
    adminElements.previewModal.classList.remove('active');
};

window.exportData = () => adminDataManager.exportData();

window.importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                adminDataManager.importData(e.target.result);
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

window.downloadTemplate = () => {
    const template = `dia,data,titulo,principioCentral,versiculoDia,penseNisso,conectandoPontos,desafioPratico,oracaoGuia
1,"1º de Janeiro","Exemplo de Título","Soli Deo Gloria (A Glória Somente a Deus)","Versículo de exemplo","História de exemplo","Reflexão de exemplo","Desafio de exemplo","Oração de exemplo"`;
    
    adminUtils.downloadFile(template, 'modelo-devocionais.csv', 'text/csv');
};

window.processBulkImport = () => {
    const fileInput = document.getElementById('bulkFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Selecione um arquivo CSV primeiro.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        adminDataManager.importData(e.target.result);
    };
    reader.readAsText(file);
};

window.changePassword = () => {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (authManager.changePassword(newPassword, confirmPassword)) {
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }
};

window.createBackup = () => {
    adminDataManager.exportData();
    localStorage.setItem(ADMIN_CONFIG.storageKeys.lastBackup, new Date().toISOString());
    document.getElementById('backupInfo').innerHTML = 
        `<small>Último backup: ${new Date().toLocaleString('pt-BR')}</small>`;
};

window.restoreBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file && confirm('Tem certeza? Isso substituirá todos os dados atuais.')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                adminDataManager.importData(e.target.result);
            };
            reader.readAsText(file);
        }
    };
    input.click();
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    if (adminElements.loginForm) {
        adminElements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = adminElements.passwordInput.value;
            authManager.login(password);
        });
    }

    // Busca administrativa
    if (adminElements.adminSearch) {
        adminElements.adminSearch.addEventListener('input', (e) => {
            adminState.searchTerm = e.target.value;
            adminState.currentPage = 1;
            adminUI.renderDevocionaisList();
        });
    }

    // Fechar modal clicando fora
    if (adminElements.previewModal) {
        adminElements.previewModal.addEventListener('click', (e) => {
            if (e.target === adminElements.previewModal) {
                closePreview();
            }
        });
    }

    // Inicializar autenticação
    authManager.init();
});

// Atualizar estatísticas do último backup
document.addEventListener('DOMContentLoaded', () => {
    const lastBackup = localStorage.getItem(ADMIN_CONFIG.storageKeys.lastBackup);
    if (lastBackup) {
        const backupInfo = document.getElementById('backupInfo');
        if (backupInfo) {
            const date = new Date(lastBackup);
            backupInfo.innerHTML = `<small>Último backup: ${date.toLocaleString('pt-BR')}</small>`;
        }
    }
});

