# CPMS - Machine Learning Module

This directory contains key components for the ML-based Camera Parking Management System.

## Project Organization

    ├── LICENSE
    ├── README.md          <- The top-level README for developers using this project.
    ├── data
    │   ├── external       <- Data from third party sources.
    │   ├── interim        <- Intermediate data that has been transformed.
    │   ├── processed      <- The final, canonical data sets for modeling.
    │   └── raw            <- The original, immutable data dump.
    │
    ├── models             <- Trained and serialized models, model predictions, or model summaries
    │
    ├── notebooks          <- Jupyter notebooks. Naming convention is a number (for ordering),
    │                         the creator's initials, and a short `-` delimited description, e.g.
    │                         `1.0-jqp-initial-data-exploration`.
    │
    ├── configs            <- Configuration files (YAML, JSON) for model parameters and zone definitions.
    │
    ├── requirements.txt   <- The requirements file for reproducing the analysis environment, e.g.
    │                         generated with `pip freeze > requirements.txt`
    │
    ├── src                <- Source code for use in this project.
    │   ├── __init__.py    <- Makes src a Python module
    │   │
    │   ├── input_processing <- Scripts to handle video streams (RTSP, Cam, Files)
    │   │   └── stream_handler.py
    │   │
    │   ├── detection      <- Scripts for vehicle and object detection (YOLO, etc.)
    │   │   └── vehicle_detector.py
    │   │
    │   ├── tracking       <- Scripts for object tracking (SORT, DeepSORT)
    │   │
    │   ├── classification <- Scripts for vehicle classification (Car vs Bike)
    │   │
    │   ├── zones          <- Logic for parking zones management (Occupancy, Availability)
    │   │
    │   ├── analytics      <- Analytics and prediction scripts
    │   │
    │   └── utils          <- Helper scripts, logging, config parsers
    │
    └── LICENSE
