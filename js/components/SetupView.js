export const SetupView = () => {
    return `
        <div class="flex-grow flex items-center justify-center p-4 sm:p-6 w-full max-w-2xl mx-auto animate-fade-in text-gray-800">
            <div class="w-full bg-white shadow-2xl rounded-2xl overflow-hidden relative border border-gray-100 p-8 sm:p-12 text-center">
                <!-- Top subtle decoration/glow -->
                <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-[#6455E5] to-indigo-600"></div>
                
                <!-- Closed Icon -->
                <div class="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-purple-100 shadow-sm animate-pulse">
                    <svg class="w-10 h-10 text-[#6455E5]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                </div>

                <!-- Academic badge -->
                <span class="inline-block py-1.5 px-4 rounded-full bg-purple-50 text-[#6455E5] text-xs font-semibold tracking-wide mb-6 uppercase">
                    Pesquisa Concluída
                </span>

                <!-- Main Title & Message -->
                <h1 class="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4 font-sans leading-tight">
                    Testes encerrado.
                </h1>
                
                <p class="text-lg sm:text-xl text-gray-600 font-medium max-w-md mx-auto leading-relaxed mb-8">
                    Agradecemos sua vinda até aqui!
                </p>

                <!-- Underline divider -->
                <div class="w-16 h-0.5 bg-gray-200 mx-auto mb-8"></div>

                <!-- Additional info -->
                <div class="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                    Esta pesquisa de avaliação de usabilidade foi finalizada. A coleta de dados para este experimento científico da Universidade Federal do Ceará (UFC) foi encerrada.
                </div>
            </div>
        </div>
    `;
};

