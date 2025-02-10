from setuptools import setup, find_packages
import os
import platform
import sys

def get_data_files():
    data_files = []
    
    # Linux-specific files
    if platform.system() == "Linux":
        # Desktop entry
        data_files.append(('share/applications', ['wodabrowser/icons/wodabrowser.desktop']))
        
        # Install icons in multiple sizes
        icon_sizes = ['16', '24', '32', '48', '64', '128', '256', 'scalable']
        for size in icon_sizes:
            if size == 'scalable':
                size_path = f'share/icons/hicolor/{size}/apps'
            else:
                size_path = f'share/icons/hicolor/{size}x{size}/apps'
            data_files.append((size_path, ['wodabrowser/icons/wodabrowser.svg']))
    
    return data_files

setup(
    name="wodabrowser",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "PyQt6>=6.4.0",
        "PyQt6-WebEngine>=6.4.0",
        "PyQt6-Qt6>=6.4.0",
        "PyQt6-sip>=13.4.0",
        "packaging>=23.0",
        "QtPy>=2.3.0",  # Added for better Qt compatibility
        "setuptools>=65.5.1",  # Ensure proper installation
        "wheel>=0.38.0",  # Required for proper package building
    ],
    setup_requires=[
        "wheel>=0.38.0",
        "setuptools>=65.5.1",
    ],
    entry_points={
        "console_scripts": [
            "wodabrowser=wodabrowser.browser:main",  # Updated entry point
        ],
    },
    include_package_data=True,
    package_data={
        "wodabrowser": [
            "js/*.js",
            "github-mark.svg",
            "icons/*.svg",
            "icons/*.desktop",
        ],
    },
    data_files=get_data_files(),
    zip_safe=False,  # Required for PyQt6 applications
    python_requires=">=3.8",
    options={
        'bdist_wheel': {
            'py_limited_api': 'cp38',  # Ensure wheel compatibility
        },
    },
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
