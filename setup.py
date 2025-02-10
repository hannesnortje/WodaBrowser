from setuptools import setup, find_packages

setup(
    name="WodaBrowser",
    version="1.0.0",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "PyQt6",
        # Add other dependencies here
    ],
    entry_points={
        "console_scripts": [
            "wodabrowser=WodaBrowser.Browser:main",
        ],
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
)
