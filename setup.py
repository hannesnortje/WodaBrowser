from setuptools import setup, find_packages

setup(
    name="WodaBrowser",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "PyQt6",
    ],
    entry_points={
        "console_scripts": [
            "wodabrowser=Browser:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["js/*.js", "github-mark.svg"],
    },
)
