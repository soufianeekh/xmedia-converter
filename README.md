# 🎬 XMedia Converter

A local media converter built with **Next.js** + **pnpm** for fast, clean file conversions.  
- 🎞️ **Video/Audio** conversions use **FFmpeg**  
- 🖼️ **Images** conversions use **Sharp** *(FFmpeg not required for images)*

---

## ✅ Requirements

- 🟢 **Node.js 18+** *(recommended **20 LTS**)*  
- 📦 **pnpm**  
- 🎛️ **FFmpeg** *(only for audio/video)*  

---

## 1) 🟢 Install Node.js (18+ / recommended 20)

### 🪟 Windows (easy)
1. Download and install **Node 20 LTS** from the official Node.js website  
2. Verify installation:
```powershell
node -v
npm -v
````

### 🍎 macOS (Homebrew)

```bash
brew install node@20
node -v
npm -v
```

### 🐧 Linux (Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

---

## 2) 📦 Install pnpm

### ✅ Recommended (Corepack)

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

### 🛠️ Alternative (npm global)

```bash
npm i -g pnpm
pnpm -v
```

---

## 3) 🎛️ Install FFmpeg (Audio/Video only)

### 🪟 Windows (Winget)

```powershell
winget install -e --id Gyan.FFmpeg
```

### 🍎 macOS (Homebrew)

```bash
brew install ffmpeg
```

### 🐧 Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y ffmpeg
```

✅ Verify FFmpeg:

```bash
ffmpeg -version
```

---

## 4) ▶️ Run XMedia Converter locally

```bash
pnpm install
pnpm dev
```

🌐 Open:

* [http://localhost:3000](http://localhost:3000)

---

## 🧠 Notes

* 🖼️ Image conversions work without FFmpeg
* 🎞️ Large video conversions can take time (local use is best)
* ☁️ For hosting, a worker/VPS is recommended (serverless timeouts are common)

---

## ✉️ Contact

Have a note? Send an email: **[soufianeholdings@gmail.com](mailto:soufianeholdings@gmail.com)** 📩

---

## ❤️ Credits

Made with love by **[Soufiane KH](https://github.com/soufianeekh/)** ✨

