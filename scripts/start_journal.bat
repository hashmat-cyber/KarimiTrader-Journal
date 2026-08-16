@echo off
cd /d "C:\Users\Waziri\Videos\Journal\KarimiTrader.Journal"
"C:\Users\Waziri\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m waitress --host=0.0.0.0 --port=5000 backend.app:app
