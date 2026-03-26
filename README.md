# 🌍 Civilization Stress Index Pro

**A complete, production-ready dashboard with REAL World Bank APIs for climate, food, social, political, and economic data analysis.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![No External CDNs](https://img.shields.io/badge/No_External_CDNs-100%25-success)](https://github.com/yourusername/stress-dashboard-pro)
[![Real APIs](https://img.shields.io/badge/Real_APIs-World_Bank_+_Open_Meteo-important)](https://worldbank.org)

## 🚀 Features

### ✅ **Real API Integration** (No Mock Data)
- **Climate Data**: Open-Meteo historical temperature API
- **Food Security**: World Bank `SN.ITK.DEFC.ZS` (Prevalence of undernourishment)
- **Economic Stability**: World Bank `NY.GDP.MKTP.KD.ZG` (GDP growth)
- **Social Development**: World Bank `SP.DYN.LE00.IN` (Life expectancy)
- **Political Stability**: World Bank `PV.EST` (Political stability estimate)

### ✅ **Professional Design**
- Modern dark theme with responsive layout
- Interactive world map with D3.js visualization
- Real-time data fetching with caching
- Mobile-friendly and accessible

### ✅ **No External Dependencies**
- All libraries self-hosted (D3.js, TopoJSON, Chart.js)
- System font fallbacks (Inter font optional)
- Zero external CDN calls in production

### ✅ **Complete Package**
- Production-ready HTML/CSS/JS
- API error handling with fallbacks
- Local storage caching
- CSV/JSON export functionality
- Detailed documentation

## 📸 Screenshots

![Dashboard Preview](https://via.placeholder.com/800x450/0a192f/e6f1ff?text=Civilization+Stress+Index+Pro+2026)
*Interactive dashboard with real-time data visualization*

## 🛠️ Quick Start

### Option 1: Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/stress-dashboard-pro.git
cd stress-dashboard-pro

# Install dependencies (one-time)
./scripts/download-dependencies.sh

# Open in browser
open index.html
```

### Option 2: Deploy to GitHub Pages
1. Fork this repository
2. Enable GitHub Pages in repository settings
3. Your dashboard will be live at: `https://yourusername.github.io/stress-dashboard-pro`

### Option 3: Deploy to Any Static Host
- Upload the entire folder to Netlify, Vercel, Render, or any static host
- No backend required - 100% client-side

## 📁 Project Structure

```
stress-dashboard-pro/
├── index.html                    # Main dashboard
├── README.md                     # This file
├── LICENSE.md                    # MIT License
├── scripts/
│   └── download-dependencies.sh  # Dependency download script
├── assets/
│   ├── css/
│   │   ├── style.css            # Main styles
│   │   ├── fonts/               # Self-hosted Inter font
│   │   └── fontawesome/         # Self-hosted Font Awesome
│   ├── js/
│   │   ├── dashboard.js         # Main application logic
│   │   ├── d3.min.js            # Self-hosted D3.js
│   │   ├── topojson.min.js      # Self-hosted TopoJSON
│   │   └── chart.min.js         # Self-hosted Chart.js
│   └── images/                  # Screenshots and assets
└── docs/
    └── deployment-guide.md      # Detailed deployment guide
```

## 🌐 API Data Sources

| Indicator | Source | API Endpoint | Real-Time |
|-----------|--------|--------------|-----------|
| **Climate** | Open-Meteo | `archive-api.open-meteo.com` | ✅ Yes |
| **Food Security** | World Bank | `api.worldbank.org/v2/country/{code}/indicator/SN.ITK.DEFC.ZS` | ✅ Yes |
| **Economic Growth** | World Bank | `api.worldbank.org/v2/country/{code}/indicator/NY.GDP.MKTP.KD.ZG` | ✅ Yes |
| **Social Development** | World Bank | `api.worldbank.org/v2/country/{code}/indicator/SP.DYN.LE00.IN` | ✅ Yes |
| **Political Stability** | World Bank | `api.worldbank.org/v2/country/{code}/indicator/PV.EST` | ✅ Yes |

## 🔧 Customization

### Change Data Sources
Edit `assets/js/dashboard.js`:
```javascript
const CONFIG = {
    REGIONS: {
        // Add your regions here
        'Your Region': { lat: 40, lon: -75, code: 'USA' }
    },
    
    WEIGHTS: {
        // Adjust weightings for stress calculation
        CLIMATE: 0.35,
        FOOD: 0.25,
        ECONOMY: 0.20,
        SOCIAL: 0.12,
        POLITICAL: 0.08
    }
};
```

### Add New Indicators
```javascript
INDICATORS: {
    YOUR_INDICATOR: {
        code: 'WB_INDICATOR_CODE',
        name: 'Your Indicator',
        source: 'WORLD_BANK'
    }
}
```

### Change Color Scheme
Edit `assets/css/style.css`:
```css
:root {
    --primary-dark: #0a192f;
    --accent-teal: #64ffda;
    /* ... customize colors */
}
```

## 🚀 Deployment Guide

### GitHub Pages (Free)
1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from branch" → main → / (root)
4. Save - your site will be live in 1-2 minutes

### Netlify (Free)
1. Drag and drop the folder to Netlify
2. Auto-deploys with HTTPS
3. Custom domain support

### Render/Vercel
1. Import Git repository
2. Select static site configuration
3. Deploy - done!

## 📊 Use Cases

### For Developers
- **Portfolio Piece**: Showcase real API integration skills
- **Client Projects**: Template for data visualization dashboards
- **Learning Resource**: Study production-ready JavaScript architecture

### For Businesses
- **Risk Assessment**: Monitor regional stability for investment decisions
- **Research Tool**: Academic analysis of global stress factors
- **Reporting Dashboard**: Generate exportable reports for stakeholders

### For Agencies
- **White-label Solution**: Rebrand for client dashboards
- **Rapid Prototyping**: Start client projects 80% complete
- **Training Material**: Teach API integration best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

Commercial use allowed. You may:
- Use for client projects
- Resell customized versions
- Deploy as SaaS
- Modify and redistribute

## 🔗 Links

- **Live Demo**: [GitHub Pages](https://yourusername.github.io/stress-dashboard-pro)
- **Source Code**: [GitHub Repository](https://github.com/yourusername/stress-dashboard-pro)
- **Purchase Template**: [Gumroad](https://gumroad.com/l/stress-dashboard-pro) ($197)
- **Support**: Create an issue on GitHub

## 🎯 Why This Dashboard?

| Feature | Our Dashboard | Typical Dashboard |
|---------|---------------|-------------------|
| **Real APIs** | ✅ World Bank + Open-Meteo | ❌ Mock data |
| **No CDNs** | ✅ 100% self-hosted | ❌ External dependencies |
| **Production Ready** | ✅ Error handling + caching | ⚠️ Basic implementation |
| **Commercial License** | ✅ Unlimited use | ❓ Varies |
| **Complete Documentation** | ✅ Step-by-step guides | ⚠️ Minimal |

---

**Ready to launch?** The dashboard works out of the box. No configuration needed for basic use.

**Questions?** Open an issue on GitHub or email support@example.com.

**Want to support development?** Purchase the template on [Gumroad](https://gumroad.com/l/stress-dashboard-pro) for $197 (includes commercial license and lifetime updates).