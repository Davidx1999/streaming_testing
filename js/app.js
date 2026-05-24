import { categories, fictionalTitles, featuredContent } from './data/mockData.js';
import { SetupView } from './components/SetupView.js';
import { InstructionView } from './components/InstructionView.js';
import { HeaderDark } from './components/HeaderDark.js';
import { CatalogDark } from './components/CatalogDark.js';
import { SettingsDark } from './components/SettingsDark.js';
import { HeaderRadiant } from './components/HeaderRadiant.js';
import { CatalogRadiant } from './components/CatalogRadiant.js';
import { SettingsRadiant } from './components/SettingsRadiant.js';
import { EndView } from './components/EndView.js';
import formSpec from './data/forms.json';

// =====================================================
// VARIÁVEIS GLOBAIS DE TELEMETRIA
// =====================================================
window.start_time_ms = 0;
window.end_time_ms = 0;
window.clics_errados = 0;
window.clics_totais = 0;
window.radiantSurveySelectValue = '';
window.radiantSurveyTextareaValue = '';

// Escutador inteligente de cliques reais
document.addEventListener('click', function (evento) {
    if (evento.target.closest('.ignorar-clique')) {
        return;
    }
    const btnId = evento.target.closest('button') ? evento.target.closest('button').id : '';
    const btnText = evento.target.closest('button') ? evento.target.closest('button').textContent.toLowerCase() : '';
    if (btnId === 'btn-radiant-send-survey' || btnText.includes('encerrar') || btnText.includes('enviar resposta') || btnText.includes('manter') || (btnText.includes('finalizar') && !btnText.includes('cancelamento'))) {
        return;
    }
    const clicouEmElementoInterativo = evento.target.closest('button, a, input, select, label, textarea');
    if (clicouEmElementoInterativo) {
        if (window.start_time_ms > 0 && window.end_time_ms === 0 && window.app && window.app.state.view !== 'loading') {
            window.clics_totais++;
            console.log("Clique válido registrado! Total:", window.clics_totais);
        }
    }
});

// =====================================================
// ESTADO E LÓGICA DO QUESTIONÁRIO DINÂMICO (SURVEY)
// =====================================================
window.currentSectionIndex = 0;
window.visibleSections = [];
window.userAnswers = {};

window.initSurvey = () => {
    // Filtrar seções baseadas em condições de telemetria
    window.visibleSections = formSpec.formulario.secoes.filter(secao => {
        const allQuestionsHidden = secao.perguntas.every(q => {
            if (q.condicao) {
                if (q.condicao.campo === 'abandono') {
                    return !window.app.state.abandonou;
                }
                if (q.condicao.campo === 'variante') {
                    const variant = window.app.state.pattern === 'radiant' ? 'Radiant' : 'Dark';
                    return variant !== q.condicao.valor;
                }
            }
            return false;
        });
        return !allQuestionsHidden;
    });

    window.currentSectionIndex = 0;
    const mainTitle = document.getElementById('form-main-title');
    if (mainTitle) mainTitle.innerText = formSpec.formulario.titulo;
    window.renderSection();
};

window.saveAnswer = (questionId, value) => {
    window.userAnswers[questionId] = value;
};

window.handleGeneroChange = (radioElement) => {
    const container = document.getElementById('genero-outros-container');
    const input = document.getElementById('genero-outros-input');
    if (radioElement.value === "Outros + input de resposta curta") {
        if (container) container.style.display = 'block';
        if (input) input.focus();
        window.saveAnswer('genero', `Outros: ${input ? input.value : ''}`);
    } else {
        if (container) container.style.display = 'none';
        window.saveAnswer('genero', radioElement.value);
    }
};

window.saveOutrosAnswer = (value) => {
    window.saveAnswer('genero', `Outros: ${value}`);
};

window.handleAreaAtuacaoChange = (radioElement) => {
    const container = document.getElementById('area-atuacao-outros-container');
    const input = document.getElementById('area-atuacao-outros-input');
    if (radioElement.value === "Outras Áreas") {
        if (container) container.style.display = 'block';
        if (input) input.focus();
        window.saveAnswer('area_atuacao', `Outras: ${input ? input.value : ''}`);
    } else {
        if (container) container.style.display = 'none';
        window.saveAnswer('area_atuacao', radioElement.value);
    }
};

window.saveAreaAtuacaoOutrasAnswer = (value) => {
    window.saveAnswer('area_atuacao', `Outras: ${value}`);
};

window.validateCurrentSection = () => {
    const secao = window.visibleSections[window.currentSectionIndex];
    let allValid = true;

    secao.perguntas.forEach(q => {
        if (q.condicao) {
            if (q.condicao.campo === 'abandono' && !window.app.state.abandonou) return;
            if (q.condicao.campo === 'variante') {
                const variant = window.app.state.pattern === 'radiant' ? 'Radiant' : 'Dark';
                if (variant !== q.condicao.valor) return;
            }
        }

        const val = window.userAnswers[q.id];
        if (q.tipo === 'number') {
            const num = val ? parseInt(val) : 0;
            if (!num || num < 18 || num > 120) {
                allValid = false;
            }
        } else if (q.id === 'genero') {
            if (!val) {
                allValid = false;
            } else if (val.startsWith('Outros:')) {
                const specifyVal = val.replace('Outros:', '').trim();
                if (specifyVal === '') {
                    allValid = false;
                }
            }
        } else if (q.id === 'area_atuacao') {
            if (!val) {
                allValid = false;
            } else if (val.startsWith('Outras:')) {
                const specifyVal = val.replace('Outras:', '').trim();
                if (specifyVal === '') {
                    allValid = false;
                }
            }
        } else {
            if (!val) {
                allValid = false;
            }
        }
    });

    return allValid;
};

window.surveyNextPage = () => {
    if (window.app && typeof window.app.surveyNextPage === 'function') {
        window.app.surveyNextPage();
    }
};

window.surveyPrevPage = () => {
    if (window.app && typeof window.app.surveyPrevPage === 'function') {
        window.app.surveyPrevPage();
    }
};

window.renderSection = () => {
    const container = document.getElementById('questions-container');
    if (!container) return;
    container.innerHTML = '';

    const secao = window.visibleSections[window.currentSectionIndex];
    const sectionTitleEl = document.getElementById('section-title');
    if (sectionTitleEl) sectionTitleEl.innerText = secao.titulo || `Seção ${window.currentSectionIndex + 1}`;

    const progressContainer = document.getElementById('progress-container');
    if (progressContainer) progressContainer.classList.remove('hidden');
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = ((window.currentSectionIndex) / window.visibleSections.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    secao.perguntas.forEach((q, index) => {
        if (q.condicao) {
            if (q.condicao.campo === 'abandono' && !window.app.state.abandonou) return;
            if (q.condicao.campo === 'variante') {
                const variant = window.app.state.pattern === 'radiant' ? 'Radiant' : 'Dark';
                if (variant !== q.condicao.valor) return;
            }
        }

        const questionDiv = document.createElement('div');
        questionDiv.className = 'bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-left';
        questionDiv.innerHTML = `<label class="block text-gray-900 font-semibold text-lg mb-4">${index + 1}. ${q.pergunta}</label>`;

        let inputHtml = '';

        if (q.tipo === 'number') {
            const val = window.userAnswers[q.id] || '';
            inputHtml = `<input type="number" id="${q.id}" class="w-full sm:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6455E5] focus:border-[#6455E5] outline-none transition-colors" placeholder="Digite um número..." value="${val}" onchange="window.saveAnswer('${q.id}', this.value)">`;
        }
        else if (q.tipo === 'single_choice' && q.id !== 'genero' && q.id !== 'area_atuacao') {
            inputHtml = '<div class="space-y-3">';
            q.opcoes.forEach((opt, i) => {
                const checked = window.userAnswers[q.id] === opt ? 'checked' : '';
                inputHtml += `
                    <label class="relative flex cursor-pointer items-center">
                        <input type="radio" name="${q.id}" value="${opt}" class="peer sr-only radio-custom" ${checked} onchange="window.saveAnswer('${q.id}', this.value)">
                        <div class="w-full flex items-center p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <div class="radio-dot-container w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3 transition-colors shrink-0">
                                <div class="radio-dot w-2.5 h-2.5 rounded-full bg-transparent transition-transform transform scale-0"></div>
                            </div>
                            <span class="text-gray-700">${opt}</span>
                        </div>
                    </label>
                `;
            });
            inputHtml += '</div>';
        }
        else if (q.id === 'genero') {
            inputHtml = '<div class="space-y-3">';
            const savedVal = window.userAnswers[q.id] || '';
            const isOutrosSaved = savedVal.startsWith('Outros:');

            q.opcoes.forEach((opt, i) => {
                const isOutrosOption = opt === "Outros + input de resposta curta";
                const isChecked = isOutrosOption ? isOutrosSaved : (savedVal === opt);
                const checkedAttr = isChecked ? 'checked' : '';

                inputHtml += `
                    <label class="relative flex cursor-pointer items-center">
                        <input type="radio" name="${q.id}" value="${opt}" class="peer sr-only radio-custom" ${checkedAttr} onchange="window.handleGeneroChange(this)">
                        <div class="w-full flex items-center p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <div class="radio-dot-container w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3 transition-colors shrink-0">
                                <div class="radio-dot w-2.5 h-2.5 rounded-full bg-transparent transition-transform transform scale-0"></div>
                            </div>
                            <span class="text-gray-700">${isOutrosOption ? 'Outros' : opt}</span>
                        </div>
                    </label>
                `;

                if (isOutrosOption) {
                    const display = isOutrosSaved ? 'block' : 'none';
                    const textVal = isOutrosSaved ? savedVal.replace('Outros: ', '') : '';
                    inputHtml += `
                        <div id="genero-outros-container" style="display: ${display};" class="mt-2 pl-8">
                            <input type="text" id="genero-outros-input" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6455E5] focus:border-[#6455E5] outline-none" placeholder="Por favor, especifique" value="${textVal}" oninput="window.saveOutrosAnswer(this.value)">
                        </div>
                    `;
                }
            });
            inputHtml += '</div>';
        }
        else if (q.id === 'area_atuacao') {
            inputHtml = '<div class="space-y-3">';
            const savedVal = window.userAnswers[q.id] || '';
            const isOutrasSaved = savedVal.startsWith('Outras:');

            q.opcoes.forEach((opt, i) => {
                const isOutrasOption = opt === "Outras Áreas";
                const isChecked = isOutrasOption ? isOutrasSaved : (savedVal === opt);
                const checkedAttr = isChecked ? 'checked' : '';

                inputHtml += `
                    <label class="relative flex cursor-pointer items-center">
                        <input type="radio" name="${q.id}" value="${opt}" class="peer sr-only radio-custom" ${checkedAttr} onchange="window.handleAreaAtuacaoChange(this)">
                        <div class="w-full flex items-center p-3.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                            <div class="radio-dot-container w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mr-3 transition-colors shrink-0">
                                <div class="radio-dot w-2.5 h-2.5 rounded-full bg-transparent transition-transform transform scale-0"></div>
                            </div>
                            <span class="text-gray-700">${opt}</span>
                        </div>
                    </label>
                `;

                if (isOutrasOption) {
                    const display = isOutrasSaved ? 'block' : 'none';
                    const textVal = isOutrasSaved ? savedVal.replace('Outras: ', '') : '';
                    inputHtml += `
                        <div id="area-atuacao-outros-container" style="display: ${display};" class="mt-2 pl-8">
                            <input type="text" id="area-atuacao-outros-input" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6455E5] focus:border-[#6455E5] outline-none" placeholder="Por favor, especifique" value="${textVal}" oninput="window.saveAreaAtuacaoOutrasAnswer(this.value)">
                        </div>
                    `;
                }
            });
            inputHtml += '</div>';
        }
        else if (q.tipo === 'likert') {
            inputHtml = `
                <div class="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-3 w-full">
            `;
            q.opcoes.forEach((opt, i) => {
                const checked = window.userAnswers[q.id] === opt ? 'checked' : '';
                const id = `${q.id}_${i}`;
                inputHtml += `
                    <div class="w-full h-full">
                        <input type="radio" name="${q.id}" id="${id}" value="${opt}" class="peer sr-only likert-radio" ${checked} onchange="window.saveAnswer('${q.id}', this.value)">
                        <label for="${id}" class="cursor-pointer flex items-center justify-center text-center h-full w-full p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors select-none peer-checked:bg-[#6455E5] peer-checked:text-white peer-checked:border-[#6455E5] leading-tight">
                            ${opt}
                        </label>
                    </div>
                `;
            });
            inputHtml += `</div>`;
        }

        questionDiv.innerHTML += inputHtml;
        container.appendChild(questionDiv);
    });

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnSubmit = document.getElementById('btn-submit');

    if (btnPrev) btnPrev.style.display = window.currentSectionIndex > 0 ? 'block' : 'none';

    if (window.currentSectionIndex === window.visibleSections.length - 1) {
        if (btnNext) btnNext.style.display = 'none';
        if (btnSubmit) btnSubmit.style.display = 'block';
    } else {
        if (btnNext) btnNext.style.display = 'block';
        if (btnSubmit) btnSubmit.style.display = 'none';
    }
};
window.enviarTelemetria = function (usuarioAbandonou = false, surveyData = {}) {
    const tempo_cpu = window.end_time_ms - window.start_time_ms;
    const memoria_bytes = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const ram_mb = (memoria_bytes / (1024 * 1024)).toFixed(2);
    const tempo_usuario_seg = (tempo_cpu / 1000).toFixed(2);

    const nomeVariante = (window.app && window.app.state.pattern === 'radiant') ? 'Radiant Plus' : 'Dark Max';
    const respondeuSurvey = 'Sim';

    const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSew5wW0PPVcnijXjbyhStfCS9fuKorg4Q_00FVgPPtgVyzzPw/formResponse';
    const dados = new URLSearchParams();

    // 1. Telemetria Base
    dados.append('entry.1532613467', nomeVariante);
    dados.append('entry.1345222698', tempo_cpu.toFixed(2));
    dados.append('entry.1504379310', ram_mb);
    dados.append('entry.778706530', tempo_usuario_seg);
    dados.append('entry.2138517373', window.clics_totais);
    dados.append('entry.1179815513', window.clics_errados);
    dados.append('entry.713314953', usuarioAbandonou ? 'Sim' : 'Não');
    dados.append('entry.1731007937', respondeuSurvey);

    // 2. Questionário Pós-Tarefa
    dados.append('entry.1676829727', surveyData.idade || '');

    // Gênero mapping
    if (surveyData.genero === 'Outros + input de resposta curta') {
        dados.append('entry.1247370759', '__other_option__');
        dados.append('entry.1247370759.other_option_response', surveyData.genero_outro || '');
    } else if (surveyData.genero === 'Não-binário ou Gênero Fluido') {
        dados.append('entry.1247370759', 'Não-binário / Gênero fluido');
    } else if (surveyData.genero === 'Prefiro não informar') {
        dados.append('entry.1247370759', 'Prefiro Não Informar');
    } else {
        dados.append('entry.1247370759', surveyData.genero || '');
    }

    dados.append('entry.980747346', surveyData.escolaridade || '');
    dados.append('entry.800785701', surveyData.freq_digital || '');

    // Frequência Streaming mapping
    if (surveyData.freq_streaming === 'Algumas vezes na semana') {
        dados.append('entry.207727496', 'Algumas vezes por semana');
    } else {
        dados.append('entry.207727496', surveyData.freq_streaming || '');
    }

    // Área Atuação mapping
    if (surveyData.area_atuacao === 'Tecnologia/TI') {
        dados.append('entry.92729514', 'Tecnologia/TI');
    } else {
        dados.append('entry.92729514', '__other_option__');
        const customArea = (surveyData.area_atuacao_outro && surveyData.area_atuacao_outro.trim() !== '')
            ? surveyData.area_atuacao_outro.trim()
            : 'Outras Áreas';
        dados.append('entry.92729514.other_option_response', customArea);
    }

    // Assinatura Mantida mapping
    let assinaturaMantida = usuarioAbandonou ? (surveyData.assinatura_mantida || '') : '-- Não houve abandono --';
    if (assinaturaMantida === '- Não se Aplica - ' || assinaturaMantida === '- Não se Aplica -' || assinaturaMantida === '') {
        assinaturaMantida = '-- Não houve abandono --';
    }
    dados.append('entry.190227893', assinaturaMantida);

    dados.append('entry.1502601928', surveyData.pu_1 || '');
    dados.append('entry.1902243391', surveyData.pu_2 || '');
    dados.append('entry.809311676', surveyData.pu_5 || '');
    dados.append('entry.623789119', surveyData.pu_7 || '');
    dados.append('entry.1322165548', surveyData.rw_4 || '');
    dados.append('entry.1058417714', surveyData.voltaria || '');

    const btnSubmit = document.getElementById('btn-submit');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Enviando...';
    }

    fetch(FORM_URL, { method: 'POST', mode: 'no-cors', body: dados })
        .then(() => {
            localStorage.setItem('testeConcluido', 'true');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Enviar Respostas ✓';
            }

            // Build the debug JSON object
            const finalPayload = {};
            dados.forEach((value, key) => {
                finalPayload[key] = value;
            });

            const debugOutput = {
                "Mapped_Data_For_Backend": finalPayload,
                "Human_Readable_Telemetry": {
                    variante: nomeVariante,
                    tempo_cpu: tempo_cpu,
                    memoria_ram: ram_mb,
                    tempo_usuario: tempo_usuario_seg,
                    total_cliques: window.clics_totais,
                    cliques_errados: window.clics_errados,
                    abandono: usuarioAbandonou ? 'Sim' : 'Não',
                    respondeu_survey: respondeuSurvey
                },
                "Human_Readable_Answers": window.userAnswers
            };

            // Show Modal
            const modal = document.getElementById('custom-modal');
            const modalContent = document.getElementById('modal-content');

            const summaryDiv = document.getElementById('modal-telemetry-summary');
            if (summaryDiv) {
                summaryDiv.innerHTML = `
                    <ul class="space-y-1.5 leading-relaxed font-sans text-gray-700 text-left">
                        <li><span class="opacity-60 font-medium">Serviço de Streaming:</span> <strong class="text-[#6455E5] font-bold">${nomeVariante}</strong></li>
                        <li><span class="opacity-60 font-medium">Tempo Total (Usuário):</span> <strong class="text-[#6455E5] font-bold">${tempo_usuario_seg} s</strong></li>
                        <li><span class="opacity-60 font-medium">Cliques Totais:</span> <strong class="text-[#6455E5] font-bold">${window.clics_totais}</strong></li>
                        <li><span class="opacity-60 font-medium">Cliques Errados:</span> <strong class="text-red-500 font-bold">${window.clics_errados}</strong></li>
                        <li><span class="opacity-60 font-medium">Abandonou a Aplicação:</span> <strong class="font-bold ${usuarioAbandonou ? 'text-red-500' : 'text-[#6455E5]'}">${usuarioAbandonou ? 'Sim' : 'Não'}</strong></li>
                        <li class="border-t border-gray-100 mt-2.5 pt-2.5"><span class="opacity-60 font-medium">Horário de Envio:</span> ${new Date().toLocaleTimeString()}</li>
                    </ul>
                `;
            }

            if (modal) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    if (modalContent) {
                        modalContent.classList.remove('scale-95');
                        modalContent.classList.add('scale-100');
                    }
                }, 10);
            }
        })
        .catch((erro) => {
            console.error('Erro na telemetria:', erro);
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = "Erro ao enviar. Tentar novamente?";
            }
        });
};

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        this.bodyElement = document.getElementById('main-body');

        this.state = {
            view: 'setup',
            pattern: 'dark', // Dinamicamente substituído depois
            darkStep: 1,
            radiantStep: 1,
            isDarkMenuOpen: false,
            darkChecks: {
                surveyValue: null,
                surveyText: '',
                finalCheck: false
            },
            featuredIndex: 0,
            endMessage: '',
            abandonou: false
        };

        window.app = this;
        this.initScrollListener();
        this.init();
    }

    nextHero() {
        const nextIndex = (this.state.featuredIndex + 1) % featuredContent.length;
        this.setState({ featuredIndex: nextIndex });
    }

    initScrollListener() {
        window.addEventListener('scroll', () => {
            const isScrolled = window.scrollY > 50;
            if (isScrolled) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        });
    }

    init() {
        this.render();
    }

    setState(newState) {
        const viewChanged = newState.view && newState.view !== this.state.view;
        this.state = { ...this.state, ...newState };
        this.render();
        if (viewChanged) {
            window.scrollTo(0, 0);
        }
    }

    prepareTest(pattern) {
        this.setState({
            view: 'instruction'
        });
    }

    startSimulation() {
        window.clics_errados = 0;
        window.clics_totais = 0;
        window.start_time_ms = 0;

        this.setState({
            view: 'loading',
            darkStep: 1,
            radiantStep: 1,
            darkChecks: { surveyValue: null, surveyText: '', finalCheck: false },
            isDarkMenuOpen: false,
            abandonou: false
        });

        if (typeof mudarFavicon === 'function') {
            mudarFavicon(this.state.pattern);
        }

        setTimeout(() => {
            window.start_time_ms = performance.now();
            this.setState({
                view: 'catalog'
            });
        }, 1500);
    }

    goToCatalog() {
        this.setState({ view: 'catalog' });
    }

    goToSettings() {
        this.setState({ view: 'settings' });
    }

    setDarkStep(step) {
        this.setState({ darkStep: step });
    }

    toggleDarkProfileMenu() {
        this.setState({ isDarkMenuOpen: !this.state.isDarkMenuOpen });
    }

    updateDarkChecks(checkId, value) {
        this.state.darkChecks[checkId] = value;

        if (checkId === 'surveyText' && this.state.darkStep === 3) {
            const btn = document.querySelector('#dark-step-3 button');
            if (btn) {
                const isOtherSelected = this.state.darkChecks.surveyValue === 'other';
                const isSurveyValid = this.state.darkChecks.surveyValue && (!isOtherSelected || (value && value.trim().length > 0));

                btn.disabled = !isSurveyValid;
                if (isSurveyValid) {
                    btn.className = "w-full py-4 font-bold rounded-lg transition-all bg-brand-surface hover:bg-brand-border text-brand-white border border-brand-border cursor-pointer shadow-lg";
                } else {
                    btn.className = "w-full py-4 font-bold rounded-lg transition-all bg-brand-surface text-brand-white/20 cursor-not-allowed border border-transparent";
                }
            }
            return;
        }

        this.render();
    }


    setRadiantStep(step) {
        this.setState({ radiantStep: step });
    }

    confirmarCancelamentoRadiant(button) {
        button.disabled = true;
        button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Confirmando...`;
        setTimeout(() => { this.setRadiantStep(3); }, 800);
    }

    checkRadiantSurveySelect(value) {
        const btn = document.getElementById('btn-radiant-send-survey');
        if (btn) {
            if (value === '') {
                btn.disabled = true;
                btn.className = "px-8 py-4 bg-[#2a3147] text-white/30 font-black rounded-xl transition-all text-lg flex items-center justify-center gap-2 cursor-not-allowed";
            } else {
                btn.disabled = false;
                btn.className = "px-8 py-4 bg-radiant-blue hover:bg-radiant-blue/80 text-white font-black rounded-xl transition-all shadow-xl text-lg flex items-center justify-center gap-2 cursor-pointer";
            }
        }
    }

    finishLabWithSpinner(action_or_abandonou, button) {
        if (this.state.pattern === 'radiant') {
            const action = action_or_abandonou;
            if (action === 'encerrar') {
                const selectEl = document.getElementById('radiant-survey-select');
                if (selectEl) selectEl.value = '';
                const textareaEl = document.getElementById('radiant-survey-textarea');
                if (textareaEl) textareaEl.value = '';
                window.radiantSurveySelectValue = '';
                window.radiantSurveyTextareaValue = '';
            } else {
                const selectEl = document.getElementById('radiant-survey-select');
                const textareaEl = document.getElementById('radiant-survey-textarea');
                window.radiantSurveySelectValue = selectEl ? selectEl.value : '';
                window.radiantSurveyTextareaValue = textareaEl ? textareaEl.value : '';
            }
            const buttons = document.querySelectorAll('#radiant-step-3 button');
            buttons.forEach(btn => btn.disabled = true);
            const originalText = button.textContent.trim();
            button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${originalText}`;
            setTimeout(() => { this.finishLab(false); }, 800);
        } else {
            const abandonou = action_or_abandonou;
            const buttons = document.querySelectorAll('#dark-step-4 button');
            buttons.forEach(btn => btn.disabled = true);
            const originalText = button.textContent.trim();
            button.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${originalText}`;
            setTimeout(() => { this.finishLab(abandonou); }, 800);
        }
    }


    finishLab(abandonou = false) {
        window.end_time_ms = performance.now();
        if (this.state.pattern === 'radiant') {
            window.radiantRespondeuSurvey = (window.radiantSurveySelectValue && window.radiantSurveySelectValue !== '') ? 'Sim' : 'Não';
        }

        const msg = abandonou
            ? 'Você desistiu do cancelamento e manteve a assinatura ativa.'
            : 'O cancelamento foi concluído com sucesso!';

        this.setState({
            view: 'end',
            endMessage: msg,
            abandonou: abandonou
        });
    }

    resetLab() {
        if (localStorage.getItem('testeConcluido') === 'true') {
            document.body.innerHTML = "<div class='min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8'><h1 class='text-[#FFFBF5] text-3xl font-bold text-center'>Você já participou deste experimento. Agradecemos sua colaboração!</h1></div>";
            alert("Você já participou deste experimento. Agradecemos sua colaboração!");
            return;
        }
        const varianteAtiva = localStorage.getItem('variante_sorteada_experimento') || 'dark';
        this.setState({
            pattern: varianteAtiva,
            view: 'setup',
            endMessage: '',
            abandonou: false
        });
        if (typeof mudarFavicon === 'function') mudarFavicon('default');
    }

    onTcleChange(decision) {
        const btn = document.getElementById('btn-tcle-continue');
        if (btn) btn.disabled = false;
        this.tcleDecision = decision;
    }

    onTcleContinue() {
        const decision = this.tcleDecision;
        const screenTcle = document.getElementById('screen-tcle');

        if (decision === 'ACEITO') {
            const screenSurvey = document.getElementById('screen-survey');
            if (screenTcle) screenTcle.classList.remove('active');
            setTimeout(() => {
                if (screenTcle) screenTcle.style.display = 'none';
                if (screenSurvey) {
                    screenSurvey.style.display = 'block';
                    void screenSurvey.offsetWidth;
                    screenSurvey.classList.add('active');
                }
                window.initSurvey();
            }, 300);
        } else {
            const screenRejected = document.getElementById('screen-rejected');
            if (screenTcle) screenTcle.classList.remove('active');
            setTimeout(() => {
                if (screenTcle) screenTcle.style.display = 'none';
                if (screenRejected) {
                    screenRejected.style.display = 'block';
                    void screenRejected.offsetWidth;
                    screenRejected.classList.add('active');
                }
            }, 300);
        }
    }

    surveyNextPage() {
        const validationError = document.getElementById('survey-validation-error');
        if (validationError) validationError.classList.add('hidden');

        if (!window.validateCurrentSection()) {
            if (validationError) validationError.classList.remove('hidden');
            return;
        }

        if (window.currentSectionIndex < window.visibleSections.length - 1) {
            window.currentSectionIndex++;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.renderSection();
        }
    }

    surveyPrevPage() {
        const validationError = document.getElementById('survey-validation-error');
        if (validationError) validationError.classList.add('hidden');

        if (window.currentSectionIndex > 0) {
            window.currentSectionIndex--;
            window.scrollTo({ top: 0, behavior: 'smooth' });
            window.renderSection();
        }
    }

    surveySubmit() {
        const validationError = document.getElementById('survey-validation-error');
        if (validationError) validationError.classList.add('hidden');

        if (!window.validateCurrentSection()) {
            if (validationError) validationError.classList.remove('hidden');
            return;
        }

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) progressBar.style.width = '100%';

        const isAreaOutras = window.userAnswers.area_atuacao && window.userAnswers.area_atuacao.startsWith('Outras:');
        const surveyData = {
            idade: window.userAnswers.idade,
            genero: window.userAnswers.genero.startsWith('Outros:') ? 'Outros + input de resposta curta' : window.userAnswers.genero,
            genero_outro: window.userAnswers.genero.startsWith('Outros:') ? window.userAnswers.genero.replace('Outros:', '').trim() : '',
            escolaridade: window.userAnswers.escolaridade,
            freq_digital: window.userAnswers.frequencia_servicos_digitais,
            freq_streaming: window.userAnswers.frequencia_streaming,
            area_atuacao: isAreaOutras ? 'Outras Áreas' : window.userAnswers.area_atuacao,
            area_atuacao_outro: isAreaOutras ? window.userAnswers.area_atuacao.replace('Outras:', '').trim() : '',
            assinatura_mantida: window.userAnswers.assinatura_mantida_ativa || '',
            pu_1: window.userAnswers.pu_1_frustracao,
            pu_2: window.userAnswers.pu_2_confusao,
            pu_5: window.userAnswers.pu_5_cansativo,
            pu_7: window.userAnswers.pu_7_controle,
            rw_4: window.userAnswers.rw_4_experiencia_gratificante,
            voltaria: window.userAnswers.voltaria_utilizar_servico,
            consentimento: 'ACEITO'
        };

        window.enviarTelemetria(this.state.abandonou, surveyData);
    }


    render() {
        this.appElement.innerHTML = '';

        if (this.state.view === 'loading') {
            this.bodyElement.style.backgroundColor = '#000000';
            this.bodyElement.className = 'min-h-screen flex flex-col font-sans';
        } else if (this.state.pattern === 'radiant' && this.state.view !== 'setup' && this.state.view !== 'instruction' && this.state.view !== 'end') {
            this.bodyElement.style.backgroundColor = '#0a090c';
            this.bodyElement.className = 'text-radiant-white min-h-screen flex flex-col font-sans transition-colors duration-500';
        } else if (this.state.pattern === 'dark' && this.state.view !== 'setup' && this.state.view !== 'instruction' && this.state.view !== 'end') {
            this.bodyElement.style.backgroundColor = '#0a0a0a';
            this.bodyElement.className = 'text-brand-white min-h-screen flex flex-col font-sans transition-colors duration-500';
        } else {
            this.bodyElement.style.backgroundColor = '#f9fafb';
            this.bodyElement.className = 'text-gray-800 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900 transition-colors duration-500';
        }

        if (this.state.view === 'catalog' || this.state.view === 'settings') {
            if (this.state.pattern === 'radiant') {
                this.appElement.insertAdjacentHTML('beforeend', HeaderRadiant(this.state.view));
            } else {
                this.appElement.insertAdjacentHTML('beforeend', HeaderDark(this.state.isDarkMenuOpen, this.state.view));
            }
        }

        const main = document.createElement('main');
        main.className = 'flex-grow flex flex-col';
        if (this.state.pattern === 'radiant' && (this.state.view === 'catalog' || this.state.view === 'setup' || this.state.view === 'end' || this.state.view === 'instruction')) {
            main.className = 'flex-grow flex flex-col justify-center';
        }

        let contentHtml = '';
        switch (this.state.view) {
            case 'setup':
                contentHtml = SetupView();
                break;
            case 'instruction':
                contentHtml = InstructionView(this.state.pattern);
                break;
            case 'loading':
                if (this.state.pattern === 'radiant') {
                    contentHtml = `
                    <div class="fixed inset-0 flex items-center justify-center bg-[#000000] z-50 animate-fade-in">
                        <div class="relative w-[300px] h-[75px] sm:w-[400px] sm:h-[100px]">
                            <img src="./assets/radiant-plus.png" onerror="if(!this.src.includes('/public/')) this.src='./public/assets/radiant-plus.png';" alt="Loading..." class="absolute inset-0 w-full h-full object-contain opacity-10" />
                            <img src="./assets/radiant-plus.png" onerror="if(!this.src.includes('/public/')) this.src='./public/assets/radiant-plus.png';" alt="Loading..." class="absolute inset-0 w-full h-full object-contain animate-reveal-up" />
                        </div>
                    </div>`;
                } else {
                    contentHtml = `
                    <div class="fixed inset-0 flex items-center justify-center bg-[#000000] z-50 animate-fade-in">
                        <div class="relative flex items-center justify-center">
                            <div style="font-family: 'Afacad Flux', sans-serif; font-weight: 900; color: #F0193D;" class="select-none text-center text-6xl sm:text-8xl tracking-wider uppercase opacity-10">Dark Max</div>
                            <div style="font-family: 'Afacad Flux', sans-serif; font-weight: 900; color: #F0193D;" class="absolute inset-0 select-none text-center text-6xl sm:text-8xl tracking-wider uppercase animate-reveal-up">Dark Max</div>
                        </div>
                    </div>`;
                }
                break;
            case 'catalog':
                if (this.state.pattern === 'radiant') {
                    contentHtml = CatalogRadiant(categories, fictionalTitles, featuredContent, this.state.featuredIndex);
                } else {
                    contentHtml = CatalogDark(categories, fictionalTitles, featuredContent, this.state.featuredIndex);
                }
                break;
            case 'settings':
                if (this.state.pattern === 'radiant') {
                    contentHtml = SettingsRadiant(this.state.radiantStep);
                } else {
                    contentHtml = SettingsDark(this.state.darkStep, this.state.darkChecks);
                }
                break;
            case 'end':
                contentHtml = EndView(this.state.endMessage, this.state.pattern, this.state.abandonou);
                break;
        }

        main.innerHTML = contentHtml;
        this.appElement.appendChild(main);

        if (this.state.view === 'catalog') {
            const heroBtn = document.getElementById('hero-button');
            if (heroBtn) {
                heroBtn.addEventListener('click', () => this.nextHero());
            }
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

}

function mudarFavicon(variante) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    if (variante === 'radiant') {
        link.href = './assets/radiantfavicon.svg';
    } else if (variante === 'dark') {
        link.href = './assets/darkfavicon.svg';
    } else {
        link.href = './assets/favicon.svg';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Trava de Duplicidade pós-envio
    if (localStorage.getItem('testeConcluido') === 'true') {
        document.body.innerHTML = "<div class='min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8'><h1 class='text-[#FFFBF5] text-3xl font-bold text-center'>Você já participou deste experimento.</h1></div>";
        return;
    }

    const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzttCYAEDYTG1wXXpL5lqrNYbmOf779yMfGEG_SwN7bfrluiNo5ilXky7ezPxRk3TiN/exec";
    let varianteAtiva = localStorage.getItem('variante_sorteada_experimento');

    // SE O USUÁRIO FOR NOVO (Não tem localStorage ainda)
    if (!varianteAtiva) {
        try {
            // Pergunta de forma invisível para o Google Script qual foi a última variante real
            const resposta = await fetch(`${URL_SCRIPT}?acao=lerUltima`);
            const ultimaVarianteBanco = await resposta.text(); // Retorna "Radiant" ou "Dark"

            // Aplica a lógica de blocos irretocável baseada no BANCO REAL
            varianteAtiva = (ultimaVarianteBanco === "Radiant") ? "dark" : "radiant";

            // Avisa o Google Script para atualizar o banco com a variante desse novo usuário
            // Passamos a variante com a primeira letra maiúscula para manter o seu padrão
            const varianteFormatada = varianteAtiva === "radiant" ? "Radiant" : "Dark";
            await fetch(`${URL_SCRIPT}?acao=gravar&v=${varianteFormatada}`);

            // Salva IMEDIATAMENTE no localStorage da máquina dele na Página 1
            localStorage.setItem('variante_sorteada_experimento', varianteAtiva);

        } catch (erro) {
            console.error("Erro na sincronização de blocos, aplicando fallback random:", erro);
            varianteAtiva = Math.random() < 0.5 ? 'radiant' : 'dark';
            localStorage.setItem('variante_sorteada_experimento', varianteAtiva);
        }
    }

    // SE O CARA JÁ TIVER LOCALSTORAGE (F5, botão voltar, reabrir aba)
    // O código pula o fetch inteiro ali de cima, não bate no Google, não mexe no banco
    // e carrega instantaneamente a variante que ele já era.

    // 3. INICIALIZA O APP COM A VARIANTE BLINDADA
    const app = new App();
    app.setState({ pattern: varianteAtiva });

    // Seu método de mudar favicon (inicia com o favicon neutro/default até começar o teste)
    if (typeof mudarFavicon === 'function') mudarFavicon('default');
});