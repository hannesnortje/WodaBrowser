from setuptools import setup, find_packages

setup(
    name="wodabrowser",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "PyQt6>=6.4.0",
        "PyQt6-WebEngine>=6.4.0",
        "PyQt6-Qt6>=6.4.0",
    ],
    entry_points={
        "console_scripts": [
            "wodabrowser=wodabrowser.browser:main",
        ],
    },
    include_package_data=True,
    package_data={
        "wodabrowser": ["js/*.js", "github-mark.svg"],
    },
    python_requires=">=3.8",
    author="Hannes Nortjé",
    description="A PyQt6-based web browser",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="https://github.com/hannesnortje/WodaBrowser",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
