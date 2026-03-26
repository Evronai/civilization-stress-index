#!/bin/bash

# Download Dependencies Script
# Downloads all required libraries for offline use

set -e

echo "📦 Downloading dependencies for Civilization Stress Index Pro..."

# Create directories
mkdir -p ../assets/js
mkdir -p ../assets/css/fonts
mkdir -p ../assets/css/fontawesome

# Download D3.js v7
echo "📥 Downloading D3.js v7..."
curl -s -L "https://d3js.org/d3.v7.min.js" -o ../assets/js/d3.min.js
echo "  ✅ D3.js downloaded ($(stat -c%s ../assets/js/d3.min.js) bytes)"

# Download TopoJSON v3
echo "📥 Downloading TopoJSON v3..."
curl -s -L "https://unpkg.com/topojson@3" -o ../assets/js/topojson.min.js
echo "  ✅ TopoJSON downloaded ($(stat -c%s ../assets/js/topojson.min.js) bytes)"

# Download Chart.js v4
echo "📥 Downloading Chart.js v4..."
curl -s -L "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" -o ../assets/js/chart.min.js
echo "  ✅ Chart.js downloaded ($(stat -c%s ../assets/js/chart.min.js) bytes)"

# Download Inter font (optional - requires manual download)
echo "📥 Note: Inter font requires manual download:"
echo "   🔗 https://fonts.google.com/specimen/Inter?query=inter"
echo "   Download .woff2 files and place in assets/css/fonts/"
echo ""
echo "📥 Note: Font Awesome requires manual download:"
echo "   🔗 https://fontawesome.com/download"
echo "   Download 'Free for Web' and extract to assets/css/fontawesome/"

# Create README for fonts
cat > ../assets/css/fonts/README.md << 'EOF'
# Inter Font Instructions

1. Download Inter font from: https://fonts.google.com/specimen/Inter?query=inter
2. Click "Download family" (.zip file)
3. Extract and copy .woff2 files to this directory
4. Update inter.css with @font-face declarations

Example @font-face:
```css
@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400;
    src: url('Inter-Regular.woff2') format('woff2');
}
```
EOF

cat > ../assets/css/fontawesome/README.md << 'EOF'
# Font Awesome Instructions

1. Download from: https://fontawesome.com/download
2. Select "Free for Web"
3. Extract and copy:
   - css/all.min.css → Replace this file
   - webfonts/ → Copy to assets/css/fontawesome/webfonts/
EOF

echo ""
echo "✅ Dependency download complete!"
echo ""
echo "Next steps:"
echo "1. Download Inter font manually (see assets/css/fonts/README.md)"
echo "2. Download Font Awesome manually (see assets/css/fontawesome/README.md)"
echo "3. Run the dashboard: open ../index.html in browser"
echo ""
echo "For CDN version (development only), edit index.html to use:"
echo "  <script src=\"https://d3js.org/d3.v7.min.js\"></script>"
echo "  <script src=\"https://unpkg.com/topojson@3\"></script>"
echo "  <script src=\"https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js\"></script>"