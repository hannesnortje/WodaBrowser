# WodaBrowser

A PyQt6-based web browser with modern features.

## Table of Contents
1. [Requirements](#requirements)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Troubleshooting](#troubleshooting)
5. [License](#license)

---

## Requirements

- **Python 3.8 or higher** is required. Check your Python version with:
  ```bash
  python3 --version
  ```
- PyQt6
- PyQt6-WebEngine

## Installation

You can install WodaBrowser directly from GitHub using pipx:

```bash
pipx install git+https://github.com/hannesnortje/WodaBrowser.git
```

If you already have a previous version of WodaBrowser installed, add `--force` to overwrite the installation:

```bash
pipx install --force git+https://github.com/hannesnortje/WodaBrowser.git
```

---

## Usage

After installation, simply run:

```bash
wodabrowser
```

The browser will launch with the Woda platform’s custom features.

---

## Troubleshooting

- **Error: `No module named 'PyQt6.QtWebEngineWidgets'`**: Ensure `PyQt6-WebEngine` is included in the package dependencies. Reinstall with `pipx install --force git+https://github.com/hannesnortje/WodaBrowser.git`.
- **Command Not Found**: If `pipx` commands are not recognized, confirm `pipx` is added to your PATH by restarting your terminal or following the installation instructions.

---

## License

This software is distributed under the GNU Affero General Public License v3 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

---