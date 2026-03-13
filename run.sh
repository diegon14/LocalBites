#!/bin/bash
python backend/api.py & 
cd LocalBites 
npm install && npx expo start