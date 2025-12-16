// Утилита для debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Константы
const ANIMATION_DELAYS = {
    CARD_STAGGER: 100,
    ACTIVITY_BASE: 800,
    ACTIVITY_ITEM: 150
};
const UPDATE_INTERVAL = 60000;
const NOTIFICATION_DURATION = 3000;

// Управление состоянием приложения
const appState = {
    chart: null,
    chartResizeHandler: null,
    updateInterval: null,
    observers: []
};

// Инициализация анимаций и интерактивности
document.addEventListener('DOMContentLoaded', function() {
    // Проверка доступности библиотек
    if (typeof anime === 'undefined') {
        console.warn('Anime.js не загружен');
    }
    if (typeof echarts === 'undefined') {
        console.warn('ECharts не загружен');
    }

    // Анимация карточек при загрузке (только если видимы)
    const metricCards = document.querySelectorAll('.metric-card');
    if (metricCards.length > 0 && typeof anime !== 'undefined') {
        anime({
            targets: metricCards,
            translateY: [30, 0],
            opacity: [0, 1],
            delay: anime.stagger(ANIMATION_DELAYS.CARD_STAGGER),
            duration: 600,
            easing: 'easeOutExpo'
        });
    }

    // Ленивая инициализация графика продаж
    const chartElement = document.getElementById('salesChart');
    if (chartElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initSalesChart();
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px' });
        observer.observe(chartElement);
        appState.observers.push(observer);
    }

    // Добавление интерактивности кнопкам быстрых действий (делегирование событий)
    document.addEventListener('click', function(e) {
        const button = e.target.closest('button');
        if (!button) return;
        
        const text = button.textContent;
        if (text.includes('Создать сделку')) {
            showModal('Создание новой сделки', 'Функция создания сделки будет доступна в полной версии портала.');
        } else if (text.includes('Загрузить лицензию')) {
            showModal('Загрузка лицензии', 'Функция загрузки лицензий будет доступна в полной версии портала.');
        } else if (text.includes('Начать обучение')) {
            window.location.href = 'education.html';
        }
    });

    // Анимация активности в реальном времени
    animateActivityItems();
});

// Инициализация графика продаж
function initSalesChart() {
    const chartDom = document.getElementById('salesChart');
    if (!chartDom || typeof echarts === 'undefined') return;
    
    // Очистка предыдущего экземпляра
    if (appState.chart) {
        appState.chart.dispose();
    }
    
    appState.chart = echarts.init(chartDom);
    
    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: {
                color: '#374151'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            axisLabel: {
                color: '#6b7280'
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#e5e7eb'
                }
            },
            axisLabel: {
                color: '#6b7280'
            },
            splitLine: {
                lineStyle: {
                    color: '#f3f4f6'
                }
            }
        },
        series: [
            {
                name: 'Продажи',
                type: 'line',
                stack: 'Total',
                smooth: true,
                lineStyle: {
                    width: 3,
                    color: '#6366f1'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: 'rgba(99, 102, 241, 0.3)'
                        }, {
                            offset: 1, color: 'rgba(99, 102, 241, 0.05)'
                        }]
                    }
                },
                data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330]
            },
            {
                name: 'Цели',
                type: 'line',
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#10b981',
                    type: 'dashed'
                },
                data: [150, 150, 150, 150, 150, 250, 250, 250, 250, 250, 350, 350]
            }
        ]
    };

    appState.chart.setOption(option);
    
    // Удаление старого обработчика resize
    if (appState.chartResizeHandler) {
        window.removeEventListener('resize', appState.chartResizeHandler);
    }
    
    // Адаптация графика при изменении размера окна (с debounce)
    appState.chartResizeHandler = debounce(() => {
        if (appState.chart) {
            appState.chart.resize();
        }
    }, 250);
    window.addEventListener('resize', appState.chartResizeHandler);
}

// Функция показа модального окна (безопасная от XSS)
function showModal(title, message) {
    // Экранирование HTML для предотвращения XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };
    
    // Создание модального окна
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-white rounded-xl p-6 max-w-md w-full mx-4 transform transition-all';
    
    modalContent.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">${escapeHtml(title)}</h3>
            <button class="modal-close text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <p class="text-gray-600 mb-6">${escapeHtml(message)}</p>
        <div class="flex justify-end">
            <button class="modal-confirm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Понятно
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Обработчики закрытия модального окна
    const closeModal = () => {
        modal.remove();
    };
    
    modalContent.querySelector('.modal-close').addEventListener('click', closeModal);
    modalContent.querySelector('.modal-confirm').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Анимация появления модального окна
    if (typeof anime !== 'undefined') {
        anime({
            targets: modalContent,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });
    }
}

// Анимация элементов активности
function animateActivityItems() {
    const activityItems = document.querySelectorAll('.activity-item, .space-y-4 > div');
    
    if (activityItems.length === 0 || typeof anime === 'undefined') return;
    
    activityItems.forEach((item, index) => {
        anime({
            targets: item,
            translateX: [-50, 0],
            opacity: [0, 1],
            delay: ANIMATION_DELAYS.ACTIVITY_BASE + (index * ANIMATION_DELAYS.ACTIVITY_ITEM),
            duration: 500,
            easing: 'easeOutExpo'
        });
    });
}

// Функция для обновления данных в реальном времени (имитация)
function updateRealTimeData() {
    const metricCards = document.querySelectorAll('.metric-card');
    
    metricCards.forEach((card, index) => {
        const valueElement = card.querySelector('.text-3xl');
        if (valueElement && index === 0) { // Только для первой карточки (активные сделки)
            const currentValue = parseInt(valueElement.textContent);
            const newValue = currentValue + Math.floor(Math.random() * 3) - 1;
            
            if (newValue !== currentValue && typeof anime !== 'undefined') {
                anime({
                    targets: valueElement,
                    innerHTML: [currentValue, Math.max(0, newValue)],
                    duration: 1000,
                    round: 1,
                    easing: 'easeInOutQuad'
                });
            }
        }
    });
}

// Обновление данных каждые 60 секунд (уменьшена частота)
if (document.querySelector('.metric-card')) {
    appState.updateInterval = setInterval(updateRealTimeData, UPDATE_INTERVAL);
}

// Очистка ресурсов при уходе со страницы
window.addEventListener('beforeunload', () => {
    // Очистка интервала
    if (appState.updateInterval) {
        clearInterval(appState.updateInterval);
    }
    
    // Очистка графика
    if (appState.chart) {
        appState.chart.dispose();
    }
    
    // Очистка обработчика resize
    if (appState.chartResizeHandler) {
        window.removeEventListener('resize', appState.chartResizeHandler);
    }
    
    // Очистка observers
    appState.observers.forEach(observer => observer.disconnect());
});

// Плавная прокрутка для якорных ссылок (делегирование событий)
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (anchor) {
        e.preventDefault();
        const targetId = anchor.getAttribute('href');
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Функция для создания уведомлений
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Автоматическое исчезновение
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, NOTIFICATION_DURATION);
}