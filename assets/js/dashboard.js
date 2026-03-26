// Civilization Stress Index Pro - Enhanced Dashboard
// Real World Bank API Integration + No CDN Dependencies
// Version 1.0.0

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    // API Endpoints
    API: {
        WORLD_BANK: 'https://api.worldbank.org/v2',
        OPEN_METEO: 'https://archive-api.open-meteo.com/v1/archive',
        CACHE_DURATION: 60 * 60 * 1000, // 1 hour cache
        RETRY_ATTEMPTS: 2,
        TIMEOUT: 10000 // 10 seconds
    },

    // Regions with country codes for API calls
    REGIONS: {
        'South Asia': { lat: 22, lon: 82, code: 'IND' },
        'Middle East': { lat: 28, lon: 45, code: 'SAU' },
        'Sub-Saharan Africa': { lat: 5, lon: 20, code: 'NGA' },
        'Mediterranean': { lat: 38, lon: 15, code: 'ITA' },
        'Southeast Asia': { lat: 12, lon: 105, code: 'IDN' },
        'North America': { lat: 40, lon: -98, code: 'USA' },
        'Western Europe': { lat: 50, lon: 8, code: 'DEU' },
        'East Asia': { lat: 35, lon: 110, code: 'CHN' },
        'Amazon Basin': { lat: -5, lon: -60, code: 'BRA' },
        'Central Asia': { lat: 45, lon: 65, code: 'KAZ' },
        'Andean Region': { lat: -15, lon: -70, code: 'PER' },
        'Central America': { lat: 14, lon: -86, code: 'GTM' },
        'Caribbean': { lat: 20, lon: -75, code: 'JAM' },
        'Oceania': { lat: -25, lon: 135, code: 'AUS' },
        'Nordic Region': { lat: 62, lon: 15, code: 'SWE' },
        'Russian Federation': { lat: 62, lon: 90, code: 'RUS' }
    },

    // World Bank Indicators (REAL APIs)
    INDICATORS: {
        // Climate: Temperature anomaly (we'll derive from Open-Meteo)
        CLIMATE: { source: 'OPEN_METEO', name: 'Climate Stress' },

        // Food: Prevalence of undernourishment (% of population)
        FOOD: {
            code: 'SN.ITK.DEFC.ZS',
            name: 'Food Security',
            description: 'Prevalence of undernourishment (% of population)',
            source: 'WORLD_BANK'
        },

        // Economy: GDP growth (annual %)
        ECONOMY: {
            code: 'NY.GDP.MKTP.KD.ZG',
            name: 'Economic Stability',
            description: 'GDP growth (annual %)',
            source: 'WORLD_BANK'
        },

        // Social: Life expectancy at birth, total (years)
        SOCIAL: {
            code: 'SP.DYN.LE00.IN',
            name: 'Social Development',
            description: 'Life expectancy at birth (years)',
            source: 'WORLD_BANK'
        },

        // Political: Political stability and absence of violence/terrorism (estimate)
        POLITICAL: {
            code: 'PV.EST',
            name: 'Political Stability',
            description: 'Political stability estimate (-2.5 to 2.5)',
            source: 'WORLD_BANK'
        }
    },

    // Weightings for composite stress index
    WEIGHTS: {
        CLIMATE: 0.35,
        FOOD: 0.25,
        ECONOMY: 0.20,
        SOCIAL: 0.12,
        POLITICAL: 0.08
    },

    // Color scales for stress levels
    COLORS: {
        LOW: '#22c55e',      // Green: <65
        MODERATE: '#eab308',  // Yellow: 65-74
        HIGH: '#f97316',      // Orange: 75-84
        CRITICAL: '#dc2626'   // Red: 85+
    }
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const STATE = {
    regionsData: {},
    currentRegion: 'Sub-Saharan Africa',
    isLoading: false,
    chartInstances: {},
    apiStatus: {
        worldBank: 'pending',
        openMeteo: 'pending',
        cache: 'empty'
    }
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

const Cache = {
    set(key, data, ttl = CONFIG.API.CACHE_DURATION) {
        const item = {
            data: data,
            timestamp: Date.now(),
            ttl: ttl
        };
        localStorage.setItem(`stress-pro:${key}`, JSON.stringify(item));
    },

    get(key) {
        const raw = localStorage.getItem(`stress-pro:${key}`);
        if (!raw) return null;

        const item = JSON.parse(raw);
        const now = Date.now();

        if (now - item.timestamp > item.ttl) {
            localStorage.removeItem(`stress-pro:${key}`);
            return null;
        }

        return item.data;
    },

    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('stress-pro:')) {
                localStorage.removeItem(key);
            }
        });
    },

    getStats() {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('stress-pro:'));
        return {
            total: keys.length,
            size: keys.reduce((total, key) => total + localStorage.getItem(key).length, 0)
        };
    }
};

// ============================================================================
// API INTEGRATION (REAL WORLD BANK + OPEN-METEO)
// ============================================================================

class API {
    constructor() {
        this.timeout = CONFIG.API.TIMEOUT;
        this.retries = CONFIG.API.RETRY_ATTEMPTS;
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async fetchWithRetry(url, options = {}, retries = this.retries) {
        for (let i = 0; i <= retries; i++) {
            try {
                return await this.fetchWithTimeout(url, options);
            } catch (error) {
                if (i === retries) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // REAL API: World Bank Data
    async fetchWorldBankIndicator(countryCode, indicatorCode, year = 2023) {
        const cacheKey = `wb:${countryCode}:${indicatorCode}:${year}`;
        const cached = Cache.get(cacheKey);
        if (cached) return { data: cached, source: 'cache' };

        try {
            const url = `${CONFIG.API.WORLD_BANK}/country/${countryCode}/indicator/${indicatorCode}?format=json&date=${year}`;
            console.log(`Fetching World Bank: ${url}`);

            const response = await this.fetchWithRetry(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data[1] && data[1][0] && data[1][0].value !== null) {
                Cache.set(cacheKey, data);
                STATE.apiStatus.worldBank = 'connected';
                return { data: data, source: 'api' };
            } else {
                throw new Error('No data available');
            }
        } catch (error) {
            console.warn(`World Bank API failed for ${indicatorCode}:`, error);
            STATE.apiStatus.worldBank = 'error';
            return { data: null, source: 'error', error: error.message };
        }
    }

    // REAL API: Open-Meteo Climate Data
    async fetchClimateData(lat, lon, startDate = '2023-01-01', endDate = '2024-12-31') {
        const cacheKey = `climate:${lat}:${lon}:${startDate}:${endDate}`;
        const cached = Cache.get(cacheKey);
        if (cached) return { data: cached, source: 'cache' };

        try {
            const url = `${CONFIG.API.OPEN_METEO}?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean&timezone=auto`;
            console.log(`Fetching Open-Meteo: ${url}`);

            const response = await this.fetchWithRetry(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            if (data.daily && data.daily.temperature_2m_mean) {
                Cache.set(cacheKey, data);
                STATE.apiStatus.openMeteo = 'connected';
                return { data: data, source: 'api' };
            } else {
                throw new Error('No temperature data');
            }
        } catch (error) {
            console.warn(`Open-Meteo API failed:`, error);
            STATE.apiStatus.openMeteo = 'error';
            return { data: null, source: 'error', error: error.message };
        }
    }

    // Process World Bank indicator to stress score (0-100)
    processWorldBankValue(indicatorCode, rawValue) {
        if (rawValue === null || rawValue === undefined) return 50; // Default neutral

        switch (indicatorCode) {
            case 'SN.ITK.DEFC.ZS': // Food: % undernourished (higher = worse)
                return Math.min(100, Math.max(0, rawValue * 2)); // Convert % to 0-100 scale

            case 'NY.GDP.MKTP.KD.ZG': // Economy: GDP growth %
                if (rawValue < -5) return 85;
                if (rawValue < -2) return 75;
                if (rawValue < 0) return 65;
                if (rawValue < 1) return 55;
                if (rawValue < 2) return 45;
                if (rawValue < 3) return 35;
                return Math.max(25, 40 - rawValue * 5);

            case 'SP.DYN.LE00.IN': // Social: Life expectancy
                // Convert life expectancy to stress (lower life expectancy = higher stress)
                if (rawValue < 60) return 80;
                if (rawValue < 65) return 70;
                if (rawValue < 70) return 60;
                if (rawValue < 75) return 50;
                if (rawValue < 80) return 40;
                return 30;

            case 'PV.EST': // Political: Stability estimate (-2.5 to 2.5)
                // Convert to 0-100 stress (lower stability = higher stress)
                const normalized = ((2.5 - rawValue) / 5) * 100;
                return Math.min(100, Math.max(0, normalized));

            default:
                return 50;
        }
    }

    // Process climate data to stress score (0-100)
    processClimateData(climateData) {
        if (!climateData || !climateData.daily || !climateData.daily.temperature_2m_mean) {
            return 60; // Default moderate
        }

        const temps = climateData.daily.temperature_2m_mean;
        const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        const baseline = 14; // Global average reference
        const anomaly = Math.abs(avgTemp - baseline);

        // Convert temperature anomaly to stress score
        return Math.min(92, Math.max(35, 40 + anomaly * 10));
    }
}

// ============================================================================
// DATA PROCESSING & STRESS CALCULATION
// ============================================================================

class StressCalculator {
    constructor() {
        this.api = new API();
    }

    async calculateRegionStress(regionName, regionData) {
        const results = {
            region: regionName,
            coordinates: regionData,
            indicators: {},
            sources: {},
            timestamp: Date.now()
        };

        // 1. Climate (Open-Meteo)
        const climateResult = await this.api.fetchClimateData(regionData.lat, regionData.lon);
        results.sources.climate = climateResult.source;

        if (climateResult.data) {
            results.indicators.climate = {
                value: this.api.processClimateData(climateResult.data),
                raw: climateResult.data,
                description: 'Temperature anomaly stress'
            };
        } else {
            results.indicators.climate = {
                value: 60, // Fallback
                raw: null,
                description: 'Fallback: Moderate climate stress'
            };
        }

        // 2. Food Security (World Bank)
        const foodResult = await this.api.fetchWorldBankIndicator(regionData.code, CONFIG.INDICATORS.FOOD.code);
        results.sources.food = foodResult.source;

        if (foodResult.data) {
            const rawValue = foodResult.data[1]?.[0]?.value;
            results.indicators.food = {
                value: this.api.processWorldBankValue(CONFIG.INDICATORS.FOOD.code, rawValue),
                raw: rawValue,
                description: CONFIG.INDICATORS.FOOD.description
            };
        } else {
            // Fallback derived from climate
            results.indicators.food = {
                value: Math.min(90, Math.max(35, results.indicators.climate.value * 0.8 + 20)),
                raw: null,
                description: 'Derived: From climate data correlation'
            };
        }

        // 3. Economy (World Bank)
        const economyResult = await this.api.fetchWorldBankIndicator(regionData.code, CONFIG.INDICATORS.ECONOMY.code);
        results.sources.economy = economyResult.source;

        if (economyResult.data) {
            const rawValue = economyResult.data[1]?.[0]?.value;
            results.indicators.economy = {
                value: this.api.processWorldBankValue(CONFIG.INDICATORS.ECONOMY.code, rawValue),
                raw: rawValue,
                description: CONFIG.INDICATORS.ECONOMY.description
            };
        } else {
            // Fallback
            results.indicators.economy = {
                value: 55,
                raw: null,
                description: 'Fallback: Global average'
            };
        }

        // 4. Social (World Bank)
        const socialResult = await this.api.fetchWorldBankIndicator(regionData.code, CONFIG.INDICATORS.SOCIAL.code);
        results.sources.social = socialResult.source;

        if (socialResult.data) {
            const rawValue = socialResult.data[1]?.[0]?.value;
            results.indicators.social = {
                value: this.api.processWorldBankValue(CONFIG.INDICATORS.SOCIAL.code, rawValue),
                raw: rawValue,
                description: CONFIG.INDICATORS.SOCIAL.description
            };
        } else {
            // Fallback derived from economy
            results.indicators.social = {
                value: Math.min(85, Math.max(35, results.indicators.economy.value * 1.1 - 10)),
                raw: null,
                description: 'Derived: From economic data correlation'
            };
        }

        // 5. Political (World Bank)
        const politicalResult = await this.api.fetchWorldBankIndicator(regionData.code, CONFIG.INDICATORS.POLITICAL.code);
        results.sources.political = politicalResult.source;

        if (politicalResult.data) {
            const rawValue = politicalResult.data[1]?.[0]?.value;
            results.indicators.political = {
                value: this.api.processWorldBankValue(CONFIG.INDICATORS.POLITICAL.code, rawValue),
                raw: rawValue,
                description: CONFIG.INDICATORS.POLITICAL.description
            };
        } else {
            // Fallback derived from economy and social
            results.indicators.political = {
                value: Math.min(90, Math.max(30, (results.indicators.economy.value + results.indicators.social.value) / 2)),
                raw: null,
                description: 'Derived: From economic and social data'
            };
        }

        // Calculate composite stress score
        results.composite = this.calculateCompositeStress(results.indicators);

        // Determine stress level and color
        results.stressLevel = this.getStressLevel(results.composite);
        results.color = this.getStressColor(results.composite);

        return results;
    }

    calculateCompositeStress(indicators) {
        const weights = CONFIG.WEIGHTS;
        return Math.round(
            (indicators.climate.value * weights.CLIMATE) +
            (indicators.food.value * weights.FOOD) +
            (indicators.economy.value * weights.ECONOMY) +
            (indicators.social.value * weights.SOCIAL) +
            (indicators.political.value * weights.POLITICAL)
        );
    }

    getStressLevel(score) {
        if (score >= 85) return 'CRITICAL';
        if (score >= 75) return 'HIGH';
        if (score >= 65) return 'MODERATE';
        return 'LOW';
    }

    getStressColor(score) {
        if (score >= 85) return CONFIG.COLORS.CRITICAL;
        if (score >= 75) return CONFIG.COLORS.HIGH;
        if (score >= 65) return CONFIG.COLORS.MODERATE;
        return CONFIG.COLORS.LOW;
    }
}

// ============================================================================
// UI UPDATES & VISUALIZATION
// ============================================================================

class UI {
    constructor() {
        this.calculator = new StressCalculator();
        this.currentChart = null;
    }

    updateStatus(message, type = 'info') {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `api-status ${type}`;
    }

    updateLoadingState(isLoading) {
        STATE.isLoading = isLoading;
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.disabled = isLoading;
            refreshBtn.innerHTML = isLoading ?
                '<span class="loading"></span> Refreshing...' :
                '🔄 Refresh Data';
        }
    }

    updateKPI(data) {
        if (!data || Object.keys(data).length === 0) return;

        const regions = Object.values(STATE.regionsData);
        if (regions.length === 0) return;

        // Global averages
        const avgStress = Math.round(regions.reduce((sum, r) => sum + r.composite, 0) / regions.length);
        const criticalCount = regions.filter(r => r.stressLevel === 'CRITICAL').length;

        const avgClimate = Math.round(regions.reduce((sum, r) => sum + r.indicators.climate.value, 0) / regions.length);
        const avgFood = Math.round(regions.reduce((sum, r) => sum + r.indicators.food.value, 0) / regions.length);

        document.getElementById('globalStress').textContent = avgStress;
        document.getElementById('criticalCount').textContent = criticalCount;
        document.getElementById('climateAvg').textContent = avgClimate;
        document.getElementById('foodAvg').textContent = avgFood;

        // Update gauge
        this.updateGauge(avgStress);
    }

    updateGauge(value) {
        const canvas = document.getElementById('stressGauge');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 50;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#2d3a4e';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Draw value arc
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * (value / 100));

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.strokeStyle = this.calculator.getStressColor(value);
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Update text
        document.getElementById('gaugeValue').textContent = value;
    }

    updateRegionButtons() {
        const container = document.getElementById('regionButtons');
        if (!container) return;

        const regions = Object.entries(STATE.regionsData)
            .sort((a, b) => b[1].composite - a[1].composite);

        container.innerHTML = regions.map(([name, data]) => `
            <button class="region-btn ${name === STATE.currentRegion ? 'active' : ''}"
                    data-region="${name}"
                    style="border-color: ${data.color}; color: ${data.color}">
                <span class="region-dot" style="background: ${data.color}"></span>
                ${name} (${data.composite})
            </button>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.region-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectRegion(btn.dataset.region));
        });
    }

    selectRegion(regionName) {
        STATE.currentRegion = regionName;
        this.updateRegionDetail();
        this.updateRegionButtons();
    }

    updateRegionDetail() {
        const data = STATE.regionsData[STATE.currentRegion];
        if (!data) return;

        const detailEl = document.getElementById('regionDetail');
        if (!detailEl) return;

        document.getElementById('regionName').textContent = STATE.currentRegion;
        document.getElementById('stressValue').textContent = data.composite;

        // Update stress bar
        const stressBar = document.getElementById('stressBar');
        if (stressBar) {
            stressBar.style.width = `${data.composite}%`;
            stressBar.style.background = data.color;
        }

        // Update indicators grid
        this.updateIndicatorGrid(data);

        // Update API source info
        this.updateSourceInfo(data);
    }

    updateIndicatorGrid(data) {
        const gridEl = document.getElementById('indicatorGrid');
        if (!gridEl) return;

        const indicators = [
            { key: 'climate', label: '🌡️ Climate', emoji: '🌡️' },
            { key: 'food', label: '🌾 Food Security', emoji: '🌾' },
            { key: 'economy', label: '💰 Economy', emoji: '💰' },
            { key: 'social', label: '👥 Social', emoji: '👥' },
            { key: 'political', label: '🏛️ Political', emoji: '🏛️' }
        ];

        gridEl.innerHTML = indicators.map(ind => {
            const indicator = data.indicators[ind.key];
            const source = data.sources[ind.key];
            const sourceBadge = source === 'api' ? 'real' :
                               source === 'cache' ? 'cached' : 'derived';

            return `
                <div class="indicator-card">
                    <div class="indicator-header">
                        <span class="indicator-emoji">${ind.emoji}</span>
                        <span class="indicator-label">${ind.label}</span>
                        <span class="data-badge ${sourceBadge}">${source.toUpperCase()}</span>
                    </div>
                    <div class="indicator-value">${indicator.value}</div>
                    <div class="indicator-description">${indicator.description}</div>
                    ${indicator.raw !== null ?
                        `<div class="indicator-raw">Raw: ${indicator.raw}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    updateSourceInfo(data) {
        const infoEl = document.getElementById('apiSourceInfo');
        if (!infoEl) return;

        const sources = Object.entries(data.sources).reduce((acc, [key, source]) => {
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {});

        const sourceText = Object.entries(sources)
            .map(([source, count]) => {
                const label = source === 'api' ? '✅ REAL API' :
                             source === 'cache' ? '📊 CACHED' :
                             '⚠️ DERIVED';
                return `${label}: ${count}`;
            })
            .join(' · ');

        infoEl.innerHTML = `<p>📡 <strong>Data Sources:</strong> ${sourceText}</p>`;
    }

    updateApiGrid() {
        const gridEl = document.getElementById('apiGrid');
        if (!gridEl) return;
        
        const apiEndpoints = [
            {
                name: 'World Bank API',
                endpoint: 'https://api.worldbank.org/v2',
                status: STATE.apiStatus.worldBank || 'unknown',
                description: 'Food security, economic growth, social development, political stability indicators',
                indicators: [
                    'SN.ITK.DEFC.ZS (Food: Undernourishment %)',
                    'NY.GDP.MKTP.KD.ZG (Economy: GDP growth %)',
                    'SP.DYN.LE00.IN (Social: Life expectancy)',
                    'PV.EST (Political: Stability estimate)'
                ]
            },
            {
                name: 'Open-Meteo API',
                endpoint: 'https://archive-api.open-meteo.com/v1/archive',
                status: STATE.apiStatus.openMeteo || 'unknown',
                description: 'Historical temperature data for climate stress calculation',
                indicators: [
                    'temperature_2m_mean (Daily average temperature)'
                ]
            }
        ];
        
        gridEl.innerHTML = apiEndpoints.map(api => `
            <div class="api-card">
                <div class="api-header">
                    <h3>${api.name}</h3>
                    <span class="api-status ${api.status === 'connected' ? 'connected' : 'error'}">
                        ${api.status === 'connected' ? '✅ Connected' : '⚠️ Error'}
                    </span>
                </div>
                <div class="api-endpoint">
                    <code>${api.endpoint}</code>
                </div>
                <p class="api-description">${api.description}</p>
                <div class="api-indicators">
                    <strong>Indicators:</strong>
                    <ul>
                        ${api.indicators.map(ind => `<li>${ind}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    updateHistoricalGrid() {
        const gridEl = document.getElementById('historicalGrid');
        if (!gridEl) return;
        
        const historicalEvents = [
            {
                name: 'Roman Empire',
                period: '27 BC – 476 AD',
                cause: 'Political instability, economic collapse, military overspending',
                stressFactors: ['Political: High', 'Economic: High', 'Social: High'],
                relevance: 'Parallels to modern political fragmentation'
            },
            {
                name: 'Mayan Civilization',
                period: '250–900 AD',
                cause: 'Drought, deforestation, political conflict',
                stressFactors: ['Climate: Extreme', 'Food: Critical', 'Social: High'],
                relevance: 'Climate-induced societal collapse'
            },
            {
                name: 'Easter Island',
                period: '1200–1600 AD',
                cause: 'Resource depletion, ecological overshoot',
                stressFactors: ['Food: Critical', 'Social: High', 'Political: High'],
                relevance: 'Unsustainable resource use'
            },
            {
                name: 'Soviet Union',
                period: '1922–1991',
                cause: 'Economic stagnation, political corruption, social unrest',
                stressFactors: ['Economic: High', 'Political: Critical', 'Social: High'],
                relevance: 'Political-economic system failure'
            },
            {
                name: 'Syrian Civil War',
                period: '2011–present',
                cause: 'Drought, political oppression, economic inequality',
                stressFactors: ['Climate: High', 'Political: Critical', 'Social: Critical'],
                relevance: 'Modern multi-factor collapse'
            },
            {
                name: 'Venezuelan Crisis',
                period: '2013–present',
                cause: 'Economic mismanagement, political corruption, hyperinflation',
                stressFactors: ['Economic: Critical', 'Political: High', 'Social: High'],
                relevance: 'Economic collapse in modern globalized world'
            }
        ];
        
        gridEl.innerHTML = historicalEvents.map(event => `
            <div class="historical-card">
                <div class="historical-header">
                    <h3>${event.name}</h3>
                    <span class="historical-period">${event.period}</span>
                </div>
                <div class="historical-cause">
                    <strong>Primary cause:</strong> ${event.cause}
                </div>
                <div class="historical-stress">
                    <strong>Stress factors:</strong> ${event.stressFactors.join(', ')}
                </div>
                <div class="historical-relevance">
                    <strong>Modern relevance:</strong> ${event.relevance}
                </div>
            </div>
        `).join('');
    }

    async refreshAllData() {
        this.updateLoadingState(true);
        this.updateStatus('Fetching real API data...', 'fetching');

        STATE.regionsData = {};

        for (const [name, coords] of Object.entries(CONFIG.REGIONS)) {
            try {
                this.updateStatus(`Loading ${name}...`, 'fetching');
                const result = await this.calculator.calculateRegionStress(name, coords);
                STATE.regionsData[name] = result;

                // Update UI progressively
                this.updateKPI();
                this.updateRegionButtons();
            } catch (error) {
                console.error(`Failed to load ${name}:`, error);
            }
        }

        this.updateLoadingState(false);
        this.updateStatus('✅ All data loaded successfully', 'real');

        // Update current region detail
        this.updateRegionDetail();

        // Render map
        this.renderMap();
        this.updateApiGrid();
        this.updateHistoricalGrid();
    }

    renderMap() {
        // Use D3.js to render a world map with regions colored by stress level
        const svg = d3.select('#map-svg');
        if (svg.empty()) {
            console.warn('Map SVG not found');
            return;
        }

        // Clear previous map
        svg.selectAll('*').remove();

        // Set SVG dimensions
        const container = document.getElementById('map-container');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        svg.attr('width', width)
           .attr('height', height)
           .attr('viewBox', `0 0 ${width} ${height}`);

        // Simple equirectangular projection
        const project = (lat, lon) => {
            // Convert lat/lon to SVG coordinates
            const x = (lon + 180) * (width / 360);
            const y = (90 - lat) * (height / 180);
            return [x, y];
        };

        // Draw world background (simple rectangle)
        svg.append('rect')
           .attr('x', 0)
           .attr('y', 0)
           .attr('width', width)
           .attr('height', height)
           .attr('fill', '#0a192f')
           .attr('stroke', '#233554')
           .attr('stroke-width', 1);

        // Draw each region as a circle
        const regions = Object.entries(CONFIG.REGIONS);
        const tooltip = d3.select('#mapTooltip');

        regions.forEach(([regionName, coords]) => {
            const [x, y] = project(coords.lat, coords.lon);
            const regionData = STATE.regionsData[regionName];

            // Determine color based on stress level
            let color = '#233554'; // Default gray (no data)
            let radius = 8;

            if (regionData) {
                color = regionData.color;
                radius = 10 + (regionData.composite - 50) / 10; // Scale with stress
                radius = Math.max(6, Math.min(16, radius)); // Clamp
            }

            // Draw region circle
            const circle = svg.append('circle')
                .attr('cx', x)
                .attr('cy', y)
                .attr('r', radius)
                .attr('fill', color)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 1)
                .attr('opacity', 0.9)
                .attr('cursor', 'pointer')
                .on('mouseover', function(event) {
                    // Highlight
                    d3.select(this)
                      .attr('stroke', '#64ffda')
                      .attr('stroke-width', 2);

                    // Show tooltip
                    const stress = regionData ? `${regionData.composite} (${regionData.stressLevel})` : 'No data';
                    tooltip.classed('hidden', false)
                           .html(`
                               <strong>${regionName}</strong><br/>
                               Stress: ${stress}<br/>
                               Lat: ${coords.lat}, Lon: ${coords.lon}<br/>
                               ${regionData ? 'Click for details' : 'Data loading...'}
                           `)
                           .style('left', (event.pageX + 10) + 'px')
                           .style('top', (event.pageY - 10) + 'px');
                })
                .on('mouseout', function() {
                    // Reset highlight
                    d3.select(this)
                      .attr('stroke', '#ffffff')
                      .attr('stroke-width', 1);

                    // Hide tooltip
                    tooltip.classed('hidden', true);
                })
                .on('click', () => {
                    // Switch to this region
                    this.selectRegion(regionName);
                });

            // Add region label
            if (regionData) {
                svg.append('text')
                   .attr('x', x)
                   .attr('y', y - radius - 5)
                   .attr('text-anchor', 'middle')
                   .attr('fill', '#e6f1ff')
                   .attr('font-size', '10px')
                   .attr('font-weight', 'bold')
                   .text(regionName.substring(0, 12));
            }
        });

        // Draw grid lines (optional)
        for (let lon = -180; lon <= 180; lon += 30) {
            const x = (lon + 180) * (width / 360);
            svg.append('line')
               .attr('x1', x)
               .attr('y1', 0)
               .attr('x2', x)
               .attr('y2', height)
               .attr('stroke', '#233554')
               .attr('stroke-width', 0.5)
               .attr('opacity', 0.5);
        }

        for (let lat = -90; lat <= 90; lat += 30) {
            const y = (90 - lat) * (height / 180);
            svg.append('line')
               .attr('x1', 0)
               .attr('y1', y)
               .attr('x2', width)
               .attr('y2', y)
               .attr('stroke', '#233554')
               .attr('stroke-width', 0.5)
               .attr('opacity', 0.5);
        }

        console.log('Map rendered with', regions.length, 'regions');
    }

    exportCSV() {
        const regions = Object.values(STATE.regionsData);
        if (regions.length === 0) {
            alert('No data to export. Please load data first.');
            return;
        }

        const headers = ['Region', 'Stress', 'Climate', 'Food', 'Economy', 'Social', 'Political', 'Level'];
        const rows = regions.map(r => [
            r.region,
            r.composite,
            r.indicators.climate.value,
            r.indicators.food.value,
            r.indicators.economy.value,
            r.indicators.social.value,
            r.indicators.political.value,
            r.stressLevel
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        this.downloadFile(csv, 'civilization-stress-pro.csv', 'text/csv');
    }

    exportJSON() {
        const data = {
            timestamp: new Date().toISOString(),
            regions: STATE.regionsData,
            config: {
                weights: CONFIG.WEIGHTS,
                indicators: CONFIG.INDICATORS
            }
        };

        const json = JSON.stringify(data, null, 2);
        this.downloadFile(json, 'civilization-stress-pro.json', 'application/json');
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Global UI instance
let ui = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Civilization Stress Index Pro initializing...');

    // Initialize UI
    ui = new UI();

    // Set up event listeners
    document.getElementById('refreshData')?.addEventListener('click', () => ui.refreshAllData());
    document.getElementById('exportCSV')?.addEventListener('click', () => ui.exportCSV());
    document.getElementById('exportJSON')?.addEventListener('click', () => ui.exportJSON());

    // Window resize handling (throttled)
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (ui && STATE.regionsData && Object.keys(STATE.regionsData).length > 0) {
                ui.renderMap();
            }
        }, 250);
    });

    // Tab switching
    function switchTab(tabName) {
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
            panel.classList.toggle('hidden', panel.id !== `panel-${tabName}`);
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.onclick.toString().includes(`'${tabName}'`));
        });
    }

    // Expose to global scope
    window.switchTab = switchTab;

    // Load initial data (with slight delay to let UI render)
    setTimeout(() => {
        ui.refreshAllData();
    }, 500);

    console.log('Civilization Stress Index Pro ready!');
});