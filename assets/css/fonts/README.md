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
