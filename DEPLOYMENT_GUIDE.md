# 🚀 Deployment Guide

## Quick Start (5 Minutes)

### 1. Download & Extract
```bash
# Download the ZIP from Gumroad
unzip stress-dashboard-pro.zip
cd stress-dashboard-pro
```

### 2. Install Dependencies
```bash
# Run the download script (requires internet)
chmod +x scripts/download-dependencies.sh
./scripts/download-dependencies.sh
```

### 3. Run Locally
```bash
# Open in browser
open index.html  # Mac
xdg-open index.html  # Linux
start index.html  # Windows
```

### 4. Deploy to Web
Choose one hosting option:

#### GitHub Pages (Free)
1. Create new repository on GitHub
2. Upload all files
3. Go to Settings → Pages → Select "main branch" → Save
4. Your site: `https://yourusername.github.io/repository-name`

#### Netlify (Free)
1. Drag and drop folder to https://app.netlify.com
2. Auto-deploys with HTTPS
3. Custom domain support

#### Render/Vercel (Free)
1. Import Git repository
2. Select static site
3. Deploy - done!

## 🛠️ Customization

### Change Regions
Edit `assets/js/dashboard.js`:
```javascript
const CONFIG = {
    REGIONS: {
        // Add/remove regions here
        'Europe': { lat: 50, lon: 10, code: 'DEU' },
        'North America': { lat: 40, lon: -100, code: 'USA' },
        // ...
    }
};
```

### Adjust Weightings
```javascript
WEIGHTS: {
    CLIMATE: 0.35,    // Climate impact weight
    FOOD: 0.25,       // Food security weight
    ECONOMY: 0.20,    // Economic weight
    SOCIAL: 0.12,     // Social development weight
    POLITICAL: 0.08   // Political stability weight
}
```

### Change Color Scheme
Edit `assets/css/style.css`:
```css
:root {
    --primary-dark: #0a192f;
    --accent-teal: #64ffda;
    --accent-red: #ff5c7c;
    /* ... customize all colors */
}
```

### Add New Indicators
```javascript
INDICATORS: {
    YOUR_INDICATOR: {
        code: 'WB_INDICATOR_CODE',
        name: 'Your Indicator Name',
        source: 'WORLD_BANK'
    }
}
```

## 🌐 API Configuration

### World Bank API
The dashboard automatically uses:
- Endpoint: `https://api.worldbank.org/v2`
- Indicators: See `CONFIG.INDICATORS` in dashboard.js
- Cache: 1 hour local storage cache

### Open-Meteo API
- Endpoint: `https://archive-api.open-meteo.com/v1/archive`
- Data: Historical temperature averages
- Cache: 1 hour local storage cache

### Rate Limiting
Both APIs have generous rate limits for personal/educational use.

## 📱 Mobile Responsive

The dashboard works on:
- Desktop (1200px+)
- Tablet (768px-1199px)
- Mobile (320px-767px)
- Print media (report generation)

## 🚨 Troubleshooting

### "No data loading"
1. Check browser console for errors (F12 → Console)
2. Verify internet connection
3. Try disabling ad-blockers
4. Check if APIs are accessible:
   ```bash
   curl "https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2023"
   ```

### "Map not showing"
The map visualization requires D3.js. Ensure:
1. `assets/js/d3.min.js` exists
2. `assets/js/topojson.min.js` exists
3. No JavaScript errors in console

### "Fonts not loading"
1. Download Inter font from https://fonts.google.com/specimen/Inter
2. Place .woff2 files in `assets/css/fonts/`
3. Update `assets/css/fonts/inter.css`

## 🔒 Security Considerations

### API Keys
No API keys required - uses public APIs.

### Data Storage
All data stored in browser localStorage:
- No server-side storage
- No user data sent to external servers
- Cache cleared automatically after 1 hour

### HTTPS Required
For API calls to work, site must be served over HTTPS.

## 📈 Performance Optimization

### Cache Strategy
- API responses cached for 1 hour
- localStorage used for persistent cache
- Fallback to derived data if APIs fail

### Bundle Size
- D3.js: 279KB
- TopoJSON: 52KB
- Chart.js: 205KB
- Total: ~536KB (gzipped: ~180KB)

### Lazy Loading
Consider implementing if adding more features:
```javascript
// Example lazy loading
import('d3-geo').then(d3geo => {
    // Use d3geo for map projections
});
```

## 🔄 Updating

### Update Dependencies
```bash
# Delete old files
rm assets/js/d3.min.js assets/js/topojson.min.js assets/js/chart.min.js

# Re-run download script
./scripts/download-dependencies.sh
```

### Update Dashboard Logic
Replace `assets/js/dashboard.js` with new version.

### Update Styling
Replace `assets/css/style.css` with new version.

## 🎯 Production Checklist

- [ ] Dependencies downloaded locally
- [ ] Fonts installed (or using system fallbacks)
- [ ] API endpoints accessible from your domain
- [ ] HTTPS configured
- [ ] Analytics added (optional)
- [ ] Custom branding applied
- [ ] Error tracking implemented (optional)
- [ ] Backup strategy in place

## 📞 Support

1. **Documentation**: Check README.md first
2. **GitHub Issues**: https://github.com/yourusername/stress-dashboard-pro/issues
3. **Email**: support@example.com
4. **Commercial Support**: Available for enterprise deployments

## 📄 License

MIT License - See [LICENSE.md](LICENSE.md) for details.

Commercial use allowed. Attribution appreciated but not required.