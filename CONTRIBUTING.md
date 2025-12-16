

# Contributing to GlyphOS

Thank you for your interest in contributing to **GlyphOS**! To make contributions smooth and effective, please follow this guide.

## 1. Reporting Issues
- Before opening a new issue, search existing issues to see if the topic has already been raised.
- To create a new issue, choose the appropriate issue template (bug report or feature request) and provide:
  - A clear description of the problem or feature.
  - Steps to reproduce (for bugs), including code snippets or minimal reproduction example.
  - Environment details: Python version, OS, GlyphOS SDK version, etc.
- If you discover a security vulnerability, do **not** disclose details publicly. Instead, follow the procedure in `SECURITY.md`.

## 2. Fork & Clone
```bash
git clone https://github.com/onestardao/GlyphOS.git
cd GlyphOS
# Use Python >= 3.10 in a virtual environment
python -m venv venv
# Linux/macOS:
source venv/bin/activate
# Windows PowerShell:
# .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
````

* Create a new branch for your work:

```bash
git checkout -b feature/short-description-of-feature
```

## 3. Development & Testing

* **Code Style**:

  * Use `black`: `black .`
  * Use `isort`: `isort .`
  * Use `pre-commit` if set up: `pre-commit run --all-files`
* **Running Tests**:

  * Run `pytest tests/` (or the specific command used by this project). Ensure all tests pass locally.
  * If you add new functionality or fix a bug, include appropriate tests.
* **Dependencies**:

  * If you introduce new dependencies, add them to `requirements.txt` or the appropriate config file.

## 4. Submitting a Pull Request

* **Title Format**:

  * Example: `Add: Brief description of feature` or `Fix: Brief description of bug fix`.
* **Description**: In the PR description, include:

  * Motivation and summary of changes.
  * Testing steps and results.
  * Related issue number, using “Closes #<issue-number>” if applicable.
* **Target Branch**:

  * Set target branch to `main` (or another branch if the project follows a different workflow).
* **Review Process**:

  * Maintainers will review your PR, may request changes; please be patient and address feedback.
* **Clean Commits**:

  * Squash or rebase commits if needed to keep history clear, according to project preference.

## 5. Documentation

* If your changes require updates to documentation (README, examples, API reference), please include those updates in the same PR.
* If applicable, update version/changelog files as per release workflow.

## 6. Release Process (for Maintainers)

* Typically maintainers handle tagging and releasing new versions.
* If you wish to propose a release candidate, open an issue with title `[Release Candidate]` and summary of changes.
* Follow semantic versioning (if used) and update changelog accordingly.

## 7. Communication Channels

* **Telegram**: Telegram user @PSBigBig (for quick chats).
* **GitHub Discussions**: [https://github.com/onestardao/GlyphOS/discussions](https://github.com/onestardao/GlyphOS/discussions) (if enabled).
* **Email**: [hello@onestardao.com](mailto:hello@onestardao.com) (for longer-form discussion or private matters).
* Please be respectful and follow the Code of Conduct when interacting.

## 8. Large Changes

* For major or breaking changes (e.g., architecture refactor, breaking API), please open an issue first to discuss design and implications.
* Label your draft PR appropriately (e.g., “WIP”, “RFC”).

## 9. Acknowledgements

* Contributions of any kind—code, documentation, examples, bug reports, suggestions—are welcome!
* Thank you for helping improve GlyphOS.

