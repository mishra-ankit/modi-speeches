# 🎤 PM Modi Speeches Archive

[![Auto Update](https://github.com/mishra-ankit/modi-speeches/actions/workflows/update.yml/badge.svg)](https://github.com/mishra-ankit/modi-speeches/actions/workflows/update.yml)

An automatically-updated archive of Prime Minister Narendra Modi's public speeches.

[**🌐 View Interactive Dashboard**](https://mishra-ankit.github.io/modi-speeches)

## 📊 Current Stats
2997 speeches (2049 Hindi + 948 English). Data is sourced from [narendramodi.in](https://www.narendramodi.in) and updated daily.
> **Note:** Some speeches in the English collection may contain Hindi text as they are scraped as-is from the source.

## ⚠️ Disclaimer
**For research and analytical purposes only.** This repository archives published speech texts and does not represent an endorsement. Texts are scraped from official publications and may differ from spoken delivery.

## 📁 Data Access
Speeches are stored in CSV format in the `docs/` folder:
- **[data_hi.csv](docs/data_hi.csv)** (Hindi)
- **[data_en.csv](docs/data_en.csv)** (English)
- **[Kaggle Dataset](https://www.kaggle.com/datasets/ankitmishra0/narendra-modi-speeches)** (Mirrored)

**Columns**: `href`, `title`, `date`, `img`, `youtubeURL`, `speechText`

## 🛠️ Development

```bash
# Install
npm install

# Scrape & Update
npm run scrape:hi
npm run scrape:en
npm run build
```

## 🤝 Contributing
Open an [issue](https://github.com/mishra-ankit/modi-speeches/issues) or submit a PR. 

## 📄 License
See [LICENSE.md](LICENSE.md).

---
*Last auto-update: Check the [Actions tab](https://github.com/mishra-ankit/modi-speeches/actions) for the latest run*

